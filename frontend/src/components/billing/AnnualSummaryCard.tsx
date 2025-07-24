import React from "react";
import { AnnualStats } from "../../pages/BillingPage";

interface AnnualSummaryCardProps {
  stats: AnnualStats;
}

// Composant pour afficher le résumé annuel des stats
export function AnnualSummaryCard({ stats }: AnnualSummaryCardProps) {
  // Calculer la progression VIP basée sur les vrais stats
  const VIP_THRESHOLD = 10; // Seuil pour devenir VIP (par exemple 10 projets)
  const vipProgress = Math.min((stats.completedProjects / VIP_THRESHOLD) * 100, 100);
  const projectsUntilVip = Math.max(VIP_THRESHOLD - stats.completedProjects, 0);
  const isVip = stats.completedProjects >= VIP_THRESHOLD;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Résumé annuel
      </h3>

      {/* Statistiques principales */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Projets complétés</span>
          <span className="font-semibold text-gray-900">
            {stats.completedProjects}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Pages corrigées</span>
          <span className="font-semibold text-gray-900">
            {stats.pagesCorrected.toLocaleString("fr-FR")}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total dépensé</span>
          <span className="font-semibold text-gray-900">
            {stats.totalSpent}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Économies réalisées</span>
          <span className="font-semibold text-green-600 flex items-center gap-1">
            <i className="fas fa-arrow-down text-xs"></i>
            {stats.savings}
          </span>
        </div>
      </div>

      {/* Badge VIP avec animation */}
      {stats.vip && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm font-medium">
          <div className="flex items-center gap-2">
            <i className="fas fa-crown text-yellow-500 animate-pulse"></i>
            <span>{stats.vipMessage}</span>
          </div>
        </div>
      )}

      {/* Barre de progression vers le prochain niveau (si pas VIP) */}
      {!stats.vip && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">
              {isVip ? "Statut VIP" : "Progression vers VIP"}
            </span>
            <span className="text-gray-900 font-medium">
              {isVip ? "✨ VIP" : `${Math.round(vipProgress)}%`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${
                isVip 
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600" 
                  : "bg-gradient-to-r from-blue-500 to-purple-500"
              }`}
              style={{ width: `${vipProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isVip 
              ? "Félicitations ! Vous êtes membre VIP" 
              : `Plus que ${projectsUntilVip} projet${projectsUntilVip > 1 ? 's' : ''} pour devenir VIP !`
            }
          </p>
        </div>
      )}

      {/* Actions rapides */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
          onClick={() => console.log("Voir rapport détaillé")}
          aria-label="Voir le rapport annuel détaillé"
        >
          <i className="fas fa-chart-line mr-2"></i>
          Voir rapport détaillé
        </button>
      </div>
    </div>
  );
}
