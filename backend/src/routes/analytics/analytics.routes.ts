import type { FastifyInstance } from 'fastify';
import { AnalyticsService } from '../../services/analytics-service.js';

const analyticsService = new AnalyticsService();

/**
 * Analytics Routes (all protected — require JWT)
 * GET /api/analytics/sales       - Sales analytics (timeframe: week|month|year|all)
 * GET /api/analytics/expenses    - Expense analytics
 * GET /api/analytics/profit      - Profit analytics
 * GET /api/analytics/categories  - Category performance breakdown
 * GET /api/analytics/weekly      - Weekly overview (Mon-Sun)
 * GET /api/analytics/dashboard   - Comprehensive analytics bundle for dashboards
 */
export async function analyticsRoutes(fastify: FastifyInstance) {
  const timeframeSchema = {
    type: 'object',
    properties: {
      timeframe: { type: 'string', enum: ['week', 'month', 'year', 'all'] },
    },
  };

  fastify.get('/analytics/sales', {
    schema: { querystring: timeframeSchema },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const { timeframe = 'week' } = req.query as { timeframe?: any };
    const data = await analyticsService.getSalesAnalytics(businessId, timeframe);
    return reply.send({ success: true, data });
  });

  fastify.get('/analytics/expenses', {
    schema: { querystring: timeframeSchema },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const { timeframe = 'week' } = req.query as { timeframe?: any };
    const data = await analyticsService.getExpenseAnalytics(businessId, timeframe);
    return reply.send({ success: true, data });
  });

  fastify.get('/analytics/profit', {
    schema: { querystring: timeframeSchema },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const { timeframe = 'week' } = req.query as { timeframe?: any };
    const data = await analyticsService.getProfitAnalytics(businessId, timeframe);
    return reply.send({ success: true, data });
  });

  fastify.get('/analytics/categories', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const data = await analyticsService.getCategoryPerformance(businessId);
    return reply.send({ success: true, data });
  });

  fastify.get('/analytics/weekly', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const data = await analyticsService.getWeeklyOverview(businessId);
    return reply.send({ success: true, data });
  });

  /**
   * Comprehensive analytics bundle — fetches everything in parallel for dashboard loads.
   */
  fastify.get('/analytics/dashboard', {
    schema: { querystring: timeframeSchema },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const { timeframe = 'month' } = req.query as { timeframe?: any };

    const [sales, expenses, profit, categories, weekly] = await Promise.all([
      analyticsService.getSalesAnalytics(businessId, timeframe),
      analyticsService.getExpenseAnalytics(businessId, timeframe),
      analyticsService.getProfitAnalytics(businessId, timeframe),
      analyticsService.getCategoryPerformance(businessId),
      analyticsService.getWeeklyOverview(businessId),
    ]);

    return reply.send({
      success: true,
      data: { sales, expenses, profit, categories, weekly, timeframe },
    });
  });
}
