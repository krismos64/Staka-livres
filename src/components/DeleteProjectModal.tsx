import React, { useState } from "react";
import { Project } from "../pages/ProjectsPage";

interface DeleteProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Modal de confirmation de suppression de projet
 * Design sécurisé avec double confirmation et warning
 */
function DeleteProjectModal({
  project,
  isOpen,
  onClose,
  onConfirm,
}: DeleteProjectModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState<"warning" | "confirm">("warning");

  if (!isOpen) return null;

  // Gestion de la fermeture avec échap
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep("warning");
      setConfirmationText("");
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsDeleting(true);

    // Simulation d'une requête API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    onConfirm();
    setIsDeleting(false);
  };

  const canDelete = project.status === "En attente" || project.progress === 0;
  const requiresConfirmation =
    project.progress > 0 || project.status !== "En attente";
  const confirmText = project.title.toUpperCase();
  const isConfirmationValid = confirmationText === confirmText;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-trash text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Supprimer le projet
                </h3>
                <p className="text-sm text-gray-600">{project.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fermer"
              disabled={isDeleting}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!canDelete ? (
            /* Cannot delete - project in progress */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-ban text-red-600 text-2xl"></i>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Suppression impossible
                </h4>
                <p className="text-gray-600 text-sm">
                  Ce projet ne peut pas être supprimé car il est actuellement en
                  cours de correction.
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <i className="fas fa-info-circle"></i>
                  <span className="text-sm">
                    Contactez notre équipe si vous souhaitez vraiment annuler ce
                    projet.
                  </span>
                </div>
              </div>
            </div>
          ) : step === "warning" ? (
            /* Warning step */
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Attention !
                </h4>
                <p className="text-gray-600 text-sm">
                  Vous êtes sur le point de supprimer définitivement ce projet.
                  Cette action est irréversible.
                </p>
              </div>

              {/* Project details recap */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Titre :</span>
                  <span className="font-medium">{project.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type :</span>
                  <span className="font-medium">{project.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pages :</span>
                  <span className="font-medium">{project.pages}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Statut :</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${project.statusBadge}`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2 text-red-800">
                  <i className="fas fa-exclamation-circle mt-0.5"></i>
                  <div className="text-sm">
                    <p className="font-medium">Que se passera-t-il ?</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Le projet sera supprimé définitivement</li>
                      <li>• Tous les fichiers associés seront perdus</li>
                      <li>• Cette action ne peut pas être annulée</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Confirmation step */
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-keyboard text-red-600 text-2xl"></i>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Confirmation finale
                </h4>
                <p className="text-gray-600 text-sm">
                  Pour confirmer la suppression, tapez le titre du projet en
                  MAJUSCULES :
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <code className="text-lg font-mono font-bold text-gray-900">
                  {confirmText}
                </code>
              </div>

              <div>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className={`w-full border rounded-lg p-3 text-center font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    confirmationText && !isConfirmationValid
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="Tapez le titre ici..."
                  disabled={isDeleting}
                />
                {confirmationText && !isConfirmationValid && (
                  <p className="text-red-600 text-xs mt-1 text-center">
                    Le texte ne correspond pas exactement
                  </p>
                )}
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-800 text-sm">
                  <i className="fas fa-shield-alt"></i>
                  <span>
                    Cette étape nous assure que la suppression est
                    intentionnelle.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          {!canDelete ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  /* Contact support logic */
                }}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Contacter le support
              </button>
            </div>
          ) : step === "warning" ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                onClick={() =>
                  requiresConfirmation ? setStep("confirm") : handleConfirm()
                }
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                <i className="fas fa-arrow-right"></i>
                {requiresConfirmation ? "Continuer" : "Supprimer"}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setStep("warning")}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Retour
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isConfirmationValid || isDeleting}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                  !isConfirmationValid || isDeleting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {isDeleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Suppression...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    Supprimer définitivement
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeleteProjectModal;
