import React from "react";
import ProjectCard from "./ProjectCard";
import RecentActivity from "./RecentActivity"; // Composant activité récente

/**
 * Composant Dashboard principal.
 * Affiche l'accueil client : statistiques, projets en cours et activité récente.
 */
const Dashboard: React.FC = () => {
  // Projets en cours (exemple statique fidèle à la maquette)
  const projects = [
    {
      id: 1,
      title: "L'Écho du Temps",
      type: "Roman • 280 pages",
      status: "Correction terminée",
      statusColor: "green",
      progress: 100,
      delivery: "Livré le 15 Jan 2025",
      download: true,
    },
    {
      id: 2,
      title: "Mémoires d'une Vie",
      type: "Biographie • 180 pages",
      status: "En correction",
      statusColor: "blue",
      progress: 65,
      delivery: "Livraison prévue: 20 Jan 2025",
      download: false,
    },
    {
      id: 3,
      title: "Nouvelles du Cœur",
      type: "Recueil • 120 pages",
      status: "En attente",
      statusColor: "yellow",
      progress: 0,
      delivery: "Début prévu: 25 Jan 2025",
      download: false,
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

  return (
    <div id="dashboard-section" className="animate-fade-in">
      {/* Header d'accueil */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bonjour Marie ! 👋
        </h2>
        <p className="text-gray-600">Voici un aperçu de vos projets en cours</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div
                className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Projets en cours
            </h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Voir tout →
            </button>
          </div>
          <div className="p-6 space-y-4">
            {projects.map((project) => {
              const color = getStatusColor(project.statusColor);
              return (
                <ProjectCard
                  key={project.id}
                  title={project.title}
                  description={project.type}
                  status={project.status}
                  statusColor={color.bg}
                  statusTextColor={color.text}
                  progress={project.progress}
                  progressColor={
                    project.progress === 100
                      ? "bg-green-500"
                      : project.progress === 0
                      ? "bg-gray-400"
                      : color.progress
                  }
                  deliveryInfo={project.delivery}
                  actionText={
                    project.download ? "Télécharger →" : "Voir détails →"
                  }
                  // onCardClick / onActionClick à ajouter si besoin
                />
              );
            })}
          </div>
        </div>
        {/* Activité récente */}
        <RecentActivity />
      </div>
    </div>
  );
};

export default Dashboard;
