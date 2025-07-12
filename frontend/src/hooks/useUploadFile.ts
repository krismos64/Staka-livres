import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UploadFileParams {
  projectId: string;
  file: File;
}

interface UploadUrlResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  fileId: string;
}

interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseUploadFileResult {
  uploadFile: (params: UploadFileParams) => Promise<string>;
  progress: number;
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook pour l'upload de fichiers de projets avec suivi de progression
 * 
 * Étapes:
 * 1. POST /projects/:id/files → obtenir uploadUrl et fields
 * 2. PUT vers S3 avec suivi de progression
 * 3. Invalider le cache useProjectFiles
 * 
 * @param onProgress - Callback appelé pendant l'upload avec le pourcentage
 * @param onSuccess - Callback appelé en cas de succès
 * @param onError - Callback appelé en cas d'erreur
 */
export const useUploadFile = (
  onProgress?: (progress: UploadProgressEvent) => void,
  onSuccess?: (fileId: string) => void,
  onError?: (error: string) => void
): UseUploadFileResult => {
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ projectId, file }: UploadFileParams): Promise<string> => {
      setError(null);
      setProgress(0);

      try {
        // Étape 1: Créer le fichier et obtenir l'URL présignée
        const createResponse = await fetch(`/api/files/projects/${projectId}/files`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            mime: file.type,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.message || "Erreur lors de la création du fichier");
        }

        const { uploadUrl, fields, fileId }: UploadUrlResponse = await createResponse.json();

        // Étape 2: Upload vers S3 avec suivi de progression
        await uploadToS3(uploadUrl, fields, file, (progressEvent) => {
          const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setProgress(percentage);
          
          if (onProgress) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage,
            });
          }
        });

        // Étape 3: Invalider le cache pour refréchir la liste des fichiers
        await queryClient.invalidateQueries({
          queryKey: ["projectFiles", projectId],
        });

        setProgress(100);
        
        if (onSuccess) {
          onSuccess(fileId);
        }

        return fileId;

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

  const uploadToS3 = async (
    uploadUrl: string,
    fields: Record<string, string>,
    file: File,
    onProgressCallback: (progress: { loaded: number; total: number }) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Suivi de la progression
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgressCallback({
            loaded: event.loaded,
            total: event.total,
          });
        }
      });

      // Gestion de la fin d'upload
      xhr.addEventListener("load", () => {
        if (xhr.status === 200 || xhr.status === 204) {
          resolve();
        } else {
          reject(new Error(`Erreur S3: ${xhr.status} ${xhr.statusText}`));
        }
      });

      // Gestion des erreurs
      xhr.addEventListener("error", () => {
        reject(new Error("Erreur réseau lors de l'upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload annulé"));
      });

      // Préparation de la requête
      const formData = new FormData();
      
      // Ajouter les champs requis pour S3
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Ajouter le fichier en dernier
      formData.append("file", file);

      // Envoyer la requête
      xhr.open("POST", uploadUrl);
      xhr.send(formData);
    });
  };

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
    mutation.reset();
  }, [mutation]);

  const uploadFile = useCallback(
    async (params: UploadFileParams): Promise<string> => {
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