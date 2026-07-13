import type { FastifyInstance } from 'fastify';
import { businessService, toPublicBusiness } from '../../services/business-service.js';

/**
 * Business Routes (protected — require JWT)
 * GET  /api/business        - Get own business profile
 * PUT  /api/business        - Update own business profile
 * DELETE /api/business      - Delete own business account
 *
 * Note: business creation happens via /api/auth/register.
 * Listing all businesses is explicitly forbidden.
 */
export async function businessRoutes(fastify: FastifyInstance) {
  // Get own business (authenticated user's business only)
  fastify.get('/business', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const business = await businessService.getBusinessById(businessId);
    return reply.send({ success: true, data: toPublicBusiness(business) });
  });

  // Get business by ID — only allowed for own business
  fastify.get<{ Params: { id: string } }>('/business/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const requestedId = Number(req.params.id);

    // Enforce ownership — users can only view their own business
    if (requestedId !== businessId) {
      return reply.status(403).send({ success: false, error: 'Access denied' });
    }

    const business = await businessService.getBusinessById(businessId);
    return reply.send({ success: true, data: toPublicBusiness(business) });
  });

  // Update own business profile
  fastify.put('/business', {
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          businessType: { type: 'string' },
          ownerName: { type: 'string' },
          ownerPhone: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const business = await businessService.updateBusiness(businessId, req.body as any);
    return reply.send({ success: true, data: toPublicBusiness(business) });
  });

  // Delete own business account
  fastify.delete('/business', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    await businessService.deleteBusiness(businessId);
    return reply.status(204).send();
  });
}
