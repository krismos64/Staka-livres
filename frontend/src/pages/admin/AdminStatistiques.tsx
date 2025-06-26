import React, { useEffect, useState } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { StatistiquesAvancees } from "../../types/shared";
import { mockStatistiquesAvancees } from "../../utils/mockData";

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension?: number;
  }>;
}

const AdminStatistiques: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatistiquesAvancees | null>(null);
  const [periode, setPeriode] = useState<"7j" | "30j" | "12m">("30j");

  useEffect(() => {
    const loadStatistiques = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulation d'un appel API
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const statistiques = mockStatistiquesAvancees;
        setStats(statistiques);
      } catch (err) {
        setError("Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };

    loadStatistiques();
  }, [periode]);

  // Données pour le graphique du chiffre d'affaires
  const chiffresAffairesData: ChartData = {
    labels: [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ],
    datasets: [
      {
        label: "Chiffre d'affaires (€)",
        data: [
          12500, 15200, 18900, 16700, 22100, 19800, 24500, 21300, 25800, 23400,
          27200, 29100,
        ],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  };

  // Données pour le graphique des commandes
  const commandesData: ChartData = {
    labels: [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ],
    datasets: [
      {
        label: "Nouvelles commandes",
        data: [45, 52, 68, 59, 78, 71, 85, 76, 92, 84, 96, 103],
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      },
    ],
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Statistiques avancées
          </h1>
          <p className="text-gray-600">Analyses et rapports détaillés</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Statistiques avancées
          </h1>
          <p className="text-gray-600">Analyses et rapports détaillés</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <i className="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const MockChart: React.FC<{
    data: ChartData;
    title: string;
    height?: string;
  }> = ({ data, title, height = "h-64" }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${height}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-end justify-between h-40 border-b border-l border-gray-200 p-4">
        {data.labels.map((label, index) => {
          const value = data.datasets[0].data[index];
          const maxValue = Math.max(...data.datasets[0].data);
          const height = (value / maxValue) * 100;

          return (
            <div
              key={label}
              className="flex flex-col items-center space-y-2 flex-1"
            >
              <div
                className="w-6 rounded-t transition-all duration-500 hover:opacity-80"
                style={{
                  height: `${height}%`,
                  backgroundColor: data.datasets[0].borderColor,
                  minHeight: "4px",
                }}
                title={`${label}: ${value.toLocaleString()}`}
              />
              <span className="text-xs text-gray-500 transform -rotate-45 origin-center whitespace-nowrap">
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-sm text-gray-600">
        <span className="inline-flex items-center">
          <span
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: data.datasets[0].borderColor }}
          />
          {data.datasets[0].label}
        </span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header avec filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Statistiques avancées
          </h1>
          <p className="text-gray-600">Analyses et rapports détaillés</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["7j", "30j", "12m"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periode === p
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {p === "7j"
                ? "7 derniers jours"
                : p === "30j"
                ? "30 derniers jours"
                : "12 derniers mois"}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Chiffre d'affaires</p>
              <p className="text-2xl font-bold">
                {stats.chiffreAffaires.toLocaleString()} €
              </p>
              <p className="text-blue-100 text-sm">
                <span className="text-green-200">↗ +{stats.croissanceCA}%</span>{" "}
                vs période précédente
              </p>
            </div>
            <i className="fas fa-euro-sign text-3xl text-blue-200"></i>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Nouvelles commandes</p>
              <p className="text-2xl font-bold">{stats.nouvellesCommandes}</p>
              <p className="text-green-100 text-sm">
                <span className="text-green-200">
                  ↗ +{stats.croissanceCommandes}%
                </span>{" "}
                vs période précédente
              </p>
            </div>
            <i className="fas fa-shopping-cart text-3xl text-green-200"></i>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Nouveaux clients</p>
              <p className="text-2xl font-bold">{stats.nouveauxClients}</p>
              <p className="text-purple-100 text-sm">
                <span className="text-green-200">
                  ↗ +{stats.croissanceClients}%
                </span>{" "}
                vs période précédente
              </p>
            </div>
            <i className="fas fa-user-plus text-3xl text-purple-200"></i>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Taux de satisfaction</p>
              <p className="text-2xl font-bold">{stats.tauxSatisfaction}%</p>
              <p className="text-orange-100 text-sm">
                Basé sur {stats.nombreAvis} avis clients
              </p>
            </div>
            <i className="fas fa-star text-3xl text-orange-200"></i>
          </div>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MockChart
          data={chiffresAffairesData}
          title="Évolution du chiffre d'affaires"
        />
        <MockChart data={commandesData} title="Évolution des commandes" />
      </div>

      {/* Métriques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par type de service */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition par type de service
          </h3>
          <div className="space-y-4">
            {stats.repartitionServices.map((service, index) => (
              <div
                key={service.type}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: [
                        "#3B82F6",
                        "#10B981",
                        "#F59E0B",
                        "#EF4444",
                        "#8B5CF6",
                      ][index],
                    }}
                  />
                  <span className="text-gray-700">{service.type}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {service.pourcentage}%
                  </span>
                  <div className="text-sm text-gray-500">
                    {service.commandes} commandes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 clients
          </h3>
          <div className="space-y-4">
            {stats.topClients.map((client, index) => (
              <div
                key={client.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {client.nom}
                    </div>
                    <div className="text-sm text-gray-500">
                      {client.commandes} commandes
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {client.chiffreAffaires.toLocaleString()} €
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métriques de performance */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Métriques de performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.tempsTraitementMoyen}
            </div>
            <div className="text-sm text-gray-600">
              Temps de traitement moyen
            </div>
            <div className="text-xs text-green-600 mt-1">
              ↓ -12% vs mois dernier
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.tauxReussite}%
            </div>
            <div className="text-sm text-gray-600">Taux de réussite</div>
            <div className="text-xs text-green-600 mt-1">
              ↑ +2% vs mois dernier
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.panierMoyen.toLocaleString()} €
            </div>
            <div className="text-sm text-gray-600">Panier moyen</div>
            <div className="text-xs text-green-600 mt-1">
              ↑ +8% vs mois dernier
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistiques;
