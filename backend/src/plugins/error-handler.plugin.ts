/**
 * Fastify error types plugin.
 * Maps application-layer AppError subclasses to correct HTTP status codes.
 * Registered globally in server.ts via fastify.setErrorHandler().
 */
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { NotFoundError, BadRequestError, UnauthorizedError, AppError } from '../../utils/types/errors.js';

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error, req, reply) => {
    // Log all errors with path for debugging
    fastify.log.error({ err: error, path: req.url, method: req.method });

    // Map application errors to HTTP status codes
    if (error instanceof NotFoundError) {
      return reply.status(404).send({ success: false, error: error.message });
    }
    if (error instanceof BadRequestError) {
      return reply.status(400).send({ success: false, error: error.message });
    }
    if (error instanceof UnauthorizedError) {
      return reply.status(401).send({ success: false, error: error.message });
    }

    // Fastify validation errors (schema mismatch)
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: error.validation,
      });
    }

    // Fastify rate limit
    if (error.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: 'Too many requests. Please slow down.',
      });
    }

    // Known AppError base
    if (error instanceof AppError) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: error.message,
      });
    }

    // Unknown — 500
    const isProd = process.env.NODE_ENV === 'production';
    return reply.status(500).send({
      success: false,
      error: isProd ? 'An unexpected error occurred.' : error.message,
    });
  });
}

export default fp(errorHandlerPlugin, { name: 'error-handler' });
