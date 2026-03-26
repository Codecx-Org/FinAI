import { Router, type Response } from 'express';
import { AnalyticsService } from '../services/analytics-service.js';
import { getAgentForBusiness } from '../chatbot/agent-manager.js';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate, type AuthenticatedRequest } from '../utils/auth-middleware.js';

const router = Router();
const analyticsService = new AnalyticsService();

router.get('/analytics/overview', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

  const overview = await analyticsService.getWeeklyOverview(businessId);
  res.json(overview);
}));

router.get('/analytics/sales', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  
  const timeframe = (req.query.timeframe as 'week' | 'month' | 'year' | 'all') || 'week';
  const data = await analyticsService.getSalesAnalytics(businessId, timeframe);
  res.json(data);
}));

router.get('/analytics/expenses', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  
  const timeframe = (req.query.timeframe as 'week' | 'month' | 'year' | 'all') || 'week';
  const data = await analyticsService.getExpenseAnalytics(businessId, timeframe);
  res.json(data);
}));

router.get('/analytics/categories', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  
  const data = await analyticsService.getCategoryPerformance(businessId);
  res.json(data);
}));

router.get('/analytics/profit', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  
  const timeframe = (req.query.timeframe as 'week' | 'month' | 'year' | 'all') || 'week';
  const data = await analyticsService.getProfitAnalytics(businessId, timeframe);
  res.json(data);
}));

router.get('/analytics/ai-insights', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

  // Gather all data for the agent
  const [overview, categories, profit] = await Promise.all([
    analyticsService.getWeeklyOverview(businessId),
    analyticsService.getCategoryPerformance(businessId),
    analyticsService.getProfitAnalytics(businessId, 'month') // Default to month for deeper insights
  ]);

  const analyticsData = {
    weeklyOverview: overview,
    categoryPerformance: categories,
    monthlyProfit: profit
  };

  try {
    const agent = await getAgentForBusiness(businessId);
    const insights = await agent.getAnalyticsInsights(businessId, analyticsData);
    res.json(insights);
  } catch (error: any) {
    console.error(`[ANALYTICS] Error generating AI insights:`, error);
    res.status(503).json({ error: 'AI insights temporarily unavailable' });
  }
}));

export default router;
