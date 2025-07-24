import { useMutation } from "@tanstack/react-query";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

export const useExportUserData = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(buildApiUrl("/users/me/export"), {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok)
        throw new Error("Erreur lors de l'export des données utilisateur");
      return await response.json();
    },
    onError: (error) => {
      console.error("Erreur lors de l'export des données:", error);
    },
  });
};
