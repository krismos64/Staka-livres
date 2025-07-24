import { useMutation } from '@tanstack/react-query';
import { api } from '../utils/api';

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await api.put('/users/me/password', data);
      return response.data;
    },
    onError: (error) => {
      console.error('Erreur lors du changement de mot de passe:', error);
    }
  });
};