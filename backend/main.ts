// src/app.ts
// Main Express app serving APIs with non-blocking background workers (BullMQ, Redis subscribers).
// Features: Clustering for scalability, Winston logging, BullMQ dashboard, graceful shutdown.
// Dependencies: npm install express body-parser dotenv winston @bull-board/express @bull-board/api bullmq ioredis @prisma/client mpesa-node-library fs-extra csv-writer node-cron

import express, { type Request, type Response, type NextFunction } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import prisma from './utils/prisma.js';
import winston from 'winston';
import cluster from 'cluster';
import os from 'os';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { orderQueue } from './workflows/order-completion-workflow.js';
import { redisService } from './services/redis-service.js';
import { startPaymentSubscriber } from './subscribers/payment-subscriber.js';

// Routes
import customerRoutes from './routes/customer-route.js';
import expenseRoutes from './routes/expenses-route.js';
import productRoutes from './routes/product-route.js';
import orderRoutes from './routes/orders-route.js';
import salesRoutes from './routes/sales-route.js';
import orderItemRoutes from './routes/order-items-route.js';
import webhookRoutes from './routes/payment-route.js';
import whatsAppRoutes from './routes/whatsapp-route.js'

// Load environment variables
dotenv.config();

// Prisma client

// Logger setup
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Error handler middleware: User-friendly messages
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error at ${req.path}: ${err.message}`, { stack: err.stack });
  const userMessage = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal server error';
  res.status(err.status || 500).json({
    error: userMessage,
    details: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
};

// Express app setup
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'application/json' })); // For MPESA webhook

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`Request: ${req.method} ${req.path}`, { body: req.body });
  next();
});

// API routes
app.use('/api', customerRoutes);
app.use('/api', expenseRoutes);
app.use('/api', productRoutes);
app.use('/api', orderRoutes);
app.use('/api', salesRoutes);
app.use('/api', orderItemRoutes);
app.use('/api', whatsAppRoutes)
app.use('/api', webhookRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date(), pid: process.pid });
});

// BullMQ dashboard (optional, for monitoring jobs)
const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullMQAdapter(orderQueue)],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

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
    logger.error(`Worker ${process.pid} shutdown error: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Cluster setup for non-blocking workers and web server
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  logger.info(`Primary ${process.pid} forking ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died with code ${code}, signal ${signal}. Forking new worker.`);
    cluster.fork();
  });
} else {
  // Worker process: Start Express server and background tasks
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    logger.info(`Worker ${process.pid} started web server on port ${PORT}`);
  });

  // Handle server errors
  server.on('error', (error: any) => {
    logger.error(`Worker ${process.pid} server error: ${error.message}`, { stack: error.stack });
  });

  // Start Redis subscribers (non-blocking)
  startPaymentSubscriber();

  // BullMQ workers are non-blocking (started in order-completion-workflow.ts)
}

// Export for testing
export default app;