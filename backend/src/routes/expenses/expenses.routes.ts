import type { FastifyInstance } from 'fastify';
import { ExpenseService } from '../../services/expense-service.js';

const expenseService = new ExpenseService();

/**
 * Expense Routes (all protected — require JWT)
 * GET    /api/expenses        - List all expenses
 * GET    /api/expenses/:id    - Get expense by ID
 * POST   /api/expenses        - Create expense
 * PUT    /api/expenses/:id    - Update expense
 * DELETE /api/expenses/:id    - Delete expense
 */
export async function expenseRoutes(fastify: FastifyInstance) {
  fastify.get('/expenses', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const expenses = await expenseService.getAllExpenses(businessId);
    return reply.send({ success: true, data: expenses });
  });

  fastify.get<{ Params: { id: string } }>('/expenses/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const expense = await expenseService.getExpense(Number(req.params.id), businessId);
    return reply.send({ success: true, data: expense });
  });

  fastify.post('/expenses', {
    schema: {
      body: {
        type: 'object',
        required: ['type', 'amount'],
        properties: {
          type: { type: 'string', minLength: 1, description: 'e.g. Rent, Salaries, Stock Purchase' },
          amount: { type: 'number', minimum: 0 },
          description: { type: 'string' },
          isRecurring: { type: 'boolean' },
          frequency: { type: 'string', enum: ['monthly', 'quarterly'] },
          nextDueDate: { type: 'string', description: 'ISO date string' },
        },
      },
    },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const body = req.body as any;

    const nextDueDate = body.nextDueDate ? new Date(body.nextDueDate) : undefined;
    const expense = await expenseService.createExpense({ ...body, businessId, nextDueDate });
    return reply.status(201).send({ success: true, data: expense });
  });

  fastify.put<{ Params: { id: string } }>('/expenses/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const expense = await expenseService.updateExpense(
      Number(req.params.id),
      businessId,
      req.body as any
    );
    return reply.send({ success: true, data: expense });
  });

  fastify.delete<{ Params: { id: string } }>('/expenses/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    await expenseService.deleteExpense(Number(req.params.id), businessId);
    return reply.send({ success: true, message: 'Expense deleted' });
  });
}
