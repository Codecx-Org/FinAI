/**
 * Rate Limiter middleware for sensitive endpoints.
 * Applied per-route for auth and payment endpoints.
 * Global rate limiter is registered in server.ts (100 req/15min per IP).
 */
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

async function rateLimitPlugin(fastify: FastifyInstance) {
  // Global rate limiter already registered in server.ts
  // This plugin provides per-route helpers for stricter limits

  /**
   * Returns rate limit config for auth routes (stricter: 15 req/hour per IP)
   */
  fastify.decorate('authRateLimit', {
    max: 15,
    timeWindow: '1 hour',
    keyGenerator: (req: any) => req.ip,
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too many authentication attempts. Try again in 1 hour.',
    }),
  });

  /**
   * Returns rate limit config for payment endpoints (10 req/hour per user)
   */
  fastify.decorate('paymentRateLimit', {
    max: 10,
    timeWindow: '1 hour',
    keyGenerator: (req: any) => req.user?.id?.toString() || req.ip,
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too many payment attempts. Try again later.',
    }),
  });
}

export default fp(rateLimitPlugin, { name: 'rate-limit-config' });
