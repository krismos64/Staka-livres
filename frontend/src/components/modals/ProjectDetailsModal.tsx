import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Project } from "../../hooks/useProjects";
import ContactModal from "./ContactModal";
import ProjectFilesModal from "./ProjectFilesModal";

interface ProjectDetailsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de détails du projet - reproduit le design de la maquette HTML
 * Affiche toutes les informations complètes du projet avec un design professionnel
 */
function ProjectDetailsModal({
  project,
  isOpen,
  onClose,
}: ProjectDetailsModalProps) {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);

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
      document.body.style.overflow = "hidden"; // Prevent background scroll
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  // Calcul des statuts et couleurs
  const getStatusColor = () => {
    switch (project.status) {
      case "Terminé":
        return "bg-green-100 text-green-800";
      case "En correction":
        return "bg-blue-100 text-blue-800";
      case "En attente":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressColor = () => {
    if (project.progress === 100) return "bg-green-500";
    if (project.progress === 0) return "bg-gray-400";
    return "bg-blue-500";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-book text-white"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {project.type} {project.pages ? `• ${project.pages} pages` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fermer"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Project Info */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-info-circle text-blue-600"></i>
                  Informations du projet
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium text-gray-900">
                      {project.type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nombre de pages</span>
                    <span className="font-medium text-gray-900">
                      {project.pages || 'Non spécifié'} {project.pages ? 'pages' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Statut</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pack</span>
                    <span className="font-medium text-gray-900">
                      {project.pack}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-line text-green-600"></i>
                  Progression
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Avancement</span>
                      <span className="font-bold text-gray-900">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ${getProgressColor()}`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 block">Début</span>
                      <div className="font-medium text-gray-900">
                        {new Date(project.startedAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Statut</span>
                      <div className="font-medium text-gray-900">
                        {project.status === "completed" ? "Terminé" : 
                         project.status === "active" ? "En cours" : 
                         project.status === "pending" ? "En attente" : "En cours"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Description & Actions */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-align-left text-purple-600"></i>
                  Description
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed">
                    {"Projet de " + project.type.toLowerCase() + (project.pages ? ` de ${project.pages} pages` : '') + "."}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-tasks text-orange-600"></i>
                  Actions
                </h4>
                <div className="space-y-3">
                  {project.status === "Terminé" && project.canDownload ? (
                    <button 
                      onClick={() => setIsFilesModalOpen(true)}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-download"></i>
                      Télécharger les fichiers
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        onClose();
                        navigate('/app/messages');
                      }}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-comment"></i>
                      Contacter l'équipe
                    </button>
                  )}

                  <button 
                    onClick={() => setIsFilesModalOpen(true)}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-folder"></i>
                    Voir les fichiers
                  </button>

                  {project.status === "Terminé" && (
                    <button className="w-full bg-yellow-100 text-yellow-800 py-3 px-4 rounded-xl font-medium hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2">
                      <i className="fas fa-star"></i>
                      Noter ce projet
                    </button>
                  )}
                </div>
              </div>

              {/* Project Timeline */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-history text-indigo-600"></i>
                  Historique
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Projet créé
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(project.startedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {project.progress > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Correction démarrée
                          </p>
                        </div>
                      </div>
                    )}

                    {project.progress === 100 && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Correction terminée
                          </p>
                          <p className="text-xs text-gray-600">
                            {project.deliveryAt ? new Date(project.deliveryAt).toLocaleDateString('fr-FR') : 'Non définie'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <i className="fas fa-calendar-alt mr-2"></i>
              Créé le: {new Date(project.startedAt).toLocaleDateString('fr-FR')}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Nested Modals */}
      <ContactModal
        project={project}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
      
      <ProjectFilesModal
        project={project}
        isOpen={isFilesModalOpen}
        onClose={() => setIsFilesModalOpen(false)}
      />
    </div>
  );
}

export default ProjectDetailsModal;
