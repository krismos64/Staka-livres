import React, { useCallback, useMemo, useState } from "react";
import DeleteProjectModal from "../components/modals/DeleteProjectModal";
import EditProjectModal from "../components/modals/EditProjectModal";
import ProjectDetailsModal from "../components/modals/ProjectDetailsModal";
import RateProjectModal from "../components/modals/RateProjectModal";
import ProjectCard from "../components/project/ProjectCard";

// Types
type ProjectStatus = "Terminé" | "En correction" | "En attente";
type ProjectPack = "Pack Intégral" | "Pack Correction" | "Pack KDP";
type FilterType = "all" | "active" | "completed" | "pending";

// Types pour les notifications
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

export interface Project {
  id: number;
  title: string;
  type: string;
  pages: number;
  started: string;
  delivery: string;
  corrector: string;
  pack: ProjectPack;
  status: ProjectStatus;
  statusBadge: string;
  progress: number;
  rating?: number;
  canDownload?: boolean;
  description?: string;
}

interface ProjectsPageProps {
  onNewProjectClick: () => void;
}

// Mock data - reproduced from HTML mockup
const projects: Project[] = [
  {
    id: 1,
    title: "L'Écho du Temps",
    type: "Roman",
    pages: 280,
    started: "5 Jan 2025",
    delivery: "15 Jan 2025",
    corrector: "Sarah Martin",
    pack: "Pack Intégral",
    status: "Terminé",
    statusBadge: "bg-green-100 text-green-800",
    progress: 100,
    rating: 5,
    canDownload: true,
    description:
      "Roman contemporain explorant les thèmes du temps et de la mémoire.",
  },
  {
    id: 2,
    title: "Mémoires d'une Vie",
    type: "Biographie",
    pages: 180,
    started: "10 Jan 2025",
    delivery: "20 Jan 2025",
    corrector: "Marc Dubois",
    pack: "Pack Correction",
    status: "En correction",
    statusBadge: "bg-blue-100 text-blue-800",
    progress: 65,
    description: "Biographie personnelle retraçant 60 années d'expériences.",
  },
  {
    id: 3,
    title: "Nouvelles du Cœur",
    type: "Recueil",
    pages: 120,
    started: "25 Jan 2025",
    delivery: "5 Fév 2025",
    corrector: "Non assigné",
    pack: "Pack KDP",
    status: "En attente",
    statusBadge: "bg-yellow-100 text-yellow-800",
    progress: 0,
    description: "Recueil de nouvelles romantiques et émouvantes.",
  },
];

// Filter configuration with counts
const filterConfig = [
  {
    key: "all" as FilterType,
    label: "Tous les projets",
    count: projects.length,
  },
  {
    key: "active" as FilterType,
    label: "En cours",
    count: projects.filter((p) => p.status === "En correction").length,
  },
  {
    key: "completed" as FilterType,
    label: "Terminés",
    count: projects.filter((p) => p.status === "Terminé").length,
  },
  {
    key: "pending" as FilterType,
    label: "En attente",
    count: projects.filter((p) => p.status === "En attente").length,
  },
];

// ----------- Toast Component -----------
interface ToastComponentProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastComponent({ toast, onClose }: ToastComponentProps) {
  const toastIcons = {
    success: "fa-check-circle text-green-500",
    error: "fa-times-circle text-red-500",
    warning: "fa-exclamation-triangle text-yellow-500",
    info: "fa-info-circle text-blue-500",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-80 animate-slide-in">
      <div className="flex items-center gap-3">
        <i className={`fas ${toastIcons[toast.type]} text-xl`}></i>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{toast.title}</h4>
          <p className="text-sm text-gray-600">{toast.message}</p>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="text-gray-400 hover:text-gray-600 transition"
          aria-label="Fermer la notification"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}

function ProjectsPage({ onNewProjectClick }: ProjectsPageProps) {
  // State management for filters and modals
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast management
  const showToast = useCallback(
    (type: ToastType, title: string, message: string) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { id, type, title, message };
      setToasts((prev) => [...prev, newToast]);

      // Auto-suppression après 5 secondes
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Filter projects based on active filter
  const filteredProjects = useMemo(() => {
    switch (activeFilter) {
      case "active":
        return projects.filter((p) => p.status === "En correction");
      case "completed":
        return projects.filter((p) => p.status === "Terminé");
      case "pending":
        return projects.filter((p) => p.status === "En attente");
      default:
        return projects;
    }
  }, [activeFilter]);

  // Action handlers for project cards
  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  const handleDownload = (project: Project) => {
    // Simulate download
    showToast(
      "success",
      "Téléchargement",
      `Téléchargement de "${project.title}" en cours...`
    );
  };

  const handleRate = (project: Project) => {
    setSelectedProject(project);
    setIsRateModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteModalOpen(true);
  };

  const handleContact = (project: Project) => {
    showToast(
      "info",
      "Contact",
      `Redirection vers la messagerie avec ${project.corrector}...`
    );
  };

  // Modal close handlers
  const closeAllModals = () => {
    setIsDetailsModalOpen(false);
    setIsRateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedProject(null);
  };

  // Empty state component
  const EmptyState = ({ filter }: { filter: FilterType }) => {
    const emptyMessages = {
      all: {
        title: "Aucun projet pour le moment",
        description: "Commencez par créer votre premier projet de correction",
        icon: "fas fa-folder-open",
      },
      active: {
        title: "Aucun projet en cours",
        description: "Tous vos projets sont terminés ou en attente",
        icon: "fas fa-sync",
      },
      completed: {
        title: "Aucun projet terminé",
        description: "Vos projets terminés apparaîtront ici",
        icon: "fas fa-check-circle",
      },
      pending: {
        title: "Aucun projet en attente",
        description: "Vos nouveaux projets apparaîtront ici",
        icon: "fas fa-clock",
      },
    };

    const config = emptyMessages[filter];

    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className={`${config.icon} text-gray-400 text-2xl`}></i>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {config.title}
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {config.description}
        </p>
        {filter === "all" && (
          <button
            onClick={onNewProjectClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-sm transition"
          >
            <i className="fas fa-plus mr-2"></i>
            Créer mon premier projet
          </button>
        )}
      </div>
    );
  };

  return (
    <section className="max-w-7xl mx-auto py-2 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Mes projets
            </h2>
            <p className="text-gray-600">
              Gérez tous vos projets de correction et d'édition
            </p>
          </div>
          <button
            onClick={onNewProjectClick}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            <i className="fas fa-plus mr-2"></i>Nouveau projet
          </button>
        </div>
      </div>

      {/* Projects Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {filterConfig.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeFilter === filter.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeFilter === filter.key
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <EmptyState filter={activeFilter} />
      ) : (
        <div className="space-y-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewDetails={() => handleViewDetails(project)}
              onDownload={() => handleDownload(project)}
              onRate={() => handleRate(project)}
              onEdit={() => handleEdit(project)}
              onDelete={() => handleDelete(project)}
              onContact={() => handleContact(project)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedProject && (
        <ProjectDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={closeAllModals}
          project={selectedProject}
        />
      )}

      {selectedProject && (
        <RateProjectModal
          isOpen={isRateModalOpen}
          onClose={closeAllModals}
          project={selectedProject}
          onSubmit={(rating, feedback) => {
            showToast("success", "Évaluation", "Merci pour votre évaluation !");
            closeAllModals();
          }}
        />
      )}

      {selectedProject && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={closeAllModals}
          project={selectedProject}
          onSave={(updatedProject) => {
            showToast(
              "success",
              "Modification",
              "Votre projet a été mis à jour !"
            );
            closeAllModals();
          }}
        />
      )}

      {selectedProject && (
        <DeleteProjectModal
          isOpen={isDeleteModalOpen}
          onClose={closeAllModals}
          project={selectedProject}
          onConfirm={() => {
            showToast(
              "success",
              "Suppression",
              "Le projet a été supprimé avec succès."
            );
            closeAllModals();
          }}
        />
      )}

      {/* Container des toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </section>
  );
}

export default ProjectsPage;
