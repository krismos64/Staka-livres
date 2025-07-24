import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

export const useDeactivateAccount = () => {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(buildApiUrl("/users/me/deactivate"), {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!response.ok)
        throw new Error("Erreur lors de la désactivation du compte");
      return await response.json();
    },
    onSuccess: () => {
      // Déconnecter automatiquement l'utilisateur après désactivation
      logout();
    },
    onError: (error) => {
      console.error("Erreur lors de la désactivation du compte:", error);
    },
  });
};
