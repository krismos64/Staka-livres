import React, { useEffect, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { Facture, FactureStats, StatutFacture } from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";
import { useToasts } from "../../utils/toast";

type StatutFilter = StatutFacture | "TOUS";

const AdminFactures: React.FC = () => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [factureStats, setFactureStats] = useState<FactureStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutFilter>("TOUS");
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [factureToDelete, setFactureToDelete] = useState<Facture | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const { showToast } = useToasts();

  const loadFactures = async (
    page = 1,
    search = "",
    statut?: StatutFacture
  ) => {
    try {
      setIsLoading(page === 1);
      setError(null);

      const searchParam = search.trim() || undefined;

      const response = await adminAPI.getFactures(
        page,
        10,
        statut,
        searchParam
      );

      setFactures(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);

      if (page === 1) {
        showToast(
          "success",
          "Données chargées",
          "Liste des factures mise à jour"
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de chargement des factures";
      setError(errorMessage);
      showToast("error", "Erreur", errorMessage);
      console.error("Erreur chargement factures:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFactureStats = async () => {
    try {
      const stats = await adminAPI.getFactureStats();
      setFactureStats(stats);
    } catch (err) {
      console.error("Erreur chargement stats factures:", err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      await Promise.all([
        loadFactureStats(),
        loadFactures(
          1,
          searchQuery,
          statutFilter === "TOUS" ? undefined : statutFilter
        ),
      ]);
      setCurrentPage(1);
    };

    initData();
  }, [searchQuery, statutFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatutFilterChange = (statut: StatutFilter) => {
    setStatutFilter(statut);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const statutParam = statutFilter === "TOUS" ? undefined : statutFilter;
    loadFactures(page, searchQuery, statutParam);
  };

  const handleViewFacture = async (factureId: string) => {
    try {
      setIsOperationLoading(true);
      const facture = await adminAPI.getFactureById(factureId);
      setSelectedFacture(facture);
      setShowFactureModal(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de récupération de la facture";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleUpdateStatut = async (
    facture: Facture,
    newStatut: StatutFacture
  ) => {
    try {
      setIsOperationLoading(true);

      await adminAPI.updateFacture(facture.id, { statut: newStatut });
      showToast(
        "success",
        "Statut modifié",
        `Facture ${facture.numero} mise à jour vers ${newStatut}`
      );

      // Recharger les données
      await Promise.all([
        loadFactureStats(),
        loadFactures(
          currentPage,
          searchQuery,
          statutFilter === "TOUS" ? undefined : statutFilter
        ),
      ]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de mise à jour du statut";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleSendReminder = async (facture: Facture) => {
    try {
      setIsOperationLoading(true);

      await adminAPI.sendFactureReminder(facture.id);
      showToast(
        "success",
        "Rappel envoyé",
        `Rappel envoyé à ${facture.user?.email} pour la facture ${facture.numero}`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur d'envoi du rappel";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleDownloadPDF = async (facture: Facture) => {
    try {
      setIsOperationLoading(true);

      const blob = await adminAPI.downloadFacturePDF(facture.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `facture-${facture.numero}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      showToast("success", "Téléchargement", "PDF téléchargé avec succès");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de téléchargement du PDF";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleDeleteFacture = (facture: Facture) => {
    setFactureToDelete(facture);
    setShowDeleteModal(true);
  };

  const confirmDeleteFacture = async () => {
    if (!factureToDelete) return;

    try {
      setIsOperationLoading(true);

      await adminAPI.deleteFacture(factureToDelete.id);
      showToast(
        "success",
        "Facture supprimée",
        `Facture ${factureToDelete.numero} supprimée`
      );

      setShowDeleteModal(false);
      setFactureToDelete(null);

      // Recharger les données
      await Promise.all([
        loadFactureStats(),
        loadFactures(
          currentPage,
          searchQuery,
          statutFilter === "TOUS" ? undefined : statutFilter
        ),
      ]);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de suppression de la facture";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      loadFactureStats(),
      loadFactures(
        currentPage,
        searchQuery,
        statutFilter === "TOUS" ? undefined : statutFilter
      ),
    ]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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

  if (isLoading && factures.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Chargement des factures...</span>
      </div>
    );
  }

  if (error && factures.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <i className="fas fa-file-invoice text-5xl"></i>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Factures
          </h1>
          <p className="text-gray-600">
            Gérez les factures et suivez les paiements
          </p>
        </div>
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

      {/* Tableau des factures */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
                      {facture.montantFormate}
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

        {/* État vide */}
        {factures.length === 0 && !isLoading && (
          <div className="text-center py-12">
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm">
          <div className="text-sm text-gray-700">
            Page {currentPage} sur {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modal détails facture */}
      <Modal
        isOpen={showFactureModal}
        onClose={() => setShowFactureModal(false)}
        title="Détails de la facture"
        size="lg"
      >
        {selectedFacture && (
          <div className="space-y-6">
            {/* Informations générales */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informations générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Numéro
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedFacture.numero}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Statut
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutBadgeColor(
                      selectedFacture.statut
                    )}`}
                  >
                    {getStatutLabel(selectedFacture.statut)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Montant
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">
                    {selectedFacture.montantFormate}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date d'émission
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedFacture.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Informations client */}
            {selectedFacture.user && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Client
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nom complet
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedFacture.user.prenom} {selectedFacture.user.nom}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedFacture.user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleDownloadPDF(selectedFacture)}
                  disabled={isOperationLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                >
                  <i className="fas fa-file-pdf mr-2"></i>
                  Télécharger PDF
                </button>

                {selectedFacture.statut === StatutFacture.EN_ATTENTE && (
                  <button
                    onClick={() => handleSendReminder(selectedFacture)}
                    disabled={isOperationLoading}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-400"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    Envoyer rappel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteFacture}
        title="Confirmer la suppression"
        message={
          factureToDelete
            ? `Êtes-vous sûr de vouloir supprimer la facture ${factureToDelete.numero} ? Cette action est irréversible.`
            : ""
        }
        type="danger"
        isLoading={isOperationLoading}
      />
    </div>
  );
};

export default AdminFactures;
