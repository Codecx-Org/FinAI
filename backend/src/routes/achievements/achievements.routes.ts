import type { FastifyInstance } from 'fastify';
import { achievementService } from '../../../services/achievement-service.js';

/**
 * Achievements Routes (protected — require JWT)
 * GET    /api/achievements           - Get all achievements for the business
 * POST   /api/achievements           - Create a custom achievement/goal
 * PATCH  /api/achievements/:id       - Toggle earned status of an achievement
 * DELETE /api/achievements/:id       - Delete a custom achievement
 */
export async function achievementsRoutes(fastify: FastifyInstance) {
  // Get all achievements
  fastify.get('/achievements', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const achievements = await achievementService.getAllAchievements(businessId);
    return reply.send({ success: true, data: achievements });
  });

  // Create achievement
  fastify.post('/achievements', {
    schema: {
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const body = req.body as { title: string; description?: string };

    const achievement = await achievementService.createAchievement({
      ...body,
      businessId,
    });
    return reply.status(201).send({ success: true, data: achievement });
  });

  // Toggle/Update achievement status
  fastify.patch<{ Params: { id: string } }>('/achievements/:id', {
    schema: {
      body: {
        type: 'object',
        properties: {
          earned: { type: 'boolean' },
        },
      },
    },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const id = Number(req.params.id);
    const body = req.body as { earned?: boolean };

    const achievement = await achievementService.updateAchievement(
      id,
      businessId,
      body
    );
    return reply.send({ success: true, data: achievement });
  });

  // Delete achievement
  fastify.delete<{ Params: { id: string } }>('/achievements/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const id = Number(req.params.id);

    await achievementService.deleteAchievement(id, businessId);
    return reply.status(204).send();
  });
}
