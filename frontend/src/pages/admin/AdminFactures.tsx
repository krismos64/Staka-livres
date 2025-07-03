import React, { useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import {
  useAdminFactures,
  useDeleteFacture,
  useDownloadFacture,
  useFactureDetails,
  useFactureStats,
  useSendReminder,
  useUpdateFactureStatus,
} from "../../hooks/useAdminFactures";
import { Facture, StatutFacture } from "../../types/shared";
import { useToasts } from "../../utils/toast";

type StatutFilter = StatutFacture | "TOUS";

const AdminFactures: React.FC = () => {
  // États locaux pour les filtres et les modales
  const [searchQuery, setSearchQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutFilter>("TOUS");
  const [selectedFactureId, setSelectedFactureId] = useState<string | null>(
    null
  );
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [factureToDelete, setFactureToDelete] = useState<Facture | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // États pour le tri
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { showToast } = useToasts();

  // ===============================
  // HOOKS REACT QUERY
  // ===============================

  // Récupération des factures avec pagination et filtres
  const {
    data: facturesData,
    isLoading: facturesLoading,
    isError: facturesError,
    isFetching: facturesRefetching,
    refetch: refetchFactures,
  } = useAdminFactures({
    page: currentPage,
    limit: 10,
    status: statutFilter === "TOUS" ? undefined : statutFilter,
    search: searchQuery.trim() || undefined,
    sortBy,
    sortOrder,
  });

  // Récupération des statistiques
  const {
    data: factureStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useFactureStats();

  // Détails d'une facture spécifique
  const { data: selectedFacture, isLoading: detailsLoading } =
    useFactureDetails(selectedFactureId || "");

  // Mutations
  const downloadMutation = useDownloadFacture();
  const reminderMutation = useSendReminder();
  const deleteMutation = useDeleteFacture();
  const updateStatusMutation = useUpdateFactureStatus();

  // ===============================
  // HANDLERS
  // ===============================

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset à la première page lors de la recherche
  };

  const handleStatutFilterChange = (statut: StatutFilter) => {
    setStatutFilter(statut);
    setCurrentPage(1); // Reset à la première page lors du changement de filtre
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewFacture = (factureId: string) => {
    setSelectedFactureId(factureId);
    setShowFactureModal(true);
  };

  const handleUpdateStatut = (facture: Facture, newStatut: StatutFacture) => {
    updateStatusMutation.mutate(
      { id: facture.id, statut: newStatut },
      {
        onSuccess: () => {
          showToast(
            "success",
            "Statut modifié",
            `Facture ${facture.numero} mise à jour vers ${getStatutLabel(
              newStatut
            )}`
          );
        },
        onError: (error: any) => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Erreur de mise à jour du statut";
          showToast("error", "Erreur", errorMessage);
        },
      }
    );
  };

  const handleSendReminder = (facture: Facture) => {
    reminderMutation.mutate(facture.id, {
      onSuccess: () => {
        showToast(
          "success",
          "Rappel envoyé",
          `Rappel envoyé à ${facture.user?.email} pour la facture ${facture.numero}`
        );
      },
      onError: (error: any) => {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur d'envoi du rappel";
        showToast("error", "Erreur", errorMessage);
      },
    });
  };

  const handleDownloadPDF = (facture: Facture) => {
    downloadMutation.mutate(facture.id, {
      onSuccess: () => {
        showToast("success", "Téléchargement", "PDF téléchargé avec succès");
      },
      onError: (error: any) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erreur de téléchargement du PDF";
        showToast("error", "Erreur", errorMessage);
      },
    });
  };

  const handleDeleteFacture = (facture: Facture) => {
    setFactureToDelete(facture);
    setShowDeleteModal(true);
  };

  const confirmDeleteFacture = () => {
    if (!factureToDelete) return;

    deleteMutation.mutate(factureToDelete.id, {
      onSuccess: () => {
        showToast(
          "success",
          "Facture supprimée",
          `Facture ${factureToDelete.numero} supprimée`
        );
        setShowDeleteModal(false);
        setFactureToDelete(null);
        // Reset à la première page si on supprime sur une page qui pourrait devenir vide
        if (
          facturesData &&
          facturesData.data &&
          facturesData.data.length === 1 &&
          currentPage > 1
        ) {
          setCurrentPage(currentPage - 1);
        }
      },
      onError: (error: any) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erreur de suppression de la facture";
        showToast("error", "Erreur", errorMessage);
      },
    });
  };

  const handleRefresh = () => {
    refetchFactures();
    refetchStats();
    showToast("success", "Données chargées", "Liste des factures mise à jour");
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Si on clique sur la même colonne, inverser l'ordre
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Nouvelle colonne, commencer par desc pour les dates/montants, asc pour le reste
      setSortBy(column);
      setSortOrder(
        ["createdAt", "amount", "dueAt"].includes(column) ? "desc" : "asc"
      );
    }
    setCurrentPage(1); // Reset à la première page lors du tri
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return "fas fa-sort text-gray-400";
    }
    return sortOrder === "asc"
      ? "fas fa-sort-up text-blue-600"
      : "fas fa-sort-down text-blue-600";
  };

  // ===============================
  // UTILITAIRES
  // ===============================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatMontant = (montantCentimes: number) => {
    const euros = montantCentimes / 100;
    return `${euros.toFixed(2)} €`;
  };

  const getStatutBadgeColor = (statut: StatutFacture) => {
    switch (statut) {
      case StatutFacture.PAYEE:
        return "bg-green-100 text-green-800";
      case StatutFacture.EN_ATTENTE:
        return "bg-yellow-100 text-yellow-800";
      case StatutFacture.ECHEANCE:
        return "bg-red-100 text-red-800";
      case StatutFacture.ANNULEE:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatutLabel = (statut: StatutFacture) => {
    switch (statut) {
      case StatutFacture.PAYEE:
        return "Payée";
      case StatutFacture.EN_ATTENTE:
        return "En attente";
      case StatutFacture.ECHEANCE:
        return "Échue";
      case StatutFacture.ANNULEE:
        return "Annulée";
      default:
        return statut;
    }
  };

  // Variables dérivées des données React Query
  const factures = facturesData?.data || [];
  const totalPages = facturesData?.pagination?.totalPages || 1;
  const isLoading = facturesLoading || statsLoading;
  const isOperationLoading =
    downloadMutation.isLoading ||
    reminderMutation.isLoading ||
    deleteMutation.isLoading ||
    updateStatusMutation.isLoading ||
    detailsLoading;

  // ===============================
  // RENDU CONDITIONNEL
  // ===============================

  if (isLoading && factures.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Chargement des factures...</span>
      </div>
    );
  }

  if (facturesError && factures.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <i className="fas fa-file-invoice text-5xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-600 mb-4">
          Une erreur est survenue lors du chargement des factures
        </p>
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
    <div className="space-y-6">
      {/* Header avec bouton Actualiser */}
      <div className="flex justify-end items-center">
        <button
          onClick={handleRefresh}
          disabled={facturesRefetching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {facturesRefetching ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            "Actualiser"
          )}
        </button>
      </div>

      {/* Stats Header */}
      {factureStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-euro-sign text-white text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">
                  {factureStats.montantTotalFormate}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-invoice text-white text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total factures</p>
                <p className="text-2xl font-bold text-gray-900">
                  {factureStats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-white text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Factures payées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {factureStats.payees}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-white text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {factureStats.enAttente}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher par numéro, client..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtre par statut */}
          <div className="flex items-center gap-2">
            <i className="fas fa-filter text-gray-400"></i>
            <select
              value={statutFilter}
              onChange={(e) =>
                handleStatutFilterChange(e.target.value as StatutFilter)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value={StatutFacture.PAYEE}>Payées</option>
              <option value={StatutFacture.EN_ATTENTE}>En attente</option>
              <option value={StatutFacture.ECHEANCE}>Échues</option>
              <option value={StatutFacture.ANNULEE}>Annulées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vue Desktop - Tableau (caché sur mobile) */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("number")}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Numéro</span>
                    <i className={getSortIcon("number")}></i>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span>Client</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("amount")}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Montant</span>
                    <i className={getSortIcon("amount")}></i>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Statut</span>
                    <i className={getSortIcon("status")}></i>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Date</span>
                    <i className={getSortIcon("createdAt")}></i>
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {factures.map((facture) => (
                <tr key={facture.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {facture.numero}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {facture.user ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {facture.user.prenom} {facture.user.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {facture.user.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">
                        Client inconnu
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {facture.montantFormate ||
                        formatMontant(facture.montant || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutBadgeColor(
                        facture.statut
                      )}`}
                    >
                      {getStatutLabel(facture.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(facture.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Voir détails */}
                      <button
                        onClick={() => handleViewFacture(facture.id)}
                        disabled={isOperationLoading}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Voir les détails"
                      >
                        <i className="fas fa-eye"></i>
                      </button>

                      {/* Télécharger PDF */}
                      <button
                        onClick={() => handleDownloadPDF(facture)}
                        disabled={isOperationLoading}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Télécharger PDF"
                      >
                        <i className="fas fa-file-pdf"></i>
                      </button>

                      {/* Envoyer rappel */}
                      {facture.statut === StatutFacture.EN_ATTENTE && (
                        <button
                          onClick={() => handleSendReminder(facture)}
                          disabled={isOperationLoading}
                          className="text-orange-600 hover:text-orange-900 transition-colors"
                          title="Envoyer un rappel"
                        >
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      )}

                      {/* Changer le statut */}
                      <select
                        value={facture.statut}
                        onChange={(e) =>
                          handleUpdateStatut(
                            facture,
                            e.target.value as StatutFacture
                          )
                        }
                        disabled={isOperationLoading}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                        title="Changer le statut"
                      >
                        <option value={StatutFacture.EN_ATTENTE}>
                          En attente
                        </option>
                        <option value={StatutFacture.PAYEE}>Payée</option>
                        <option value={StatutFacture.ECHEANCE}>Échue</option>
                        <option value={StatutFacture.ANNULEE}>Annulée</option>
                      </select>

                      {/* Supprimer */}
                      <button
                        onClick={() => handleDeleteFacture(facture)}
                        disabled={isOperationLoading}
                        className="text-red-600 hover:text-red-900 transition-colors"
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

      {/* Vue Mobile - Cards (visible uniquement sur mobile) */}
      <div className="block md:hidden space-y-4">
        {/* Boutons de tri pour mobile */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Trier par :
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSort("number")}
              className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-md border transition-colors ${
                sortBy === "number"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>Numéro</span>
              <i className={getSortIcon("number")}></i>
            </button>
            <button
              onClick={() => handleSort("amount")}
              className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-md border transition-colors ${
                sortBy === "amount"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>Montant</span>
              <i className={getSortIcon("amount")}></i>
            </button>
            <button
              onClick={() => handleSort("status")}
              className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-md border transition-colors ${
                sortBy === "status"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>Statut</span>
              <i className={getSortIcon("status")}></i>
            </button>
            <button
              onClick={() => handleSort("createdAt")}
              className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-md border transition-colors ${
                sortBy === "createdAt"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>Date</span>
              <i className={getSortIcon("createdAt")}></i>
            </button>
          </div>
        </div>

        {/* Cards des factures */}
        {factures.map((facture) => (
          <div
            key={facture.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            {/* En-tête de la card */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {facture.numero}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(facture.createdAt)}
                </p>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutBadgeColor(
                  facture.statut
                )}`}
              >
                {getStatutLabel(facture.statut)}
              </span>
            </div>

            {/* Informations client */}
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-1">Client :</p>
              {facture.user ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {facture.user.prenom} {facture.user.nom}
                  </p>
                  <p className="text-xs text-gray-500">{facture.user.email}</p>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Client inconnu</span>
              )}
            </div>

            {/* Montant */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Montant :</p>
              <p className="text-lg font-semibold text-gray-900">
                {facture.montantFormate || formatMontant(facture.montant || 0)}
              </p>
            </div>

            {/* Sélecteur de statut */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Changer le statut :</p>
              <select
                value={facture.statut}
                onChange={(e) =>
                  handleUpdateStatut(facture, e.target.value as StatutFacture)
                }
                disabled={isOperationLoading}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={StatutFacture.EN_ATTENTE}>En attente</option>
                <option value={StatutFacture.PAYEE}>Payée</option>
                <option value={StatutFacture.ECHEANCE}>Échue</option>
                <option value={StatutFacture.ANNULEE}>Annulée</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex space-x-3">
                {/* Voir détails */}
                <button
                  onClick={() => handleViewFacture(facture.id)}
                  disabled={isOperationLoading}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 transition-colors"
                >
                  <i className="fas fa-eye text-sm"></i>
                  <span className="text-sm">Détails</span>
                </button>

                {/* Télécharger PDF */}
                <button
                  onClick={() => handleDownloadPDF(facture)}
                  disabled={isOperationLoading}
                  className="flex items-center space-x-1 text-green-600 hover:text-green-900 transition-colors"
                >
                  <i className="fas fa-file-pdf text-sm"></i>
                  <span className="text-sm">PDF</span>
                </button>

                {/* Envoyer rappel */}
                {facture.statut === StatutFacture.EN_ATTENTE && (
                  <button
                    onClick={() => handleSendReminder(facture)}
                    disabled={isOperationLoading}
                    className="flex items-center space-x-1 text-orange-600 hover:text-orange-900 transition-colors"
                  >
                    <i className="fas fa-paper-plane text-sm"></i>
                    <span className="text-sm">Rappel</span>
                  </button>
                )}
              </div>

              {/* Supprimer */}
              <button
                onClick={() => handleDeleteFacture(facture)}
                disabled={isOperationLoading}
                className="flex items-center space-x-1 text-red-600 hover:text-red-900 transition-colors"
              >
                <i className="fas fa-trash text-sm"></i>
                <span className="text-sm">Supprimer</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* État vide (commun aux deux vues) */}
      {factures.length === 0 && !facturesLoading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <i className="fas fa-file-invoice text-gray-400 text-4xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune facture trouvée
          </h3>
          <p className="text-gray-500">
            {searchQuery || statutFilter !== "TOUS"
              ? "Essayez de modifier vos filtres de recherche"
              : "Il n'y a pas encore de factures dans le système"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm">
          <div className="text-sm text-gray-700">
            Page {currentPage} sur {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || facturesRefetching}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || facturesRefetching}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modal détails facture moderne */}
      <Modal
        isOpen={showFactureModal}
        onClose={() => {
          setShowFactureModal(false);
          setSelectedFactureId(null);
        }}
        title=""
        size="xl"
      >
        {detailsLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">
              Chargement des détails...
            </span>
          </div>
        ) : selectedFacture ? (
          <div className="space-y-6">
            {/* Header moderne avec gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <i className="fas fa-file-invoice text-2xl"></i>
                    <h1 className="text-2xl font-bold">
                      {selectedFacture.numero}
                    </h1>
                  </div>
                  <p className="text-blue-100">
                    Facture émise le {formatDate(selectedFacture.createdAt)}
                  </p>
                </div>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedFacture.statut === StatutFacture.PAYEE
                      ? "bg-green-100 text-green-800"
                      : selectedFacture.statut === StatutFacture.EN_ATTENTE
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {getStatutLabel(selectedFacture.statut)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonne gauche */}
              <div className="space-y-6">
                {/* Informations financières */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                      <i className="fas fa-euro-sign text-white"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">
                      Informations financières
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">
                        Montant HT :
                      </span>
                      <span className="font-semibold text-green-900">
                        {formatMontant(selectedFacture.montant || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-green-200">
                      <span className="text-sm font-semibold text-green-700">
                        Montant TTC :
                      </span>
                      <span className="text-lg font-bold text-green-900">
                        {selectedFacture.montantFormate ||
                          formatMontant(selectedFacture.montant || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informations client */}
                {(selectedFacture.user || selectedFacture.commande?.user) && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <i className="fas fa-user text-white"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-blue-800">
                        Informations client
                      </h3>
                    </div>

                    {(() => {
                      const user =
                        selectedFacture.user || selectedFacture.commande?.user;
                      if (!user) return null;
                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-blue-700 font-medium">
                              Nom complet :
                            </label>
                            <p className="text-blue-900 font-semibold">
                              {user.prenom} {user.nom}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm text-blue-700 font-medium">
                              Email :
                            </label>
                            <p className="text-blue-900">{user.email}</p>
                          </div>
                          <div>
                            <label className="text-sm text-blue-700 font-medium">
                              ID Client :
                            </label>
                            <p className="text-blue-900 font-mono text-xs">
                              {user.id}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Colonne droite */}
              <div className="space-y-6">
                {/* Informations dates */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <i className="fas fa-calendar-alt text-white"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-purple-800">
                      Dates importantes
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-purple-700 font-medium">
                        Facture créée :
                      </label>
                      <p className="text-purple-900 font-semibold">
                        {formatDate(selectedFacture.createdAt)}
                      </p>
                    </div>
                    {selectedFacture.dateEcheance && (
                      <div>
                        <label className="text-sm text-purple-700 font-medium">
                          Date d'échéance :
                        </label>
                        <p className="text-purple-900 font-semibold">
                          {formatDate(selectedFacture.dateEcheance)}
                        </p>
                      </div>
                    )}
                    {selectedFacture.datePaiement && (
                      <div>
                        <label className="text-sm text-purple-700 font-medium">
                          Date de paiement :
                        </label>
                        <p className="text-purple-900 font-semibold">
                          {formatDate(selectedFacture.datePaiement)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations commande */}
                {selectedFacture.commande && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mr-3">
                        <i className="fas fa-shopping-cart text-white"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-amber-800">
                        Commande associée
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-amber-700 font-medium">
                          Titre :
                        </label>
                        <p className="text-amber-900 font-semibold">
                          {selectedFacture.commande.titre}
                        </p>
                      </div>

                      {selectedFacture.commande.description && (
                        <div>
                          <label className="text-sm text-amber-700 font-medium">
                            Description :
                          </label>
                          <p className="text-amber-900 text-sm">
                            {selectedFacture.commande.description}
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm text-amber-700 font-medium">
                          Statut commande :
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                            selectedFacture.commande.statut === "TERMINE"
                              ? "bg-green-100 text-green-800"
                              : selectedFacture.commande.statut === "EN_COURS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {selectedFacture.commande.statut}
                        </span>
                      </div>

                      <div>
                        <label className="text-sm text-amber-700 font-medium">
                          ID Commande :
                        </label>
                        <p className="text-amber-900 font-mono text-xs">
                          {selectedFacture.commande.id}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section Actions */}
            <div className="bg-gray-50 rounded-xl p-6 border">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-cogs text-white"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Actions disponibles
                </h3>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleDownloadPDF(selectedFacture)}
                  disabled={isOperationLoading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-file-pdf mr-2"></i>
                  Télécharger PDF
                </button>

                {selectedFacture.statut === StatutFacture.EN_ATTENTE && (
                  <button
                    onClick={() => handleSendReminder(selectedFacture)}
                    disabled={isOperationLoading}
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-400 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    Envoyer un rappel
                  </button>
                )}

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Changer le statut :
                  </label>
                  <select
                    value={selectedFacture.statut}
                    onChange={(e) =>
                      handleUpdateStatut(
                        selectedFacture,
                        e.target.value as StatutFacture
                      )
                    }
                    disabled={isOperationLoading}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={StatutFacture.EN_ATTENTE}>En attente</option>
                    <option value={StatutFacture.PAYEE}>Payée</option>
                    <option value={StatutFacture.ECHEANCE}>Échue</option>
                    <option value={StatutFacture.ANNULEE}>Annulée</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setShowFactureModal(false);
                    setSelectedFactureId(null);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <i className="fas fa-times mr-2"></i>
                  Fermer
                </button>
              </div>
            </div>

            {/* Informations techniques (dépliable) */}
            <details className="bg-gray-50 rounded-lg">
              <summary className="cursor-pointer p-4 text-sm font-medium text-gray-700 hover:text-gray-900">
                <i className="fas fa-info-circle mr-2"></i>
                Informations techniques
              </summary>
              <div className="px-4 pb-4 text-xs text-gray-600 space-y-1">
                <p>
                  <strong>ID Facture :</strong> {selectedFacture.id}
                </p>
                <p>
                  <strong>Créée le :</strong>{" "}
                  {new Date(selectedFacture.createdAt).toLocaleString("fr-FR")}
                </p>
                <p>
                  <strong>Modifiée le :</strong>{" "}
                  {new Date(selectedFacture.updatedAt).toLocaleString("fr-FR")}
                </p>
                {selectedFacture.pdfUrl && (
                  <p>
                    <strong>URL PDF :</strong>{" "}
                    <a
                      href={selectedFacture.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedFacture.pdfUrl}
                    </a>
                  </p>
                )}
              </div>
            </details>
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="fas fa-exclamation-triangle text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Facture non trouvée
            </h3>
            <p className="text-gray-500">
              Cette facture n'existe pas ou a été supprimée.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFactureToDelete(null);
        }}
        onConfirm={confirmDeleteFacture}
        title="Confirmer la suppression"
        message={
          factureToDelete
            ? `Êtes-vous sûr de vouloir supprimer la facture ${factureToDelete.numero} ? Cette action est irréversible.`
            : ""
        }
        type="danger"
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
};

export default AdminFactures;
