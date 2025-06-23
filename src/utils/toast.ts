// Type pour les différents types de toast
export type ToastType = "success" | "error" | "warning" | "info";

// Interface pour les données du toast
export interface ToastData {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

// Fonction utilitaire pour afficher un toast
// En production, ceci serait connecté à votre système de notification (react-hot-toast, sonner, etc.)
export function showToast(
  type: ToastType,
  title: string,
  message: string,
  duration = 5000
) {
  // Pour la démo, on utilise console.log
  // En production, remplacez par votre librairie de toast préférée
  const emoji = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  console.log(`${emoji[type]} ${title}: ${message}`);

  // Simulation d'un toast visuel avec une notification browser
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: "/favicon.ico",
      tag: `toast-${Date.now()}`,
    });
  }

  // TODO: Intégrer avec votre système de toast UI (ex: react-hot-toast)
  // toast[type](message, { title, duration });
}

// Fonction pour demander la permission des notifications
export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}
