import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export interface Expense {
  id: number;
  type: string;
  amount: number;
  description?: string;
  isRecurring?: boolean;
  frequency?: string;
  nextDueDate?: string;
  createdAt: string;
  businessId: number;
}

export const useExpenses = (businessId?: number) => {
  return useQuery({
    queryKey: ['expenses', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get<Expense[]>(`/expenses`, {
        params: { businessId },
      });
      return response.data;
    },
    enabled: !!businessId,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Expense, 'id' | 'createdAt'>) => {
      const response = await api.post<Expense>('/expenses', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', data.businessId] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: number; businessId: number }) => {
      await api.delete(`/expenses/${id}`);
      return { id, businessId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', data.businessId] });
    },
  });
};
