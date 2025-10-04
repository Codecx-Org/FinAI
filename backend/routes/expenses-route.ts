import express from 'express';
import { ExpenseService } from '../services/expense-service.js';

const router = express.Router();
const expenseService = new ExpenseService();

router.post('/expenses', async (req, res) => {
  try {
    const expense = await expenseService.createExpense(req.body);
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.get('/expenses/:id', async (req, res) => {
  try {
    const expense = await expenseService.getExpense(Number(req.params.id));
    if (!expense) throw new Error('Expense not found');
    res.json(expense);
  } catch (error) {
    res.status(404).json({ error: 'Expense not found' });
  }
});

router.get('/expenses', async (req, res) => {
  try {
    const expenses = await expenseService.getAllExpenses();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.put('/expenses/:id', async (req, res) => {
  try {
    const expense = await expenseService.updateExpense(Number(req.params.id), req.body);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    await expenseService.deleteExpense(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;