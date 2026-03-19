import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export interface Product {
  id: number;
  name: string;
  imageUrl?: string;
  stockQuantity: number;
  price: number;
  buyingPrice: number;
  businessId: number;
}

export const useProducts = (businessId?: number) => {
  return useQuery({
    queryKey: ['products', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get<Product[]>(`/products`, {
        params: { businessId },
      });
      return response.data;
    },
    enabled: !!businessId,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Product, 'id'>) => {
      const response = await api.post<Product>('/products', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', data.businessId] });
    },
  });
};

export const useGenerateProductImage = () => {
  return useMutation({
    mutationFn: async ({ productId, prompt }: { productId: number; prompt: string }) => {
      const response = await api.post<Product>(`/products/${productId}/generate-image`, { prompt });
      return response.data;
    },
  });
};
