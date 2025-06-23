import React, { useState } from "react";
import { Project } from "../pages/ProjectsPage";

/**
 * Props pour le composant ProjectCard.
 */
interface ProjectCardProps {
  /** Projet à afficher */
  project: Project;
  /** Fonction pour voir les détails du projet */
  onViewDetails: () => void;
  /** Fonction pour télécharger le projet */
  onDownload: () => void;
  /** Fonction pour noter le projet */
  onRate: () => void;
  /** Fonction pour modifier le projet */
  onEdit: () => void;
  /** Fonction pour supprimer le projet */
  onDelete: () => void;
  /** Fonction pour contacter le correcteur */
  onContact: () => void;
}

/**
 * Composant carte projet avec menu contextuel et actions complètes.
 * Reproduit fidèlement le design de la maquette HTML.
 */
function ProjectCard({
  project,
  onViewDetails,
  onDownload,
  onRate,
  onEdit,
  onDelete,
  onContact,
}: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Gestion du menu contextuel
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Fermeture du menu lors du clic en dehors
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) {
        closeMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isMenuOpen]);

  // Gestion des actions du menu avec fermeture
  const handleMenuAction = (action: () => void) => {
    action();
    closeMenu();
  };

  // Vérification de sécurité pour éviter les erreurs si project est undefined
  if (!project) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        Projet non disponible
      </div>
    );
  }

  // Détermination des couleurs et icônes selon le statut
  const getStatusStyles = () => {
    switch (project.status) {
      case "Terminé":
        return {
          cardBg: "bg-gradient-to-br from-blue-500 to-blue-600",
          cardIcon: "fas fa-book",
          progressColor: "bg-green-500",
        };
      case "En correction":
        return {
          cardBg: "bg-gradient-to-br from-green-500 to-green-600",
          cardIcon: "fas fa-user-edit",
          progressColor: "bg-blue-500",
        };
      case "En attente":
        return {
          cardBg: "bg-gradient-to-br from-yellow-500 to-yellow-600",
          cardIcon: "fas fa-clock",
          progressColor: "bg-gray-400",
        };
      default:
        return {
          cardBg: "bg-gradient-to-br from-gray-500 to-gray-600",
          cardIcon: "fas fa-file",
          progressColor: "bg-gray-400",
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
      {/* Header avec titre, status et menu contextuel */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Icône du projet avec couleur dynamique */}
          <div
            className={`w-12 h-12 ${styles.cardBg} rounded-xl flex items-center justify-center`}
          >
            <i className={`${styles.cardIcon} text-white`}></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
              {project.title}
            </h3>
            <p className="text-sm text-gray-600">
              {project.type} • {project.pages} pages • Commencé le{" "}
              {project.started}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge de statut */}
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${project.statusBadge}`}
          >
            {project.status}
          </span>

          {/* Menu contextuel (3 dots) */}
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Actions du projet"
            >
              <i className="fas fa-ellipsis-h"></i>
            </button>

            {/* Dropdown menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 py-2 animate-in fade-in duration-200">
                <button
                  onClick={() => handleMenuAction(onViewDetails)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-eye text-gray-400"></i>
                  Voir les détails
                </button>

                {project.canDownload && (
                  <button
                    onClick={() => handleMenuAction(onDownload)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-download text-gray-400"></i>
                    Télécharger
                  </button>
                )}

                {project.status === "Terminé" && (
                  <button
                    onClick={() => handleMenuAction(onRate)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-star text-gray-400"></i>
                    Noter le projet
                  </button>
                )}

                {project.status !== "Terminé" &&
                  project.corrector !== "Non assigné" && (
                    <button
                      onClick={() => handleMenuAction(onContact)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <i className="fas fa-comment text-gray-400"></i>
                      Contacter {project.corrector}
                    </button>
                  )}

                <hr className="my-2" />

                <button
                  onClick={() => handleMenuAction(onEdit)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-edit text-gray-400"></i>
                  Modifier
                </button>

                <button
                  onClick={() => handleMenuAction(onDelete)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-trash text-red-400"></i>
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barre de progression avec animation */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 font-medium">Progression</span>
          <span
            className={`font-bold ${
              project.progress === 100 ? "text-green-600" : "text-gray-900"
            }`}
          >
            {project.progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${styles.progressColor} relative`}
            style={{ width: `${project.progress}%` }}
          >
            {/* Effet de brillance sur la progress bar */}
            {project.progress > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Informations détaillées du projet */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-500 mb-1">Date de début</p>
          <p className="text-sm font-medium text-gray-900">{project.started}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Date de livraison</p>
          <p className="text-sm font-medium text-gray-900">
            {project.delivery}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Correcteur assigné</p>
          <p className="text-sm font-medium text-gray-900">
            {project.corrector}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Pack choisi</p>
          <p className="text-sm font-medium text-gray-900">{project.pack}</p>
        </div>
      </div>

      {/* Actions principales - affichage conditionnel selon le statut */}
      <div className="flex items-center gap-3">
        {project.status === "Terminé" && project.canDownload ? (
          <>
            <button
              onClick={onDownload}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-download mr-2"></i>
              Télécharger
            </button>
            {project.rating ? (
              <button
                onClick={onRate}
                className="flex-1 bg-white text-gray-700 py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-star mr-2 text-yellow-500"></i>
                Noté {project.rating}/5
              </button>
            ) : (
              <button
                onClick={onRate}
                className="flex-1 bg-white text-gray-700 py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-star mr-2"></i>
                Noter
              </button>
            )}
          </>
        ) : project.status === "En correction" ? (
          <>
            <button
              onClick={onViewDetails}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-eye mr-2"></i>
              Voir progression
            </button>
            {project.corrector !== "Non assigné" && (
              <button
                onClick={onContact}
                className="flex-1 bg-white text-gray-700 py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-comment mr-2"></i>
                Contacter
              </button>
            )}
          </>
        ) : (
          // En attente
          <>
            <button
              onClick={onEdit}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-edit mr-2"></i>
              Modifier
            </button>
            <button
              onClick={onViewDetails}
              className="flex-1 bg-white text-gray-700 py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <i className="fas fa-eye mr-2"></i>
              Détails
            </button>
          </>
        )}

        {/* Badge de notification pour les projets terminés */}
        {project.progress === 100 && (
          <div className="relative">
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
              <i className="fas fa-check text-white text-xs"></i>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectCard;
