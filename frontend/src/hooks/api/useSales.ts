import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export interface Sale {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  totalAmount: number;
  createdAt: string;
  businessId: number;
  product?: {
    name: string;
  };
}

export interface OrderItem {
  productId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  businessId: number;
  customerId?: number;
  items: OrderItem[];
  totalAmount: number;
}

export interface UpdateOrderRequest {
  id: number;
  businessId?: number;
  customerId?: number;
  status?: string;
  totalAmount?: number;
}

export const useSales = (businessId?: number) => {
  return useQuery({
    queryKey: ['sales', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get<Sale[]>(`/sales`, {
        params: { businessId },
      });
      return response.data;
    },
    enabled: !!businessId,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrderRequest) => {
      const response = await api.post('/orders', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales', variables.businessId] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.businessId] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.businessId] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateOrderRequest) => {
      const { id, ...payload } = data;
      const response = await api.put(`/orders/${id}`, payload);
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['orders', data.businessId] });
      queryClient.invalidateQueries({ queryKey: ['sales', data.businessId] });
    },
  });
};

export const useDeleteOrder = (businessId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', businessId] });
    },
  });
};

export const useOrders = (businessId?: number) => {
  return useQuery({
    queryKey: ['orders', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get<any[]>(`/orders`, {
        params: { businessId },
      });
      return response.data;
    },
    enabled: !!businessId,
  });
};
