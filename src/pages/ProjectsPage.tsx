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
    started: "12 Jan 2025", // Changed to 'Créé le' as per mockup logic
    delivery: "25 Jan 2025", // Changed to 'Début prévu'
    corrector: "Non assigné",
    pack: "Pack KDP",
    status: "En attente",
    statusBadge: "bg-yellow-100 text-yellow-800",
    progress: 0,
    description: "Recueil de nouvelles romantiques et émouvantes.",
  },
];

// Filter configuration with counts - adapted from HTML mockup
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

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-80 animate-in slide-in-from-top-5">
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
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Filter projects based on active filter
  const filteredProjects = useMemo(() => {
    if (activeFilter === "all") return projects;
    const statusMap = {
      active: "En correction",
      completed: "Terminé",
      pending: "En attente",
    };
    return projects.filter((p) => p.status === statusMap[activeFilter]);
  }, [activeFilter]);

  // Action handlers for project cards
  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  const handleDownload = (project: Project) => {
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
        description: "Les projets en correction apparaîtront ici.",
        icon: "fas fa-play-circle",
      },
      completed: {
        title: "Aucun projet terminé",
        description: "Vos projets finalisés seront listés ici.",
        icon: "fas fa-check-circle",
      },
      pending: {
        title: "Aucun projet en attente",
        description: "Les projets en attente de validation s'afficheront ici.",
        icon: "fas fa-clock",
      },
    };
    const message = emptyMessages[filter];

    return (
      <div className="text-center bg-gray-50 rounded-2xl p-12">
        <i className={`${message.icon} text-4xl text-gray-400 mb-4`}></i>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {message.title}
        </h3>
        <p className="text-gray-600 mb-6">{message.description}</p>
        <button
          onClick={onNewProjectClick}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          <i className="fas fa-plus mr-2"></i>Nouveau projet
        </button>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Toast container */}
      <div className="fixed top-6 right-6 z-50 space-y-3">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

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
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>Nouveau projet
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {filterConfig.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === key
                    ? "bg-blue-500"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
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
          ))
        ) : (
          <EmptyState filter={activeFilter} />
        )}
      </div>

      {/* Modals */}
      {selectedProject && (
        <>
          <ProjectDetailsModal
            project={selectedProject}
            isOpen={isDetailsModalOpen}
            onClose={closeAllModals}
          />
          <RateProjectModal
            project={selectedProject}
            isOpen={isRateModalOpen}
            onClose={closeAllModals}
            onSubmit={(rating, comments) => {
              console.log("Rating submitted:", { rating, comments });
              showToast(
                "success",
                "Évaluation envoyée",
                "Merci pour votre retour !"
              );
              closeAllModals();
            }}
          />
          <EditProjectModal
            project={selectedProject}
            isOpen={isEditModalOpen}
            onClose={closeAllModals}
            onSave={(updatedProject) => {
              console.log("Project saved:", updatedProject);
              showToast(
                "success",
                "Modifications enregistrées",
                "Votre projet a été mis à jour."
              );
              closeAllModals();
            }}
          />
          <DeleteProjectModal
            project={selectedProject}
            isOpen={isDeleteModalOpen}
            onClose={closeAllModals}
            onConfirm={() => {
              console.log("Project deleted:", selectedProject.title);
              showToast(
                "success",
                "Projet supprimé",
                `Le projet "${selectedProject.title}" a été supprimé.`
              );
              closeAllModals();
            }}
          />
        </>
      )}
    </div>
  );
}

export default ProjectsPage;
