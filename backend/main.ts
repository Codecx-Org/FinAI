// src/app.ts
// Main Express app serving APIs with non-blocking background workers (BullMQ, Redis subscribers).
// Features: Clustering for scalability, Winston logging, BullMQ dashboard, graceful shutdown.
// Dependencies: npm install express body-parser dotenv winston @bull-board/express @bull-board/api bullmq ioredis @prisma/client mpesa-node-library fs-extra csv-writer node-cron

import express from "express";
import type { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./utils/prisma.js";
import winston from "winston";
import cluster from "cluster";
import os from "os";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { orderQueue } from "./workflows/order-completion-workflow.js";
import { redisService } from "./services/redis-service.js";
import { startPaymentSubscriber } from "./subscribers/payment-subscriber.js";
import { rateLimit } from 'express-rate-limit';

// Routes
import authRoutes from "./routes/auth-route.js";
import customerRoutes from "./routes/customer-route.js";
import businessRoutes from "./routes/business-route.js";
import expenseRoutes from "./routes/expenses-route.js";
import productRoutes from "./routes/product-route.js";
import orderRoutes from "./routes/orders-route.js";
import salesRoutes from "./routes/sales-route.js";
import orderItemRoutes from "./routes/order-items-route.js";
import webhookRoutes from "./routes/payment-route.js";
import chatbotRoutes from "./routes/chatbot-route.js";
import contentGenerationRoutes from "./routes/content-generation-route.js";
import analyticsRoutes from "./routes/analytics-route.js";
import creditRoutes from "./routes/credit-route.js";
import achievementRoutes from "./routes/achievement-route.js";
import { authenticate } from "./utils/auth-middleware.js";
import { validateEnv } from "./utils/env-validator.js";

// Validate environment variables on startup
validateEnv();

// Load environment variables
dotenv.config();

// Prisma client

// Logger setup
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// Error handler middleware: User-friendly messages
const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  logger.error(`Error at ${req.path}: ${err.message}`, {
    stack: err.stack,
    statusCode,
    isOperational,
  });

  const response = {
    status: "error",
    message:
      process.env.NODE_ENV === "production" && !isOperational
        ? "An unexpected error occurred. Please try again later."
        : err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

// Express app setup
const app = express();
const STATIC_CORS_ORIGINS = [
  "http://localhost:19006",
  "http://127.0.0.1:19006",
  "http://10.0.2.2:3000",
  "http://192.168.0.101:3000",
  "exp://192.168.0.101:19000",
];

/** Dev-only: allow common private LAN origins when PC IP changes (DHCP). Not applied in production. */
const DEV_LAN_ORIGIN_RE =
  /^(https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?|exp:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?)$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (STATIC_CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      if (process.env.NODE_ENV !== "production" && DEV_LAN_ORIGIN_RE.test(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.raw({ type: "application/json", limit: "10mb" })); // For MPESA webhook

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login/register attempts per hour
  message: 'Too many authentication attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use('/api/auth/', authLimiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const sanitizedBody = req.body ? { ...req.body } : undefined;
  if (sanitizedBody) {
    ['password', 'token', 'secret', 'mpesa_password'].forEach(key => {
      if (key in sanitizedBody) sanitizedBody[key] = '***';
    });
  }

  logger.info(`Request: ${req.method} ${req.path}`, {
    query: req.query,
    params: req.params,
    body: req.method !== "GET" ? sanitizedBody : undefined,
  });
  next();
});

// BullMQ dashboard (optional, for monitoring jobs)
const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullMQAdapter(orderQueue)],
  serverAdapter: serverAdapter,
});

// API routes
app.use("/api", authRoutes);

app.use("/api", webhookRoutes);

// Protected routes
app.use("/api", authenticate);
app.use("/admin/queues", serverAdapter.getRouter());

app.use("/api", customerRoutes);
app.use("/api", businessRoutes);
app.use("/api", expenseRoutes);
app.use("/api", productRoutes);
app.use("/api", orderRoutes);
app.use("/api", salesRoutes);
app.use("/api", orderItemRoutes);
app.use("/api", chatbotRoutes);
app.use("/api", contentGenerationRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", creditRoutes);
app.use("/api", achievementRoutes);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date(), pid: process.pid });
});


// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const shutdown = async () => {
  logger.info(`Worker ${process.pid} shutting down gracefully`);
  try {
    await orderQueue.close(); // Close BullMQ queue
    await redisService.quit(); // Close Redis connections
    await prisma.$disconnect(); // Close Prisma
    logger.info(`Worker ${process.pid} closed all connections`);
    process.exit(0);
  } catch (error: any) {
    logger.error(`Worker ${process.pid} shutdown error: ${error.message}`, {
      stack: error.stack,
    });
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Cluster setup for non-blocking workers and web server
if (cluster.isPrimary && process.env.NODE_ENV !== "test") {
  const numCPUs = os.cpus().length;
  logger.info(`Primary ${process.pid} forking ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.warn(
      `Worker ${worker.process.pid} died with code ${code}, signal ${signal}. Forking new worker.`,
    );
    cluster.fork();
  });
} else if (!cluster.isPrimary || process.env.NODE_ENV === "test") {
  // Worker process or test environment: Start Express server and background tasks
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    logger.info(`Process ${process.pid} started web server on port ${PORT}`);
  });

  // Handle server errors
  server.on("error", (error: any) => {
    logger.error(`Process ${process.pid} server error: ${error.message}`, {
      stack: error.stack,
    });
  });

  if (process.env.NODE_ENV !== "test") {
    // Start Redis subscribers (non-blocking)
    startPaymentSubscriber();
  }
}

// Export for testing
export default app;
