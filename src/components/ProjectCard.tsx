import React, { useEffect, useState } from "react";

/**
 * Props pour le composant ProjectCard.
 */
interface ProjectCardProps {
  /** Titre du projet */
  title: string;
  /** Description (ex: "Roman • 280 pages") */
  description: string;
  /** Statut du projet (ex: "Correction terminée") */
  status: string;
  /** Couleur de fond pour la pastille de statut (classe Tailwind) */
  statusColor: string;
  /** Couleur de texte pour la pastille de statut (classe Tailwind) */
  statusTextColor: string;
  /** Progression en pourcentage (0-100) */
  progress: number;
  /** Couleur de la barre de progression (classe Tailwind) */
  progressColor: string;
  /** Information sur la livraison (ex: "Livré le 15 Jan 2025") */
  deliveryInfo: string;
  /** Texte du bouton d'action (ex: "Télécharger →") */
  actionText: string;
  /** Fonction à appeler lors du clic sur la carte */
  onCardClick?: () => void;
  /** Fonction à appeler lors du clic sur le bouton d'action */
  onActionClick?: (e: React.MouseEvent) => void;
}

/**
 * Carte réutilisable pour afficher les informations d'un projet.
 */
function ProjectCard({
  title,
  description,
  status,
  statusColor,
  statusTextColor,
  progress,
  progressColor,
  deliveryInfo,
  actionText,
  onCardClick,
  onActionClick,
}: ProjectCardProps) {
  // State pour l'animation de la progress bar
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Animation de la progress bar au montage
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress]);

  // Gère le clic sur le bouton pour ne pas déclencher le clic sur la carte
  const handleActionClick = (e: React.MouseEvent) => {
    if (onActionClick) {
      e.stopPropagation();
      onActionClick(e);
    }
  };

  // Styles conditionnels pour les interactions
  const getProgressBarColor = () => {
    if (progress === 100) return "bg-green-500";
    if (progress === 0) return "bg-gray-300";
    return progressColor;
  };

  const getStatusIcon = () => {
    if (progress === 100) return "fas fa-check-circle";
    if (progress === 0) return "fas fa-clock";
    return "fas fa-sync fa-spin";
  };

  return (
    <div
      className={`relative p-5 border-2 rounded-xl transition-all duration-300 cursor-pointer
        group overflow-hidden
        ${
          isHovered
            ? "border-blue-300 shadow-xl shadow-blue-100/50 -translate-y-1"
            : "border-gray-200 shadow-sm hover:border-blue-200"
        }
        ${onCardClick ? "hover:shadow-lg" : ""}
      `}
      onClick={onCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Effet de brillance au survol */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
        -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
      />

      {/* En-tête de la carte avec titre et statut */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h4
            className="font-semibold text-gray-900 truncate pr-2
            group-hover:text-blue-900 transition-colors duration-200"
          >
            {title}
          </h4>
          <p className="text-sm text-gray-600 mt-1 flex items-center">
            <i className="fas fa-book text-xs mr-2 text-gray-400"></i>
            {description}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center text-xs px-3 py-1 rounded-full font-medium
              ${statusColor} ${statusTextColor} transition-all duration-200
              ${isHovered ? "scale-105" : ""}`}
          >
            <i className={`${getStatusIcon()} mr-1`}></i>
            {status}
          </span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600 font-medium">Progression</span>
          <span
            className={`font-bold transition-colors duration-200
            ${progress === 100 ? "text-green-600" : "text-gray-900"}`}
          >
            {progress}%
          </span>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out
                ${getProgressBarColor()} relative overflow-hidden`}
              style={{ width: `${animatedProgress}%` }}
            >
              {/* Effet de brillance sur la progress bar */}
              {progress > 0 && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent 
                  via-white/30 to-transparent -translate-x-full animate-pulse"
                />
              )}
            </div>
          </div>
          {/* Indicateur de progression pour les projets en cours */}
          {progress > 0 && progress < 100 && (
            <div
              className="absolute -top-1 bg-white rounded-full w-5 h-5 shadow-sm 
              border-2 border-current flex items-center justify-center transition-all duration-1000"
              style={{
                left: `calc(${animatedProgress}% - 10px)`,
                color: progressColor.replace("bg-", "").replace("-500", ""),
              }}
            >
              <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* Pied de la carte avec date de livraison et action */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-600">
          <i className="fas fa-calendar-alt mr-2 text-gray-400"></i>
          <span className="truncate">{deliveryInfo}</span>
        </div>
        <button
          className={`font-medium transition-all duration-200 px-3 py-1 rounded-lg
            ${
              progress === 100
                ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            }
            ${isHovered ? "translate-x-1 shadow-sm" : ""}
          `}
          onClick={handleActionClick}
        >
          {actionText}
        </button>
      </div>

      {/* Badge de notification pour les projets terminés */}
      {progress === 100 && (
        <div
          className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full 
          flex items-center justify-center animate-bounce"
        >
          <i className="fas fa-check text-white text-xs"></i>
        </div>
      )}
    </div>
  );
}

export default ProjectCard;
