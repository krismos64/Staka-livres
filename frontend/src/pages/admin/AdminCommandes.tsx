import React, { useEffect, useState } from "react";
import CommandeStatusSelect from "../../components/admin/CommandeStatusSelect";
import {
  Commande,
  PaginatedResponse,
  StatutCommande,
} from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";

const AdminCommandes: React.FC = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatutCommande | "">("");
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(
    null
  );
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadCommandes();
  }, [pagination.page, selectedStatus]);

  const loadCommandes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response: PaginatedResponse<Commande> = await adminAPI.getCommandes(
        pagination.page,
        pagination.limit,
        selectedStatus || undefined
      );

      setCommandes(response.data || []);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de chargement des commandes";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    commandeId: string,
    newStatus: StatutCommande
  ) => {
    try {
      setIsUpdating(commandeId);
      await adminAPI.updateCommande(commandeId, { statut: newStatus });

      // Mettre à jour la commande dans la liste
      setCommandes((prev) =>
        prev.map((cmd) =>
          cmd.id === commandeId ? { ...cmd, statut: newStatus } : cmd
        )
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de mise à jour";
      alert(errorMessage);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleViewDetails = async (commandeId: string) => {
    try {
      const commande = await adminAPI.getCommandeById(commandeId);
      setSelectedCommande(commande);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de chargement du détail";
      alert(errorMessage);
    }
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

  const getStatusIcon = (status: StatutCommande) => {
    switch (status) {
      case StatutCommande.EN_ATTENTE:
        return "fas fa-clock text-yellow-500";
      case StatutCommande.EN_COURS:
        return "fas fa-spinner text-blue-500";
      case StatutCommande.TERMINE:
        return "fas fa-check-circle text-green-500";
      case StatutCommande.ANNULEE:
        return "fas fa-times-circle text-red-500";
      default:
        return "fas fa-question-circle text-gray-500";
    }
  };

  if (isLoading && commandes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && commandes.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <i className="fas fa-exclamation-triangle text-red-600"></i>
          <h3 className="font-medium text-red-800">Erreur de chargement</h3>
        </div>
        <p className="text-red-700 mt-1">{error}</p>
        <button
          onClick={loadCommandes}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header et filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Commandes
          </h1>
          <p className="text-gray-600">
            {pagination.total} commande{pagination.total > 1 ? "s" : ""} au
            total
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as StatutCommande | "");
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value={StatutCommande.EN_ATTENTE}>En Attente</option>
            <option value={StatutCommande.EN_COURS}>En Cours</option>
            <option value={StatutCommande.TERMINE}>Terminé</option>
            <option value={StatutCommande.ANNULEE}>Annulé</option>
          </select>

          <button
            onClick={loadCommandes}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-sync-alt"></i>
            Actualiser
          </button>
        </div>
      </div>

      {/* Table des commandes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
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
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commandes.map((commande) => (
                <tr key={commande.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {commande.titre}
                      </p>
                      {commande.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {commande.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {commande.user?.prenom} {commande.user?.nom}
                      </p>
                      <p className="text-sm text-gray-500">
                        {commande.user?.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <i className={getStatusIcon(commande.statut)}></i>
                      <CommandeStatusSelect
                        currentStatus={commande.statut}
                        onStatusChange={(status) =>
                          handleStatusChange(commande.id, status)
                        }
                        disabled={isUpdating === commande.id}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(commande.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewDetails(commande.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Voir détail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.page} sur {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal détail commande */}
      {selectedCommande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détail de la commande
                </h3>
                <button
                  onClick={() => setSelectedCommande(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre
                  </label>
                  <p className="text-gray-900">{selectedCommande.titre}</p>
                </div>

                {selectedCommande.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <p className="text-gray-900">
                      {selectedCommande.description}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <p className="text-gray-900">
                    {selectedCommande.user?.prenom} {selectedCommande.user?.nom}{" "}
                    ({selectedCommande.user?.email})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <div className="flex items-center gap-2">
                    <i className={getStatusIcon(selectedCommande.statut)}></i>
                    <span className="text-gray-900">
                      {selectedCommande.statut}
                    </span>
                  </div>
                </div>

                {selectedCommande.noteClient && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note du client
                    </label>
                    <p className="text-gray-900">
                      {selectedCommande.noteClient}
                    </p>
                  </div>
                )}

                {selectedCommande.noteCorrecteur && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note du correcteur
                    </label>
                    <p className="text-gray-900">
                      {selectedCommande.noteCorrecteur}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Créée le
                    </label>
                    <p className="text-gray-900">
                      {formatDate(selectedCommande.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mise à jour
                    </label>
                    <p className="text-gray-900">
                      {formatDate(selectedCommande.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommandes;
