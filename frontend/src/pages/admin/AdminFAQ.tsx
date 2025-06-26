import React, { useEffect, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { FAQ } from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";
import { useToasts } from "../../utils/toast";

const AdminFAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categorieFilter, setCategorieFilter] = useState<string>("TOUTES");
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    question: "",
    reponse: "",
    categorie: "",
    ordre: 1,
    visible: true,
  });
  const { showToast } = useToasts();

  // Liste des catégories disponibles
  const categories = [
    "Correction",
    "Relecture",
    "Tarifs",
    "Délais",
    "Formats",
    "Paiement",
    "Général",
  ];

  const loadFAQs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await adminAPI.getFAQ();
      setFaqs(response);

      showToast("success", "Données chargées", "Liste des FAQ mise à jour");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de chargement des FAQ";
      setError(errorMessage);
      showToast("error", "Erreur", errorMessage);
      console.error("Erreur chargement FAQ:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory =
      categorieFilter === "TOUTES" || faq.categorie === categorieFilter;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.reponse.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateFAQ = () => {
    setEditFormData({
      question: "",
      reponse: "",
      categorie: categories[0],
      ordre: Math.max(...faqs.map((f) => f.ordre), 0) + 1,
      visible: true,
    });
    setIsEditing(true);
    setSelectedFAQ(null);
    setShowFAQModal(true);
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditFormData({
      question: faq.question,
      reponse: faq.reponse,
      categorie: faq.categorie,
      ordre: faq.ordre,
      visible: faq.visible,
    });
    setIsEditing(true);
    setSelectedFAQ(faq);
    setShowFAQModal(true);
  };

  const handleViewFAQ = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setIsEditing(false);
    setShowFAQModal(true);
  };

  const handleSaveFAQ = async () => {
    try {
      setIsOperationLoading(true);

      if (selectedFAQ) {
        // Mise à jour
        await adminAPI.updateFAQ(selectedFAQ.id, editFormData);
        showToast(
          "success",
          "FAQ modifiée",
          "La FAQ a été mise à jour avec succès"
        );
      } else {
        // Création
        await adminAPI.createFAQ(editFormData);
        showToast(
          "success",
          "FAQ créée",
          "La nouvelle FAQ a été ajoutée avec succès"
        );
      }

      setShowFAQModal(false);
      setSelectedFAQ(null);
      await loadFAQs();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de sauvegarde de la FAQ";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleToggleVisibility = async (faq: FAQ) => {
    try {
      setIsOperationLoading(true);

      await adminAPI.updateFAQ(faq.id, { visible: !faq.visible });
      showToast(
        "success",
        "Visibilité modifiée",
        `FAQ ${!faq.visible ? "rendue visible" : "masquée"}`
      );

      await loadFAQs();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de modification de la visibilité";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleUpdateOrder = async (faq: FAQ, newOrder: number) => {
    try {
      setIsOperationLoading(true);

      await adminAPI.updateFAQ(faq.id, { ordre: newOrder });
      showToast(
        "success",
        "Ordre modifié",
        "L'ordre de la FAQ a été mis à jour"
      );

      await loadFAQs();
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

  const handleDeleteFAQ = (faq: FAQ) => {
    setFaqToDelete(faq);
    setShowDeleteModal(true);
  };

  const confirmDeleteFAQ = async () => {
    if (!faqToDelete) return;

    try {
      setIsOperationLoading(true);

      await adminAPI.deleteFAQ(faqToDelete.id);
      showToast(
        "success",
        "FAQ supprimée",
        "La FAQ a été supprimée avec succès"
      );

      setShowDeleteModal(false);
      setFaqToDelete(null);
      await loadFAQs();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de suppression de la FAQ";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFAQs();
  };

  if (isLoading && faqs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Chargement des FAQ...</span>
      </div>
    );
  }

  if (error && faqs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <i className="fas fa-question-circle text-5xl"></i>
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des FAQ</h1>
          <p className="text-gray-600">
            Gérez les questions fréquemment posées
          </p>
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
            onClick={handleCreateFAQ}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Nouvelle FAQ
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-question-circle text-blue-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total FAQ</p>
              <p className="text-xl font-bold text-gray-900">{faqs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-eye text-green-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Visibles</p>
              <p className="text-xl font-bold text-gray-900">
                {faqs.filter((f) => f.visible).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-eye-slash text-yellow-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Masquées</p>
              <p className="text-xl font-bold text-gray-900">
                {faqs.filter((f) => !f.visible).length}
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
              <p className="text-sm text-gray-600">Catégories</p>
              <p className="text-xl font-bold text-gray-900">
                {new Set(faqs.map((f) => f.categorie)).size}
              </p>
            </div>
          </div>
        </div>
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
                placeholder="Rechercher dans les questions et réponses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtre par catégorie */}
          <div className="flex items-center gap-2">
            <i className="fas fa-filter text-gray-400"></i>
            <select
              value={categorieFilter}
              onChange={(e) => setCategorieFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TOUTES">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des FAQ */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visibilité
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFAQs
                .sort((a, b) => a.ordre - b.ordre)
                .map((faq) => (
                  <tr key={faq.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={faq.ordre}
                        onChange={(e) =>
                          handleUpdateOrder(faq, parseInt(e.target.value) || 1)
                        }
                        disabled={isOperationLoading}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        min="1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {faq.question}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {faq.reponse.substring(0, 100)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {faq.categorie}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleVisibility(faq)}
                        disabled={isOperationLoading}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                          faq.visible
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        <i
                          className={`fas ${
                            faq.visible ? "fa-eye" : "fa-eye-slash"
                          } mr-1`}
                        ></i>
                        {faq.visible ? "Visible" : "Masquée"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Voir */}
                        <button
                          onClick={() => handleViewFAQ(faq)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Voir les détails"
                        >
                          <i className="fas fa-eye"></i>
                        </button>

                        {/* Modifier */}
                        <button
                          onClick={() => handleEditFAQ(faq)}
                          disabled={isOperationLoading}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Modifier"
                        >
                          <i className="fas fa-edit"></i>
                        </button>

                        {/* Supprimer */}
                        <button
                          onClick={() => handleDeleteFAQ(faq)}
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
        {filteredFAQs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <i className="fas fa-question-circle text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune FAQ trouvée
            </h3>
            <p className="text-gray-500">
              {searchQuery || categorieFilter !== "TOUTES"
                ? "Essayez de modifier vos filtres de recherche"
                : "Commencez par créer votre première FAQ"}
            </p>
            {!searchQuery && categorieFilter === "TOUTES" && (
              <button
                onClick={handleCreateFAQ}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Créer une FAQ
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal FAQ */}
      <Modal
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
        title={
          isEditing
            ? selectedFAQ
              ? "Modifier la FAQ"
              : "Nouvelle FAQ"
            : "Détails de la FAQ"
        }
        size="lg"
      >
        <div className="space-y-4">
          {isEditing ? (
            <>
              {/* Mode édition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question
                </label>
                <input
                  type="text"
                  value={editFormData.question}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      question: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Entrez la question..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Réponse
                </label>
                <textarea
                  value={editFormData.reponse}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      reponse: e.target.value,
                    })
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Entrez la réponse..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={editFormData.categorie}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        categorie: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
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
                    Visibilité
                  </label>
                  <select
                    value={editFormData.visible.toString()}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        visible: e.target.value === "true",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">Visible</option>
                    <option value="false">Masquée</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowFAQModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveFAQ}
                  disabled={
                    isOperationLoading ||
                    !editFormData.question ||
                    !editFormData.reponse
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
            selectedFAQ && (
              <>
                {/* Mode visualisation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedFAQ.question}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Réponse
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedFAQ.reponse}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {selectedFAQ.categorie}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordre
                    </label>
                    <p className="text-gray-900">{selectedFAQ.ordre}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibilité
                    </label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedFAQ.visible
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <i
                        className={`fas ${
                          selectedFAQ.visible ? "fa-eye" : "fa-eye-slash"
                        } mr-1`}
                      ></i>
                      {selectedFAQ.visible ? "Visible" : "Masquée"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => handleEditFAQ(selectedFAQ)}
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
        onConfirm={confirmDeleteFAQ}
        title="Confirmer la suppression"
        message={
          faqToDelete
            ? `Êtes-vous sûr de vouloir supprimer la FAQ "${faqToDelete.question}" ? Cette action est irréversible.`
            : ""
        }
        type="danger"
        isLoading={isOperationLoading}
      />
    </div>
  );
};

export default AdminFAQ;
