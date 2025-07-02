import React, { useEffect, useState } from "react";
import CommandeStatusSelect from "../../components/admin/CommandeStatusSelect";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import {
  CommandeFilters,
  useAdminCommandes,
} from "../../hooks/useAdminCommandes";
import { useDebouncedSearch } from "../../hooks/useDebouncedSearch";
import { Commande, CommandeDetailed, StatutCommande } from "../../types/shared";

type StatutFilter = StatutCommande | "TOUS";

const AdminCommandes: React.FC = () => {
  // Hook de recherche avec debounce
  const {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    isSearching,
    clearSearch,
  } = useDebouncedSearch({
    delay: 300,
    minLength: 0,
  });

  // Hook de gestion des commandes
  const {
    commandes,
    stats,
    isLoadingList,
    isLoadingStats,
    isOperationLoading,
    error,
    currentPage,
    totalPages,
    totalCommandes,
    loadCommandes,
    refreshCommandes,
    loadCommandeStats,
    viewCommande,
    updateCommandeStatut,
    deleteCommande,
    setCurrentPage,
    clearError,
  } = useAdminCommandes({
    initialPage: 1,
    pageSize: 10,
  });

  // États locaux pour les filtres et modales
  const [statutFilter, setStatutFilter] = useState<StatutFilter>("TOUS");
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedCommande, setSelectedCommande] =
    useState<CommandeDetailed | null>(null);
  const [showCommandeModal, setShowCommandeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commandeToDelete, setCommandeToDelete] = useState<Commande | null>(
    null
  );

  // Charger les statistiques au montage du composant
  useEffect(() => {
    loadCommandeStats();
  }, [loadCommandeStats]);

  // Recharger quand les filtres ou le tri changent
  useEffect(() => {
    const filters: CommandeFilters = {};

    if (statutFilter !== "TOUS") {
      filters.statut = statutFilter;
    }

    loadCommandes(1, debouncedSearchTerm, filters, sortColumn, sortDirection);
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    statutFilter,
    sortColumn,
    sortDirection,
    loadCommandes,
    setCurrentPage,
  ]);

  // Gestionnaires d'événements
  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  const handleStatutFilterChange = (statut: StatutFilter) => {
    setStatutFilter(statut);
  };

  const handleSort = (column: string, direction: "asc" | "desc") => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const filters: CommandeFilters = {};

    if (statutFilter !== "TOUS") {
      filters.statut = statutFilter;
    }

    loadCommandes(
      page,
      debouncedSearchTerm,
      filters,
      sortColumn,
      sortDirection
    );
  };

  const handleViewCommande = async (commandeId: string) => {
    const commande = await viewCommande(commandeId);
    if (commande) {
      setSelectedCommande(commande);
      setShowCommandeModal(true);
    }
  };

  const handleUpdateStatut = async (
    commande: Commande,
    newStatut: StatutCommande,
    noteCorrecteur?: string
  ) => {
    await updateCommandeStatut(commande.id, newStatut, noteCorrecteur);
  };

  const handleDeleteCommande = (commande: Commande) => {
    setCommandeToDelete(commande);
    setShowDeleteModal(true);
  };

  const confirmDeleteCommande = async () => {
    if (!commandeToDelete) return;

    const success = await deleteCommande(commandeToDelete.id);
    if (success) {
      setShowDeleteModal(false);
      setCommandeToDelete(null);
    }
  };

  const handleRefresh = () => {
    refreshCommandes();
  };

  // Fonctions utilitaires pour la modal de détails
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

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <div className="flex items-center">
          <i className="fas fa-exclamation-triangle text-red-500 mr-3"></i>
          <div>
            <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => {
                clearError();
                handleRefresh();
              }}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            {totalCommandes} commandes au total
            {isLoadingList && " • Chargement..."}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoadingList}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Actualiser
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="ID commande, email client..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statutFilter}
              onChange={(e) =>
                handleStatutFilterChange(e.target.value as StatutFilter)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value={StatutCommande.EN_ATTENTE}>En attente</option>
              <option value={StatutCommande.EN_COURS}>En cours</option>
              <option value={StatutCommande.TERMINE}>Terminées</option>
              <option value={StatutCommande.ANNULEE}>Annulées</option>
              <option value={StatutCommande.SUSPENDUE}>Suspendues</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tri
            </label>
            <select
              value={sortColumn ? `${sortColumn}:${sortDirection}` : ""}
              onChange={(e) => {
                const [column, direction] = e.target.value.split(":");
                if (column && direction) {
                  handleSort(column, direction as "asc" | "desc");
                } else {
                  setSortColumn(undefined);
                  setSortDirection("asc");
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sans tri</option>
              <option value="createdAt:desc">Plus récentes</option>
              <option value="createdAt:asc">Plus anciennes</option>
              <option value="titre:asc">Titre A-Z</option>
              <option value="titre:desc">Titre Z-A</option>
              <option value="statut:asc">Statut A-Z</option>
            </select>
          </div>
        </div>

        {/* Statistiques */}
        {stats && !isLoadingStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.enAttente}
              </div>
              <div className="text-xs text-gray-500">En attente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.enCours}
              </div>
              <div className="text-xs text-gray-500">En cours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.termine}
              </div>
              <div className="text-xs text-gray-500">Terminées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.annulee}
              </div>
              <div className="text-xs text-gray-500">Annulées</div>
            </div>
          </div>
        )}
      </div>

      {/* Table des commandes */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoadingList ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
            <p className="mt-2 text-gray-500">Chargement des commandes...</p>
          </div>
        ) : commandes.length === 0 ? (
          <div className="p-8 text-center">
            <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900">
              Aucune commande trouvée
            </h3>
            <p className="text-gray-500">
              {debouncedSearchTerm || statutFilter !== "TOUS"
                ? "Aucune commande ne correspond aux critères de recherche."
                : "Aucune commande n'a été créée pour le moment."}
            </p>
            {(debouncedSearchTerm || statutFilter !== "TOUS") && (
              <button
                onClick={() => {
                  clearSearch();
                  setStatutFilter("TOUS");
                }}
                className="mt-3 text-blue-600 hover:text-blue-800"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Vue desktop (tableau) - cachée sur mobile */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
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
                              handleUpdateStatut(commande, newStatut)
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
                              onClick={() => handleViewCommande(commande.id)}
                              disabled={isOperationLoading}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50 p-2 rounded-md hover:bg-blue-50"
                              title="Voir les détails"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteCommande(commande)}
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
                  <div
                    key={commande.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
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
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-semibold text-xs">
                            {commande.user?.prenom?.charAt(0)}
                            {commande.user?.nom?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {commande.user?.prenom} {commande.user?.nom}
                          </p>
                          <p className="text-sm text-gray-500">
                            {commande.user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Informations supplémentaires */}
                    <div className="grid grid-cols-1 gap-3 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Date de création:</span>
                        <p className="font-medium">
                          {formatDate(commande.createdAt)}
                        </p>
                      </div>

                      {/* Sélecteur de statut mobile */}
                      <div>
                        <span className="text-gray-500 block mb-1">
                          Changer le statut:
                        </span>
                        <CommandeStatusSelect
                          currentStatus={commande.statut}
                          onStatusChange={(newStatut) =>
                            handleUpdateStatut(commande, newStatut)
                          }
                          disabled={isOperationLoading}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleViewCommande(commande.id)}
                        disabled={isOperationLoading}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <i className="fas fa-eye mr-2"></i>
                        Voir détails
                      </button>
                      <button
                        onClick={() => handleDeleteCommande(commande)}
                        disabled={isOperationLoading}
                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal détails commande */}
      {showCommandeModal && selectedCommande && (
        <Modal
          isOpen={showCommandeModal}
          onClose={() => {
            setShowCommandeModal(false);
            setSelectedCommande(null);
          }}
          title="Détails de la commande"
          size="xl"
        >
          <div className="space-y-6">
            {/* En-tête avec informations principales */}
            <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <i className="fas fa-file-alt text-2xl text-white"></i>
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedCommande.titre}
                </h3>
                <p className="text-gray-600 mb-3">
                  ID: {selectedCommande.id.slice(0, 8)}...
                </p>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutBadgeColor(
                      selectedCommande.statut
                    )}`}
                  >
                    {getStatutLabel(selectedCommande.statut)}
                  </span>
                  {selectedCommande.priorite && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedCommande.priorite === "URGENTE"
                          ? "bg-red-100 text-red-800"
                          : selectedCommande.priorite === "ELEVEE"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      Priorité {selectedCommande.priorite?.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Informations en grille */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Informations générales
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-calendar text-blue-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Créée le</p>
                      <p className="font-medium text-gray-900">
                        {new Date(
                          selectedCommande.createdAt
                        ).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-clock text-orange-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Dernière mise à jour
                      </p>
                      <p className="font-medium text-gray-900">
                        {new Date(
                          selectedCommande.updatedAt
                        ).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedCommande.dateEcheance && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-red-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date d'échéance</p>
                        <p className="font-medium text-gray-900">
                          {new Date(
                            selectedCommande.dateEcheance
                          ).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedCommande.dateFinition && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-check-circle text-green-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Date de finition
                        </p>
                        <p className="font-medium text-gray-900">
                          {new Date(
                            selectedCommande.dateFinition
                          ).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations client */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Informations client
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-purple-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nom complet</p>
                      <p className="font-medium text-gray-900">
                        {selectedCommande.user?.prenom}{" "}
                        {selectedCommande.user?.nom}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-envelope text-green-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">
                        {selectedCommande.user?.email}
                      </p>
                    </div>
                  </div>

                  {selectedCommande.user?.telephone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-phone text-yellow-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="font-medium text-gray-900">
                          {selectedCommande.user.telephone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations financières et techniques */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Informations techniques
                </h4>

                <div className="space-y-3">
                  {selectedCommande.amount && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-euro-sign text-emerald-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Montant</p>
                        <p className="font-medium text-gray-900">
                          {(selectedCommande.amount / 100).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedCommande.paymentStatus && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-credit-card text-indigo-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Statut de paiement
                        </p>
                        <p className="font-medium text-gray-900">
                          {selectedCommande.paymentStatus}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedCommande.fichierUrl && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-paperclip text-pink-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Fichier joint</p>
                        <a
                          href={selectedCommande.fichierUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          Télécharger
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Statistiques si disponibles */}
                  {selectedCommande._count && (
                    <>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-comments text-teal-600"></i>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Messages</p>
                          <p className="font-medium text-gray-900">
                            {selectedCommande._count.messages || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-file-invoice text-cyan-600"></i>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Factures</p>
                          <p className="font-medium text-gray-900">
                            {selectedCommande._count.invoices || 0}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedCommande.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <i className="fas fa-align-left mr-2 text-gray-600"></i>
                  Description du projet
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedCommande.description}
                </p>
              </div>
            )}

            {/* Notes */}
            {(selectedCommande.noteClient ||
              selectedCommande.noteCorrecteur) && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <i className="fas fa-sticky-note mr-2 text-amber-600"></i>
                  Notes et commentaires
                </h4>
                <div className="space-y-4">
                  {selectedCommande.noteClient && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <i className="fas fa-user mr-1 text-blue-500"></i>
                        Note du client :
                      </h5>
                      <div className="bg-white p-3 rounded border border-amber-200">
                        <p className="text-gray-600 whitespace-pre-wrap">
                          {selectedCommande.noteClient}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedCommande.noteCorrecteur && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <i className="fas fa-user-edit mr-1 text-green-500"></i>
                        Note du correcteur :
                      </h5>
                      <div className="bg-white p-3 rounded border border-amber-200">
                        <p className="text-gray-600 whitespace-pre-wrap">
                          {selectedCommande.noteCorrecteur}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions rapides */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCommandeModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Fermer
                </button>
              </div>
              <div className="flex space-x-3">
                {selectedCommande.statut !== StatutCommande.TERMINE && (
                  <button
                    onClick={() => {
                      handleUpdateStatut(
                        selectedCommande,
                        StatutCommande.TERMINE
                      );
                      setShowCommandeModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Marquer comme terminée
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowCommandeModal(false);
                    handleDeleteCommande(selectedCommande);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal confirmation suppression */}
      {showDeleteModal && commandeToDelete && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setCommandeToDelete(null);
          }}
          onConfirm={confirmDeleteCommande}
          title="Supprimer la commande"
          message={`Êtes-vous sûr de vouloir supprimer la commande "${commandeToDelete.titre}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          type="danger"
          isLoading={isOperationLoading}
        />
      )}
    </div>
  );
};

export default AdminCommandes;
