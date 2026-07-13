import type { FastifyInstance } from 'fastify';
import axios from 'axios';

/**
 * Chatbot Routes — proxies to the Python AI Service
 * All routes are protected (require JWT).
 *
 * POST /api/chatbot/chat              - Send message to AI agent
 * GET  /api/chatbot/insights          - Get AI business insights
 * GET  /api/chatbot/analytics-insights - Deep analytics insights
 * POST /api/chatbot/clear-cache       - Clear Redis conversation history
 * GET  /api/chatbot/health            - AI service health check
 */
export async function chatbotRoutes(fastify: FastifyInstance) {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || '';

  // Shared headers for internal service calls
  const internalHeaders = () => ({
    'Content-Type': 'application/json',
    'x-internal-secret': INTERNAL_SECRET,
  });

  fastify.post('/chatbot/chat', {
    schema: {
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', minLength: 1, maxLength: 1000 },
          history: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: ['user', 'assistant'] },
                content: { type: 'string' },
              },
            },
          },
          language: { type: 'string', enum: ['en', 'sw'] },
        },
      },
    },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const body = req.body as { message: string; history?: any[]; language?: string };

    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/chat`,
        { businessId, ...body },
        { headers: internalHeaders(), timeout: 60_000 }
      );
      return reply.send(response.data);
    } catch (err: any) {
      fastify.log.error({ err }, '[Chatbot] AI service error');
      const status = err?.response?.status || 503;
      return reply.status(status).send({
        success: false,
        error: 'AI service temporarily unavailable',
        details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      });
    }
  });

  fastify.get('/chatbot/insights', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };

    try {
      const response = await axios.get(
        `${AI_SERVICE_URL}/insights`,
        { params: { businessId }, headers: internalHeaders(), timeout: 90_000 }
      );
      return reply.send(response.data);
    } catch (err: any) {
      fastify.log.error({ err }, '[Chatbot] Insights error');
      return reply.status(503).send({ success: false, error: 'Insights temporarily unavailable' });
    }
  });

  fastify.get('/chatbot/analytics-insights', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const query = req.query as Record<string, string>;

    try {
      const response = await axios.get(
        `${AI_SERVICE_URL}/analytics-insights`,
        { params: { businessId, ...query }, headers: internalHeaders(), timeout: 90_000 }
      );
      return reply.send(response.data);
    } catch (err: any) {
      fastify.log.error({ err }, '[Chatbot] Analytics insights error');
      return reply.status(503).send({ success: false, error: 'Analytics insights temporarily unavailable' });
    }
  });

  fastify.post('/chatbot/clear-cache', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };

    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/clear-history`,
        { businessId },
        { headers: internalHeaders(), timeout: 10_000 }
      );
      return reply.send(response.data);
    } catch (err: any) {
      fastify.log.error({ err }, '[Chatbot] Clear cache error');
      return reply.status(503).send({ success: false, error: 'Could not clear cache' });
    }
  });

  fastify.get('/chatbot/health', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };

    try {
      const response = await axios.get(
        `${AI_SERVICE_URL}/health`,
        { headers: internalHeaders(), timeout: 5_000 }
      );
      return reply.send({
        success: true,
        status: 'healthy',
        businessId,
        aiService: response.data,
      });
    } catch {
      return reply.status(503).send({
        success: false,
        status: 'unhealthy',
        businessId,
        error: 'AI service unreachable',
      });
    }
  });
}
