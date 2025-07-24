import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  notificationTypes: {
    projects: boolean;
    messages: boolean;
    invoices: boolean;
    promos: boolean;
  };
  privacy: {
    publicProfile: boolean;
    analytics: boolean;
  };
}

export const useUserPreferences = () => {
  return useQuery<UserPreferences>({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const response = await api.get('/users/me/preferences');
      return response.data;
    }
  });
};