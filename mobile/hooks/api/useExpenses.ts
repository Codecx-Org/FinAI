import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';

export interface Expense {
  id: number;
  type: string;
  description?: string;
  amount: number;
  isRecurring: boolean;
  frequency?: string;
  nextDueDate?: string;
  createdAt: string;
  businessId: number;
}

export interface CreateExpenseInput {
  type: string;
  description?: string;
  amount: number;
  isRecurring?: boolean;
  frequency?: string;
  nextDueDate?: string;
}

export interface UpdateExpenseInput {
  type?: string;
  description?: string;
  amount?: number;
  isRecurring?: boolean;
  frequency?: string;
  nextDueDate?: string;
}

export const useExpenses = () => {
  const queryClient = useQueryClient();

  const getExpenses = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await api.get<Expense[]>('/expenses');
      return response.data;
    },
  });

  const createExpense = useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      const response = await api.post<Expense>('/expenses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateExpenseInput }) => {
      const response = await api.put<Expense>(`/expenses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  return {
    expenses: getExpenses.data || [],
    isLoading: getExpenses.isLoading,
    error: (getExpenses.error as ApiError)?.friendlyMessage || null,
    refetch: getExpenses.refetch,
    createExpense: createExpense.mutateAsync,
    isCreating: createExpense.isPending,
    updateExpense: updateExpense.mutateAsync,
    isUpdating: updateExpense.isPending,
    deleteExpense: deleteExpense.mutateAsync,
    isDeleting: deleteExpense.isPending,
  };
};
