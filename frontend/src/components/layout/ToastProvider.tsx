import { AnimatePresence, motion } from "framer-motion";
import React, { createContext, useContext } from "react";
import {
  Toast,
  toastConfig,
  useToasts as useToastsCore,
} from "../../utils/toast";

// --- Contexte pour les toasts ---
interface ToastContextType {
  showToast: (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- Provider ---
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, showToast, removeToast } = useToastsCore();

  // Log pour debug (désactivé pour réduire la verbosité)
  // React.useEffect(() => {
  //   console.log('🍞 ToastProvider - Toasts actuels:', toasts.length, toasts.map(t => t.title));
  // }, [toasts]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// --- Hook public ---
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// --- Composant Conteneur de Toasts ---
function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 pointer-events-none p-6 flex flex-col items-end z-[100]"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Composant Toast individuel ---
function ToastComponent({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const config = toastConfig[toast.type];

  // console.log('🍞 Rendu toast:', toast.title, toast.type); // Debug désactivé

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.5,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`w-full max-w-sm pointer-events-auto my-2 rounded-xl shadow-lg border ${config.borderColor} ${config.bgColor}`}
    >
      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className={`text-xl ${config.iconColor}`}>
          <i className={`fas ${config.icon}`}></i>
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className={`font-semibold ${config.titleColor}`}>{toast.title}</p>
          <p className={`text-sm mt-1 ${config.messageColor}`}>
            {toast.message}
          </p>
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className="mt-3 px-3 py-1 bg-transparent border border-current rounded-md text-sm font-medium hover:opacity-80 transition-opacity"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className={`p-1 rounded-full hover:bg-black/10 transition-colors ${config.titleColor}`}
          aria-label="Fermer"
        >
          <i className="fas fa-times text-xs w-4 h-4 flex items-center justify-center"></i>
        </button>
      </div>
    </motion.div>
  );
}
