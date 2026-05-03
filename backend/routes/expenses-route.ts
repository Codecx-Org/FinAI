import express from 'express';
import { ExpenseService } from '../services/expense-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate } from '../utils/auth-middleware.js';
import type { AuthenticatedRequest } from '../utils/auth-middleware.js';

const router = express.Router();
const expenseService = new ExpenseService();

router.post('/expenses', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  const expense = await expenseService.createExpense({ ...req.body, businessId });
  res.status(201).json(expense);
}));

router.get('/expenses/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  const expense = await expenseService.getExpense(Number(req.params.id), businessId);
  res.json(expense);
}));

router.get('/expenses', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = Number(req.query.businessId) || req.user?.id;
  const expenses = await expenseService.getAllExpenses(businessId);
  res.json(expenses);
}));

router.put('/expenses/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  const expense = await expenseService.updateExpense(Number(req.params.id), businessId, req.body);
  res.json(expense);
}));

router.delete('/expenses/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  await expenseService.deleteExpense(Number(req.params.id), businessId);
  res.status(204).send();
}));

export default router;
