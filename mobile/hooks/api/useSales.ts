import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';

export interface Sale {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  totalAmount: number;
  createdAt: string;
  businessId: number;
  product?: {
    id: number;
    name: string;
    category?: string;
    price: number;
  };
  order?: {
    id: number;
    customer?: {
      name: string;
      phone: string;
    };
  };
}

export interface CreateSaleInput {
  orderId: number;
  productId: number;
  quantity: number;
  totalAmount: number;
}

export interface UpdateSaleInput {
  quantity?: number;
  totalAmount?: number;
}

export const useSales = () => {
  const queryClient = useQueryClient();

  const getSales = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const response = await api.get<Sale[]>('/sales');
      return response.data;
    },
  });

  const createSale = useMutation({
    mutationFn: async (data: CreateSaleInput) => {
      const response = await api.post<Sale>('/sales', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateSale = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSaleInput }) => {
      const response = await api.put<Sale>(`/sales/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });

  const deleteSale = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/sales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });

  return {
    sales: getSales.data || [],
    isLoading: getSales.isLoading,
    error: (getSales.error as ApiError)?.friendlyMessage || null,
    refetch: getSales.refetch,
    createSale: createSale.mutateAsync,
    isCreating: createSale.isPending,
    updateSale: updateSale.mutateAsync,
    isUpdating: updateSale.isPending,
    deleteSale: deleteSale.mutateAsync,
    isDeleting: deleteSale.isPending,
  };
};
