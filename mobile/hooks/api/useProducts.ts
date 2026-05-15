import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';

export interface Product {
  id: number;
  name: string;
  category?: string;
  imageUrl?: string;
  stockQuantity: number;
  price: number;
  buyingPrice: number;
  businessId: number;
  createdAt: string;
  supplier?: string | null;
  minStockLevel?: number | null;
  maxStockLevel?: number | null;
  lastRestockedAt?: string | null;
}

export interface CreateProductInput {
  name: string;
  category?: string;
  imageUrl?: string;
  stockQuantity: number;
  price: number;
  buyingPrice: number;
  supplier?: string | null;
  minStockLevel?: number | null;
  maxStockLevel?: number | null;
  lastRestockedAt?: string | null;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  imageUrl?: string;
  stockQuantity?: number;
  price?: number;
  buyingPrice?: number;
  supplier?: string | null;
  minStockLevel?: number | null;
  maxStockLevel?: number | null;
  lastRestockedAt?: string | null;
}

export const useProducts = () => {
  const queryClient = useQueryClient();

  const getProducts = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get<Product[]>('/products');
      return response.data;
    },
  });

  const createProduct = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await api.post<Product>('/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProductInput }) => {
      const response = await api.put<Product>(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    products: getProducts.data || [],
    isLoading: getProducts.isLoading,
    error: (getProducts.error as ApiError)?.friendlyMessage || null,
    refetch: getProducts.refetch,
    createProduct: createProduct.mutateAsync,
    isCreating: createProduct.isPending,
    updateProduct: updateProduct.mutateAsync,
    isUpdating: updateProduct.isPending,
    deleteProduct: deleteProduct.mutateAsync,
    isDeleting: deleteProduct.isPending,
  };
};
