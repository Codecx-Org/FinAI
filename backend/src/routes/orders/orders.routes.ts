import type { FastifyInstance } from 'fastify';
import { OrderService } from '../../services/orders-services.js';
import { OrderItemService } from '../../services/orders-items-services.js';

const orderService = new OrderService();
const orderItemService = new OrderItemService();

/**
 * Order Routes (all protected — require JWT)
 * GET    /api/orders           - List all orders
 * GET    /api/orders/:id       - Get order by ID
 * POST   /api/orders           - Create order
 * PUT    /api/orders/:id       - Update order
 * DELETE /api/orders/:id       - Delete order
 * POST   /api/orders/:id/items - Add item to order
 */
export async function orderRoutes(fastify: FastifyInstance) {
  fastify.get('/orders', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const orders = await orderService.getAllOrders(businessId);
    return reply.send({ success: true, data: orders });
  });

  fastify.get<{ Params: { id: string } }>('/orders/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const order = await orderService.getOrder(Number(req.params.id), businessId);
    return reply.send({ success: true, data: order });
  });

  fastify.post('/orders', {
    schema: {
      body: {
        type: 'object',
        required: ['totalAmount', 'status'],
        properties: {
          customerId: { type: 'number' },
          totalAmount: { type: 'number', minimum: 0 },
          status: { type: 'string', enum: ['drafted', 'created', 'pending', 'paid', 'canceled', 'failed'] },
          orderItems: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { type: 'number' },
                quantity: { type: 'number', minimum: 1 },
              },
            },
          },
        },
      },
    },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const body = req.body as any;
    const order = await orderService.createOrder({ ...body, businessId });
    return reply.status(201).send({ success: true, data: order });
  });

  fastify.put<{ Params: { id: string } }>('/orders/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const order = await orderService.updateOrder(
      Number(req.params.id),
      businessId,
      req.body as any
    );
    return reply.send({ success: true, data: order });
  });

  fastify.delete<{ Params: { id: string } }>('/orders/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    await orderService.deleteOrder(Number(req.params.id), businessId);
    return reply.send({ success: true, message: 'Order deleted' });
  });

  fastify.post<{ Params: { id: string } }>('/orders/:id/items', {
    schema: {
      body: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'number' },
          quantity: { type: 'number', minimum: 1 },
        },
      },
    },
  }, async (req, reply) => {
    const body = req.body as { productId: number; quantity: number };
    const item = await orderItemService.createOrderItem({
      orderId: Number(req.params.id),
      productId: body.productId,
      quantity: body.quantity,
    });
    return reply.status(201).send({ success: true, data: item });
  });
}
