import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export interface Business {
  id: number;
  name: string;
  mpesaShortcode?: string;
  ownerName: string;
  ownerEmail: string;
  metadata?: any;
}

export const useCreateBusiness = () => {
  return useMutation({
    mutationFn: async (data: Omit<Business, 'id'>) => {
      const response = await api.post<Business>('/business', data);
      return response.data;
    },
  });
};

export const useBusiness = (id?: number) => {
  return useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<Business>(`/business/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};
