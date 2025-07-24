import { useMutation } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export const useDeleteAccount = () => {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete('/users/me');
      return response.data;
    },
    onSuccess: () => {
      // Déconnecter automatiquement l'utilisateur après suppression
      logout();
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression du compte:', error);
    }
  });
};