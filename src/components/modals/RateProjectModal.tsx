import React, { useState } from "react";
import { Project } from "../../pages/ProjectsPage";

interface RateProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
}

/**
 * Modal de notation du projet avec système d'étoiles interactif
 * Reproduit le design de la maquette HTML avec UX optimisée
 */
function RateProjectModal({
  project,
  isOpen,
  onClose,
  onSubmit,
}: RateProjectModalProps) {
  const [rating, setRating] = useState(project.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);

    // Simulation d'une requête API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onSubmit(rating, feedback);
    setIsSubmitting(false);
  };

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  const handleStarHover = (starValue: number) => {
    setHoverRating(starValue);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const getRatingText = (value: number) => {
    switch (value) {
      case 1:
        return "Très insatisfait";
      case 2:
        return "Insatisfait";
      case 3:
        return "Correct";
      case 4:
        return "Satisfait";
      case 5:
        return "Excellent";
      default:
        return "Sélectionnez une note";
    }
  };

  const currentRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-lg w-full animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <i className="fas fa-star text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Noter le projet
                </h3>
                <p className="text-sm text-gray-600">{project.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fermer"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Info Recap */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-green-600 text-sm"></i>
              </div>
              <div>
                <p className="font-medium text-gray-900">Projet terminé !</p>
                <p className="text-sm text-gray-600">
                  Livré le {project.delivery}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              {project.type} • {project.pages} pages • {project.pack}
            </div>
          </div>

          {/* Rating Stars */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Comment évaluez-vous notre service ?
            </label>

            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className={`text-3xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded ${
                    star <= currentRating
                      ? "text-yellow-400 hover:text-yellow-500"
                      : "text-gray-300 hover:text-gray-400"
                  }`}
                  aria-label={`Noter ${star} étoile${star > 1 ? "s" : ""}`}
                >
                  <i className="fas fa-star"></i>
                </button>
              ))}
            </div>

            <p
              className={`text-sm font-medium transition-colors duration-200 ${
                currentRating > 0 ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {getRatingText(currentRating)}
            </p>
          </div>

          {/* Feedback Text */}
          <div>
            <label
              htmlFor="feedback"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Commentaires (optionnel)
            </label>
            <textarea
              id="feedback"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Partagez votre expérience avec nous... Qu'avez-vous apprécié ? Que pourrions-nous améliorer ?"
            />
            <p className="text-xs text-gray-500 mt-1">
              Votre avis nous aide à améliorer nos services
            </p>
          </div>

          {/* Corrector Appreciation */}
          {project.corrector !== "Non assigné" && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-user-tie text-blue-600"></i>
                <span className="font-medium text-blue-900">
                  Votre correcteur
                </span>
              </div>
              <p className="text-sm text-blue-800">
                {project.corrector} s'est occupé de votre projet avec soin.
                N'hésitez pas à mentionner la qualité de son travail !
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                rating === 0 || isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Envoyer l'évaluation
                </>
              )}
            </button>
          </div>

          {/* Already Rated Notice */}
          {project.rating && (
            <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              <i className="fas fa-info-circle mr-2"></i>
              Vous avez déjà noté ce projet {project.rating}/5. Cette nouvelle
              note remplacera l'ancienne.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default RateProjectModal;
