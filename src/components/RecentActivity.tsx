// src/components/RecentActivity.tsx
import React from "react";

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
      // Upload (ici pour l’exemple, on peut mettre un icône upload générique)
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

const RecentActivity: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">
      Activité récente
    </h3>
    <div className="space-y-6">
      {activities.map((a, idx) => (
        <div className="flex items-start gap-4" key={idx}>
          <div className="mt-1">
            <span
              className={`inline-flex items-center justify-center w-7 h-7 ${a.bg} rounded-full`}
            >
              {a.icon}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{a.title}</div>
            <div className="text-gray-600 text-sm">{a.desc}</div>
            <div className="text-xs text-gray-400 mt-1">{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default RecentActivity;
