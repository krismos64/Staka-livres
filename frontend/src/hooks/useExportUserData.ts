import { useMutation } from '@tanstack/react-query';
import { api } from '../utils/api';

export const useExportUserData = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/users/me/export');
      return response.data;
    },
    onError: (error) => {
      console.error('Erreur lors de l\'export des données:', error);
    }
  });
};