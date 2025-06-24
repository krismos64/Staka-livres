import React from "react";

// Système de notifications toast pour l'application

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Configuration des icônes et couleurs pour chaque type
export const toastConfig = {
  success: {
    icon: "fa-check-circle",
    iconColor: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    titleColor: "text-green-800",
    messageColor: "text-green-600",
  },
  error: {
    icon: "fa-times-circle",
    iconColor: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    titleColor: "text-red-800",
    messageColor: "text-red-600",
  },
  warning: {
    icon: "fa-exclamation-triangle",
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    titleColor: "text-yellow-800",
    messageColor: "text-yellow-600",
  },
  info: {
    icon: "fa-info-circle",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    titleColor: "text-blue-800",
    messageColor: "text-blue-600",
  },
};

// Générateur d'ID unique pour les toasts
export const generateToastId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Fonction utilitaire pour créer un toast
export const createToast = (
  type: ToastType,
  title: string,
  message: string,
  options?: {
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }
): Toast => {
  return {
    id: generateToastId(),
    type,
    title,
    message,
    duration: options?.duration || 5000,
    action: options?.action,
  };
};

// Toasts prédéfinis pour les actions courantes de fichiers
export const fileToasts = {
  uploadSuccess: (fileName: string) =>
    createToast(
      "success",
      "Fichier uploadé",
      `${fileName} a été ajouté avec succès`
    ),

  uploadError: (fileName: string, reason: string) =>
    createToast("error", "Erreur d'upload", `${fileName}: ${reason}`),

  downloadStart: (fileName: string) =>
    createToast(
      "info",
      "Téléchargement",
      `Téléchargement de ${fileName} en cours...`
    ),

  fileDeleted: (fileName: string) =>
    createToast("success", "Fichier supprimé", `${fileName} a été supprimé`),

  fileRenamed: (newName: string) =>
    createToast(
      "success",
      "Fichier renommé",
      `Fichier renommé en "${newName}"`
    ),

  sentToCorrector: (fileName: string) =>
    createToast(
      "success",
      "Envoyé au correcteur",
      `${fileName} a été envoyé pour correction`
    ),

  alreadyProcessing: () =>
    createToast(
      "warning",
      "Déjà en traitement",
      "Ce fichier est déjà en cours de correction"
    ),

  fileTooLarge: (fileName: string, maxSize: string) =>
    createToast(
      "error",
      "Fichier trop volumineux",
      `${fileName} dépasse la limite de ${maxSize}`
    ),

  invalidFormat: (fileName: string) =>
    createToast(
      "error",
      "Format non supporté",
      `${fileName} n'est pas dans un format accepté`
    ),

  networkError: () =>
    createToast(
      "error",
      "Erreur réseau",
      "Impossible de contacter le serveur",
      {
        duration: 8000,
        action: {
          label: "Réessayer",
          onClick: () => window.location.reload(),
        },
      }
    ),

  maxFilesReached: (limit: number) =>
    createToast(
      "warning",
      "Limite atteinte",
      `Vous ne pouvez pas uploader plus de ${limit} fichiers à la fois`
    ),
};

// Hook pour gérer les toasts dans un composant React
export const useToasts = () => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);

    // Auto-suppression basée sur la durée
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = React.useCallback(
    (
      type: ToastType,
      title: string,
      message: string,
      options?: {
        duration?: number;
        action?: { label: string; onClick: () => void };
      }
    ) => {
      const toast = createToast(type, title, message, options);
      addToast(toast);
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showToast,
  };
};
