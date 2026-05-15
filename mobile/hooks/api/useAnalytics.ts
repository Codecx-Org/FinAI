import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';

export type Timeframe = 'week' | 'month' | 'year' | 'all';

export interface WeeklyOverview {
  day: string;
  sales: number;
  fullDate: string;
}

export interface AnalyticsDataPoint {
  date: string;
  amount: number;
}

export interface CategoryPerformance {
  sales: Array<{ name: string; value: number; type: string }>;
  expenses: Array<{ name: string; value: number; type: string }>;
}

export interface ProfitAnalytics {
  date: string;
  revenue: number;
  expense: number;
  profit: number;
  margin: number;
}

export interface AIInsights {
  summary: string;
  trends: Array<{
    title: string;
    description: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  recommendations: Array<{
    action: string;
    reason: string;
    priority: 'High' | 'Medium' | 'Low';
  }>;
}

export const useAnalytics = () => {
  const getWeeklyOverview = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const response = await api.get<WeeklyOverview[]>('/analytics/overview');
      return response.data;
    },
  });

  const getSalesAnalytics = (timeframe: Timeframe = 'week') => {
    return useQuery({
      queryKey: ['analytics', 'sales', timeframe],
      queryFn: async () => {
        const response = await api.get<AnalyticsDataPoint[]>('/analytics/sales', {
          params: { timeframe },
        });
        return response.data;
      },
    });
  };

  const getExpenseAnalytics = (timeframe: Timeframe = 'week') => {
    return useQuery({
      queryKey: ['analytics', 'expenses', timeframe],
      queryFn: async () => {
        const response = await api.get<AnalyticsDataPoint[]>('/analytics/expenses', {
          params: { timeframe },
        });
        return response.data;
      },
    });
  };

  const getCategoryPerformance = useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: async () => {
      const response = await api.get<CategoryPerformance>('/analytics/categories');
      return response.data;
    },
  });

  const getProfitAnalytics = (timeframe: Timeframe = 'week') => {
    return useQuery({
      queryKey: ['analytics', 'profit', timeframe],
      queryFn: async () => {
        const response = await api.get<ProfitAnalytics[]>('/analytics/profit', {
          params: { timeframe },
        });
        return response.data;
      },
    });
  };

  const getAIInsights = useQuery({
    queryKey: ['analytics', 'ai-insights'],
    queryFn: async () => {
      const response = await api.get<AIInsights>('/analytics/ai-insights');
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    weeklyOverview: getWeeklyOverview.data || [],
    isOverviewLoading: getWeeklyOverview.isLoading,
    overviewError: (getWeeklyOverview.error as ApiError)?.friendlyMessage || null,
    
    salesAnalytics: getSalesAnalytics,
    expenseAnalytics: getExpenseAnalytics,
    profitAnalytics: getProfitAnalytics,
    
    categoryPerformance: getCategoryPerformance.data || { sales: [], expenses: [] },
    isCategoriesLoading: getCategoryPerformance.isLoading,
    categoriesError: (getCategoryPerformance.error as ApiError)?.friendlyMessage || null,
    
    aiInsights: getAIInsights.data,
    isAIInsightsLoading: getAIInsights.isLoading,
    aiInsightsError: (getAIInsights.error as ApiError)?.friendlyMessage || null,
    fetchAIInsights: getAIInsights.refetch,
  };
};
