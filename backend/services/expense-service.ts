import { redisService } from '../services/redis-service.js';
import prisma from '../utils/prisma.js';
import { NotFoundError, InternalServerError } from '../utils/types/errors.js';

export class ExpenseService {
  async createExpense(data: {
    type: string;
    amount: number;
    description?: string;
    isRecurring?: boolean;
    frequency?: string;
    nextDueDate?: Date;
  }) {
    try {
      const expense = await prisma.expenses.create({
        data,
        select: { id: true, type: true, amount: true, description: true, isRecurring: true, frequency: true, nextDueDate: true, createdAt: true },
      });
      if (!data.isRecurring) {
        await redisService.publish('expense:processed', JSON.stringify({ expenseId: expense.id }));
      }
      return expense;
    } catch (error) {
      throw new InternalServerError('Failed to create expense');
    }
  }

  async getExpense(id: number) {
    const expense = await prisma.expenses.findUnique({ where: { id } });
    if (!expense) throw new NotFoundError('Expense not found');
    return expense;
  }

  async getAllExpenses() {
    return await prisma.expenses.findMany();
  }

  async updateExpense(id: number, data: any) {
    try {
      return await prisma.expenses.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2025') throw new NotFoundError('Expense not found');
      throw new InternalServerError('Failed to update expense');
    }
  }

  async deleteExpense(id: number) {
    try {
      await prisma.expenses.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2025') throw new NotFoundError('Expense not found');
      throw new InternalServerError('Failed to delete expense');
    }
  }

  async processRecurringExpenses() {
    const recurring = await prisma.expenses.findMany({
      where: { isRecurring: true, nextDueDate: { lte: new Date() } },
    });
    for (const exp of recurring) {
      const newExpense = await this.createExpense({
        type: exp.type,
        amount: exp.amount,
        description: exp.description || "",
        isRecurring: false,
      });
      if (exp.frequency === 'monthly') {
        const nextDate = new Date(exp.nextDueDate || new Date());
        nextDate.setMonth(nextDate.getMonth() + 1);
        await prisma.expenses.update({
          where: { id: exp.id },
          data: { nextDueDate: nextDate },
        });
      }
      await redisService.publish('expense:processed', JSON.stringify({ expenseId: newExpense.id }));
    }
  }
}
