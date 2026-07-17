import type { FastifyInstance } from 'fastify';
import { CustomerService } from '../../../services/customer-service.js';

const customerService = new CustomerService();

/**
 * Customer Routes (all protected — require JWT)
 * GET  /api/customers       - List all customers
 * GET  /api/customers/:id   - Get customer by ID
 * POST /api/customers       - Create customer
 * PUT  /api/customers/:id   - Update customer
 */
export async function customerRoutes(fastify: FastifyInstance) {
  fastify.get('/customers', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const customers = await customerService.getAllCustomers(businessId);
    return reply.send({ success: true, data: customers });
  });

  fastify.get<{ Params: { id: string } }>('/customers/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const customer = await customerService.getCustomer(Number(req.params.id), businessId);
    return reply.send({ success: true, data: customer });
  });

  fastify.post('/customers', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const body = req.body as any;
    const customer = await customerService.createCustomer({ ...body, businessId });
    return reply.status(201).send({ success: true, data: customer });
  });

  fastify.put<{ Params: { id: string } }>('/customers/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const customer = await customerService.updateCustomer(
      Number(req.params.id),
      businessId,
      req.body as any
    );
    return reply.send({ success: true, data: customer });
  });
}
