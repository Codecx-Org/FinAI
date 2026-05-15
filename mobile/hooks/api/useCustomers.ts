import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

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
  businessId?: number; // Optional, can be injected by backend if context exists
}

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get<Customer[]>('/customers');
      return response.data;
    },
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const response = await api.post<Customer>('/customers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
