import React from "react";

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
  // Gère le clic sur le bouton pour ne pas déclencher le clic sur la carte
  const handleActionClick = (e: React.MouseEvent) => {
    if (onActionClick) {
      e.stopPropagation(); // Empêche l'événement de remonter au div parent
      onActionClick(e);
    }
  };

  return (
    <div
      className="project-card p-4 border border-gray-200 rounded-xl hover:border-blue-200 transition cursor-pointer"
      onClick={onCardClick}
    >
      {/* En-tête de la carte avec titre et statut */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${statusColor} ${statusTextColor}`}
        >
          {status}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progression</span>
          <span className="text-gray-900 font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full progress-bar ${progressColor}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Pied de la carte avec date de livraison et action */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{deliveryInfo}</span>
        <button
          className="text-blue-600 hover:text-blue-700 font-medium"
          onClick={handleActionClick}
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;
