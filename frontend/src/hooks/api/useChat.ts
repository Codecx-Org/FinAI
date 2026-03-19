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
}

export const useChat = () => {
  return useMutation({
    mutationFn: async (data: ChatRequest) => {
      const response = await api.post<ChatResponse>('/chatbot/chat', data);
      return response.data;
    },
  });
};
