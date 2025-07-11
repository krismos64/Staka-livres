import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders, buildApiUrl } from "../utils/api";

// Interface pour les projets (nouvelle structure paginée)
export interface Project {
  id: string;
  title: string;
  type: string;
  pages?: number;
  startedAt: string;
  deliveryAt?: string;
  corrector?: string;
  pack: string;
  status: string;
  progress: number;
  rating?: number;
  canDownload: boolean;
}

// Interface pour la réponse paginée
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// Paramètres pour les requêtes de projets
export interface ProjectsParams {
  page: number;
  limit: number;
  status?: 'all' | 'active' | 'pending' | 'completed';
  search?: string;
}

// Fonction pour récupérer les projets via l'API
export const fetchProjects = async (
  params: ProjectsParams
): Promise<PaginatedResponse<Project>> => {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
  });

  if (params.status) {
    queryParams.set('status', params.status);
  }

  if (params.search?.trim()) {
    queryParams.set('search', params.search.trim());
  }

  const response = await fetch(
    buildApiUrl(`/projects?${queryParams.toString()}`),
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

// Fonction pour récupérer les compteurs par statut
export const fetchProjectCounts = async (): Promise<Record<string, number>> => {
  const response = await fetch(
    buildApiUrl('/projects/counts'),
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

// Hook React Query principal pour récupérer les projets avec pagination
export const useProjects = (params: ProjectsParams) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => fetchProjects(params),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook React Query pour récupérer les compteurs par statut
export const useProjectCounts = () => {
  return useQuery({
    queryKey: ['projects', 'counts'],
    queryFn: fetchProjectCounts,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook utilitaire pour invalider les caches des projets
export const useInvalidateProjects = () => {
  const queryClient = useQueryClient();
  
  const invalidateProjects = () => {
    queryClient.invalidateQueries(['projects']);
  };

  const invalidateProjectCounts = () => {
    queryClient.invalidateQueries(['projects', 'counts']);
  };

  return {
    invalidateProjects,
    invalidateProjectCounts,
    invalidateAll: () => {
      invalidateProjects();
      invalidateProjectCounts();
    },
  };
};