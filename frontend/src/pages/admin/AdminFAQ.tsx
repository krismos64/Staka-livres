import React, { useEffect, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { FAQ } from "../../types/shared";
import { createFAQ, deleteFAQ, getFAQ, updateFAQ } from "../../utils/adminAPI";
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
    answer: "",
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

      const response = await getFAQ();
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
      faq.answer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false;
    return matchesCategory && matchesSearch;
  });

  const handleCreateFAQ = () => {
    setEditFormData({
      question: "",
      answer: "",
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
      answer: faq.answer,
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
        await updateFAQ(selectedFAQ.id, editFormData);
        showToast(
          "success",
          "FAQ modifiée",
          "La FAQ a été mise à jour avec succès"
        );
      } else {
        // Création
        await createFAQ(editFormData);
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

      await updateFAQ(faq.id, { visible: !faq.visible });
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

      await updateFAQ(faq.id, { ordre: newOrder });
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

      await deleteFAQ(faqToDelete.id);
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header avec actions */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center">
              <i className="fas fa-question-circle mr-3"></i>
              Gestion des FAQ
            </h1>
            <p className="text-blue-100 mt-1">
              Gérez les questions fréquemment posées de votre site
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <>
                  <i className="fas fa-sync-alt mr-2"></i>
                  Actualiser
                </>
              )}
            </button>
            <button
              onClick={handleCreateFAQ}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium flex items-center justify-center shadow-lg"
            >
              <i className="fas fa-plus mr-2"></i>
              <span className="hidden sm:inline">Nouvelle FAQ</span>
              <span className="sm:hidden">Créer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats modernes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-question-circle text-white"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Total FAQ</p>
              <p className="text-2xl font-bold text-blue-900">{faqs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-eye text-white"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">Visibles</p>
              <p className="text-2xl font-bold text-green-900">
                {faqs.filter((f) => f.visible).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-eye-slash text-white"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-700">Masquées</p>
              <p className="text-2xl font-bold text-yellow-900">
                {faqs.filter((f) => !f.visible).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-tags text-white"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-700">Catégories</p>
              <p className="text-2xl font-bold text-purple-900">
                {new Set(faqs.map((f) => f.categorie)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche modernes */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col space-y-4">
          {/* Titre de la section */}
          <div className="flex items-center mb-2">
            <div className="bg-indigo-100 rounded-full p-2 mr-3">
              <i className="fas fa-search text-indigo-600"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              Recherche et filtres
            </h3>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher une FAQ
              </label>
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Tapez votre recherche (questions, réponses, catégories)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all bg-gray-50 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-sm text-blue-600 mt-1">
                  📝 {filteredFAQs.length} résultat(s) trouvé(s)
                </p>
              )}
            </div>

            {/* Filtre par catégorie */}
            <div className="lg:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par catégorie
              </label>
              <div className="relative">
                <i className="fas fa-filter absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <select
                  value={categorieFilter}
                  onChange={(e) => setCategorieFilter(e.target.value)}
                  className="w-full pl-12 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all bg-gray-50 focus:bg-white appearance-none"
                >
                  <option value="TOUTES">🌐 Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      📂 {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé des filtres */}
          {(searchQuery || categorieFilter !== "TOUTES") && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-blue-800">
                  Filtres actifs :
                </span>
                {searchQuery && (
                  <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    🔍 Recherche: "{searchQuery}"
                  </span>
                )}
                {categorieFilter !== "TOUTES" && (
                  <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                    📂 Catégorie: {categorieFilter}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCategorieFilter("TOUTES");
                  }}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-2"
                >
                  ✖️ Effacer tout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Liste des FAQ - Responsive */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Vue tableau pour desktop */}
        <div className="hidden md:block overflow-x-auto">
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
                          {faq.answer?.substring(0, 100) || "Pas de réponse"}...
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

        {/* Vue cards pour mobile */}
        <div className="md:hidden space-y-4 p-4">
          {filteredFAQs
            .sort((a, b) => a.ordre - b.ordre)
            .map((faq) => (
              <div
                key={faq.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Header de la card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="bg-blue-500 text-white rounded-full p-2 flex-shrink-0">
                      <i className="fas fa-question-circle text-sm"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                        {faq.question}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {faq.answer?.substring(0, 80) || "Pas de réponse"}...
                      </p>
                    </div>
                  </div>

                  {/* Badge ordre */}
                  <div className="bg-indigo-100 text-indigo-800 rounded-full px-2 py-1 text-xs font-bold ml-2">
                    #{faq.ordre}
                  </div>
                </div>

                {/* Informations de la card */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Catégorie */}
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center mb-1">
                      <i className="fas fa-tags text-purple-500 text-xs mr-2"></i>
                      <span className="text-xs font-medium text-gray-600">
                        Catégorie
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-purple-700">
                      📂 {faq.categorie}
                    </span>
                  </div>

                  {/* Ordre éditable */}
                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                    <div className="flex items-center mb-1">
                      <i className="fas fa-sort-numeric-up text-indigo-500 text-xs mr-2"></i>
                      <span className="text-xs font-medium text-gray-600">
                        Ordre
                      </span>
                    </div>
                    <input
                      type="number"
                      value={faq.ordre}
                      onChange={(e) =>
                        handleUpdateOrder(faq, parseInt(e.target.value) || 1)
                      }
                      disabled={isOperationLoading}
                      className="w-full text-sm font-semibold bg-white border border-indigo-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                      min="1"
                    />
                  </div>
                </div>

                {/* Toggle visibilité */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 flex items-center">
                      <i className="fas fa-eye text-gray-400 mr-2"></i>
                      Visibilité
                    </span>
                    <button
                      onClick={() => handleToggleVisibility(faq)}
                      disabled={isOperationLoading}
                      className={`px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                        faq.visible
                          ? "bg-green-500 text-white shadow-green-200 shadow-lg"
                          : "bg-red-500 text-white shadow-red-200 shadow-lg"
                      }`}
                    >
                      <i
                        className={`fas ${
                          faq.visible ? "fa-eye" : "fa-eye-slash"
                        } mr-1`}
                      ></i>
                      {faq.visible ? "Visible" : "Masquée"}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleViewFAQ(faq)}
                    className="bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center"
                    title="Voir les détails"
                  >
                    <i className="fas fa-eye mr-1"></i>
                    Voir
                  </button>

                  <button
                    onClick={() => handleEditFAQ(faq)}
                    disabled={isOperationLoading}
                    className="bg-green-100 text-green-600 hover:bg-green-200 rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center disabled:opacity-50"
                    title="Modifier"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Modifier
                  </button>

                  <button
                    onClick={() => handleDeleteFAQ(faq)}
                    disabled={isOperationLoading}
                    className="bg-red-100 text-red-600 hover:bg-red-200 rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center disabled:opacity-50"
                    title="Supprimer"
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* État vide */}
        {filteredFAQs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-question-circle text-blue-500 text-3xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune FAQ trouvée
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || categorieFilter !== "TOUTES"
                ? "Essayez de modifier vos filtres de recherche"
                : "Commencez par créer votre première FAQ"}
            </p>
            {!searchQuery && categorieFilter === "TOUTES" && (
              <button
                onClick={handleCreateFAQ}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
              >
                <i className="fas fa-plus mr-2"></i>
                Créer votre première FAQ
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal FAQ Moderne */}
      <Modal
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
        title=""
        size="xl"
      >
        <div className="relative">
          {/* Header avec gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 -mx-6 -mt-6 mb-8 px-6 py-6 rounded-t-lg">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <i
                    className={`fas ${
                      isEditing
                        ? selectedFAQ
                          ? "fa-edit"
                          : "fa-plus"
                        : "fa-eye"
                    } text-xl`}
                  ></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {isEditing
                      ? selectedFAQ
                        ? "✨ Modifier la FAQ"
                        : "🚀 Nouvelle FAQ"
                      : "👁️ Détails de la FAQ"}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {isEditing
                      ? "Personnalisez votre question-réponse"
                      : "Visualisation des informations"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFAQModal(false)}
                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-6">
              {/* Section Question */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-500 text-white rounded-full p-2 mr-3">
                    <i className="fas fa-question-circle"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Question
                  </h3>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={editFormData.question}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        question: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white/70 backdrop-blur-sm"
                    placeholder="❓ Quelle question vos clients se posent-ils souvent ?"
                  />
                  <div className="absolute right-3 top-3 text-gray-400">
                    <i className="fas fa-question"></i>
                  </div>
                </div>
                {editFormData.question && (
                  <div className="mt-3 text-sm text-blue-600">
                    ✅ {editFormData.question.length} caractères
                  </div>
                )}
              </div>

              {/* Section Réponse */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="bg-green-500 text-white rounded-full p-2 mr-3">
                    <i className="fas fa-comment-dots"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Réponse détaillée
                  </h3>
                </div>
                <div className="relative">
                  <textarea
                    value={editFormData.answer}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        answer: e.target.value,
                      })
                    }
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-400 transition-all bg-white/70 backdrop-blur-sm resize-none"
                    placeholder="💬 Rédigez une réponse claire et complète qui aidera vos clients..."
                  />
                  <div className="absolute right-3 top-3 text-gray-400">
                    <i className="fas fa-pen"></i>
                  </div>
                </div>
                {editFormData.answer && (
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-green-600">
                      ✅ {editFormData.answer.length} caractères
                    </span>
                    <span className="text-gray-500">
                      ~{Math.ceil(editFormData.answer.split(" ").length / 200)}{" "}
                      min de lecture
                    </span>
                  </div>
                )}
              </div>

              {/* Section Configuration */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-500 text-white rounded-full p-2 mr-3">
                    <i className="fas fa-cogs"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Configuration
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Catégorie */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-tags mr-2 text-purple-500"></i>
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
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/70 backdrop-blur-sm appearance-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          📂 {cat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-9 text-gray-400 pointer-events-none">
                      <i className="fas fa-chevron-down"></i>
                    </div>
                  </div>

                  {/* Ordre */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-sort-numeric-up mr-2 text-purple-500"></i>
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
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/70 backdrop-blur-sm"
                      min="1"
                      placeholder="1"
                    />
                  </div>

                  {/* Visibilité */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-eye mr-2 text-purple-500"></i>
                      Visibilité
                    </label>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData({
                            ...editFormData,
                            visible: true,
                          })
                        }
                        className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                          editFormData.visible
                            ? "bg-green-500 text-white border-green-500 shadow-lg"
                            : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
                        }`}
                      >
                        <i className="fas fa-eye mr-2"></i>
                        Visible
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData({
                            ...editFormData,
                            visible: false,
                          })
                        }
                        className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                          !editFormData.visible
                            ? "bg-red-500 text-white border-red-500 shadow-lg"
                            : "bg-white border-gray-200 text-gray-600 hover:border-red-300"
                        }`}
                      >
                        <i className="fas fa-eye-slash mr-2"></i>
                        Masquée
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview en temps réel */}
              {editFormData.question && editFormData.answer && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-yellow-500 text-white rounded-full p-2 mr-3">
                      <i className="fas fa-eye"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      📱 Aperçu sur le site
                    </h3>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500 text-white rounded-full p-2 flex-shrink-0">
                        <i className="fas fa-question-circle"></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {editFormData.question}
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {editFormData.answer}
                        </p>
                        <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded-full">
                            📂 {editFormData.categorie}
                          </span>
                          <span>
                            {editFormData.visible ? "👁️ Visible" : "🙈 Masquée"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowFAQModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  <i className="fas fa-times mr-2"></i>
                  Annuler
                </button>
                <button
                  onClick={handleSaveFAQ}
                  disabled={
                    !editFormData.question.trim() ||
                    !editFormData.answer.trim() ||
                    isOperationLoading
                  }
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOperationLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-2">Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      {selectedFAQ ? "Mettre à jour" : "Créer la FAQ"}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            selectedFAQ && (
              <div className="space-y-6">
                {/* Vue détaillée moderne */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-500 text-white rounded-full p-3 mr-4">
                      <i className="fas fa-question-circle text-xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Question
                    </h3>
                  </div>
                  <p className="text-lg text-gray-900 font-medium leading-relaxed">
                    {selectedFAQ.question}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-500 text-white rounded-full p-3 mr-4">
                      <i className="fas fa-comment-dots text-xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Réponse</h3>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedFAQ.answer}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center mb-2">
                      <i className="fas fa-tags text-purple-500 mr-2"></i>
                      <span className="text-sm font-medium text-gray-600">
                        Catégorie
                      </span>
                    </div>
                    <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-full bg-purple-500 text-white">
                      📂 {selectedFAQ.categorie}
                    </span>
                  </div>

                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-center mb-2">
                      <i className="fas fa-sort-numeric-up text-indigo-500 mr-2"></i>
                      <span className="text-sm font-medium text-gray-600">
                        Ordre
                      </span>
                    </div>
                    <div className="text-xl font-bold text-indigo-600">
                      #{selectedFAQ.ordre}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center mb-2">
                      <i className="fas fa-eye text-gray-500 mr-2"></i>
                      <span className="text-sm font-medium text-gray-600">
                        Statut
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-full ${
                        selectedFAQ.visible
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      <i
                        className={`fas ${
                          selectedFAQ.visible ? "fa-eye" : "fa-eye-slash"
                        } mr-2`}
                      ></i>
                      {selectedFAQ.visible ? "Visible" : "Masquée"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleEditFAQ(selectedFAQ)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Modifier cette FAQ
                  </button>
                </div>
              </div>
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
