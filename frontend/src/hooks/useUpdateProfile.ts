import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

interface UpdateProfileData {
  prenom?: string;
  nom?: string;
  telephone?: string;
  adresse?: string;
  bio?: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await fetch(buildApiUrl("/users/me/profile"), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok)
        throw new Error("Erreur lors de la mise à jour du profil");
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalider les caches des données utilisateur
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });

      // Mettre à jour le cache du contexte auth si nécessaire
      queryClient.setQueryData(["user"], (oldData: any) => {
        if (oldData) {
          return { ...oldData, ...data.user };
        }
        return oldData;
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour du profil:", error);
    },
  });
};
