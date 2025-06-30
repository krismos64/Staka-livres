import React, { useEffect, useState } from "react";
import StatCard from "../../components/admin/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { CommandeStats, FactureStats, UserStats } from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";
import { useToasts } from "../../utils/toast";

const AdminDashboard: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [commandeStats, setCommandeStats] = useState<CommandeStats | null>(
    null
  );
  const [factureStats, setFactureStats] = useState<FactureStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToasts();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Charger les stats depuis l'API
        const dashboardData = await adminAPI.getDashboardStats();

        setUserStats(dashboardData.userStats);
        setCommandeStats(dashboardData.commandeStats);
        setFactureStats(dashboardData.factureStats);

        showToast(
          "success",
          "Données chargées",
          "Dashboard mis à jour avec succès"
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur de chargement des données";
        setError(errorMessage);
        showToast("error", "Erreur", errorMessage);
        console.error("Erreur chargement dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [showToast]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const dashboardData = await adminAPI.getDashboardStats();
      setUserStats(dashboardData.userStats);
      setCommandeStats(dashboardData.commandeStats);
      setFactureStats(dashboardData.factureStats);
      showToast("success", "Actualisé", "Données mises à jour");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de rafraîchissement";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !userStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Chargement du dashboard...</span>
      </div>
    );
  }

  if (error && !userStats) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <i className="fas fa-chart-line text-5xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            "Actualiser"
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userStats && (
          <StatCard
            title="Utilisateurs"
            value={userStats.total}
            icon="fas fa-users"
            color="from-blue-500 to-cyan-400"
            trend={`${userStats.actifs} actifs, +${userStats.recents} ce mois`}
          />
        )}

        {commandeStats && (
          <StatCard
            title="Commandes"
            value={commandeStats.total}
            icon="fas fa-file-alt"
            color="from-green-500 to-teal-400"
            trend={`${commandeStats.tauxCompletion}% terminées, ${commandeStats.enCours} en cours`}
          />
        )}

        {factureStats && (
          <StatCard
            title="Chiffre d'Affaires"
            value={factureStats.montantTotalFormate}
            icon="fas fa-euro-sign"
            color="from-purple-500 to-pink-500"
            trend={`${factureStats.montantMensuelFormate} ce mois, ${factureStats.payees} payées`}
          />
        )}

        <StatCard
          title="Croissance"
          value="12.5%"
          icon="fas fa-chart-line"
          color="from-yellow-500 to-orange-400"
          trend="+2.3% vs mois dernier"
        />
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Activité Récente
        </h2>

        <div className="space-y-4">
          {commandeStats && commandeStats.enAttente > 0 && (
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">
                  Commandes en attente
                </h3>
                <p className="text-sm text-gray-600">
                  {commandeStats.enAttente} commandes nécessitent votre
                  attention
                </p>
              </div>
              <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-medium">
                Action requise
              </span>
            </div>
          )}

          {userStats && userStats.recents > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">
                  Nouveaux utilisateurs
                </h3>
                <p className="text-sm text-gray-600">
                  {userStats.recents} nouveaux utilisateurs ce mois
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
                +{userStats.recents}
              </span>
            </div>
          )}

          {factureStats && factureStats.enAttente > 0 && (
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">
                  Factures en attente
                </h3>
                <p className="text-sm text-gray-600">
                  {factureStats.enAttente} factures en attente de paiement
                </p>
              </div>
              <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                À suivre
              </span>
            </div>
          )}
        </div>

        {!commandeStats?.enAttente &&
          !userStats?.recents &&
          !factureStats?.enAttente && (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-chart-line text-4xl mb-2"></i>
              <p>Aucune activité récente à signaler</p>
            </div>
          )}
      </div>

      {/* Résumé des actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Actions rapides</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
              Voir les commandes en attente
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
              Gérer les utilisateurs
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
              Consulter les factures
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Performance</h3>
          {commandeStats && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taux de completion</span>
                <span className="font-medium">
                  {commandeStats.tauxCompletion}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${commandeStats.tauxCompletion}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Support</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
              Centre d'aide
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
              Logs système
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
              Rapports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
