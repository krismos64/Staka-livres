import React, { useEffect, useState } from "react";
import ProjectDetailsModal from "../components/modals/ProjectDetailsModal";
import RecentActivity from "../components/project/RecentActivity";
import { useAuth } from "../contexts/AuthContext";
import { useProjects, Project } from "../hooks/useProjects";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Récupérer les projets de l'utilisateur via l'API
  const { data: projectsResponse, isLoading, error } = useProjects({
    page: 1,
    limit: 5, // Limiter à 5 projets pour le dashboard
    status: 'all'
  });

  const projects = projectsResponse?.data || [];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);


  // Calculer les statistiques à partir des données réelles
  const activeProjects = projects.filter(p => 
    p.status === "En cours" || p.status === "En correction" || p.status === "En attente"
  ).length;
  
  const completedProjects = projects.filter(p => 
    p.status === "Terminé" || p.status === "Livré"
  ).length;

  const averageRating = projects.filter(p => p.rating).length > 0 
    ? (projects.filter(p => p.rating).reduce((sum, p) => sum + (p.rating || 0), 0) / 
       projects.filter(p => p.rating).length).toFixed(1)
    : "N/A";

  // Statistiques principales calculées dynamiquement
  const stats = [
    {
      label: "Projets actifs",
      value: activeProjects,
      icon: "fas fa-folder-open text-blue-600",
      iconBg: "bg-blue-100",
      change: isLoading ? "..." : `${activeProjects} en cours`,
      changeColor: "text-blue-600",
    },
    {
      label: "Projets terminés",
      value: completedProjects,
      icon: "fas fa-check-circle text-green-600",
      iconBg: "bg-green-100",
      change: isLoading ? "..." : `${completedProjects} terminés`,
      changeColor: "text-green-600",
    },
    {
      label: "Messages non lus",
      value: isLoading ? "..." : 0, // TODO: intégrer avec useMessages
      icon: "fas fa-envelope text-yellow-600",
      iconBg: "bg-yellow-100",
      change: "À consulter",
      changeColor: "text-blue-600",
    },
    {
      label: "Satisfaction",
      value: averageRating === "N/A" ? "N/A" : `${averageRating}/5`,
      icon: "fas fa-star text-purple-600",
      iconBg: "bg-purple-100",
      change: (
        <div className="flex text-yellow-400">
          <i className="fas fa-star text-xs"></i>
          <i className="fas fa-star text-xs"></i>
          <i className="fas fa-star text-xs"></i>
          <i className="fas fa-star text-xs"></i>
          <i className="fas fa-star text-xs"></i>
        </div>
      ),
      changeColor: "",
    },
  ];

  // Gestionnaires de modal
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // Composant carte projet style maquette HTML exact
  const ProjectCard = ({ project }: { project: Project }) => {
    const getStatusColor = () => {
      switch (project.status) {
        case "Terminé":
          return "bg-green-500";
        case "En correction":
          return "bg-blue-500";
        case "En attente":
          return "bg-gray-400";
        default:
          return "bg-gray-400";
      }
    };

    const getButtonText = () => {
      switch (project.status) {
        case "Terminé":
          return "Télécharger →";
        case "En correction":
          return "Voir détails →";
        case "En attente":
          return "Préparer →";
        default:
          return "Voir détails →";
      }
    };

    const getDeliveryText = () => {
      switch (project.status) {
        case "Terminé":
          return `Livré le ${project.delivery}`;
        case "En correction":
          return `Livraison prévue: ${project.delivery}`;
        case "En attente":
          return `Début prévu: ${project.started}`;
        default:
          return `Livraison prévue: ${project.delivery}`;
      }
    };

    const getStatusText = () => {
      switch (project.status) {
        case "Terminé":
          return "Correction terminée";
        case "En correction":
          return "En correction";
        case "En attente":
          return "En attente";
        default:
          return project.status;
      }
    };

    return (
      <div
        className="project-card p-4 border border-gray-200 rounded-xl hover:border-blue-200 transition cursor-pointer"
        onClick={() => handleProjectClick(project)}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-gray-900">{project.title}</h4>
            <p className="text-sm text-gray-600">
              {project.type} • {project.pages} pages
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${project.statusBadge}`}
          >
            {getStatusText()}
          </span>
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progression</span>
            <span className="text-gray-900 font-medium">
              {project.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full progress-bar ${getStatusColor()}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{getDeliveryText()}</span>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            {getButtonText()}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header d'accueil */}
      <div
        className={`mb-8 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bonjour {user?.prenom || "Utilisateur"} ! 👋
        </h2>
        <p className="text-gray-600">Voici un aperçu de vos projets en cours</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100
              hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer
              ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            style={{ transitionDelay: isVisible ? `${index * 100}ms` : "0ms" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div
                className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110`}
              >
                <i className={stat.icon}></i>
              </div>
            </div>
            <div className="mt-4">
              {typeof stat.change === "string" ? (
                <span className={`${stat.changeColor} text-sm font-medium`}>
                  {stat.change}
                </span>
              ) : (
                stat.change
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Contenu principal avec deux colonnes */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Projets en cours - Style exact de la maquette */}
        <div
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-700 hover:shadow-lg ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          }`}
          style={{ transitionDelay: isVisible ? "400ms" : "0ms" }}
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Projets en cours
              </h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Voir tout →
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Chargement de vos projets...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">Erreur lors du chargement des projets</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun projet en cours</p>
                <p className="text-sm text-gray-400 mt-2">Créez votre premier projet pour commencer</p>
              </div>
            ) : (
              projects.map((project, index) => (
                <div
                  key={project.id}
                  className={`transition-all duration-500 ${
                    isVisible
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-4"
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${600 + index * 150}ms` : "0ms",
                  }}
                >
                  <ProjectCard project={project} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activité récente */}
        <div
          className={`transition-all duration-700 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          }`}
          style={{ transitionDelay: isVisible ? "500ms" : "0ms" }}
        >
          <RecentActivity />
        </div>
      </div>

      {/* Modal de détails de projet */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Dashboard;
