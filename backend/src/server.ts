/**
 * FinAI Core API — Fastify Server
 *
 * Architecture:
 * - Fastify as HTTP framework (replaces Express for 3x throughput)
 * - Plugin-based architecture: cors, rate-limit, helmet, jwt
 * - Domain-separated route modules under src/routes/
 * - Auth via JWT (verified in onRequest hook for protected routes)
 * - Error handling via setErrorHandler
 * - Graceful shutdown on SIGTERM/SIGINT
 */
import dotenv from 'dotenv';
dotenv.config();

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import fjwt from '@fastify/jwt';
import { validateEnv } from '../utils/env-validator.js';
import { orderQueue } from '../workflows/order-completion-workflow.js';
import { redisService } from '../services/redis-service.js';
import prisma from '../utils/prisma.js';
import { startPaymentSubscriber } from '../subscribers/payment-subscriber.js';
import { ZodError } from 'zod';

// Route modules
import { authRoutes } from './routes/auth/auth.routes.js';
import { productRoutes } from './routes/products/products.routes.js';
import { customerRoutes } from './routes/customers/customers.routes.js';
import { orderRoutes } from './routes/orders/orders.routes.js';
import { salesRoutes } from './routes/sales/sales.routes.js';
import { expenseRoutes } from './routes/expenses/expenses.routes.js';
import { paymentRoutes, webhookRoutes } from './routes/payments/payments.routes.js';
import { analyticsRoutes } from './routes/analytics/analytics.routes.js';
import { creditRoutes } from './routes/credit/credit.routes.js';
import { chatbotRoutes } from './routes/chatbot/chatbot.routes.js';
import { businessRoutes } from './routes/business/business.routes.js';
import { achievementsRoutes } from './routes/achievements/achievements.routes.js';
import errorHandlerPlugin from './plugins/error-handler.plugin.js';

validateEnv();

const PORT = parseInt(process.env.PORT || '3000', 10);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function buildServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: IS_PRODUCTION ? 'info' : 'debug',
      serializers: {
        req(req) {
          return { method: req.method, url: req.url };
        },
      },
    },
    trustProxy: true,
  });

  // ─── Error Handler Plugin ───────────────────────────────────────────────
  await fastify.register(errorHandlerPlugin);

  // ─── Security ──────────────────────────────────────────────────────────────
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Allow API responses
  });

  // ─── CORS ──────────────────────────────────────────────────────────────────
  const STATIC_CORS_ORIGINS = [
    'http://localhost:19006',
    'http://127.0.0.1:19006',
    'http://10.0.2.2:3000',
    'http://192.168.0.101:3000',
    'exp://192.168.0.101:19000',
  ];
  const DEV_LAN_RE = /^(https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?|exp:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?)$/;

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin || STATIC_CORS_ORIGINS.includes(origin)) return cb(null, true);
      if (!IS_PRODUCTION && DEV_LAN_RE.test(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    errorResponseBuilder: () => ({
      status: 'error',
      message: 'Too many requests from this IP, please try again after 15 minutes',
    }),
  });

  // ─── JWT ───────────────────────────────────────────────────────────────────
  await fastify.register(fjwt, {
    secret: process.env.JWT_SECRET!,
  });

  // Auth hook: decode JWT and attach user to request for protected routes
  fastify.decorate('authenticate', async (req: any, reply: any) => {
    try {
      const decoded = await req.jwtVerify() as { id: number; email: string };
      req.user = decoded;
    } catch {
      return reply.status(401).send({ success: false, error: 'Invalid or expired token' });
    }
  });

  // ─── Error Handler ─────────────────────────────────────────────────────────
  fastify.setErrorHandler((error, req, reply) => {
    fastify.log.error({ err: error, path: req.url });

    if (error instanceof ZodError) {
      return reply.status(400).send({
        status: 'error',
        message: error.errors[0]?.message || 'Validation error',
      });
    }

    if (error.statusCode === 429) {
      return reply.status(429).send({ status: 'error', message: error.message });
    }

    const statusCode = error.statusCode || 500;
    const message = IS_PRODUCTION && statusCode >= 500
      ? 'An unexpected error occurred. Please try again later.'
      : error.message;

    return reply.status(statusCode).send({ status: 'error', message });
  });

  // ─── Public Routes (no auth) ───────────────────────────────────────────────
  fastify.get('/health', async () => ({
    status: 'OK',
    timestamp: new Date(),
    pid: process.pid,
    service: 'finai-core-api',
  }));

  fastify.get('/api/public/health', async () => ({
    status: 'OK',
    timestamp: new Date(),
    pid: process.pid,
  }));

  // Auth routes (public — login/register)
  await fastify.register(authRoutes, { prefix: '/api' });

  // Webhook routes (public — M-Pesa calls this directly)
  await fastify.register(webhookRoutes, { prefix: '/api' });

  // ─── Protected Routes (require JWT) ────────────────────────────────────────
  const protectedPlugin = async (protectedFastify: FastifyInstance) => {
    // Apply auth to all routes in this scope
    protectedFastify.addHook('onRequest', (protectedFastify as any).authenticate);

    await protectedFastify.register(productRoutes, { prefix: '/api' });
    await protectedFastify.register(customerRoutes, { prefix: '/api' });
    await protectedFastify.register(orderRoutes, { prefix: '/api' });
    await protectedFastify.register(salesRoutes, { prefix: '/api' });
    await protectedFastify.register(expenseRoutes, { prefix: '/api' });
    await protectedFastify.register(paymentRoutes, { prefix: '/api' });
    await protectedFastify.register(analyticsRoutes, { prefix: '/api' });
    await protectedFastify.register(creditRoutes, { prefix: '/api' });
    await protectedFastify.register(chatbotRoutes, { prefix: '/api' });
    await protectedFastify.register(businessRoutes, { prefix: '/api' });
    await protectedFastify.register(achievementsRoutes, { prefix: '/api' });
  };

  await fastify.register(protectedPlugin);

  return fastify;
}

// ─── Graceful Shutdown ─────────────────────────────────────────────────────
const shutdown = async (fastify: FastifyInstance) => {
  fastify.log.info(`Worker ${process.pid} shutting down gracefully`);
  try {
    await fastify.close();
    await orderQueue.close();
    await redisService.quit();
    await prisma.$disconnect();
    fastify.log.info(`Worker ${process.pid} closed all connections`);
    process.exit(0);
  } catch (error: any) {
    fastify.log.error(`Shutdown error: ${error.message}`);
    process.exit(1);
  }
};

// ─── Entrypoint ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  buildServer().then((fastify) => {
    fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
    });

    startPaymentSubscriber();

    process.on('SIGTERM', () => shutdown(fastify));
    process.on('SIGINT', () => shutdown(fastify));
  });
}
