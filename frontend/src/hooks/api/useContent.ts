import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export interface SocialMediaContentRequest {
  platform: string;
  type: string;
  tone: string;
  description: string;
}

export interface SocialMediaContentResponse {
  platform: string;
  type: string;
  content: string;
  hashtags: string[];
  imageUrl?: string;
}

export interface ProductImageRequest {
  productName: string;
  description?: string;
}

export interface ProductImageResponse {
  imageUrl: string;
}

export const useGenerateSocialMedia = () => {
  return useMutation({
    mutationFn: async (data: SocialMediaContentRequest) => {
      const response = await api.post<SocialMediaContentResponse>('/content/generate-social-media', data);
      return response.data;
    },
  });
};

export const useGenerateProductImage = () => {
  return useMutation({
    mutationFn: async (data: ProductImageRequest) => {
      const response = await api.post<ProductImageResponse>('/content/generate-product-image', data);
      return response.data;
    },
  });
};
