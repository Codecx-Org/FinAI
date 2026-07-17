import type { FastifyInstance } from 'fastify';
import axios from 'axios';
import { AnalyticsService } from '../../../services/analytics-service.js';

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

  fastify.get('/analytics/overview', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const data = await analyticsService.getWeeklyOverview(businessId);
    return reply.send({ success: true, data });
  });

  fastify.get('/analytics/ai-insights', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || '';

    try {
      const response = await axios.get(
        `${AI_SERVICE_URL}/analytics-insights`,
        {
          params: { businessId },
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': INTERNAL_SECRET,
          },
          timeout: 90_000,
        }
      );
      return reply.send({ success: true, data: response.data });
    } catch (err: any) {
      fastify.log.error({ err }, '[Analytics AI Insights] Error proxying to AI service');
      return reply.status(503).send({ success: false, error: 'AI insights temporarily unavailable' });
    }
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
