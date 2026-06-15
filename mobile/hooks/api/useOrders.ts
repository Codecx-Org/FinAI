import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export enum OrderStatus {
  drafted = 'drafted',
  created = 'created',
  pending = 'pending',
  paid = 'paid',
  canceled = 'canceled',
  failed = 'failed',
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    price: number;
  };
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface Order {
  id: number;
  customerId?: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  businessId: number;
  customer?: Customer;
  orderItems?: OrderItem[];
}

export interface CreateOrderInput {
  customerId?: number;
  totalAmount: number;
  status?: OrderStatus;
  paymentMethod?: string;
  orderItems?: { productId: number; quantity: number }[];
}

export interface UpdateOrderInput {
  customerId?: number;
  totalAmount?: number;
  status?: OrderStatus;
}

export const useOrders = () => {
  const queryClient = useQueryClient();

  const getOrders = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get<Order[]>('/orders');
      return response.data;
    },
  });

  const createOrder = useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const response = await api.post<Order>('/orders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateOrderInput }) => {
      const response = await api.put<Order>(`/orders/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    orders: getOrders.data || [],
    isLoading: getOrders.isLoading,
    error: getOrders.error,
    refetch: getOrders.refetch,
    createOrder: createOrder.mutateAsync,
    isCreating: createOrder.isPending,
    updateOrder: updateOrder.mutateAsync,
    isUpdating: updateOrder.isPending,
    deleteOrder: deleteOrder.mutateAsync,
    isDeleting: deleteOrder.isPending,
  };
};
