import React, { useMemo, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import Modal from "../../components/common/Modal";
import { FAQ } from "../../types/shared";
import { mockFAQ } from "../../utils/mockData";

const AdminFAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>(mockFAQ);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Nouvelle FAQ vide
  const [newFaq, setNewFaq] = useState<Partial<FAQ>>({
    question: "",
    reponse: "",
    categorie: "Général",
    visible: true,
  });

  // Obtenir toutes les catégories uniques
  const categories = useMemo(() => {
    const cats = [...new Set(faqs.map((faq) => faq.categorie))];
    return cats.sort();
  }, [faqs]);

  // Filtrage des FAQs
  const filteredFaqs = useMemo(() => {
    return faqs
      .filter((faq) => {
        const matchesCategory =
          !selectedCategory || faq.categorie === selectedCategory;
        const matchesSearch =
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.reponse.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => a.ordre - b.ordre);
  }, [faqs, selectedCategory, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleCreateFaq = async () => {
    if (!newFaq.question || !newFaq.reponse) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const faq: FAQ = {
      id: `faq-${Date.now()}`,
      question: newFaq.question!,
      reponse: newFaq.reponse!,
      categorie: newFaq.categorie || "Général",
      ordre: faqs.length + 1,
      visible: newFaq.visible || true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFaqs((prev) => [...prev, faq]);
    setNewFaq({
      question: "",
      reponse: "",
      categorie: "Général",
      visible: true,
    });
    setIsCreateModalOpen(false);
    setIsLoading(false);
  };

  const handleEditFaq = async (updatedFaq: FAQ) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setFaqs((prev) =>
      prev.map((faq) =>
        faq.id === updatedFaq.id
          ? { ...updatedFaq, updatedAt: new Date().toISOString() }
          : faq
      )
    );
    setEditingFaq(null);
    setIsLoading(false);
  };

  const handleDeleteFaq = async (id: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setFaqs((prev) => prev.filter((f) => f.id !== id));
    setShowDeleteConfirm(false);
    setFaqToDelete(null);
    setIsLoading(false);
  };

  const handleToggleVisibility = async (faq: FAQ) => {
    setFaqs((prev) =>
      prev.map((f) =>
        f.id === faq.id
          ? { ...f, visible: !f.visible, updatedAt: new Date().toISOString() }
          : f
      )
    );
  };

  const handleReorder = (id: string, direction: "up" | "down") => {
    const currentIndex = faqs.findIndex((f) => f.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= faqs.length) return;

    const newFaqs = [...faqs];
    [newFaqs[currentIndex], newFaqs[newIndex]] = [
      newFaqs[newIndex],
      newFaqs[currentIndex],
    ];

    // Mettre à jour les ordres
    newFaqs.forEach((faq, index) => {
      faq.ordre = index + 1;
    });

    setFaqs(newFaqs);
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <i className="fas fa-question-circle text-white text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total questions</p>
              <p className="text-2xl font-bold text-gray-900">{faqs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
              <i className="fas fa-eye text-white text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Visibles</p>
              <p className="text-2xl font-bold text-gray-900">
                {faqs.filter((f) => f.visible).length}
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
              <p className="text-sm text-gray-600">Catégories</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-400 rounded-lg flex items-center justify-center">
              <i className="fas fa-eye-slash text-white text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Masquées</p>
              <p className="text-2xl font-bold text-gray-900">
                {faqs.filter((f) => !f.visible).length}
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
                placeholder="Rechercher dans les questions et réponses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Nouvelle question
          </button>
        </div>
      </div>

      {/* Liste des FAQs */}
      <div className="space-y-4">
        {filteredFaqs.map((faq, index) => (
          <div
            key={faq.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-medium text-gray-500">
                      #{faq.ordre}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        faq.visible
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {faq.visible ? "Visible" : "Masqué"}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {faq.categorie}
                    </span>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {faq.question}
                  </h3>

                  <div className="text-gray-600 text-sm leading-relaxed mb-4">
                    {faq.reponse.length > 200
                      ? `${faq.reponse.substring(0, 200)}...`
                      : faq.reponse}
                  </div>

                  <div className="text-xs text-gray-500">
                    Mis à jour le {formatDate(faq.updatedAt)}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleReorder(faq.id, "up")}
                    disabled={index === 0}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Monter"
                  >
                    <i className="fas fa-chevron-up"></i>
                  </button>

                  <button
                    onClick={() => handleReorder(faq.id, "down")}
                    disabled={index === filteredFaqs.length - 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Descendre"
                  >
                    <i className="fas fa-chevron-down"></i>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleToggleVisibility(faq)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    faq.visible
                      ? "text-yellow-600 hover:bg-yellow-50"
                      : "text-green-600 hover:bg-green-50"
                  }`}
                >
                  <i
                    className={`fas ${
                      faq.visible ? "fa-eye-slash" : "fa-eye"
                    } mr-1`}
                  ></i>
                  {faq.visible ? "Masquer" : "Afficher"}
                </button>

                <button
                  onClick={() => setEditingFaq(faq)}
                  className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-colors"
                >
                  <i className="fas fa-edit mr-1"></i>
                  Modifier
                </button>

                <button
                  onClick={() => {
                    setFaqToDelete(faq.id);
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

      {filteredFaqs.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <i className="fas fa-question-circle text-gray-300 text-4xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune question trouvée
          </h3>
          <p className="text-gray-500 mb-4">
            Aucune question ne correspond à vos critères de recherche.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer la première question
          </button>
        </div>
      )}

      {/* Modal création */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewFaq({
            question: "",
            reponse: "",
            categorie: "Général",
            visible: true,
          });
        }}
        title="Nouvelle question FAQ"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question
            </label>
            <input
              type="text"
              value={newFaq.question || ""}
              onChange={(e) =>
                setNewFaq((prev) => ({ ...prev, question: e.target.value }))
              }
              placeholder="Entrez la question..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Réponse
            </label>
            <textarea
              value={newFaq.reponse || ""}
              onChange={(e) =>
                setNewFaq((prev) => ({ ...prev, reponse: e.target.value }))
              }
              placeholder="Entrez la réponse détaillée..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={newFaq.categorie || ""}
                onChange={(e) =>
                  setNewFaq((prev) => ({ ...prev, categorie: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Nouvelle catégorie">+ Nouvelle catégorie</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibilité
              </label>
              <select
                value={newFaq.visible ? "true" : "false"}
                onChange={(e) =>
                  setNewFaq((prev) => ({
                    ...prev,
                    visible: e.target.value === "true",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Visible</option>
                <option value="false">Masqué</option>
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
              onClick={handleCreateFaq}
              disabled={isLoading || !newFaq.question || !newFaq.reponse}
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
        isOpen={!!editingFaq}
        onClose={() => setEditingFaq(null)}
        title="Modifier la question FAQ"
        size="lg"
      >
        {editingFaq && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question
              </label>
              <input
                type="text"
                value={editingFaq.question}
                onChange={(e) =>
                  setEditingFaq((prev) =>
                    prev ? { ...prev, question: e.target.value } : null
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Réponse
              </label>
              <textarea
                value={editingFaq.reponse}
                onChange={(e) =>
                  setEditingFaq((prev) =>
                    prev ? { ...prev, reponse: e.target.value } : null
                  )
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={editingFaq.categorie}
                  onChange={(e) =>
                    setEditingFaq((prev) =>
                      prev ? { ...prev, categorie: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibilité
                </label>
                <select
                  value={editingFaq.visible ? "true" : "false"}
                  onChange={(e) =>
                    setEditingFaq((prev) =>
                      prev
                        ? { ...prev, visible: e.target.value === "true" }
                        : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Visible</option>
                  <option value="false">Masqué</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setEditingFaq(null)}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleEditFaq(editingFaq)}
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
          setFaqToDelete(null);
        }}
        onConfirm={() => faqToDelete && handleDeleteFaq(faqToDelete)}
        title="Supprimer la question"
        message="Êtes-vous sûr de vouloir supprimer cette question FAQ ? Cette action est irréversible."
        confirmText="Supprimer"
        type="danger"
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminFAQ;
