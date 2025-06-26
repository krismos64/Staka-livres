import React, { useMemo, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import Modal from "../../components/common/Modal";
import { Tarif } from "../../types/shared";
import { mockTarifs } from "../../utils/mockData";

const AdminTarifs: React.FC = () => {
  const [tarifs, setTarifs] = useState<Tarif[]>(mockTarifs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [editingTarif, setEditingTarif] = useState<Tarif | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tarifToDelete, setTarifToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Nouveau tarif vide
  const [newTarif, setNewTarif] = useState<Partial<Tarif>>({
    nom: "",
    description: "",
    prix: 0,
    typeService: "par page",
    dureeEstimee: "",
    actif: true,
  });

  // Obtenir tous les types de services uniques
  const typesServices = useMemo(() => {
    const types = [...new Set(tarifs.map((tarif) => tarif.typeService))];
    return types.sort();
  }, [tarifs]);

  // Filtrage des tarifs
  const filteredTarifs = useMemo(() => {
    return tarifs
      .filter((tarif) => {
        const matchesType = !selectedType || tarif.typeService === selectedType;
        const matchesSearch =
          tarif.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tarif.description.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesType && matchesSearch;
      })
      .sort((a, b) => a.ordre - b.ordre);
  }, [tarifs, selectedType, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleCreateTarif = async () => {
    if (!newTarif.nom || !newTarif.description || newTarif.prix === undefined)
      return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const tarif: Tarif = {
      id: `tarif-${Date.now()}`,
      nom: newTarif.nom!,
      description: newTarif.description!,
      prix: newTarif.prix!,
      prixFormate: `${(newTarif.prix! / 100).toFixed(2)} €`,
      typeService: newTarif.typeService || "par page",
      dureeEstimee: newTarif.dureeEstimee,
      actif: newTarif.actif || true,
      ordre: tarifs.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTarifs((prev) => [...prev, tarif]);
    setNewTarif({
      nom: "",
      description: "",
      prix: 0,
      typeService: "par page",
      dureeEstimee: "",
      actif: true,
    });
    setIsCreateModalOpen(false);
    setIsLoading(false);
  };

  const handleEditTarif = async (updatedTarif: Tarif) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const formattedTarif = {
      ...updatedTarif,
      prixFormate: `${(updatedTarif.prix / 100).toFixed(2)} €`,
      updatedAt: new Date().toISOString(),
    };

    setTarifs((prev) =>
      prev.map((tarif) =>
        tarif.id === updatedTarif.id ? formattedTarif : tarif
      )
    );
    setEditingTarif(null);
    setIsLoading(false);
  };

  const handleDeleteTarif = async (id: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setTarifs((prev) => prev.filter((t) => t.id !== id));
    setShowDeleteConfirm(false);
    setTarifToDelete(null);
    setIsLoading(false);
  };

  const handleToggleActive = async (tarif: Tarif) => {
    setTarifs((prev) =>
      prev.map((t) =>
        t.id === tarif.id
          ? { ...t, actif: !t.actif, updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
              <i className="fas fa-euro-sign text-white text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total tarifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {tarifs.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-white text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {tarifs.filter((t) => t.actif).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-tags text-white text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Types services</p>
              <p className="text-2xl font-bold text-gray-900">
                {typesServices.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-400 rounded-lg flex items-center justify-center">
              <i className="fas fa-pause-circle text-white text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {tarifs.filter((t) => !t.actif).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher par nom ou description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les types</option>
            {typesServices.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Nouveau tarif
          </button>
        </div>
      </div>

      {/* Liste des tarifs */}
      <div className="grid gap-6">
        {filteredTarifs.map((tarif) => (
          <div
            key={tarif.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-medium text-gray-500">
                      #{tarif.ordre}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tarif.actif
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tarif.actif ? "Actif" : "Inactif"}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {tarif.typeService}
                    </span>
                    {tarif.dureeEstimee && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        <i className="fas fa-clock mr-1"></i>
                        {tarif.dureeEstimee}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {tarif.nom}
                      </h3>

                      <p className="text-gray-600 text-sm leading-relaxed mb-3">
                        {tarif.description}
                      </p>

                      <div className="text-xs text-gray-500">
                        Mis à jour le {formatDate(tarif.updatedAt)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {tarif.prixFormate}
                      </div>
                      <div className="text-sm text-gray-500">
                        {tarif.typeService}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleToggleActive(tarif)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    tarif.actif
                      ? "text-red-600 hover:bg-red-50"
                      : "text-green-600 hover:bg-green-50"
                  }`}
                >
                  <i
                    className={`fas ${
                      tarif.actif ? "fa-pause" : "fa-play"
                    } mr-1`}
                  ></i>
                  {tarif.actif ? "Désactiver" : "Activer"}
                </button>

                <button
                  onClick={() => setEditingTarif(tarif)}
                  className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-colors"
                >
                  <i className="fas fa-edit mr-1"></i>
                  Modifier
                </button>

                <button
                  onClick={() => {
                    setTarifToDelete(tarif.id);
                    setShowDeleteConfirm(true);
                  }}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                >
                  <i className="fas fa-trash mr-1"></i>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTarifs.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <i className="fas fa-euro-sign text-gray-300 text-4xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun tarif trouvé
          </h3>
          <p className="text-gray-500 mb-4">
            Aucun tarif ne correspond à vos critères de recherche.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer le premier tarif
          </button>
        </div>
      )}

      {/* Modal création */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewTarif({
            nom: "",
            description: "",
            prix: 0,
            typeService: "par page",
            dureeEstimee: "",
            actif: true,
          });
        }}
        title="Nouveau tarif"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du service
            </label>
            <input
              type="text"
              value={newTarif.nom || ""}
              onChange={(e) =>
                setNewTarif((prev) => ({ ...prev, nom: e.target.value }))
              }
              placeholder="Ex: Correction Standard"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newTarif.description || ""}
              onChange={(e) =>
                setNewTarif((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Description détaillée du service..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix (en centimes)
              </label>
              <input
                type="number"
                value={newTarif.prix || ""}
                onChange={(e) =>
                  setNewTarif((prev) => ({
                    ...prev,
                    prix: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="Ex: 499 pour 4,99€"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de service
              </label>
              <select
                value={newTarif.typeService || ""}
                onChange={(e) =>
                  setNewTarif((prev) => ({
                    ...prev,
                    typeService: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="par page">par page</option>
                <option value="forfait">forfait</option>
                <option value="supplément">supplément</option>
                <option value="à l'heure">à l'heure</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée estimée (optionnel)
              </label>
              <input
                type="text"
                value={newTarif.dureeEstimee || ""}
                onChange={(e) =>
                  setNewTarif((prev) => ({
                    ...prev,
                    dureeEstimee: e.target.value,
                  }))
                }
                placeholder="Ex: 5-7 jours"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={newTarif.actif ? "true" : "false"}
                onChange={(e) =>
                  setNewTarif((prev) => ({
                    ...prev,
                    actif: e.target.value === "true",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateTarif}
              disabled={isLoading || !newTarif.nom || !newTarif.description}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              Créer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal édition */}
      <Modal
        isOpen={!!editingTarif}
        onClose={() => setEditingTarif(null)}
        title="Modifier le tarif"
        size="lg"
      >
        {editingTarif && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du service
              </label>
              <input
                type="text"
                value={editingTarif.nom}
                onChange={(e) =>
                  setEditingTarif((prev) =>
                    prev ? { ...prev, nom: e.target.value } : null
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={editingTarif.description}
                onChange={(e) =>
                  setEditingTarif((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (en centimes)
                </label>
                <input
                  type="number"
                  value={editingTarif.prix}
                  onChange={(e) =>
                    setEditingTarif((prev) =>
                      prev
                        ? { ...prev, prix: parseInt(e.target.value) || 0 }
                        : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de service
                </label>
                <select
                  value={editingTarif.typeService}
                  onChange={(e) =>
                    setEditingTarif((prev) =>
                      prev ? { ...prev, typeService: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="par page">par page</option>
                  <option value="forfait">forfait</option>
                  <option value="supplément">supplément</option>
                  <option value="à l'heure">à l'heure</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setEditingTarif(null)}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleEditTarif(editingTarif)}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                Enregistrer
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
          setTarifToDelete(null);
        }}
        onConfirm={() => tarifToDelete && handleDeleteTarif(tarifToDelete)}
        title="Supprimer le tarif"
        message="Êtes-vous sûr de vouloir supprimer ce tarif ? Cette action est irréversible."
        confirmText="Supprimer"
        type="danger"
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminTarifs;
