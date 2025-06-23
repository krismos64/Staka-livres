import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useToast } from "../layout/ToastProvider";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarChange: (file: File) => void;
  currentAvatar: string;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function AvatarUploadModal({
  isOpen,
  onClose,
  onAvatarChange,
  currentAvatar,
}: AvatarUploadModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      const firstError = rejectedFiles[0].errors[0];
      if (firstError.code === "file-too-large") {
        setError("Fichier trop lourd (max 5Mo)");
      } else if (firstError.code === "file-invalid-type") {
        setError("Type de fichier invalide (JPEG, PNG, GIF)");
      } else {
        setError("Impossible de charger ce fichier.");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const acceptedFile = acceptedFiles[0];
      setFile(acceptedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(acceptedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/gif": [] },
    maxSize: MAX_SIZE,
    multiple: false,
  });

  useEffect(() => {
    if (isOpen) {
      setPreview(null);
      setFile(null);
      setError(null);
    }
  }, [isOpen]);

  const handleRemove = () => {
    setPreview(null);
    setFile(null);
    setError(null);
  };

  const handleConfirm = () => {
    if (file) {
      onAvatarChange(file);
      showToast("success", "Photo de profil mise à jour", "");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      aria-labelledby="avatar-upload-title"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
      >
        <div className="p-6 border-b">
          <h3
            id="avatar-upload-title"
            className="text-lg font-bold text-gray-900"
          >
            Changer la photo de profil
          </h3>
        </div>

        <div className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center text-gray-600">
              <i className="fas fa-cloud-upload-alt text-4xl mb-3 text-gray-400"></i>
              <p className="font-semibold">Glissez-déposez une image ici</p>
              <p className="text-sm">ou cliquez pour sélectionner</p>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, GIF jusqu'à 5Mo
              </p>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-red-100 text-red-700 p-3 rounded-lg text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center"
              >
                <p className="font-semibold mb-3">Aperçu :</p>
                <div className="relative inline-block">
                  <img
                    src={preview}
                    alt="Aperçu"
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
                  />
                  <button
                    onClick={handleRemove}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600"
                    aria-label="Supprimer l'image"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!file}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <i className="fas fa-check"></i>
            Confirmer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
