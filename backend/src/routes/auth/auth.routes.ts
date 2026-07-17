import type { FastifyInstance } from 'fastify';
import { AuthService } from '../../../services/auth-service.js';
import rateLimit from '@fastify/rate-limit';

const authService = new AuthService();

/**
 * Auth Routes
 * POST /api/auth/register  - Register a new business
 * POST /api/auth/login     - Login with email/password
 * POST /api/auth/google    - Login with Google OAuth token
 */
export async function authRoutes(fastify: FastifyInstance) {
  // Per-route stricter rate limiting for auth endpoints
  await fastify.register(rateLimit, {
    max: 15,
    timeWindow: '1 hour',
    keyGenerator: (req) => req.ip,
  });

  fastify.post('/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['ownerName', 'ownerEmail', 'password', 'name'],
        properties: {
          ownerName: { type: 'string', minLength: 1 },
          ownerEmail: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string', minLength: 1 },
          businessType: { type: 'string' },
          whatsappNumber: { type: 'string' },
          yearsInBusiness: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const result = await authService.register(req.body as any);
    return reply.status(201).send({ success: true, data: result });
  });

  fastify.post('/auth/login', async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await authService.login(email, password);
    return reply.send({ success: true, data: result });
  });

  fastify.post('/auth/google', async (req, reply) => {
    const { idToken } = req.body as { idToken: string };
    const result = await authService.googleLogin(idToken);
    return reply.send({ success: true, data: result });
  });
}
