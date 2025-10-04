import { redisService } from '../services/redis-service.js';
import prisma from '../utils/prisma.js';
import cron from 'node-cron';


export class ExpenseService {
  async createExpense(data: {
    type: string;
    amount: number;
    description?: string;
    isRecurring?: boolean;
    frequency?: string;
    nextDueDate?: Date;
  }) {
    const expense = await prisma.expenses.create({
      data,
      select: { id: true, type: true, amount: true, description: true, isRecurring: true, frequency: true, nextDueDate: true, createdAt: true },
    });
    if (!data.isRecurring) {
      await redisService.publish('expense:processed', JSON.stringify({ expenseId: expense.id }));
    }
    return expense;
  }

  async getExpense(id: number) {
    return prisma.expenses.findUnique({ where: { id } });
  }

  async getAllExpenses() {
    return prisma.expenses.findMany();
  }

  async updateExpense(id: number, data: { type?: string; amount?: number; description?: string; isRecurring?: boolean; frequency?: string; nextDueDate?: Date }) {
    return prisma.expenses.update({
      where: { id },
      data,
      select: { id: true, type: true, amount: true, description: true, isRecurring: true, frequency: true, nextDueDate: true, createdAt: true },
    });
  }

  async deleteExpense(id: number) {
    return prisma.expenses.delete({ where: { id } });
  }

  async processRecurringExpenses() {
    const recurring = await prisma.expenses.findMany({
      where: { isRecurring: true, nextDueDate: { lte: new Date() } },
    });
    for (const exp of recurring) {
      // Log instance of recurring expense
      const newExpense = await this.createExpense({
        type: exp.type,
        amount: exp.amount,
        description: exp.description || "",
        isRecurring: false,
      });
      // Update next due date
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

// Cron for recurring expenses (in main.ts or a dedicated cron file)
const expenseService = new ExpenseService();
cron.schedule('0 0 * * *', async () => {
  await expenseService.processRecurringExpenses();
});