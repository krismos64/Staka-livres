import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

interface UpdateProfileData {
  prenom?: string;
  nom?: string;
  telephone?: string;
  adresse?: string;
  bio?: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await api.put('/users/me/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalider les caches des données utilisateur
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      
      // Mettre à jour le cache du contexte auth si nécessaire
      queryClient.setQueryData(['user'], (oldData: any) => {
        if (oldData) {
          return { ...oldData, ...data.user };
        }
        return oldData;
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  });
};