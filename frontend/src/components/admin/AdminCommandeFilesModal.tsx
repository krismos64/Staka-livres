import React, { useState, useCallback, useRef } from "react";
import Modal from "../common/Modal";
import LoadingSpinner from "../common/LoadingSpinner";
import { useProjectFiles, useDownloadFile, fileUtils } from "../../hooks/useProjectFiles";
import { useLocalUpload } from "../../hooks/useLocalUpload";

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
  isAdminFile?: boolean; // Nouveau champ pour distinguer les fichiers admin des fichiers client
}

interface AdminCommandeFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  commandeId: string;
  commandeTitle: string;
  clientName: string;
}

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

// Composant pour afficher un fichier
const FileItem: React.FC<{
  file: ProjectFile;
  onDownload: (file: ProjectFile) => void;
  onDelete?: (file: ProjectFile) => void;
  isDeleting?: boolean;
  isAdmin: boolean;
}> = ({ file, onDownload, onDelete, isDeleting = false, isAdmin }) => {
  const [showActions, setShowActions] = useState(false);
  const fileIcon = fileUtils.getFileIcon(file.mimeType);
  const fileColors = fileUtils.getFileColor(file.mimeType);
  const formattedSize = fileUtils.formatFileSize(file.size);
  const formattedDate = fileUtils.formatDate(file.uploadedAt);

  const fileTypeLabel = file.isAdminFile ? "Document corrigé" : "Document client";
  const fileTypeBadgeColor = file.isAdminFile 
    ? "bg-green-100 text-green-800" 
    : "bg-blue-100 text-blue-800";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-300">
      {/* Header avec icône et type */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${fileColors.bg} rounded-lg flex items-center justify-center`}>
          <i className={`fas ${fileIcon} ${fileColors.text} text-lg`}></i>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${fileTypeBadgeColor}`}>
            {fileTypeLabel}
          </span>
          {onDelete && (
            <button
              onClick={() => setShowActions(!showActions)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded transition"
              aria-label="Actions du fichier"
              disabled={isDeleting}
            >
              <i className="fas fa-ellipsis-h"></i>
            </button>
          )}
        </div>
      </div>

      {/* Menu d'actions */}
      {showActions && onDelete && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-40">
          <div className="py-2">
            <button
              onClick={() => {
                onDownload(file);
                setShowActions(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center"
              disabled={isDeleting}
            >
              <i className="fas fa-download mr-2 w-4"></i>
              Télécharger
            </button>
            <hr className="my-1" />
            <button
              onClick={() => {
                onDelete(file);
                setShowActions(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center"
              disabled={isDeleting}
            >
              <i className={`fas ${isDeleting ? 'fa-spinner fa-spin' : 'fa-trash'} mr-2 w-4`}></i>
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      )}

      {/* Nom du fichier */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 mb-1 truncate" title={file.filename}>
          {file.filename}
        </h4>
      </div>

      {/* Informations du fichier */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Taille</span>
          <span className="text-gray-900">{formattedSize}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Uploadé le</span>
          <span className="text-gray-900">{formattedDate}</span>
        </div>
        <div className="flex justify-between">
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
};

// Composant d'upload pour les admins
const AdminUploadButton: React.FC<{
  onFileSelect: (files: FileList) => void;
  isUploading: boolean;
  progress: number;
}> = ({ onFileSelect, isUploading, progress }) => {
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
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 cursor-pointer ${
        isDragOver
          ? "border-green-400 bg-green-50"
          : "border-gray-300 hover:border-green-400 hover:bg-green-50"
      } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFileDialog}
    >
      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
        <i
          className={`fas text-xl transition-colors ${
            isDragOver
              ? "fa-download text-green-500"
              : "fa-cloud-upload-alt text-gray-400 hover:text-green-500"
          }`}
        ></i>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2">
        {isUploading ? "Upload en cours..." : "Ajouter un document corrigé"}
      </h3>

      <p className="text-sm text-gray-600 mb-3">
        Glissez-déposez le document corrigé ici ou cliquez pour parcourir
      </p>

      <div className="text-xs text-gray-500 mb-3">
        Formats acceptés: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP, RAR
        <br />
        Taille maximum: 20 Mo par fichier
      </div>

      {isUploading && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progression</span>
            <span className="text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {!isUploading && (
        <button
          className="bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition inline-flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fas fa-plus mr-2"></i>
          Choisir un fichier
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
};

// Toast Component
const ToastComponent: React.FC<{
  toast: Toast;
  onClose: (id: string) => void;
}> = ({ toast, onClose }) => {
  const toastIcons = {
    success: "fa-check-circle text-green-500",
    error: "fa-times-circle text-red-500",
    warning: "fa-exclamation-triangle text-yellow-500",
    info: "fa-info-circle text-blue-500",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80 animate-slide-in">
      <div className="flex items-center gap-3">
        <i className={`fas ${toastIcons[toast.type]} text-xl`}></i>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{toast.title}</h4>
          <p className="text-sm text-gray-600">{toast.message}</p>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

// Composant principal
export default function AdminCommandeFilesModal({
  isOpen,
  onClose,
  commandeId,
  commandeTitle,
  clientName,
}: AdminCommandeFilesModalProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Hooks pour la gestion des fichiers
  const { files, count, isLoading, error, refetch } = useProjectFiles(commandeId, isOpen);
  const { downloadFile } = useDownloadFile(commandeId);

  // Hook pour l'upload avec suivi de progression (stockage local)
  const { uploadFile, progress, isUploading, reset } = useLocalUpload(
    undefined, // onProgress
    () => showToast("success", "Fichier uploadé", "Le document corrigé a été uploadé avec succès"),
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

  // Gestion de l'upload de fichiers corrigés
  const handleFileUpload = useCallback(
    async (fileList: FileList) => {
      if (!commandeId) {
        showToast("error", "Erreur", "ID de commande manquant");
        return;
      }

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        try {
          await uploadFile({ 
            projectId: commandeId, 
            file,
            isAdminFile: true // Marquer comme fichier admin
          });
        } catch (error) {
          console.error("Erreur lors de l'upload:", error);
        }
      }

      reset();
      refetch(); // Recharger la liste des fichiers
    },
    [commandeId, uploadFile, reset, showToast, refetch]
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

  // Séparer les fichiers clients et admin
  const clientFiles = files.filter(file => !file.isAdminFile);
  const adminFiles = files.filter(file => file.isAdminFile);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gestion des fichiers - ${commandeTitle}`}
      size="xl"
    >
      {/* Toast container */}
      <div className="fixed top-6 right-6 z-50 space-y-3">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

      <div className="space-y-6">
        {/* Header avec informations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-folder-open text-white"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{commandeTitle}</h3>
              <p className="text-sm text-gray-600">Client: {clientName}</p>
              <p className="text-sm text-gray-500">
                {count} fichier{count !== 1 ? 's' : ''} au total
              </p>
            </div>
          </div>
        </div>

        {/* Affichage du loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600">Chargement des fichiers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
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
        ) : (
          <>
            {/* Section fichiers du client */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <i className="fas fa-user mr-2 text-blue-500"></i>
                Documents du client ({clientFiles.length})
              </h4>
              {clientFiles.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <i className="fas fa-inbox text-3xl text-gray-300 mb-3"></i>
                  <p className="text-gray-600">Aucun document envoyé par le client</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientFiles.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      onDownload={handleDownload}
                      isAdmin={true}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Section upload de documents corrigés */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <i className="fas fa-user-edit mr-2 text-green-500"></i>
                Documents corrigés ({adminFiles.length})
              </h4>
              
              {/* Zone d'upload */}
              <div className="mb-6">
                <AdminUploadButton
                  onFileSelect={handleFileUpload}
                  isUploading={isUploading}
                  progress={progress}
                />
              </div>

              {/* Liste des documents corrigés */}
              {adminFiles.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <i className="fas fa-upload text-3xl text-green-300 mb-3"></i>
                  <p className="text-gray-600">Aucun document corrigé uploadé</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Utilisez la zone ci-dessus pour uploader les documents corrigés
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adminFiles.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      onDownload={handleDownload}
                      isAdmin={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}