import React, { useEffect, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { Tarif } from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";
import { useToasts } from "../../utils/toast";

const AdminTarifs: React.FC = () => {
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTarif, setSelectedTarif] = useState<Tarif | null>(null);
  const [showTarifModal, setShowTarifModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tarifToDelete, setTarifToDelete] = useState<Tarif | null>(null);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nom: "",
    description: "",
    prix: 0,
    prixFormate: "0€",
    typeService: "",
    dureeEstimee: "",
    actif: true,
    ordre: 1,
  });
  const { showToast } = useToasts();

  const typesService = [
    "Correction",
    "Relecture",
    "Réécriture",
    "Révision",
    "Mise en forme",
    "Traduction",
  ];

  const loadTarifs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await adminAPI.getTarifs();
      setTarifs(response);

      showToast("success", "Tarifs chargés", "Liste des tarifs mise à jour");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de chargement des tarifs";
      setError(errorMessage);
      showToast("error", "Erreur", errorMessage);
      console.error("Erreur chargement tarifs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTarifs();
  }, []);

  const handleCreateTarif = () => {
    setEditFormData({
      nom: "",
      description: "",
      prix: 0,
      prixFormate: "0€",
      typeService: typesService[0],
      dureeEstimee: "",
      actif: true,
      ordre: Math.max(...tarifs.map((t) => t.ordre), 0) + 1,
    });
    setIsEditing(true);
    setSelectedTarif(null);
    setShowTarifModal(true);
  };

  const handleEditTarif = (tarif: Tarif) => {
    setEditFormData({
      nom: tarif.nom,
      description: tarif.description,
      prix: tarif.prix,
      prixFormate: tarif.prixFormate,
      typeService: tarif.typeService,
      dureeEstimee: tarif.dureeEstimee || "",
      actif: tarif.actif,
      ordre: tarif.ordre,
    });
    setIsEditing(true);
    setSelectedTarif(tarif);
    setShowTarifModal(true);
  };

  const handleViewTarif = (tarif: Tarif) => {
    setSelectedTarif(tarif);
    setIsEditing(false);
    setShowTarifModal(true);
  };

  const handleSaveTarif = async () => {
    try {
      setIsOperationLoading(true);

      if (selectedTarif) {
        // Mise à jour
        await adminAPI.updateTarif(selectedTarif.id, editFormData);
        showToast(
          "success",
          "Tarif modifié",
          "Le tarif a été mis à jour avec succès"
        );
      } else {
        // Création
        await adminAPI.createTarif(editFormData);
        showToast(
          "success",
          "Tarif créé",
          "Le nouveau tarif a été ajouté avec succès"
        );
      }

      setShowTarifModal(false);
      setSelectedTarif(null);
      await loadTarifs();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de sauvegarde du tarif";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleToggleActivation = async (tarif: Tarif) => {
    try {
      setIsOperationLoading(true);

      await adminAPI.updateTarif(tarif.id, { actif: !tarif.actif });
      showToast(
        "success",
        "Statut modifié",
        `Tarif ${!tarif.actif ? "activé" : "désactivé"}`
      );

      await loadTarifs();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de modification du statut";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleUpdateOrder = async (tarif: Tarif, newOrder: number) => {
    try {
      setIsOperationLoading(true);

      await adminAPI.updateTarif(tarif.id, { ordre: newOrder });
      showToast(
        "success",
        "Ordre modifié",
        "L'ordre du tarif a été mis à jour"
      );

      await loadTarifs();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de modification de l'ordre";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleDeleteTarif = (tarif: Tarif) => {
    setTarifToDelete(tarif);
    setShowDeleteModal(true);
  };

  const confirmDeleteTarif = async () => {
    if (!tarifToDelete) return;

    try {
      setIsOperationLoading(true);

      await adminAPI.deleteTarif(tarifToDelete.id);
      showToast(
        "success",
        "Tarif supprimé",
        "Le tarif a été supprimé avec succès"
      );

      setShowDeleteModal(false);
      setTarifToDelete(null);
      await loadTarifs();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de suppression du tarif";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTarifs();
  };

  if (isLoading && tarifs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Chargement des tarifs...</span>
      </div>
    );
  }

  if (error && tarifs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <i className="fas fa-euro-sign text-5xl"></i>
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
            Gestion des Tarifs
          </h1>
          <p className="text-gray-600">Gérez les tarifs et services proposés</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              "Actualiser"
            )}
          </button>
          <button
            onClick={handleCreateTarif}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Nouveau tarif
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-euro-sign text-blue-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total tarifs</p>
              <p className="text-xl font-bold text-gray-900">{tarifs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-check-circle text-green-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-xl font-bold text-gray-900">
                {tarifs.filter((t) => t.actif).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-pause-circle text-yellow-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactifs</p>
              <p className="text-xl font-bold text-gray-900">
                {tarifs.filter((t) => !t.actif).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-tags text-purple-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Services</p>
              <p className="text-xl font-bold text-gray-900">
                {new Set(tarifs.map((t) => t.typeService)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des tarifs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tarifs
                .sort((a, b) => a.ordre - b.ordre)
                .map((tarif) => (
                  <tr key={tarif.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={tarif.ordre}
                        onChange={(e) =>
                          handleUpdateOrder(
                            tarif,
                            parseInt(e.target.value) || 1
                          )
                        }
                        disabled={isOperationLoading}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        min="1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {tarif.nom}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {tarif.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {tarif.typeService}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tarif.prixFormate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {tarif.dureeEstimee || "Non défini"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActivation(tarif)}
                        disabled={isOperationLoading}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                          tarif.actif
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        <i
                          className={`fas ${
                            tarif.actif ? "fa-check-circle" : "fa-pause-circle"
                          } mr-1`}
                        ></i>
                        {tarif.actif ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Voir */}
                        <button
                          onClick={() => handleViewTarif(tarif)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Voir les détails"
                        >
                          <i className="fas fa-eye"></i>
                        </button>

                        {/* Modifier */}
                        <button
                          onClick={() => handleEditTarif(tarif)}
                          disabled={isOperationLoading}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Modifier"
                        >
                          <i className="fas fa-edit"></i>
                        </button>

                        {/* Supprimer */}
                        <button
                          onClick={() => handleDeleteTarif(tarif)}
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
        {tarifs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <i className="fas fa-euro-sign text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun tarif trouvé
            </h3>
            <p className="text-gray-500">
              Commencez par créer votre premier tarif
            </p>
            <button
              onClick={handleCreateTarif}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Créer un tarif
            </button>
          </div>
        )}
      </div>

      {/* Modal Tarif */}
      <Modal
        isOpen={showTarifModal}
        onClose={() => setShowTarifModal(false)}
        title={
          isEditing
            ? selectedTarif
              ? "Modifier le tarif"
              : "Nouveau tarif"
            : "Détails du tarif"
        }
        size="lg"
      >
        <div className="space-y-4">
          {isEditing ? (
            <>
              {/* Mode édition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du service
                </label>
                <input
                  type="text"
                  value={editFormData.nom}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, nom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Correction orthographique..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description détaillée du service..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    value={editFormData.prix}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        prix: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de service
                  </label>
                  <select
                    value={editFormData.typeService}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        typeService: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {typesService.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée estimée
                  </label>
                  <input
                    type="text"
                    value={editFormData.dureeEstimee}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        dureeEstimee: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 2-3 jours"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordre
                  </label>
                  <input
                    type="number"
                    value={editFormData.ordre}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        ordre: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={editFormData.actif.toString()}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        actif: e.target.value === "true",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">Actif</option>
                    <option value="false">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowTarifModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTarif}
                  disabled={
                    isOperationLoading ||
                    !editFormData.nom ||
                    !editFormData.description
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  {isOperationLoading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    "Sauvegarder"
                  )}
                </button>
              </div>
            </>
          ) : (
            selectedTarif && (
              <>
                {/* Mode visualisation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du service
                    </label>
                    <p className="text-gray-900 font-medium">
                      {selectedTarif.nom}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {selectedTarif.typeService}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900">{selectedTarif.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix
                    </label>
                    <p className="text-gray-900 font-semibold text-lg">
                      {selectedTarif.prixFormate}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée estimée
                    </label>
                    <p className="text-gray-900">
                      {selectedTarif.dureeEstimee || "Non défini"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedTarif.actif
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <i
                        className={`fas ${
                          selectedTarif.actif
                            ? "fa-check-circle"
                            : "fa-pause-circle"
                        } mr-1`}
                      ></i>
                      {selectedTarif.actif ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => handleEditTarif(selectedTarif)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Modifier
                  </button>
                </div>
              </>
            )
          )}
        </div>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteTarif}
        title="Confirmer la suppression"
        message={
          tarifToDelete
            ? `Êtes-vous sûr de vouloir supprimer le tarif "${tarifToDelete.nom}" ? Cette action est irréversible.`
            : ""
        }
        type="danger"
        isLoading={isOperationLoading}
      />
    </div>
  );
};

export default AdminTarifs;
