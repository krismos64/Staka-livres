import { useQuery } from "@tanstack/react-query";

interface ProjectFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  type: "DOCUMENT" | "IMAGE" | "AUDIO" | "VIDEO" | "ARCHIVE" | "OTHER";
  commandeId: string;
  uploadedAt: string;
  isAdminFile?: boolean;
  projectTitle?: string;
  owner?: {
    name: string;
    email: string;
  };
}

interface UserFilesResponse {
  files: ProjectFile[];
  count: number;
}

interface UseUserFilesResult {
  files: ProjectFile[];
  count: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook pour récupérer tous les fichiers de l'utilisateur
 * (pour la page "Mes fichiers")
 */
export const useUserFiles = (): UseUserFilesResult => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<UserFilesResponse, Error>({
    queryKey: ["userFiles"],
    queryFn: async () => {
      const response = await fetch("/api/files/user/all", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    files: data?.files || [],
    count: data?.count || 0,
    isLoading,
    error,
    refetch,
  };
};