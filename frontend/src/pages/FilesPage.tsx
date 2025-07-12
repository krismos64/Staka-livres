import React, { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useProjectFiles, useDeleteFile, useDownloadFile, fileUtils } from "../hooks/useProjectFiles";
import { useUploadFile } from "../hooks/useUploadFile";

// Types
interface ProjectFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  type: "DOCUMENT" | "IMAGE" | "AUDIO" | "VIDEO" | "ARCHIVE" | "OTHER";
  commandeId: string;
  uploadedAt: string;
}

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

// ----------- FileItem Component -----------
interface FileItemProps {
  file: ProjectFile;
  onDownload: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
  isDeleting?: boolean;
}

function FileItem({ file, onDownload, onDelete, isDeleting = false }: FileItemProps) {
  const [showActions, setShowActions] = useState(false);
  const fileIcon = fileUtils.getFileIcon(file.mimeType);
  const fileColors = fileUtils.getFileColor(file.mimeType);
  const formattedSize = fileUtils.formatFileSize(file.size);
  const formattedDate = fileUtils.formatDate(file.uploadedAt);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
      {/* Header avec icône et menu */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${fileColors.bg} rounded-xl flex items-center justify-center`}>
          <i className={`fas ${fileIcon} ${fileColors.text} text-xl`}></i>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Actions du fichier"
            disabled={isDeleting}
          >
            <i className="fas fa-ellipsis-h"></i>
          </button>

          {/* Menu d'actions */}
          {showActions && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-10 min-w-48">
              <div className="py-2">
                <button
                  onClick={() => {
                    onDownload(file);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center"
                  disabled={isDeleting}
                >
                  <i className="fas fa-download mr-3 w-4"></i>
                  Télécharger
                </button>
                <hr className="my-2" />
                <button
                  onClick={() => {
                    onDelete(file);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center"
                  disabled={isDeleting}
                >
                  <i className={`fas ${isDeleting ? 'fa-spinner fa-spin' : 'fa-trash'} mr-3 w-4`}></i>
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nom du fichier */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-2 truncate" title={file.filename}>
          {file.filename}
        </h3>
      </div>

      {/* Informations du fichier */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Taille</span>
          <span className="text-gray-900">{formattedSize}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Uploadé le</span>
          <span className="text-gray-900">{formattedDate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Type</span>
          <span className="text-gray-900">{file.type}</span>
        </div>
      </div>

      {/* Action principale */}
      <div className="flex gap-2">
        <button
          onClick={() => onDownload(file)}
          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center"
          disabled={isDeleting}
        >
          <i className="fas fa-download mr-1"></i>
          Télécharger
        </button>
      </div>
    </div>
  );
}

// ----------- UploadButton Component -----------
interface UploadButtonProps {
  onFileSelect: (files: FileList) => void;
  isUploading: boolean;
  progress: number;
}

function UploadButton({ onFileSelect, isUploading, progress }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileSelect(files);
      }
    },
    [onFileSelect]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        onFileSelect(files);
      }
    },
    [onFileSelect]
  );

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group ${
        isDragOver
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
      } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFileDialog}
      role="button"
      tabIndex={0}
      aria-label="Zone d'upload de fichiers"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          openFileDialog();
        }
      }}
    >
      <div className="w-16 h-16 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
        <i
          className={`fas text-2xl transition-colors ${
            isDragOver
              ? "fa-download text-blue-500"
              : "fa-cloud-upload-alt text-gray-400 group-hover:text-blue-500"
          }`}
        ></i>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2">
        {isUploading ? "Upload en cours..." : "Ajouter un fichier"}
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        Glissez-déposez vos fichiers ici ou cliquez pour parcourir
      </p>

      <div className="text-xs text-gray-500 mb-4">
        Formats acceptés: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP, RAR
        <br />
        Taille maximum: 20 Mo par fichier
      </div>

      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progression</span>
            <span className="text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {!isUploading && (
        <button
          className="bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 transition inline-flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fas fa-plus mr-2"></i>
          Choisir des fichiers
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}

// ----------- Toast Component -----------
interface ToastComponentProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastComponent({ toast, onClose }: ToastComponentProps) {
  const toastIcons = {
    success: "fa-check-circle text-green-500",
    error: "fa-times-circle text-red-500",
    warning: "fa-exclamation-triangle text-yellow-500",
    info: "fa-info-circle text-blue-500",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-80 animate-slide-in">
      <div className="flex items-center gap-3">
        <i className={`fas ${toastIcons[toast.type]} text-xl`}></i>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{toast.title}</h4>
          <p className="text-sm text-gray-600">{toast.message}</p>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="text-gray-400 hover:text-gray-600 transition"
          aria-label="Fermer la notification"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}

// ----------- FilesPage Component (Principal) -----------
export default function FilesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Hooks pour la gestion des fichiers
  const { files, count, isLoading, error, refetch } = useProjectFiles(projectId || "");
  const { downloadFile } = useDownloadFile(projectId || "");
  const { deleteFile, isDeleting } = useDeleteFile(
    projectId || "",
    () => showToast("success", "Fichier supprimé", "Le fichier a été supprimé avec succès"),
    (error) => showToast("error", "Erreur", error)
  );

  // Hook pour l'upload avec suivi de progression
  const { uploadFile, progress, isUploading, reset } = useUploadFile(
    undefined, // onProgress
    () => showToast("success", "Fichier uploadé", "Le fichier a été uploadé avec succès"),
    (error) => showToast("error", "Erreur d'upload", error)
  );

  // Fonction pour afficher des notifications
  const showToast = useCallback(
    (type: ToastType, title: string, message: string) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { id, type, title, message };
      setToasts((prev) => [...prev, newToast]);

      // Auto-suppression après 5 secondes
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Gestion de l'upload de fichiers
  const handleFileUpload = useCallback(
    async (fileList: FileList) => {
      if (!projectId) {
        showToast("error", "Erreur", "ID de projet manquant");
        return;
      }

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        try {
          await uploadFile({ projectId, file });
        } catch (error) {
          console.error("Erreur lors de l'upload:", error);
          // L'erreur est déjà gérée par le hook useUploadFile
        }
      }

      reset();
    },
    [projectId, uploadFile, reset, showToast]
  );

  // Gestion du téléchargement
  const handleDownload = useCallback(
    async (file: ProjectFile) => {
      try {
        await downloadFile(file);
        showToast("success", "Téléchargement", `Téléchargement de ${file.filename} démarré`);
      } catch (error) {
        showToast("error", "Erreur", "Erreur lors du téléchargement");
      }
    },
    [downloadFile, showToast]
  );

  // Gestion de la suppression
  const handleDelete = useCallback(
    async (file: ProjectFile) => {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${file.filename}" ?`)) {
        try {
          await deleteFile(file.id);
        } catch (error) {
          console.error("Erreur lors de la suppression:", error);
          // L'erreur est déjà gérée par le hook useDeleteFile
        }
      }
    },
    [deleteFile]
  );

  // Affichage du loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-600">Chargement des fichiers...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <i className="fas fa-redo mr-2"></i>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Toast container */}
      <div className="fixed top-6 right-6 z-50 space-y-3">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Fichiers du projet
            </h2>
            <p className="text-gray-600">
              Gérez tous vos documents et manuscrits ({count} fichier{count !== 1 ? 's' : ''})
            </p>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            onDownload={handleDownload}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        ))}
        <UploadButton
          onFileSelect={handleFileUpload}
          isUploading={isUploading}
          progress={progress}
        />
      </div>

      {/* Empty state */}
      {files.length === 0 && !isLoading && (
        <div className="text-center py-16 px-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-cloud-upload-alt text-blue-500 text-3xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun fichier pour le moment
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Commencez par uploader vos manuscrits et documents pour ce projet.
          </p>
        </div>
      )}
    </div>
  );
}