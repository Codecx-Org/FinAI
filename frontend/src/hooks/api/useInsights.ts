import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export interface BusinessInsight {
  tips: {
    title: string;
    tip: string;
    impact: 'High' | 'Medium' | 'Low';
  }[];
  insight: string;
  summary: {
    revenue: number;
    expenses: number;
    profit: number;
  };
}

export const useInsights = (businessId?: number) => {
  return useQuery({
    queryKey: ['insights', businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const response = await api.get<BusinessInsight>(`/chatbot/insights`, {
        params: { businessId },
      });
      return response.data;
    },
    enabled: !!businessId,
  });
};
