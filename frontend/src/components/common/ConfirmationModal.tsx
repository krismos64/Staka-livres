import React from "react";
import Modal from "./Modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "info",
  isLoading = false,
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case "danger":
        return {
          icon: "fas fa-exclamation-triangle",
          iconColor: "text-red-600",
          buttonColor: "bg-red-600 hover:bg-red-700",
        };
      case "warning":
        return {
          icon: "fas fa-exclamation-circle",
          iconColor: "text-yellow-600",
          buttonColor: "bg-yellow-600 hover:bg-yellow-700",
        };
      default:
        return {
          icon: "fas fa-info-circle",
          iconColor: "text-blue-600",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <i className={`${config.icon} ${config.iconColor} text-2xl`}></i>
          </div>
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${config.buttonColor}`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
