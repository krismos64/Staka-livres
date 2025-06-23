import React, { useMemo, useState } from "react";
import DeleteProjectModal from "../components/DeleteProjectModal";
import EditProjectModal from "../components/EditProjectModal";
import ProjectCard from "../components/ProjectCard";
import ProjectDetailsModal from "../components/ProjectDetailsModal";
import RateProjectModal from "../components/RateProjectModal";
import { showToast } from "../utils/toast";

// Types
type ProjectStatus = "Terminé" | "En correction" | "En attente";
type ProjectPack = "Pack Intégral" | "Pack Correction" | "Pack KDP";
type FilterType = "all" | "active" | "completed" | "pending";

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

function ProjectsPage({ onNewProjectClick }: ProjectsPageProps) {
  // State management for filters and modals
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

    const message = emptyMessages[filter];

    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className={`${message.icon} text-gray-400 text-3xl`}></i>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {message.title}
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {message.description}
        </p>
        <button
          onClick={onNewProjectClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition"
        >
          <i className="fas fa-plus mr-2"></i>
          Créer mon premier projet
        </button>
      </div>
    );
  };

  return (
    <section className="p-6">
      {/* Header - reproduced from HTML mockup */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mes projets</h2>
          <p className="text-gray-600">
            Gérez tous vos projets de correction et d'édition
          </p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl shadow-sm transition"
          onClick={onNewProjectClick}
        >
          <i className="fas fa-plus mr-2"></i>
          Nouveau projet
        </button>
      </div>

      {/* Dynamic Filters - with counts and active state */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filterConfig.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeFilter === filter.key
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
            }`}
          >
            {filter.label}
            {filter.count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === filter.key
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <EmptyState filter={activeFilter} />
      ) : (
        <div className="space-y-6 animate-fade-in">
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

      {/* Modals - rendered conditionally */}
      {selectedProject && isDetailsModalOpen && (
        <ProjectDetailsModal
          project={selectedProject}
          isOpen={isDetailsModalOpen}
          onClose={closeAllModals}
        />
      )}

      {selectedProject && isRateModalOpen && (
        <RateProjectModal
          project={selectedProject}
          isOpen={isRateModalOpen}
          onClose={closeAllModals}
          onSubmit={(rating, feedback) => {
            showToast("success", "Évaluation", "Merci pour votre évaluation !");
            closeAllModals();
          }}
        />
      )}

      {selectedProject && isEditModalOpen && (
        <EditProjectModal
          project={selectedProject}
          isOpen={isEditModalOpen}
          onClose={closeAllModals}
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

      {selectedProject && isDeleteModalOpen && (
        <DeleteProjectModal
          project={selectedProject}
          isOpen={isDeleteModalOpen}
          onClose={closeAllModals}
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
    </section>
  );
}

export default ProjectsPage;
