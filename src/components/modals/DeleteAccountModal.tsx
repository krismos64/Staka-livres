import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CONFIRM_TEXT = "SUPPRIMER";

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      setConfirmationText("");
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onConfirm();
    setIsDeleting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      aria-labelledby="delete-account-title"
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
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-trash-alt text-red-600"></i>
              </div>
              <div>
                <h3
                  id="delete-account-title"
                  className="text-lg font-bold text-gray-900"
                >
                  Supprimer le compte
                </h3>
                <p className="text-sm text-gray-600">
                  Cette action est définitive et irréversible.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
              aria-label="Fermer"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            Pour confirmer, veuillez taper "<b>{CONFIRM_TEXT}</b>" dans le champ
            ci-dessous.
          </p>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="w-full border rounded-lg p-3 text-center font-mono tracking-widest focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder={CONFIRM_TEXT}
            disabled={isDeleting}
            autoFocus
          />
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-red-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Toutes vos données, y compris les projets, messages et
                  factures, seront supprimées de manière permanente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmationText !== CONFIRM_TEXT || isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-trash-alt"></i>
            )}
            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
