import express from 'express';
import { ExpenseService } from '../services/expense-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = express.Router();
const expenseService = new ExpenseService();

router.post('/expenses', asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.body);
  res.status(201).json(expense);
}));

router.get('/expenses/:id', asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpense(Number(req.params.id));
  res.json(expense);
}));

router.get('/expenses', asyncHandler(async (req, res) => {
  const businessId = req.query.businessId ? Number(req.query.businessId) : undefined;
  const expenses = await expenseService.getAllExpenses(businessId);
  res.json(expenses);
}));

router.put('/expenses/:id', asyncHandler(async (req, res) => {
  const expense = await expenseService.updateExpense(Number(req.params.id), req.body);
  res.json(expense);
}));

router.delete('/expenses/:id', asyncHandler(async (req, res) => {
  await expenseService.deleteExpense(Number(req.params.id));
  res.status(204).send();
}));

export default router;
