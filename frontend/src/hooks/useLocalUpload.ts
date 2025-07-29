import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface LocalUploadParams {
  projectId: string;
  file: File;
}

interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseLocalUploadResult {
  uploadFile: (params: LocalUploadParams) => Promise<string>;
  progress: number;
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook pour l'upload direct de fichiers (stockage local, sans S3)
 * Remplace useUploadFile qui utilisait AWS S3
 */
export const useLocalUpload = (
  onProgress?: (progress: UploadProgressEvent) => void,
  onSuccess?: (fileId: string) => void,
  onError?: (error: string) => void
): UseLocalUploadResult => {
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ projectId, file }: LocalUploadParams): Promise<string> => {
      setError(null);
      setProgress(0);

      try {
        // Créer FormData pour upload multipart
        const formData = new FormData();
        formData.append('file', file);

        // Upload direct vers le backend (comme les messages)
        const response = await fetch(`/api/files/projects/${projectId}/upload`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erreur lors de l'upload");
        }

        const data = await response.json();

        // Simuler la progression (upload terminé)
        setProgress(100);
        
        // Invalider le cache pour rafraîchir la liste des fichiers
        await queryClient.invalidateQueries({
          queryKey: ["projectFiles", projectId],
        });

        if (onSuccess) {
          onSuccess(data.fileId);
        }

        return data.fileId;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);
        
        if (onError) {
          onError(errorMessage);
        }
        
        throw error;
      }
    },
  });

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
    mutation.reset();
  }, [mutation]);

  const uploadFile = useCallback(
    async (params: LocalUploadParams): Promise<string> => {
      return mutation.mutateAsync(params);
    },
    [mutation]
  );

  return {
    uploadFile,
    progress,
    isUploading: mutation.isPending,
    error,
    reset,
  };
};