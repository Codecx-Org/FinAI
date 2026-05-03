import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export type Timeframe = 'week' | 'month' | 'year' | 'all';

export interface WeeklyOverview {
  day: string;
  sales: number;
  fullDate: string;
}

export interface CategoryData {
  name: string;
  value: number;
  type: 'sales' | 'expense';
}

export interface ProfitData {
  date: string;
  revenue: number;
  expense: number;
  profit: number;
  margin: number;
}

export interface AIInsights {
  summary: string;
  trends: {
    title: string;
    description: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
  recommendations: {
    action: string;
    reason: string;
    priority: 'High' | 'Medium' | 'Low';
  }[];
}

export const useWeeklyOverview = (businessId?: number) => {
  return useQuery({
    queryKey: ['analytics', 'overview', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get<WeeklyOverview[]>(`/analytics/overview`);
      return response.data;
    },
    enabled: !!businessId,
  });
};

export const useCategoryPerformance = (businessId?: number) => {
  return useQuery({
    queryKey: ['analytics', 'categories', businessId],
    queryFn: async () => {
      if (!businessId) return { sales: [], expenses: [] };
      const response = await api.get<{ sales: CategoryData[], expenses: CategoryData[] }>(`/analytics/categories`);
      return response.data;
    },
    enabled: !!businessId,
  });
};

export const useProfitAnalytics = (businessId?: number, timeframe: Timeframe = 'week') => {
  return useQuery({
    queryKey: ['analytics', 'profit', businessId, timeframe],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get<ProfitData[]>(`/analytics/profit`, {
        params: { timeframe },
      });
      return response.data;
    },
    enabled: !!businessId,
  });
};

export const useAIInsights = (businessId?: number) => {
  return useQuery({
    queryKey: ['analytics', 'ai-insights', businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const response = await api.get<AIInsights>(`/analytics/ai-insights`);
      return response.data;
    },
    enabled: !!businessId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour as it's expensive
  });
};
