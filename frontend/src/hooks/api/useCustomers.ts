import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  businessId: number;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  businessId: number;
}

export const useCustomers = (businessId?: number) => {
  return useQuery({
    queryKey: ['customers', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get<Customer[]>(`/customers`, {
        params: { businessId },
      });
      return response.data;
    },
    enabled: !!businessId,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const response = await api.post<Customer>('/customers', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers', data.businessId] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Customer> & { id: number }) => {
      const { id, ...payload } = data;
      const response = await api.put<Customer>(`/customers/${id}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers', data.businessId] });
    },
  });
};
