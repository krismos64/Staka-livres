// src/components/RecentActivity.tsx
import React, { useEffect, useState } from "react";

/**
 * Activité récente du dashboard client.
 * Affiche les dernières actions avec couleurs/icônes.
 */
const activities = [
  {
    color: "green",
    bg: "bg-green-100",
    icon: (
      // Check
      <svg
        className="w-4 h-4 text-green-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M16.707 7.293a1 1 0 00-1.414 0L9 13.586 6.707 11.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" />
      </svg>
    ),
    title: "Correction terminée",
    desc: `"L'Écho du Temps" est prêt à télécharger`,
    time: "Il y a 2 heures",
  },
  {
    color: "blue",
    bg: "bg-blue-100",
    icon: (
      // Message
      <svg
        className="w-4 h-4 text-blue-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M18 10c0 3.866-3.134 7-7 7s-7-3.134-7-7 3.134-7 7-7 7 3.134 7 7zM9 13h2v2H9v-2zm0-8h2v6H9V5z" />
      </svg>
    ),
    title: "Nouveau message",
    desc: "Sarah a envoyé une mise à jour",
    time: "Hier à 16:30",
  },
  {
    color: "purple",
    bg: "bg-purple-100",
    icon: (
      // Upload (ici pour l'exemple, on peut mettre un icône upload générique)
      <svg
        className="w-4 h-4 text-purple-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M16.707 7.293a1 1 0 00-1.414 0L9 13.586 6.707 11.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" />
      </svg>
    ),
    title: "Fichier reçu",
    desc: 'Manuscrit "Mémoires d\'une Vie" uploadé',
    time: "Il y a 3 jours",
  },
  {
    color: "yellow",
    bg: "bg-yellow-100",
    icon: (
      // Star
      <svg
        className="w-4 h-4 text-yellow-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 00-.364 1.118l1.286 3.967c.3.921-.755 1.688-1.539 1.118l-3.388-2.46a1 1 0 00-1.175 0l-3.388 2.46c-.783.57-1.838-.197-1.539-1.118l1.286-3.967a1 1 0 00-.364-1.118L2.045 9.394c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.967z" />
      </svg>
    ),
    title: "Évaluation reçue",
    desc: "Vous avez noté notre service 5/5 ⭐",
    time: "Il y a 1 semaine",
  },
];

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

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Pour demo, on peut mettre activities à [] pour tester l'empty state
  const currentActivities = activities; // Changer en [] pour tester l'empty state

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
        {currentActivities.length > 0 ? (
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
