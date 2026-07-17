import type { FastifyInstance } from 'fastify';
import { PaymentService } from '../../../services/payment-service.js';

const paymentService = new PaymentService();

/**
 * Payment Routes (all protected — require JWT)
 * POST /api/payments/initiate          - Initiate M-Pesa STK Push
 * GET  /api/payments/:orderId/status   - Check payment status for an order
 *
 * Webhook Routes (PUBLIC — called by M-Pesa servers)
 * POST /api/webhook/mpesa              - M-Pesa payment callback
 */
export async function paymentRoutes(fastify: FastifyInstance) {
  // Protected: Initiate STK Push
  fastify.post('/payments/initiate', {
    schema: {
      body: {
        type: 'object',
        required: ['orderId', 'phone', 'amount'],
        properties: {
          orderId: { type: 'number' },
          phone: {
            type: 'string',
            pattern: '^(07|01)[0-9]{8}$',
            description: 'Kenyan phone number: 07XXXXXXXX or 01XXXXXXXX',
          },
          amount: { type: 'number', minimum: 1 },
        },
      },
    },
  }, async (req, reply) => {
    const { orderId, phone, amount } = req.body as { orderId: number; phone: string; amount: number };
    const result = await paymentService.initiateSTKPush(orderId, phone, amount);
    return reply.send(result);
  });

  // Protected: Check payment status
  fastify.get<{ Params: { orderId: string } }>('/payments/:orderId/status', async (req, reply) => {
    const orderId = Number(req.params.orderId);
    // Payment status is determined by order status
    const result = await paymentService.handleMpesaWebhook({ orderId });
    return reply.send({ success: true, orderId, data: result });
  });
}

/**
 * Webhook routes — registered WITHOUT auth middleware (M-Pesa calls this directly)
 */
export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post('/webhook/mpesa', async (req, reply) => {
    const result = await paymentService.handleMpesaWebhook(req.body as any);
    return reply.send(result);
  });
}
