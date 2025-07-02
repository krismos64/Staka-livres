import React, { useEffect, useState } from "react";
import CommandeStatusSelect from "../../components/admin/CommandeStatusSelect";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { Commande, StatutCommande } from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";
import { useToasts } from "../../utils/toast";

type StatutFilter = StatutCommande | "TOUS";

const AdminCommandes: React.FC = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutFilter>("TOUS");
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(
    null
  );
  const [showCommandeModal, setShowCommandeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commandeToDelete, setCommandeToDelete] = useState<Commande | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const { showToast } = useToasts();

  const loadCommandes = async (
    page = 1,
    search = "",
    statut?: StatutCommande
  ) => {
    try {
      console.log(`🔍 [DEBUG FRONTEND] loadCommandes appelé avec:`, {
        page,
        search,
        statut,
      });
      setIsLoading(page === 1);
      setError(null);

      // Construction de l'objet filters selon la nouvelle API
      const filters: any = {};

      if (search && search.trim()) {
        filters.search = search.trim();
      }

      if (statut) {
        filters.statut = statut;
      }

      console.log(`🔍 [DEBUG FRONTEND] Filters construits:`, filters);

      const response = await adminAPI.getCommandes(page, 10, filters);

      console.log(`🔍 [DEBUG FRONTEND] Réponse API:`, response);

      setCommandes(response.data || []);
      setTotalPages(Math.ceil((response.stats?.total || 0) / 10) || 1);

      console.log(
        `🔍 [DEBUG FRONTEND] Commandes définies:`,
        response.data || []
      );
      console.log(
        `🔍 [DEBUG FRONTEND] Nombre de commandes:`,
        (response.data || []).length
      );

      if (page === 1) {
        showToast(
          "success",
          "Données chargées",
          `${response.data?.length || 0} commandes récupérées`
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de chargement des commandes";
      setError(errorMessage);
      showToast("error", "Erreur", errorMessage);
      console.error("❌ [DEBUG FRONTEND] Erreur chargement commandes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const statutParam = statutFilter === "TOUS" ? undefined : statutFilter;
    loadCommandes(1, searchQuery, statutParam);
    setCurrentPage(1);
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
    loadCommandes(page, searchQuery, statutParam);
  };

  const handleViewCommande = async (commandeId: string) => {
    try {
      setIsOperationLoading(true);
      const commande = await adminAPI.getCommandeById(commandeId);
      setSelectedCommande(commande);
      setShowCommandeModal(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de récupération de la commande";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleUpdateStatut = async (
    commande: Commande,
    newStatut: StatutCommande,
    noteCorrecteur?: string
  ) => {
    try {
      setIsOperationLoading(true);

      await adminAPI.updateCommande(commande.id, {
        statut: newStatut,
        noteCorrecteur: noteCorrecteur || commande.noteCorrecteur,
      });

      showToast(
        "success",
        "Statut modifié",
        `Commande "${commande.titre}" mise à jour vers ${newStatut}`
      );

      // Recharger la page courante
      const statutParam = statutFilter === "TOUS" ? undefined : statutFilter;
      await loadCommandes(currentPage, searchQuery, statutParam);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de mise à jour du statut";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleDeleteCommande = (commande: Commande) => {
    setCommandeToDelete(commande);
    setShowDeleteModal(true);
  };

  const confirmDeleteCommande = async () => {
    if (!commandeToDelete) return;

    try {
      setIsOperationLoading(true);

      await adminAPI.deleteCommande(commandeToDelete.id);
      showToast(
        "success",
        "Commande supprimée",
        `"${commandeToDelete.titre}" a été supprimée`
      );

      setShowDeleteModal(false);
      setCommandeToDelete(null);

      // Recharger la page courante
      const statutParam = statutFilter === "TOUS" ? undefined : statutFilter;
      await loadCommandes(currentPage, searchQuery, statutParam);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de suppression de la commande";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleRefresh = () => {
    const statutParam = statutFilter === "TOUS" ? undefined : statutFilter;
    loadCommandes(currentPage, searchQuery, statutParam);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
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
        return "Terminé";
      case StatutCommande.ANNULEE:
        return "Annulée";
      default:
        return statut;
    }
  };

  if (isLoading && commandes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Chargement des commandes...</span>
      </div>
    );
  }

  if (error && commandes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <i className="fas fa-file-alt text-5xl"></i>
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

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher par titre, description ou client..."
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
              <option value={StatutCommande.EN_ATTENTE}>En attente</option>
              <option value={StatutCommande.EN_COURS}>En cours</option>
              <option value={StatutCommande.TERMINE}>Terminé</option>
              <option value={StatutCommande.ANNULEE}>Annulée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des commandes */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
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
                  Créée le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modifiée le
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
                      {commande.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {commande.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {commande.user ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {commande.user.prenom} {commande.user.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {commande.user.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">
                        Client inconnu
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutBadgeColor(
                        commande.statut
                      )}`}
                    >
                      {getStatutLabel(commande.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(commande.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(commande.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Voir détails */}
                      <button
                        onClick={() => handleViewCommande(commande.id)}
                        disabled={isOperationLoading}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Voir les détails"
                      >
                        <i className="fas fa-eye"></i>
                      </button>

                      {/* Changer le statut */}
                      <div className="relative">
                        <CommandeStatusSelect
                          currentStatus={commande.statut}
                          onStatusChange={(newStatut) =>
                            handleUpdateStatut(commande, newStatut)
                          }
                          disabled={isOperationLoading}
                        />
                      </div>

                      {/* Supprimer */}
                      <button
                        onClick={() => handleDeleteCommande(commande)}
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
        {commandes.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <i className="fas fa-file-alt text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune commande trouvée
            </h3>
            <p className="text-gray-500">
              {searchQuery || statutFilter !== "TOUS"
                ? "Essayez de modifier vos filtres de recherche"
                : "Il n'y a pas encore de commandes dans le système"}
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

      {/* Modal détails commande */}
      <Modal
        isOpen={showCommandeModal}
        onClose={() => setShowCommandeModal(false)}
        title="Détails de la commande"
        size="lg"
      >
        {selectedCommande && (
          <div className="space-y-6">
            {/* Informations générales */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informations générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Titre
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCommande.titre}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Statut
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutBadgeColor(
                      selectedCommande.statut
                    )}`}
                  >
                    {getStatutLabel(selectedCommande.statut)}
                  </span>
                </div>
              </div>

              {selectedCommande.description && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedCommande.description}
                  </p>
                </div>
              )}

              {selectedCommande.fichierUrl && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Fichier
                  </label>
                  <a
                    href={selectedCommande.fichierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-blue-600 hover:text-blue-900"
                  >
                    <i className="fas fa-file-download mr-1"></i>
                    Télécharger le fichier
                  </a>
                </div>
              )}
            </div>

            {/* Informations client */}
            {selectedCommande.user && (
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
                      {selectedCommande.user.prenom} {selectedCommande.user.nom}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedCommande.user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <div className="space-y-4">
                {selectedCommande.noteClient && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Note du client
                    </label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                      {selectedCommande.noteClient}
                    </p>
                  </div>
                )}

                {selectedCommande.noteCorrecteur && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Note du correcteur
                    </label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-blue-50 p-3 rounded-md">
                      {selectedCommande.noteCorrecteur}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Historique
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Créée le
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedCommande.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dernière modification
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedCommande.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteCommande}
        title="Confirmer la suppression"
        message={
          commandeToDelete
            ? `Êtes-vous sûr de vouloir supprimer la commande "${commandeToDelete.titre}" ? Cette action est irréversible.`
            : ""
        }
        type="danger"
        isLoading={isOperationLoading}
      />
    </div>
  );
};

export default AdminCommandes;
