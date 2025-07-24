import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { UserPreferences } from './useUserPreferences';

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const response = await api.put('/users/me/preferences', preferences);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalider et mettre à jour le cache des préférences
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      
      // Mettre à jour directement le cache avec les nouvelles données
      queryClient.setQueryData(['userPreferences'], data.preferences);
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour des préférences:', error);
    }
  });
};