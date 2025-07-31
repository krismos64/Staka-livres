// src/components/RecentActivity.tsx
import React, { useEffect, useState } from "react";
import { useProjects } from "../../hooks/useProjects";
import { useMessages } from "../../hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Activité récente du dashboard client.
 * Affiche les dernières actions basées sur les données réelles.
 */

// Composant Empty State
const EmptyActivityState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <i className="fas fa-bell-slash text-2xl text-gray-400"></i>
    </div>
    <h4 className="text-lg font-medium text-gray-900 mb-2">
      Aucune activité récente
    </h4>
    <p className="text-gray-600 text-sm">
      Vos dernières actions apparaîtront ici
    </p>
  </div>
);

const RecentActivity: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Récupérer les données réelles via les hooks
  const { data: projectsResponse, isLoading: projectsLoading } = useProjects({
    page: 1,
    limit: 10,
    status: 'all'
  });
  
  const { data: messagesResponse, isLoading: messagesLoading } = useMessages({
    page: 1,
    limit: 5
  });

  const projects = projectsResponse?.data || [];
  const messages = messagesResponse?.data || [];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Générer les activités basées sur les données réelles
  const generateActivities = () => {
    const activities: any[] = [];

    // Activités des projets récents
    projects.slice(0, 3).forEach(project => {
      if (project.status === "completed") {
        activities.push({
          color: "green",
          bg: "bg-green-100",
          icon: (
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.707 7.293a1 1 0 00-1.414 0L9 13.586 6.707 11.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" />
            </svg>
          ),
          title: "Correction terminée",
          desc: `"${project.title}" est prêt à télécharger`,
          time: formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: fr }),
          date: new Date(project.updatedAt)
        });
      } else if (project.status === "active") {
        activities.push({
          color: "blue",
          bg: "bg-blue-100",
          icon: (
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
          ),
          title: "Projet en correction",
          desc: `"${project.title}" est en cours de traitement`,
          time: formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: fr }),
          date: new Date(project.updatedAt)
        });
      } else if (project.status === "pending") {
        activities.push({
          color: "yellow",
          bg: "bg-yellow-100",
          icon: (
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2C5.582 2 2 5.582 2 10s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 14c-3.313 0-6-2.687-6-6s2.687-6 6-6 6 2.687 6 6-2.687 6-6 6z" />
            </svg>
          ),
          title: "Projet créé",
          desc: `"${project.title}" a été soumis et attend traitement`,
          time: formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: fr }),
          date: new Date(project.createdAt)
        });
      }
    });

    // Activités des messages récents
    messages.slice(0, 2).forEach(message => {
      activities.push({
        color: "purple",
        bg: "bg-purple-100",
        icon: (
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        ),
        title: message.fromAdmin ? "Message reçu" : "Message envoyé",
        desc: message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content,
        time: formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: fr }),
        date: new Date(message.createdAt)
      });
    });

    // Trier par date décroissante et limiter à 4 activités
    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 4);
  };

  const currentActivities = (projectsLoading || messagesLoading) ? [] : generateActivities();

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full
      hover:shadow-lg transition-shadow duration-300"
    >
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Activité récente
          {currentActivities.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({currentActivities.length})
            </span>
          )}
        </h3>
        {currentActivities.length > 0 && (
          <button
            className="text-blue-600 hover:text-blue-700 text-sm font-medium
            transition-colors duration-200 hover:underline"
          >
            Voir tout →
          </button>
        )}
      </div>

      <div className="p-6">
        {projectsLoading || messagesLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des activités...</p>
          </div>
        ) : currentActivities.length > 0 ? (
          <div className="space-y-6">
            {currentActivities.map((activity, index) => (
              <div
                key={index}
                className={`flex items-start gap-4 group cursor-pointer
                  transition-all duration-500 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg
                  ${
                    isVisible
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-4"
                  }`}
                style={{
                  transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
                }}
              >
                <div className="relative mt-1">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 ${activity.bg} 
                      rounded-full transition-all duration-300 group-hover:scale-110
                      group-hover:shadow-lg`}
                  >
                    {activity.icon}
                  </span>
                  {/* Indicateur de nouveauté pour les activités récentes */}
                  {index === 0 && (
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 
                      rounded-full animate-pulse"
                    ></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium text-gray-900 group-hover:text-blue-900
                    transition-colors duration-200"
                  >
                    {activity.title}
                  </div>
                  <div className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {activity.desc}
                  </div>
                  <div className="flex items-center text-xs text-gray-400 mt-2">
                    <i className="fas fa-clock mr-1"></i>
                    {activity.time}
                  </div>
                </div>

                {/* Chevron pour indiquer l'interactivité */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyActivityState />
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
