import React from "react";
import { Commande, StatutCommande } from "../../types/shared";
import LoadingSpinner from "../common/LoadingSpinner";
import CommandeStatusSelect from "./CommandeStatusSelect";

interface CommandeTableProps {
  commandes: Commande[];
  isLoading?: boolean;
  isOperationLoading?: boolean;
  onViewCommande: (commandeId: string) => void;
  onDeleteCommande: (commande: Commande) => void;
  onUpdateStatut: (
    commande: Commande,
    newStatut: StatutCommande,
    noteCorrecteur?: string
  ) => void;
  emptyStateMessage?: string;
  emptyStateIcon?: string;
  showClearFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
  "aria-label"?: string;
}

export const CommandeTable: React.FC<CommandeTableProps> = ({
  commandes,
  isLoading = false,
  isOperationLoading = false,
  onViewCommande,
  onDeleteCommande,
  onUpdateStatut,
  emptyStateMessage = "Aucune commande trouvée",
  emptyStateIcon = "fas fa-inbox",
  showClearFilters = false,
  onClearFilters,
  className = "",
  "aria-label": ariaLabel = "Table des commandes",
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatutBadgeColor = (statut: StatutCommande) => {
    switch (statut) {
      case StatutCommande.EN_ATTENTE:
        return "bg-yellow-100 text-yellow-800";
      case StatutCommande.EN_COURS:
        return "bg-blue-100 text-blue-800";
      case StatutCommande.TERMINE:
        return "bg-green-100 text-green-800";
      case StatutCommande.ANNULEE:
        return "bg-red-100 text-red-800";
      case StatutCommande.SUSPENDUE:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatutLabel = (statut: StatutCommande) => {
    switch (statut) {
      case StatutCommande.EN_ATTENTE:
        return "En attente";
      case StatutCommande.EN_COURS:
        return "En cours";
      case StatutCommande.TERMINE:
        return "Terminée";
      case StatutCommande.ANNULEE:
        return "Annulée";
      case StatutCommande.SUSPENDUE:
        return "Suspendue";
      default:
        return statut;
    }
  };

  // États de chargement
  if (isLoading && commandes.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-8 text-center">
          <LoadingSpinner />
          <p className="mt-2 text-gray-500">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  // État vide
  if (!isLoading && commandes.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-8 text-center">
          <i className={`${emptyStateIcon} text-4xl text-gray-300 mb-4`}></i>
          <h3 className="text-lg font-medium text-gray-900">
            {emptyStateMessage}
          </h3>
          {showClearFilters && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="mt-3 text-blue-600 hover:text-blue-800"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      {/* Vue desktop (tableau) - cachée sur mobile */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            role="table"
            aria-label={ariaLabel}
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commandes.map((commande) => (
                <tr key={commande.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {commande.titre}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {commande.id.slice(0, 8)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {commande.user?.prenom} {commande.user?.nom}
                    </div>
                    <div className="text-sm text-gray-500">
                      {commande.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CommandeStatusSelect
                      currentStatus={commande.statut}
                      onStatusChange={(newStatut) =>
                        onUpdateStatut(commande, newStatut)
                      }
                      disabled={isOperationLoading}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(commande.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onViewCommande(commande.id)}
                        disabled={isOperationLoading}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 p-2 rounded-md hover:bg-blue-50"
                        title="Voir les détails"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        onClick={() => onDeleteCommande(commande)}
                        disabled={isOperationLoading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 p-2 rounded-md hover:bg-red-50"
                        title="Supprimer"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vue mobile/tablette (cartes) - affichée sur petit écran */}
      <div className="lg:hidden">
        <div className="p-4 space-y-4">
          {commandes.map((commande) => (
            <CommandeCard
              key={commande.id}
              commande={commande}
              onViewCommande={onViewCommande}
              onDeleteCommande={onDeleteCommande}
              onUpdateStatut={onUpdateStatut}
              isOperationLoading={isOperationLoading}
              formatDate={formatDate}
              getStatutBadgeColor={getStatutBadgeColor}
              getStatutLabel={getStatutLabel}
            />
          ))}
        </div>
      </div>

      {/* Indicateur de chargement */}
      {isLoading && commandes.length > 0 && (
        <div className="flex items-center justify-center py-4 bg-gray-50">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-gray-600">Chargement...</span>
        </div>
      )}
    </div>
  );
};

// Composant CommandeCard pour l'affichage mobile
interface CommandeCardProps {
  commande: Commande;
  onViewCommande: (commandeId: string) => void;
  onDeleteCommande: (commande: Commande) => void;
  onUpdateStatut: (
    commande: Commande,
    newStatut: StatutCommande,
    noteCorrecteur?: string
  ) => void;
  isOperationLoading: boolean;
  formatDate: (dateString: string) => string;
  getStatutBadgeColor: (statut: StatutCommande) => string;
  getStatutLabel: (statut: StatutCommande) => string;
}

const CommandeCard: React.FC<CommandeCardProps> = ({
  commande,
  onViewCommande,
  onDeleteCommande,
  onUpdateStatut,
  isOperationLoading,
  formatDate,
  getStatutBadgeColor,
  getStatutLabel,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* En-tête de la carte avec titre et statut */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {commande.titre}
          </h3>
          <p className="text-sm text-gray-500">
            ID: {commande.id.slice(0, 8)}...
          </p>
        </div>

        {/* Badge statut */}
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutBadgeColor(
            commande.statut
          )}`}
        >
          {getStatutLabel(commande.statut)}
        </span>
      </div>

      {/* Informations client */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 font-semibold text-xs">
              {commande.user?.prenom?.charAt(0)}
              {commande.user?.nom?.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {commande.user?.prenom} {commande.user?.nom}
            </p>
            <p className="text-sm text-gray-500">{commande.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="grid grid-cols-1 gap-3 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Date de création:</span>
          <p className="font-medium">{formatDate(commande.createdAt)}</p>
        </div>

        {/* Sélecteur de statut mobile */}
        <div>
          <span className="text-gray-500 block mb-1">Changer le statut:</span>
          <CommandeStatusSelect
            currentStatus={commande.statut}
            onStatusChange={(newStatut) => onUpdateStatut(commande, newStatut)}
            disabled={isOperationLoading}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onViewCommande(commande.id)}
          disabled={isOperationLoading}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <i className="fas fa-eye mr-2"></i>
          Voir détails
        </button>
        <button
          onClick={() => onDeleteCommande(commande)}
          disabled={isOperationLoading}
          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <i className="fas fa-trash mr-1"></i>
          Supprimer
        </button>
      </div>
    </div>
  );
};
