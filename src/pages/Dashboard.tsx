import React, { useEffect, useState } from "react";
import ProjectCard from "../components/project/ProjectCard";
import RecentActivity from "../components/RecentActivity"; // Composant activité récente
import { Project } from "./ProjectsPage";

/**
 * Composant Dashboard principal.
 * Affiche l'accueil client : statistiques, projets en cours et activité récente.
 */
const Dashboard: React.FC = () => {
  // State pour gérer l'animation d'apparition
  const [isVisible, setIsVisible] = useState(false);

  // Déclenche l'animation au montage
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Projets en cours adaptés pour ProjectCard
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

  // Statistiques principales
  const stats = [
    {
      label: "Projets actifs",
      value: 3,
      icon: "fas fa-folder-open text-blue-600",
      iconBg: "bg-blue-100",
      change: "+1 ce mois",
      changeColor: "text-green-600",
    },
    {
      label: "Projets terminés",
      value: 12,
      icon: "fas fa-check-circle text-green-600",
      iconBg: "bg-green-100",
      change: "+3 ce mois",
      changeColor: "text-green-600",
    },
    {
      label: "Messages non lus",
      value: 2,
      icon: "fas fa-envelope text-yellow-600",
      iconBg: "bg-yellow-100",
      change: "Nouveau",
      changeColor: "text-blue-600",
    },
    {
      label: "Satisfaction",
      value: "4.9/5",
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

  // Fonction utilitaire pour générer la couleur du badge statut
  const getStatusColor = (statusColor: string) => {
    switch (statusColor) {
      case "green":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          progress: "bg-green-500",
        };
      case "blue":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          progress: "bg-blue-500",
        };
      case "yellow":
      default:
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          progress: "bg-gray-400",
        };
    }
  };

  // Gestionnaires d'événements pour les projets
  const handleProjectClick = (projectId: number) => {
    console.log(`Clic sur projet ${projectId}`);
    // TODO: Navigation vers la page projet
  };

  const handleProjectAction = (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Action sur projet ${projectId}`);
    // TODO: Téléchargement ou autre action
  };

  // Composant Empty State pour les projets
  const EmptyProjectsState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i className="fas fa-folder-plus text-2xl text-gray-400"></i>
      </div>
      <h4 className="text-lg font-medium text-gray-900 mb-2">
        Aucun projet en cours
      </h4>
      <p className="text-gray-600 mb-4">
        Commencez votre premier projet de correction
      </p>
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
        Nouveau projet
      </button>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header d'accueil avec animation */}
      <div
        className={`mb-8 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bonjour Marie ! 👋
        </h2>
        <p className="text-gray-600">Voici un aperçu de vos projets en cours</p>
      </div>

      {/* Statistiques principales avec animation staggered */}
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
            style={{
              transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div
                className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center
                  transition-transform duration-300 hover:scale-110`}
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

      {/* Grille principale avec deux colonnes */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Projets en cours */}
        <div
          className={`bg-white rounded-2xl shadow-sm border border-gray-100
            transition-all duration-700 hover:shadow-lg
            ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          style={{ transitionDelay: isVisible ? "400ms" : "0ms" }}
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Projets en cours
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({projects.length})
              </span>
            </h3>
            <button
              className="text-blue-600 hover:text-blue-700 text-sm font-medium
              transition-colors duration-200 hover:underline"
            >
              Voir tout →
            </button>
          </div>
          <div className="p-6">
            {projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project, index) => {
                  const color = getStatusColor(
                    project.statusBadge.split(" ")[1]
                  );
                  return (
                    <div
                      key={project.id}
                      className={`transition-all duration-500 ${
                        isVisible
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 translate-x-4"
                      }`}
                      style={{
                        transitionDelay: isVisible
                          ? `${600 + index * 150}ms`
                          : "0ms",
                      }}
                    >
                      <ProjectCard
                        project={project}
                        onViewDetails={() => handleProjectClick(project.id)}
                        onDownload={() =>
                          console.log("Download project", project.id)
                        }
                        onRate={() => console.log("Rate project", project.id)}
                        onEdit={() => console.log("Edit project", project.id)}
                        onDelete={() =>
                          console.log("Delete project", project.id)
                        }
                        onContact={() =>
                          console.log("Contact corrector", project.id)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyProjectsState />
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
    </div>
  );
};

export default Dashboard;
