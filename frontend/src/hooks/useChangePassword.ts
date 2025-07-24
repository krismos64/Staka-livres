import { useMutation } from "@tanstack/react-query";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await fetch(buildApiUrl("/users/me/password"), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok)
        throw new Error("Erreur lors du changement de mot de passe");
      return await response.json();
    },
    onError: (error) => {
      console.error("Erreur lors du changement de mot de passe:", error);
    },
  });
};
