import React, { useCallback, useRef, useState } from "react";

// Types pour la gestion des fichiers
type FileStatus = "pending" | "processing" | "completed" | "rejected";
type FileType = "docx" | "pdf" | "zip" | "txt" | "jpg" | "png";

interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: string;
  sizeBytes: number;
  modified: string;
  status: FileStatus;
  description: string;
  uploadProgress?: number;
  isUploading?: boolean;
}

// Données mockées avec différents statuts
const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "L'Écho du Temps - Final.docx",
    type: "docx",
    size: "2.3 MB",
    sizeBytes: 2400000,
    modified: "15 Jan 2025",
    status: "completed",
    description: "Document final",
  },
  {
    id: "2",
    name: "Couverture_Écho_du_Temps.pdf",
    type: "pdf",
    size: "1.2 MB",
    sizeBytes: 1200000,
    modified: "15 Jan 2025",
    status: "completed",
    description: "Couverture",
  },
  {
    id: "3",
    name: "Pack_Complet_Écho_du_Temps.zip",
    type: "zip",
    size: "5.7 MB",
    sizeBytes: 5700000,
    modified: "15 Jan 2025",
    status: "completed",
    description: "Archive complète",
  },
  {
    id: "4",
    name: "Mémoires_Original.docx",
    type: "docx",
    size: "1.8 MB",
    sizeBytes: 1800000,
    modified: "10 Jan 2025",
    status: "processing",
    description: "En cours de correction",
  },
  {
    id: "5",
    name: "Nouvelles_du_Coeur_V1.docx",
    type: "docx",
    size: "950 KB",
    sizeBytes: 950000,
    modified: "12 Jan 2025",
    status: "rejected",
    description: "Corrections requises",
  },
];

// Configuration des icônes et couleurs par type de fichier
const fileTypeConfig = {
  docx: {
    icon: "fa-file-word",
    color: "blue",
    bgColor: "bg-blue-100",
    textColor: "text-blue-600",
  },
  pdf: {
    icon: "fa-file-pdf",
    color: "green",
    bgColor: "bg-green-100",
    textColor: "text-green-600",
  },
  zip: {
    icon: "fa-file-archive",
    color: "purple",
    bgColor: "bg-purple-100",
    textColor: "text-purple-600",
  },
  txt: {
    icon: "fa-file-alt",
    color: "gray",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
  },
  jpg: {
    icon: "fa-file-image",
    color: "yellow",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-600",
  },
  png: {
    icon: "fa-file-image",
    color: "yellow",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-600",
  },
};

// Configuration des badges de statut
const statusConfig = {
  pending: {
    label: "En attente",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
  },
  processing: {
    label: "En traitement",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
  },
  completed: {
    label: "Terminé",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
  },
  rejected: {
    label: "Refusé",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
  },
};

// Types pour les notifications
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

// Options de catégories pour la modal d'upload
const categoryOptions = [
  { value: "manuscript", label: "Manuscrit original" },
  { value: "corrected", label: "Document corrigé" },
  { value: "cover", label: "Couverture" },
  { value: "notes", label: "Notes et annotations" },
  { value: "archive", label: "Archive complète" },
  { value: "other", label: "Autre" },
];

// ----------- FileUploadModal Component -----------
interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: FileList, fileName?: string, category?: string) => void;
  isUploading?: boolean;
}

function FileUploadModal({
  isOpen,
  onClose,
  onUpload,
  isUploading = false,
}: FileUploadModalProps) {
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("manuscript");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFileName("");
      setCategory("manuscript");
      setSelectedFiles(null);
      setIsDragOver(false);
    }
  }, [isOpen]);

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
        setSelectedFiles(files);
        if (!fileName && files[0]) {
          setFileName(files[0].name);
        }
      }
    },
    [fileName]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        setSelectedFiles(files);
        if (!fileName && files[0]) {
          setFileName(files[0].name);
        }
      }
    },
    [fileName]
  );

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = () => {
    if (selectedFiles) {
      onUpload(selectedFiles, fileName, category);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full animate-zoom-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              Uploader un fichier
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Fermer la modal"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Nom du fichier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du fichier
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Nom du fichier"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Zone de drag & drop */}
          <div>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
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
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i
                  className={`fas text-2xl transition-colors ${
                    isDragOver
                      ? "fa-download text-blue-500"
                      : "fa-cloud-upload-alt text-gray-400"
                  }`}
                ></i>
              </div>

              <p className="text-gray-600 mb-2">
                Glissez votre fichier ici ou cliquez pour parcourir
              </p>

              <p className="text-sm text-gray-500 mb-4">
                Max 10 Mo • .doc, .docx, .pdf, .jpg, .png
              </p>

              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition inline-flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
              >
                Choisir un fichier
              </button>

              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <i className="fas fa-check-circle"></i>
                    <span className="text-sm font-medium">
                      {selectedFiles.length} fichier
                      {selectedFiles.length > 1 ? "s" : ""} sélectionné
                      {selectedFiles.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {Array.from(selectedFiles)
                      .map((f) => f.name)
                      .join(", ")}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".doc,.docx,.pdf,.txt,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
            disabled={isUploading}
          >
            Annuler
          </button>
          <button
            onClick={handleUpload}
            disabled={
              !selectedFiles || selectedFiles.length === 0 || isUploading
            }
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            <i className="fas fa-upload mr-2"></i>
            {isUploading ? "Upload en cours..." : "Uploader"}
          </button>
        </div>
      </div>
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

// ----------- EmptyState Component -----------
interface EmptyStateProps {
  onUpload: () => void;
}

function EmptyState({ onUpload }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
        <i className="fas fa-cloud-upload-alt text-blue-500 text-3xl"></i>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Aucun fichier pour le moment
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Commencez par uploader vos manuscrits et documents pour les faire
        corriger par notre équipe.
      </p>
      <button
        onClick={onUpload}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-sm transition inline-flex items-center"
      >
        <i className="fas fa-plus mr-2"></i>
        Ajouter votre premier fichier
      </button>
    </div>
  );
}

// ----------- FileCard Component -----------
interface FileCardProps {
  file: FileItem;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onPreview: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onSendToCorrector: (file: FileItem) => void;
}

function FileCard({
  file,
  onDownload,
  onDelete,
  onPreview,
  onRename,
  onSendToCorrector,
}: FileCardProps) {
  const [showActions, setShowActions] = useState(false);
  const typeConfig = fileTypeConfig[file.type] || fileTypeConfig.txt;
  const statusInfo = statusConfig[file.status];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
      {/* Header avec icône et menu */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 ${typeConfig.bgColor} rounded-xl flex items-center justify-center`}
        >
          <i
            className={`fas ${typeConfig.icon} ${typeConfig.textColor} text-xl`}
          ></i>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Actions du fichier"
          >
            <i className="fas fa-ellipsis-h"></i>
          </button>

          {/* Menu d'actions */}
          {showActions && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-10 min-w-48">
              <div className="py-2">
                <button
                  onClick={() => {
                    onPreview(file);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center"
                >
                  <i className="fas fa-eye mr-3 w-4"></i>Aperçu
                </button>
                <button
                  onClick={() => {
                    onRename(file);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center"
                >
                  <i className="fas fa-edit mr-3 w-4"></i>Renommer
                </button>
                <button
                  onClick={() => {
                    onSendToCorrector(file);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center"
                  disabled={file.status === "processing"}
                >
                  <i className="fas fa-paper-plane mr-3 w-4"></i>Envoyer au
                  correcteur
                </button>
                <hr className="my-2" />
                <button
                  onClick={() => {
                    onDelete(file);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center"
                >
                  <i className="fas fa-trash mr-3 w-4"></i>Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nom du fichier avec badge statut */}
      <div className="mb-4">
        <h3
          className="font-semibold text-gray-900 mb-2 truncate"
          title={file.name}
        >
          {file.name}
        </h3>
        <span
          className={`${statusInfo.bgColor} ${statusInfo.textColor} text-xs px-2 py-1 rounded-full font-medium`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Informations du fichier */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Taille</span>
          <span className="text-gray-900">{file.size}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Modifié</span>
          <span className="text-gray-900">{file.modified}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Description</span>
          <span className="text-gray-900">{file.description}</span>
        </div>
      </div>

      {/* Barre de progression si en upload */}
      {file.isUploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Upload en cours...</span>
            <span className="text-gray-900">{file.uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${file.uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Actions principales */}
      <div className="flex gap-2">
        <button
          onClick={() => onDownload(file)}
          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center"
          disabled={file.isUploading}
        >
          <i className="fas fa-download mr-1"></i>
          Télécharger
        </button>

        {file.type === "zip" ? (
          <button
            onClick={() => onPreview(file)}
            className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center"
            disabled={file.isUploading}
          >
            <i className="fas fa-expand-arrows-alt mr-1"></i>
            Extraire
          </button>
        ) : (
          <button
            onClick={() => onPreview(file)}
            className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center"
            disabled={file.isUploading}
          >
            <i className="fas fa-eye mr-1"></i>
            Aperçu
          </button>
        )}
      </div>
    </div>
  );
}

// ----------- FileUploader Component -----------
interface FileUploaderProps {
  onFileUpload: (files: FileList, fileName?: string, category?: string) => void;
  isUploading: boolean;
  onOpenUploadModal: () => void;
}

function FileUploader({
  onFileUpload,
  isUploading,
  onOpenUploadModal,
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        onFileUpload(files);
      }
    },
    [onFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        onFileUpload(files);
      }
    },
    [onFileUpload]
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
        Formats acceptés: DOC, DOCX, PDF, TXT, JPG, PNG
        <br />
        Taille maximum: 10 Mo par fichier
      </div>

      {!isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenUploadModal();
          }}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 transition inline-flex items-center"
        >
          <i className="fas fa-plus mr-2"></i>
          Choisir des fichiers
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".doc,.docx,.pdf,.txt,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}

// ----------- FilePreviewModal Component -----------
interface FilePreviewModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
  if (!isOpen || !file) return null;

  const typeConfig = fileTypeConfig[file.type] || fileTypeConfig.txt;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 ${typeConfig.bgColor} rounded-lg flex items-center justify-center`}
            >
              <i
                className={`fas ${typeConfig.icon} ${typeConfig.textColor}`}
              ></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{file.name}</h3>
              <p className="text-sm text-gray-600">
                {file.size} • {file.modified}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Fermer l'aperçu"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="text-center py-16">
            <div
              className={`w-24 h-24 ${typeConfig.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}
            >
              <i
                className={`fas ${typeConfig.icon} ${typeConfig.textColor} text-3xl`}
              ></i>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              Aperçu du fichier
            </h4>
            <p className="text-gray-600 mb-6">
              L'aperçu en ligne n'est pas encore disponible pour ce type de
              fichier.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <i className="fas fa-download mr-2"></i>
                Télécharger pour voir
              </button>
              <button
                onClick={onClose}
                className="bg-gray-100 text-gray-700 py-2 px-6 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------- FilesPage Component (Principal) -----------
export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

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
    async (fileList: FileList, customFileName?: string, category?: string) => {
      const maxSize = 10 * 1024 * 1024; // 10 Mo
      const allowedTypes = [
        ".doc",
        ".docx",
        ".pdf",
        ".txt",
        ".jpg",
        ".jpeg",
        ".png",
      ];

      setIsUploading(true);

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        // Vérifications
        if (file.size > maxSize) {
          showToast(
            "error",
            "Fichier trop volumineux",
            `${file.name} dépasse la limite de 10 Mo`
          );
          continue;
        }

        const extension = "." + file.name.split(".").pop()?.toLowerCase();
        if (!allowedTypes.includes(extension)) {
          showToast(
            "error",
            "Format non supporté",
            `${file.name} n'est pas dans un format accepté`
          );
          continue;
        }

        // Simulation d'upload avec progress
        const newFile: FileItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: customFileName || file.name,
          type: extension.slice(1) as FileType,
          size: (file.size / 1024 / 1024).toFixed(1) + " MB",
          sizeBytes: file.size,
          modified: new Date().toLocaleDateString("fr-FR"),
          status: "pending",
          description: category
            ? categoryOptions.find((c) => c.value === category)?.label ||
              "Nouvellement ajouté"
            : "Nouvellement ajouté",
          isUploading: true,
          uploadProgress: 0,
        };

        setFiles((prev) => [...prev, newFile]);

        // Simulation de la progression
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);

            // Finaliser l'upload
            setFiles((prev) =>
              prev.map((f) =>
                f.id === newFile.id
                  ? {
                      ...f,
                      isUploading: false,
                      uploadProgress: undefined,
                      status: "pending",
                    }
                  : f
              )
            );

            showToast(
              "success",
              "Fichier uploadé",
              `${customFileName || file.name} a été ajouté avec succès`
            );
          }

          setFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id
                ? { ...f, uploadProgress: Math.floor(progress) }
                : f
            )
          );
        }, 300);
      }

      setIsUploading(false);
    },
    [showToast]
  );

  // Actions sur les fichiers
  const handleDownload = useCallback(
    (file: FileItem) => {
      showToast(
        "info",
        "Téléchargement",
        `Téléchargement de ${file.name} en cours...`
      );
      // Ici, implémenter la logique de téléchargement
    },
    [showToast]
  );

  const handleDelete = useCallback(
    (file: FileItem) => {
      if (
        window.confirm(`Êtes-vous sûr de vouloir supprimer "${file.name}" ?`)
      ) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
        showToast("success", "Fichier supprimé", `${file.name} a été supprimé`);
      }
    },
    [showToast]
  );

  const handlePreview = useCallback((file: FileItem) => {
    setPreviewFile(file);
  }, []);

  const handleRename = useCallback(
    (file: FileItem) => {
      const newName = window.prompt("Nouveau nom:", file.name);
      if (newName && newName !== file.name) {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, name: newName } : f))
        );
        showToast(
          "success",
          "Fichier renommé",
          `Fichier renommé en "${newName}"`
        );
      }
    },
    [showToast]
  );

  const handleSendToCorrector = useCallback(
    (file: FileItem) => {
      if (file.status === "processing") {
        showToast(
          "warning",
          "Déjà en traitement",
          "Ce fichier est déjà en cours de correction"
        );
        return;
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: "processing",
                description: "En cours de correction",
              }
            : f
        )
      );
      showToast(
        "success",
        "Envoyé au correcteur",
        `${file.name} a été envoyé pour correction`
      );
    },
    [showToast]
  );

  // Ouvrir la modal d'upload
  const openUploadModal = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  // Fermer la modal d'upload
  const closeUploadModal = useCallback(() => {
    setShowUploadModal(false);
  }, []);

  return (
    <section className="max-w-7xl mx-auto py-2 px-4">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Mes fichiers
          </h2>
          <p className="text-gray-600">
            Gérez tous vos documents et manuscrits ({files.length} fichier
            {files.length > 1 ? "s" : ""})
          </p>
        </div>
        <button
          onClick={openUploadModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition text-base"
          disabled={isUploading}
        >
          <i className="fas fa-cloud-upload-alt mr-2"></i>
          Uploader un fichier
        </button>
      </div>

      {/* Contenu principal */}
      {files.length === 0 ? (
        <EmptyState onUpload={openUploadModal} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* FileCards existants */}
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onPreview={handlePreview}
              onRename={handleRename}
              onSendToCorrector={handleSendToCorrector}
            />
          ))}

          {/* Zone d'upload */}
          <FileUploader
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
            onOpenUploadModal={openUploadModal}
          />
        </div>
      )}

      {/* Modal d'upload */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={closeUploadModal}
        onUpload={handleFileUpload}
        isUploading={isUploading}
      />

      {/* Modal d'aperçu */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Container des toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </section>
  );
}
