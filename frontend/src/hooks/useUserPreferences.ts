import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

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
    queryKey: ["userPreferences"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/users/me/preferences"), {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok)
        throw new Error(
          "Erreur lors de la récupération des préférences utilisateur"
        );
      return await response.json();
    },
  });
};
