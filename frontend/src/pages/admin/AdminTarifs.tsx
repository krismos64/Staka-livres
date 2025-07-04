import { useQueryClient } from "@tanstack/react-query";
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

  const queryClient = useQueryClient();

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

  const invalidatePublicTarifs = () => {
    queryClient.invalidateQueries({ queryKey: ["tarifs", "public"] });
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
      invalidatePublicTarifs();
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
      invalidatePublicTarifs();
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
      invalidatePublicTarifs();
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
      invalidatePublicTarifs();
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
    <div className="space-y-6 p-6">
      {/* Actions */}
      <div className="flex justify-end items-center space-x-3">
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
      {/* Version desktop - Tableau */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
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

      {/* Version mobile - Cartes */}
      <div className="md:hidden space-y-4">
        {tarifs
          .sort((a, b) => a.ordre - b.ordre)
          .map((tarif) => (
            <div
              key={tarif.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {tarif.nom}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {tarif.description}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleActivation(tarif)}
                  disabled={isOperationLoading}
                  className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
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
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    Ordre
                  </label>
                  <input
                    type="number"
                    value={tarif.ordre}
                    onChange={(e) =>
                      handleUpdateOrder(tarif, parseInt(e.target.value) || 1)
                    }
                    disabled={isOperationLoading}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    Type
                  </label>
                  <div className="mt-1">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {tarif.typeService}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    Prix
                  </label>
                  <div className="text-sm font-medium text-gray-900 mt-1">
                    {tarif.prixFormate}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    Durée
                  </label>
                  <div className="text-sm text-gray-900 mt-1">
                    {tarif.dureeEstimee || "Non défini"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
                {/* Voir */}
                <button
                  onClick={() => handleViewTarif(tarif)}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-900 transition-colors"
                  title="Voir les détails"
                >
                  <i className="fas fa-eye mr-1"></i>
                  Voir
                </button>

                {/* Modifier */}
                <button
                  onClick={() => handleEditTarif(tarif)}
                  disabled={isOperationLoading}
                  className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-900 transition-colors"
                  title="Modifier"
                >
                  <i className="fas fa-edit mr-1"></i>
                  Modifier
                </button>

                {/* Supprimer */}
                <button
                  onClick={() => handleDeleteTarif(tarif)}
                  disabled={isOperationLoading}
                  className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-900 transition-colors"
                  title="Supprimer"
                >
                  <i className="fas fa-trash mr-1"></i>
                  Supprimer
                </button>
              </div>
            </div>
          ))}

        {/* État vide mobile */}
        {tarifs.length === 0 && !isLoading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <i className="fas fa-euro-sign text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun tarif trouvé
            </h3>
            <p className="text-gray-500 mb-4">
              Commencez par créer votre premier tarif
            </p>
            <button
              onClick={handleCreateTarif}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="space-y-6">
          {/* En-tête moderne avec icône */}
          <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isEditing
                  ? selectedTarif
                    ? "bg-gradient-to-br from-blue-100 to-blue-200"
                    : "bg-gradient-to-br from-green-100 to-green-200"
                  : "bg-gradient-to-br from-purple-100 to-purple-200"
              }`}
            >
              <i
                className={`fas text-lg ${
                  isEditing
                    ? selectedTarif
                      ? "fa-edit text-blue-600"
                      : "fa-plus text-green-600"
                    : "fa-eye text-purple-600"
                }`}
              ></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {isEditing
                  ? selectedTarif
                    ? "Modifier le tarif"
                    : "Nouveau tarif"
                  : "Détails du tarif"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing
                  ? selectedTarif
                    ? "Modifiez les informations du tarif"
                    : "Créez un nouveau tarif pour vos services"
                  : "Consultez les détails de ce tarif"}
              </p>
            </div>
          </div>

          {isEditing ? (
            <>
              {/* Section Informations générales */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-info-circle text-blue-600"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Informations générales
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-tag text-gray-400 mr-2"></i>
                      Nom du service
                    </label>
                    <input
                      type="text"
                      value={editFormData.nom}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          nom: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      placeholder="Ex: Correction orthographique..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-align-left text-gray-400 mr-2"></i>
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
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 resize-none bg-white/70 backdrop-blur-sm"
                      placeholder="Description détaillée du service..."
                    />
                  </div>
                </div>
              </div>

              {/* Section Tarification */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-euro-sign text-green-600"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Tarification
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-money-bill text-gray-400 mr-2"></i>
                      Prix (€)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">€</span>
                      </div>
                      <input
                        type="number"
                        value={editFormData.prix}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            prix: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-3 focus:ring-green-100 focus:border-green-400 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-list text-gray-400 mr-2"></i>
                      Type de service
                    </label>
                    <div className="relative">
                      <select
                        value={editFormData.typeService}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            typeService: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-3 focus:ring-green-100 focus:border-green-400 transition-all duration-200 bg-white/70 backdrop-blur-sm appearance-none"
                      >
                        {typesService.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <i className="fas fa-chevron-down text-gray-400"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Configuration */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-cogs text-purple-600"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Configuration
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-clock text-gray-400 mr-2"></i>
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-3 focus:ring-purple-100 focus:border-purple-400 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      placeholder="Ex: 2-3 jours"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-sort-numeric-up text-gray-400 mr-2"></i>
                      Ordre d'affichage
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-3 focus:ring-purple-100 focus:border-purple-400 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-toggle-on text-gray-400 mr-2"></i>
                      Statut
                    </label>
                    <div className="relative">
                      <select
                        value={editFormData.actif.toString()}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            actif: e.target.value === "true",
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-3 focus:ring-purple-100 focus:border-purple-400 transition-all duration-200 bg-white/70 backdrop-blur-sm appearance-none"
                      >
                        <option value="true">✅ Actif</option>
                        <option value="false">⏸️ Inactif</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <i className="fas fa-chevron-down text-gray-400"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowTarifModal(false)}
                  className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                >
                  <i className="fas fa-times mr-2"></i>
                  Annuler
                </button>
                <button
                  onClick={handleSaveTarif}
                  disabled={
                    isOperationLoading ||
                    !editFormData.nom ||
                    !editFormData.description
                  }
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOperationLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-2">Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Sauvegarder
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            selectedTarif && (
              <>
                {/* Mode visualisation moderne */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                        <div className="flex items-center mb-2">
                          <i className="fas fa-tag text-indigo-500 mr-2"></i>
                          <label className="text-sm font-medium text-gray-600">
                            Nom du service
                          </label>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedTarif?.nom}
                        </p>
                      </div>

                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                        <div className="flex items-center mb-2">
                          <i className="fas fa-list text-indigo-500 mr-2"></i>
                          <label className="text-sm font-medium text-gray-600">
                            Type de service
                          </label>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                          <i className="fas fa-dot-circle mr-1 text-xs"></i>
                          {selectedTarif?.typeService}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                        <div className="flex items-center mb-2">
                          <i className="fas fa-euro-sign text-green-500 mr-2"></i>
                          <label className="text-sm font-medium text-gray-600">
                            Prix
                          </label>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedTarif?.prixFormate}
                        </p>
                      </div>

                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                        <div className="flex items-center mb-2">
                          <i
                            className={`fas ${
                              selectedTarif?.actif
                                ? "fa-check-circle text-green-500"
                                : "fa-pause-circle text-red-500"
                            } mr-2`}
                          ></i>
                          <label className="text-sm font-medium text-gray-600">
                            Statut
                          </label>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${
                            selectedTarif?.actif
                              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                              : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {selectedTarif?.actif ? "✅ Actif" : "⏸️ Inactif"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                    <div className="flex items-center mb-3">
                      <i className="fas fa-align-left text-indigo-500 mr-2"></i>
                      <label className="text-sm font-medium text-gray-600">
                        Description
                      </label>
                    </div>
                    <p className="text-gray-800 leading-relaxed">
                      {selectedTarif?.description}
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                      <div className="flex items-center mb-2">
                        <i className="fas fa-clock text-purple-500 mr-2"></i>
                        <label className="text-sm font-medium text-gray-600">
                          Durée estimée
                        </label>
                      </div>
                      <p className="text-gray-800 font-medium">
                        {selectedTarif?.dureeEstimee || "Non défini"}
                      </p>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                      <div className="flex items-center mb-2">
                        <i className="fas fa-sort-numeric-up text-purple-500 mr-2"></i>
                        <label className="text-sm font-medium text-gray-600">
                          Ordre d'affichage
                        </label>
                      </div>
                      <p className="text-gray-800 font-medium">
                        #{selectedTarif?.ordre}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={() =>
                      selectedTarif && handleEditTarif(selectedTarif)
                    }
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Modifier ce tarif
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
