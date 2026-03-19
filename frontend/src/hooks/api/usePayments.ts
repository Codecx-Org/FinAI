import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export interface PaymentInitiationRequest {
  orderId: number;
  phone: string;
  amount: number;
}

export interface PaymentInitiationResponse {
  success: boolean;
  message: string;
  checkoutRequestID: string;
}

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: async (data: PaymentInitiationRequest) => {
      const response = await api.post<PaymentInitiationResponse>('/payments/initiate', data);
      return response.data;
    },
  });
};

export const usePaymentStatus = (orderId: number, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['paymentStatus', orderId],
    queryFn: async () => {
      const response = await api.get<{ orderId: number; status: string }>(`/payments/${orderId}/status`);
      return response.data;
    },
    enabled: enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling if paid or failed
      if (status === 'paid' || status === 'failed' || status === 'canceled') {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
  });
};
