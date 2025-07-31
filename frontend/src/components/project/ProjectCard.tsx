import React, { useState } from "react";
import { Project } from "../../pages/ProjectsPage";

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
 * Composant carte projet avec actions directes.
 * Reproduit fidèlement le design de la maquette HTML de la page "Mes Projets".
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

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const getStatusStyles = () => {
    switch (project.status) {
      case "Terminé":
        return {
          iconContainer: "bg-gradient-to-br from-blue-500 to-blue-600",
          icon: "fas fa-book",
          progressColor: "bg-green-500",
        };
      case "En correction":
        return {
          iconContainer: "bg-gradient-to-br from-green-500 to-green-600",
          icon: "fas fa-user-edit",
          progressColor: "bg-blue-500",
        };
      case "En attente":
        return {
          iconContainer: "bg-gradient-to-br from-yellow-500 to-yellow-600",
          icon: "fas fa-heart", // Changed from fa-clock to match mockup
          progressColor: "bg-gray-400",
        };
      default:
        return {
          iconContainer: "bg-gradient-to-br from-gray-500 to-gray-600",
          icon: "fas fa-file",
          progressColor: "bg-gray-400",
        };
    }
  };

  const styles = getStatusStyles();

  const getSubtitle = () => {
    if (project.status === "En attente") {
      return `${project.type} • ${project.pages} pages • Créé le ${project.started}`;
    }
    return `${project.type} • ${project.pages} pages • Commencé le ${project.started}`;
  };

  const renderActions = () => {
    switch (project.status) {
      case "Terminé":
        return (
          <>
            <button
              onClick={onDownload}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-download"></i>Télécharger
            </button>
            <button
              onClick={onRate}
              className="flex-1 bg-white text-gray-700 py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-star"></i>Noter ({project.rating || "N/A"})
            </button>
            <button
              onClick={onViewDetails}
              className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-eye"></i>Détails
            </button>
          </>
        );
      case "En correction":
        return (
          <>
            <button
              onClick={onViewDetails}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-eye"></i>Voir progression
            </button>
            <button
              onClick={onContact}
              className="flex-1 bg-white text-gray-700 py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-comment"></i>Contacter
            </button>
            <button
              onClick={() => alert("Affichage des fichiers")}
              className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-folder"></i>Fichiers
            </button>
          </>
        );
      case "En attente":
        return (
          <>
            <button
              onClick={() => alert("Ajout des fichiers")}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-upload"></i>Ajouter fichiers
            </button>
            <button
              onClick={onEdit}
              className="flex-1 bg-white text-gray-700 py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-edit"></i>Modifier
            </button>
            <button
              onClick={onDelete}
              className="bg-red-50 text-red-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-times"></i>Annuler
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-shadow hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 ${styles.iconContainer} rounded-xl flex items-center justify-center shrink-0`}
          >
            <i className={`${styles.icon} text-white`}></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {project.title}
            </h3>
            <p className="text-sm text-gray-600">{getSubtitle()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${project.statusBadge}`}
          >
            {project.status}
          </span>
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i className="fas fa-ellipsis-h"></i>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 py-2 animate-in fade-in duration-200">
                <button
                  onClick={onViewDetails}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-eye text-gray-400 w-4"></i>Détails
                </button>
                <button
                  onClick={onEdit}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-edit text-gray-400 w-4"></i>Modifier
                </button>
                <hr className="my-2" />
                <button
                  onClick={onDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-trash text-red-400 w-4"></i>Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progression</span>
          <span className="text-gray-900 font-medium">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`${styles.progressColor} h-3 rounded-full transition-all duration-1000`}
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-500 mb-1">Date de début</p>
          <p className="text-sm font-medium text-gray-900">{project.started}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">
            Statut du projet
          </p>
          <p className="text-sm font-medium text-gray-900">
            {project.status === "completed" ? "Terminé" : 
             project.status === "active" ? "En cours" : 
             project.status === "pending" ? "En attente" : "En cours"}
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

      {/* Actions */}
      <div className="flex items-center gap-3">{renderActions()}</div>
    </div>
  );
}

export default ProjectCard;
