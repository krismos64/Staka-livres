import React, { useMemo, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import Modal from "../../components/common/Modal";
import { Facture, StatutFacture } from "../../types/shared";
import { mockFactures, mockFactureStats } from "../../utils/mockData";

const AdminFactures: React.FC = () => {
  const [factures, setFactures] = useState<Facture[]>(mockFactures);
  const [selectedStatus, setSelectedStatus] = useState<StatutFacture | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [factureToDelete, setFactureToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filtrage des factures
  const filteredFactures = useMemo(() => {
    return factures.filter((facture) => {
      const matchesStatus =
        !selectedStatus || facture.statut === selectedStatus;
      const matchesSearch =
        facture.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facture.user?.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facture.user?.email.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [factures, selectedStatus, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (statut: StatutFacture) => {
    const config = {
      [StatutFacture.PAYEE]: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: "fas fa-check-circle",
        label: "Payée",
      },
      [StatutFacture.EN_ATTENTE]: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: "fas fa-clock",
        label: "En attente",
      },
      [StatutFacture.ECHEANCE]: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: "fas fa-exclamation-triangle",
        label: "Échue",
      },
      [StatutFacture.ANNULEE]: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: "fas fa-times-circle",
        label: "Annulée",
      },
    };

    const statusConfig = config[statut];

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
      >
        <i className={`${statusConfig.icon} mr-1`}></i>
        {statusConfig.label}
      </span>
    );
  };

  const handleViewDetails = (facture: Facture) => {
    setSelectedFacture(facture);
    setIsModalOpen(true);
  };

  const handleDeleteFacture = async (id: string) => {
    setIsLoading(true);
    // Simulation API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setFactures((prev) => prev.filter((f) => f.id !== id));
    setShowDeleteConfirm(false);
    setFactureToDelete(null);
    setIsLoading(false);
  };

  const handleSendReminder = async (facture: Facture) => {
    alert(
      `Rappel envoyé à ${facture.user?.email} pour la facture ${facture.numero}`
    );
  };

  const handleDownloadPDF = (facture: Facture) => {
    // Simulation du téléchargement
    const link = document.createElement("a");
    link.href = facture.pdfUrl || "#";
    link.download = `${facture.numero}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
              <i className="fas fa-euro-sign text-white text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockFactureStats.montantTotalFormate}
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
                {mockFactureStats.total}
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
                {mockFactureStats.payees}
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
                {mockFactureStats.enAttente}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher par numéro, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as StatutFacture | "")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value={StatutFacture.PAYEE}>Payées</option>
            <option value={StatutFacture.EN_ATTENTE}>En attente</option>
            <option value={StatutFacture.ECHEANCE}>Échues</option>
            <option value={StatutFacture.ANNULEE}>Annulées</option>
          </select>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <i className="fas fa-download"></i>
            Exporter
          </button>
        </div>
      </div>

      {/* Table des factures */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facture
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
            <tbody className="divide-y divide-gray-200">
              {filteredFactures.map((facture) => (
                <tr key={facture.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {facture.numero}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {facture.id.slice(0, 8)}...
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {facture.user?.prenom} {facture.user?.nom}
                      </p>
                      <p className="text-sm text-gray-500">
                        {facture.user?.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {facture.montantFormate}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(facture.statut)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(facture.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(facture)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Voir les détails"
                      >
                        <i className="fas fa-eye"></i>
                      </button>

                      <button
                        onClick={() => handleDownloadPDF(facture)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Télécharger PDF"
                      >
                        <i className="fas fa-download"></i>
                      </button>

                      {facture.statut === StatutFacture.EN_ATTENTE && (
                        <button
                          onClick={() => handleSendReminder(facture)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Envoyer un rappel"
                        >
                          <i className="fas fa-bell"></i>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setFactureToDelete(facture.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="text-red-600 hover:text-red-900 p-1"
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

        {filteredFactures.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-receipt text-gray-300 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune facture trouvée
            </h3>
            <p className="text-gray-500">
              Aucune facture ne correspond à vos critères de recherche.
            </p>
          </div>
        )}
      </div>

      {/* Modal détails facture */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFacture(null);
        }}
        title="Détails de la facture"
        size="lg"
      >
        {selectedFacture && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Informations facture
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Numéro:</span>{" "}
                    {selectedFacture.numero}
                  </p>
                  <p>
                    <span className="font-medium">Montant:</span>{" "}
                    {selectedFacture.montantFormate}
                  </p>
                  <p>
                    <span className="font-medium">Statut:</span>{" "}
                    {getStatusBadge(selectedFacture.statut)}
                  </p>
                  <p>
                    <span className="font-medium">Date de création:</span>{" "}
                    {formatDate(selectedFacture.createdAt)}
                  </p>
                  {selectedFacture.dateEcheance && (
                    <p>
                      <span className="font-medium">Échéance:</span>{" "}
                      {formatDate(selectedFacture.dateEcheance)}
                    </p>
                  )}
                  {selectedFacture.datePaiement && (
                    <p>
                      <span className="font-medium">Payée le:</span>{" "}
                      {formatDate(selectedFacture.datePaiement)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Client</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Nom:</span>{" "}
                    {selectedFacture.user?.prenom} {selectedFacture.user?.nom}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedFacture.user?.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => handleDownloadPDF(selectedFacture)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-download mr-2"></i>
                Télécharger PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmation suppression */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setFactureToDelete(null);
        }}
        onConfirm={() =>
          factureToDelete && handleDeleteFacture(factureToDelete)
        }
        title="Supprimer la facture"
        message="Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible."
        confirmText="Supprimer"
        type="danger"
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminFactures;
