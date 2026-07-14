import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';

export interface Achievement {
  id: number;
  title: string;
  description: string | null;
  earned: boolean;
  earnedAt: string | null;
  createdAt: string;
  businessId: number;
}

export interface CreateAchievementInput {
  title: string;
  description?: string;
}

export interface UpdateAchievementInput {
  earned: boolean;
}

export const useAchievements = () => {
  const queryClient = useQueryClient();

  const getAchievements = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await api.get<Achievement[]>('/achievements');
      return response.data;
    },
  });

  const createAchievement = useMutation({
    mutationFn: async (data: CreateAchievementInput) => {
      const response = await api.post<Achievement>('/achievements', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });

  const toggleAchievement = useMutation({
    mutationFn: async ({ id, earned }: { id: number; earned: boolean }) => {
      const response = await api.patch<Achievement>(`/achievements/${id}`, { earned });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });

  const deleteAchievement = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/achievements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });

  return {
    achievements: getAchievements.data || [],
    isLoading: getAchievements.isLoading,
    error: (getAchievements.error as ApiError)?.friendlyMessage || null,
    refetch: getAchievements.refetch,
    addAchievement: createAchievement.mutateAsync,
    isAdding: createAchievement.isPending,
    toggleAchievement: toggleAchievement.mutateAsync,
    isToggling: toggleAchievement.isPending,
    deleteAchievement: deleteAchievement.mutateAsync,
    isDeleting: deleteAchievement.isPending,
  };
};
