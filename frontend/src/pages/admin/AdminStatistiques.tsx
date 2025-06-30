import React, { useEffect, useState } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { StatistiquesAvancees } from "../../types/shared";
import { MockDataService } from "../../utils/mockData";
import { useToasts } from "../../utils/toast";

const AdminStatistiques: React.FC = () => {
  const [stats, setStats] = useState<StatistiquesAvancees | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToasts();

  const loadStatistiques = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Utilisation des données mockées existantes
      const response = await MockDataService.getStatistiquesAvancees();
      setStats(response);

      showToast("success", "Statistiques chargées", "Données mises à jour");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de chargement des statistiques";
      setError(errorMessage);
      showToast("error", "Erreur", errorMessage);
      console.error("Erreur chargement statistiques:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatistiques();
  }, []);

  const handleExportData = async () => {
    try {
      setIsExporting(true);

      // Simulation d'export pour l'instant
      await new Promise((resolve) => setTimeout(resolve, 1500));

      showToast("success", "Export réussi", "Données exportées en CSV");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur d'export";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    loadStatistiques();
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">
          Chargement des statistiques...
        </span>
      </div>
    );
  }

  if (error && !stats) {
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

  if (!stats) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Actions */}
      <div className="flex justify-end items-center space-x-3">
        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
        >
          {isExporting ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <>
              <i className="fas fa-download mr-2"></i>Exporter
            </>
          )}
        </button>

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.chiffreAffaires.toLocaleString()}€
              </p>
              <p className="text-sm text-green-600">
                +{stats.croissanceCA}% vs période précédente
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-euro-sign text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nouvelles commandes</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.nouvellesCommandes}
              </p>
              <p className="text-sm text-blue-600">
                +{stats.croissanceCommandes}% vs période précédente
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-shopping-cart text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nouveaux clients</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.nouveauxClients}
              </p>
              <p className="text-sm text-purple-600">
                +{stats.croissanceClients}% vs période précédente
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux de satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.tauxSatisfaction}%
              </p>
              <p className="text-sm text-yellow-600">
                {stats.nombreAvis} avis clients
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-star text-yellow-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques mockés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique revenus */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Évolution du chiffre d'affaires
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-chart-line text-gray-400 text-4xl mb-2"></i>
              <p className="text-gray-500">Graphique du chiffre d'affaires</p>
              <p className="text-sm text-gray-400">
                CA actuel: {stats.chiffreAffaires.toLocaleString()}€ (+
                {stats.croissanceCA}%)
              </p>
            </div>
          </div>
        </div>

        {/* Graphique commandes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Évolution des commandes
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-shopping-cart text-gray-400 text-4xl mb-2"></i>
              <p className="text-gray-500">Graphique des commandes</p>
              <p className="text-sm text-gray-400">
                Nouvelles: {stats.nouvellesCommandes} (+
                {stats.croissanceCommandes}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Répartition par services */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Répartition par type de service
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.repartitionServices.map((service, index) => (
            <div key={index} className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {service.pourcentage}%
                  </div>
                </div>
              </div>
              <h4 className="font-semibold text-gray-900">{service.type}</h4>
              <p className="text-sm text-gray-600">
                {service.commandes} commandes
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top clients et métriques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clients */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 clients
          </h3>
          <div className="space-y-3">
            {stats.topClients.map((client, index) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {client.nom.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{client.nom}</p>
                    <p className="text-sm text-gray-600">
                      {client.commandes} commandes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {client.chiffreAffaires.toLocaleString()}€
                  </p>
                  <p className="text-sm text-gray-600">CA total</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Métriques de performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Métriques de performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Temps de traitement moyen</span>
              <span className="font-semibold text-gray-900">
                {stats.tempsTraitementMoyen}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Taux de réussite</span>
              <span className="font-semibold text-green-600">
                {stats.tauxReussite}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Panier moyen</span>
              <span className="font-semibold text-blue-600">
                {stats.panierMoyen.toLocaleString()}€
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Satisfaction client</span>
              <span className="font-semibold text-yellow-600">
                {stats.tauxSatisfaction}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistiques;
