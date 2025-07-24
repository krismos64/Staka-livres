import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

interface UserStats {
  totalProjects: number;
  completedProjects: number;
  averageRating: number;
  isVip: boolean;
}

export const useUserStats = () => {
  return useQuery<UserStats>({
    queryKey: ["userStats"],
    queryFn: async () => {
      try {
        const response = await fetch(buildApiUrl("/users/me/stats"), {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (!response.ok)
          throw new Error(
            "Erreur lors de la récupération des stats utilisateur"
          );
        return await response.json();
      } catch (error) {
        // Si l'endpoint n'existe pas encore, retourner des données par défaut
        console.warn("User stats endpoint not implemented yet");
        return {
          totalProjects: 0,
          completedProjects: 0,
          averageRating: 0,
          isVip: false,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
