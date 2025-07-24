import { useMutation } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export const useDeactivateAccount = () => {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const response = await api.put('/users/me/deactivate');
      return response.data;
    },
    onSuccess: () => {
      // Déconnecter automatiquement l'utilisateur après désactivation
      logout();
    },
    onError: (error) => {
      console.error('Erreur lors de la désactivation du compte:', error);
    }
  });
};