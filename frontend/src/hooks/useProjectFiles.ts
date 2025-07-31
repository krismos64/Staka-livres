import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ProjectFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  type: "DOCUMENT" | "IMAGE" | "AUDIO" | "VIDEO" | "ARCHIVE" | "OTHER";
  commandeId: string;
  uploadedAt: string;
  deletedAt?: string;
  isAdminFile?: boolean;
}

interface ProjectFilesResponse {
  files: ProjectFile[];
  count: number;
}

interface UseProjectFilesResult {
  files: ProjectFile[];
  count: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseDeleteFileResult {
  deleteFile: (fileId: string) => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

/**
 * Hook pour récupérer les fichiers d'un projet
 * 
 * @param projectId - ID du projet
 * @param enabled - Si la requête doit être activée (par défaut: true)
 */
export const useProjectFiles = (
  projectId: string,
  enabled: boolean = true
): UseProjectFilesResult => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<ProjectFilesResponse, Error>({
    queryKey: ["projectFiles", projectId],
    queryFn: async (): Promise<ProjectFilesResponse> => {
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const response = await fetch(`/api/files/projects/${projectId}/files`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: enabled && !!projectId,
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Ne pas retry sur les erreurs d'authentification
      if (error.message.includes("401") || error.message.includes("403")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    files: data?.files || [],
    count: data?.count || 0,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook pour supprimer un fichier de projet
 * 
 * @param projectId - ID du projet
 * @param onSuccess - Callback appelé en cas de succès
 * @param onError - Callback appelé en cas d'erreur
 */
export const useDeleteFile = (
  projectId: string,
  onSuccess?: () => void,
  onError?: (error: string) => void
): UseDeleteFileResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (fileId: string): Promise<void> => {
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const response = await fetch(`/api/files/projects/${projectId}/files/${fileId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }
    },
    onSuccess: () => {
      // Invalider le cache pour refréchir la liste
      queryClient.invalidateQueries({
        queryKey: ["projectFiles", projectId],
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      if (onError) {
        onError(errorMessage);
      }
    },
  });

  return {
    deleteFile: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error?.message || null,
  };
};

/**
 * Hook pour télécharger un fichier de projet
 * 
 * @param projectId - ID du projet
 */
export const useDownloadFile = (projectId: string) => {
  const downloadFile = async (file: ProjectFile): Promise<void> => {
    try {
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      console.log(`📥 Téléchargement du fichier ${file.filename} (ID: ${file.id})`);

      const response = await fetch(`http://localhost:3001/api/files/download/${file.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      // Traiter comme un blob (fichiers stockage local)
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Fichier ${file.filename} téléchargé avec succès`);

    } catch (error) {
      console.error("❌ Erreur lors du téléchargement:", error);
      throw error;
    }
  };

  return { downloadFile };
};

/**
 * Utilitaires pour les fichiers
 */
export const fileUtils = {
  /**
   * Formate la taille d'un fichier en Mo/Ko
   */
  formatFileSize: (sizeInBytes: number): string => {
    if (sizeInBytes === 0) return "0 B";
    
    const k = 1024;
    const sizes = ["B", "Ko", "Mo", "Go"];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
    
    return `${parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  },

  /**
   * Détermine l'icône FontAwesome appropriée selon le type de fichier
   */
  getFileIcon: (mimeType: string): string => {
    if (mimeType.includes("pdf")) return "fa-file-pdf";
    if (mimeType.includes("word") || mimeType.includes("document")) return "fa-file-word";
    if (mimeType.includes("image")) return "fa-file-image";
    if (mimeType.includes("text")) return "fa-file-alt";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "fa-file-archive";
    return "fa-file";
  },

  /**
   * Détermine la couleur selon le type de fichier
   */
  getFileColor: (mimeType: string): { bg: string; text: string } => {
    if (mimeType.includes("pdf")) return { bg: "bg-red-100", text: "text-red-600" };
    if (mimeType.includes("word") || mimeType.includes("document")) return { bg: "bg-blue-100", text: "text-blue-600" };
    if (mimeType.includes("image")) return { bg: "bg-green-100", text: "text-green-600" };
    if (mimeType.includes("text")) return { bg: "bg-gray-100", text: "text-gray-600" };
    if (mimeType.includes("zip") || mimeType.includes("rar")) return { bg: "bg-purple-100", text: "text-purple-600" };
    return { bg: "bg-gray-100", text: "text-gray-600" };
  },

  /**
   * Formate une date ISO en format français
   */
  formatDate: (isoDate: string): string => {
    return new Date(isoDate).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },
};