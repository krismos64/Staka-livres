import { useQuery } from "@tanstack/react-query";
import { StatutCommande } from "../types/shared";
import { getAuthHeaders, buildApiUrl } from "../utils/api";

// Interface pour les projets (basée sur les commandes)
export interface Project {
  id: string;
  title: string;
  status: StatutCommande;
  updatedAt: string;
}

// Fonction pour récupérer les projets via l'API
export const fetchProjects = async (
  status: string = "active",
  limit: number = 3
): Promise<Project[]> => {
  const params = new URLSearchParams({
    status,
    limit: limit.toString(),
  });

  const response = await fetch(
    buildApiUrl(`/projects?${params.toString()}`),
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
};

// Hook React Query pour récupérer les projets actifs
export const useProjectsSummary = (limit: number = 3) => {
  return useQuery({
    queryKey: ["projects", "active", limit],
    queryFn: () => fetchProjects("active", limit),
    staleTime: 5 * 60 * 1000, // 5 minutes comme spécifié
    cacheTime: 10 * 60 * 1000, // 10 minutes de cache
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook React Query générique pour récupérer les projets avec différents statuts
export const useProjects = (status: string = "active", limit: number = 3) => {
  return useQuery({
    queryKey: ["projects", status, limit],
    queryFn: () => fetchProjects(status, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes de cache
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!status, // Ne s'exécute que si status est fourni
  });
};