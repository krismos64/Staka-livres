import React from "react";
import { useAdminStats } from "../../hooks/useAdminStats";

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 0
  });
};

const formatEvolution = (evolution: number): string => {
  const sign = evolution >= 0 ? '+' : '';
  return `${sign}${evolution.toFixed(1)}%`;
};

const getEvolutionColor = (evolution: number): string => {
  if (evolution > 0) return 'text-green-600';
  if (evolution < 0) return 'text-red-600';
  return 'text-gray-600';
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  evolution?: number;
  icon: string;
  iconColor: string;
  subtitle?: string;
}> = ({ title, value, evolution, icon, iconColor, subtitle }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mb-2">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {evolution !== undefined && (
          <p className={`text-sm font-medium ${getEvolutionColor(evolution)}`}>
            {formatEvolution(evolution)} vs mois précédent
          </p>
        )}
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <i className={`${icon} text-xl`}></i>
      </div>
    </div>
  </div>
);

const AdminStatistiques: React.FC = () => {
  const { data: stats, isLoading, error, refetch } = useAdminStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
          <p className="text-gray-600 text-lg">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">
            Impossible de charger les statistiques
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-redo mr-2"></i>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <i className="fas fa-chart-line mr-3 text-blue-600"></i>
              Statistiques
            </h1>
            <p className="text-gray-600">
              Vue d'ensemble des performances - {stats.resumeMois.periode}
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Résumé du mois */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 mb-8 text-white">
        <h2 className="text-xl font-semibold mb-4">Résumé - {stats.resumeMois.periode}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-blue-100 text-sm font-medium mb-1">Chiffre d'affaires</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.resumeMois.totalCA)}</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm font-medium mb-1">Commandes</p>
            <p className="text-2xl font-bold">{stats.resumeMois.totalCommandes}</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm font-medium mb-1">Nouveaux clients</p>
            <p className="text-2xl font-bold">{stats.resumeMois.totalClients}</p>
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(stats.chiffreAffairesMois)}
          evolution={stats.evolutionCA}
          icon="fas fa-euro-sign"
          iconColor="bg-green-100 text-green-600"
        />
        
        <StatCard
          title="Nouvelles commandes"
          value={stats.nouvellesCommandesMois}
          evolution={stats.evolutionCommandes}
          icon="fas fa-shopping-cart"
          iconColor="bg-blue-100 text-blue-600"
        />
        
        <StatCard
          title="Nouveaux clients"
          value={stats.nouveauxClientsMois}
          evolution={stats.evolutionClients}
          icon="fas fa-users"
          iconColor="bg-purple-100 text-purple-600"
        />
        
        <StatCard
          title="Satisfaction"
          value={`${stats.satisfactionMoyenne}/5`}
          icon="fas fa-star"
          iconColor="bg-yellow-100 text-yellow-600"
          subtitle={`${stats.nombreAvisTotal} avis clients`}
        />
      </div>

      {/* Derniers paiements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <i className="fas fa-credit-card mr-2 text-green-600"></i>
          Derniers paiements
        </h3>
        
        {stats.derniersPaiements.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-receipt text-gray-300 text-4xl mb-4"></i>
            <p className="text-gray-500 text-lg">Aucun paiement récent</p>
            <p className="text-gray-400">Les paiements apparaîtront ici</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Projet</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Montant</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.derniersPaiements.map((paiement, index) => (
                  <tr key={paiement.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{paiement.clientNom}</p>
                        <p className="text-sm text-gray-500">{paiement.clientEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900 truncate max-w-xs">{paiement.projetTitre}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(paiement.montant)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-600 text-sm">
                        {new Date(paiement.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStatistiques;