import prisma from '../utils/prisma.js';
import { startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, format, subMonths } from 'date-fns';

type Timeframe = 'week' | 'month' | 'year' | 'all';

export class AnalyticsService {
  
  private getDateRange(timeframe: Timeframe) {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'all':
        return { start: new Date(0), end: now };
      default:
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    }
  }

  async getSalesAnalytics(businessId: number, timeframe: Timeframe) {
    const { start, end } = this.getDateRange(timeframe);

    const sales = await prisma.sales.findMany({
      where: {
        businessId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by day or month depending on timeframe
    const grouped = sales.reduce((acc: any, curr) => {
      const date = timeframe === 'year' 
        ? format(curr.createdAt, 'yyyy-MM') 
        : format(curr.createdAt, 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + (curr.totalAmount || 0);
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, amount]) => ({ date, amount: Number(amount) }));
  }

  async getExpenseAnalytics(businessId: number, timeframe: Timeframe) {
    const { start, end } = this.getDateRange(timeframe);

    const expenses = await prisma.expenses.findMany({
      where: {
        businessId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const grouped = expenses.reduce((acc: any, curr) => {
      const date = timeframe === 'year' 
        ? format(curr.createdAt, 'yyyy-MM') 
        : format(curr.createdAt, 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + (curr.amount || 0);
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, amount]) => ({ date, amount: Number(amount) }));
  }

  async getCategoryPerformance(businessId: number) {
    // Sales by Category (using Product Category or Name as fallback)
    const sales = await prisma.sales.findMany({
      where: { businessId },
      include: { product: true },
    });

    const salesByCategory: Record<string, number> = {};
    sales.forEach(sale => {
      const category = sale.product?.category || sale.product?.name || 'Other';
      salesByCategory[category] = (salesByCategory[category] || 0) + sale.totalAmount;
    });

    const formattedSales = Object.entries(salesByCategory).map(([name, value]) => ({
      name,
      value: Number(value),
      type: 'sales'
    })).sort((a, b) => b.value - a.value);

    // Expenses by Type
    const expenses = await prisma.expenses.groupBy({
      by: ['type'],
      where: { businessId },
      _sum: { amount: true },
    });

    const formattedExpenses = expenses.map(exp => ({
      name: exp.type,
      value: Number(exp._sum.amount || 0),
      type: 'expense'
    })).sort((a, b) => b.value - a.value);

    return {
      sales: formattedSales,
      expenses: formattedExpenses
    };
  }

  async getWeeklyOverview(businessId: number) {
    const { start } = this.getDateRange('week');

    const sales = await this.getSalesAnalytics(businessId, 'week');
    
    // Fill in missing days (Monday to Sunday)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const overview = days.map((day, index) => {
      const date = new Date(start);
      date.setDate(date.getDate() + index);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const salesEntry = sales.find((s: any) => s.date === dateStr);
      
      return {
        day: day.substring(0, 3), // Mon, Tue...
        sales: salesEntry ? Number(salesEntry.amount) : 0,
        fullDate: dateStr
      };
    });

    return overview;
  }

  async getProfitAnalytics(businessId: number, timeframe: Timeframe) {
    const { start, end } = this.getDateRange(timeframe);
    const sales = await this.getSalesAnalytics(businessId, timeframe);
    const expenses = await this.getExpenseAnalytics(businessId, timeframe);

    // If week or month, fill in missing days
    if (timeframe === 'week' || timeframe === 'month') {
      const result = [];
      let current = new Date(start);
      while (current <= end && current <= new Date()) {
        const dateStr = format(current, 'yyyy-MM-dd');
        const revenue = Number(sales.find((s: any) => s.date === dateStr)?.amount || 0);
        const expense = Number(expenses.find((e: any) => e.date === dateStr)?.amount || 0);
        
        result.push({
          date: dateStr,
          revenue,
          expense,
          profit: revenue - expense,
          margin: revenue > 0 ? ((revenue - expense) / revenue) * 100 : 0
        });
        current.setDate(current.getDate() + 1);
      }
      return result;
    }

    // For year, group by month (ensure all months are present)
    if (timeframe === 'year') {
      const result = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(start.getFullYear(), i, 1);
        const dateStr = format(date, 'yyyy-MM');
        const revenue = Number(sales.find((s: any) => s.date === dateStr)?.amount || 0);
        const expense = Number(expenses.find((e: any) => e.date === dateStr)?.amount || 0);
        
        result.push({
          date: dateStr,
          revenue,
          expense,
          profit: revenue - expense,
          margin: revenue > 0 ? ((revenue - expense) / revenue) * 100 : 0
        });
      }
      return result;
    }

    // For 'all', just merge existing dates
    const allDates = new Set([
      ...sales.map((s: any) => s.date), 
      ...expenses.map((e: any) => e.date)
    ]);

    const result = Array.from(allDates).sort().map(date => {
      const revenue = Number(sales.find((s: any) => s.date === date)?.amount || 0);
      const expense = Number(expenses.find((e: any) => e.date === date)?.amount || 0);
      return {
        date,
        revenue,
        expense,
        profit: revenue - expense,
        margin: revenue > 0 ? ((revenue - expense) / revenue) * 100 : 0
      };
    });

    return result;
  }
}
