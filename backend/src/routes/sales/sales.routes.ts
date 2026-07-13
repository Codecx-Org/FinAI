import type { FastifyInstance } from 'fastify';
import { SalesService } from '../../services/sales-service.js';

const salesService = new SalesService();

/**
 * Sales Routes (all protected — require JWT)
 * GET    /api/sales        - List all sales
 * GET    /api/sales/:id    - Get sale by ID
 * POST   /api/sales        - Create sale record
 * PUT    /api/sales/:id    - Update sale
 * DELETE /api/sales/:id    - Delete sale
 */
export async function salesRoutes(fastify: FastifyInstance) {
  fastify.get('/sales', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const sales = await salesService.getAllSales(businessId);
    return reply.send({ success: true, data: sales });
  });

  fastify.get<{ Params: { id: string } }>('/sales/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const sale = await salesService.getSale(Number(req.params.id), businessId);
    return reply.send({ success: true, data: sale });
  });

  fastify.post('/sales', {
    schema: {
      body: {
        type: 'object',
        required: ['orderId', 'productId', 'quantity', 'totalAmount'],
        properties: {
          orderId: { type: 'number' },
          productId: { type: 'number' },
          quantity: { type: 'number', minimum: 1 },
          totalAmount: { type: 'number', minimum: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const body = req.body as any;
    const sale = await salesService.createSale({ ...body, businessId });
    return reply.status(201).send({ success: true, data: sale });
  });

  fastify.put<{ Params: { id: string } }>('/sales/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const sale = await salesService.updateSale(
      Number(req.params.id),
      businessId,
      req.body as any
    );
    return reply.send({ success: true, data: sale });
  });

  fastify.delete<{ Params: { id: string } }>('/sales/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    await salesService.deleteSale(Number(req.params.id), businessId);
    return reply.send({ success: true, message: 'Sale record deleted' });
  });
}
