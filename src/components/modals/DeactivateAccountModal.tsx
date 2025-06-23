import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

interface DeactivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeactivateAccountModal({
  isOpen,
  onClose,
  onConfirm,
}: DeactivateAccountModalProps) {
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleConfirm = async () => {
    setIsDeactivating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onConfirm();
    setIsDeactivating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      aria-labelledby="deactivate-account-title"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
      >
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-pause-circle text-yellow-600"></i>
              </div>
              <div>
                <h3
                  id="deactivate-account-title"
                  className="text-lg font-bold text-gray-900"
                >
                  Désactiver votre compte
                </h3>
                <p className="text-sm text-gray-600">
                  Votre compte sera temporairement suspendu.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeactivating}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
              aria-label="Fermer"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            Êtes-vous sûr de vouloir désactiver votre compte ? Vous pourrez le
            réactiver à tout moment en vous reconnectant.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-info-circle text-yellow-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Votre profil et vos projets ne seront plus visibles, mais vos
                  données ne seront pas supprimées.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeactivating}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeactivating}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:bg-yellow-300 flex items-center gap-2"
          >
            {isDeactivating ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-pause-circle"></i>
            )}
            {isDeactivating ? "Désactivation..." : "Désactiver le compte"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
