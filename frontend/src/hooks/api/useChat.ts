import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  history: ChatMessage[];
  businessId?: number;
  success: boolean;
}

export const useChat = () => {
  return useMutation({
    mutationFn: async (data: ChatRequest) => {
      // Get token from localStorage
      const token = localStorage.getItem('numeraai_token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      
      // IMPORTANT: Send the token in the Authorization header
      const response = await api.post<ChatResponse>('/chatbot/chat', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    },
  });
};