import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl, getAuthHeaders } from "../utils/api";
import { UserPreferences } from "./useUserPreferences";

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const response = await fetch(buildApiUrl("/users/me/preferences"), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(preferences),
      });
      if (!response.ok)
        throw new Error("Erreur lors de la mise à jour des préférences");
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalider et mettre à jour le cache des préférences
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });

      // Mettre à jour directement le cache avec les nouvelles données
      queryClient.setQueryData(["userPreferences"], data.preferences);
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour des préférences:", error);
    },
  });
};
