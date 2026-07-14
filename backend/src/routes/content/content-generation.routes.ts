import type { FastifyInstance } from 'fastify';
import { socialMediaService } from '../../../services/social-media-service.js';

/**
 * Content Generation Routes (protected — require JWT)
 * POST /api/content/generate-social-media    - Generate text & image for marketing posts
 */
export async function contentGenerationRoutes(fastify: FastifyInstance) {
  fastify.post('/content/generate-social-media', {
    schema: {
      body: {
        type: 'object',
        required: ['platform', 'type', 'tone', 'description'],
        properties: {
          platform: { type: 'string', enum: ['instagram', 'twitter', 'linkedin'] },
          type: { type: 'string', enum: ['post', 'ad'] },
          tone: { type: 'string' },
          description: { type: 'string', minLength: 5, maxLength: 500 },
        },
      },
    },
  }, async (req, reply) => {
    const { platform, type, tone, description } = req.body as {
      platform: string;
      type: string;
      tone: string;
      description: string;
    };

    const result = await socialMediaService.generateContent({
      platform,
      type,
      tone,
      description,
    });

    return reply.send({ success: true, data: result });
  });
}
