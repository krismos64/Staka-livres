import React, { useEffect, useMemo, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { PageStatique, StatutPage } from "../../types/shared";
import { mockPagesStatiques } from "../../utils/mockData";

const AdminPages: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<PageStatique[]>([]);
  const [filtreStatut, setFiltreStatut] = useState<StatutPage | "tous">("tous");
  const [recherche, setRecherche] = useState("");
  const [selectedPage, setSelectedPage] = useState<PageStatique | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<PageStatique>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const pagesData = mockPagesStatiques;
        setPages(pagesData);
      } catch (error) {
        console.error("Erreur lors du chargement des pages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, []);

  const pagesFiltrees = useMemo(() => {
    return pages.filter((page) => {
      const matchRecherche =
        page.titre.toLowerCase().includes(recherche.toLowerCase()) ||
        page.slug.toLowerCase().includes(recherche.toLowerCase());
      const matchStatut =
        filtreStatut === "tous" || page.statut === filtreStatut;

      return matchRecherche && matchStatut;
    });
  }, [pages, recherche, filtreStatut]);

  const stats = useMemo(() => {
    const total = pages.length;
    const publiees = pages.filter(
      (p) => p.statut === StatutPage.PUBLIEE
    ).length;
    const brouillons = pages.filter(
      (p) => p.statut === StatutPage.BROUILLON
    ).length;

    return { total, publiees, brouillons };
  }, [pages]);

  const handleEdit = (page?: PageStatique) => {
    if (page) {
      setEditingPage({ ...page });
      setSelectedPage(page);
    } else {
      setEditingPage({
        titre: "",
        slug: "",
        contenu: "",
        statut: StatutPage.BROUILLON,
        description: "",
      });
      setSelectedPage(null);
    }
    setShowEditModal(true);
  };

  const handleSave = async () => {
    setSaveLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (selectedPage) {
        // Modification
        setPages(
          pages.map((p) =>
            p.id === selectedPage.id
              ? {
                  ...p,
                  ...editingPage,
                  updatedAt: new Date().toISOString(),
                }
              : p
          )
        );
      } else {
        // Création
        const nouvellePage: PageStatique = {
          id: `page_${Date.now()}`,
          titre: editingPage.titre!,
          slug: editingPage.slug!,
          contenu: editingPage.contenu!,
          statut: editingPage.statut as StatutPage,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          description: editingPage.description || "",
        };
        setPages([nouvellePage, ...pages]);
      }

      setShowEditModal(false);
      setEditingPage({});
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPage) return;

    setSaveLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPages(pages.filter((p) => p.id !== selectedPage.id));
      setShowDeleteModal(false);
      setSelectedPage(null);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleStatut = async (page: PageStatique) => {
    const nouveauStatut: StatutPage =
      page.statut === StatutPage.PUBLIEE
        ? StatutPage.BROUILLON
        : StatutPage.PUBLIEE;

    setPages(
      pages.map((p) =>
        p.id === page.id
          ? {
              ...p,
              statut: nouveauStatut,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const getStatutBadge = (statut: StatutPage) => {
    const styles = {
      [StatutPage.PUBLIEE]: "bg-green-100 text-green-800 border-green-200",
      [StatutPage.BROUILLON]: "bg-yellow-100 text-yellow-800 border-yellow-200",
      [StatutPage.ARCHIVEE]: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const icons = {
      [StatutPage.PUBLIEE]: "fas fa-check-circle",
      [StatutPage.BROUILLON]: "fas fa-edit",
      [StatutPage.ARCHIVEE]: "fas fa-archive",
    };

    const labels = {
      [StatutPage.PUBLIEE]: "Publiée",
      [StatutPage.BROUILLON]: "Brouillon",
      [StatutPage.ARCHIVEE]: "Archivée",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[statut]}`}
      >
        <i className={`${icons[statut]} mr-1`}></i>
        {labels[statut]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pages statiques</h1>
          <p className="text-gray-600">Contenu éditorial et pages marketing</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pages statiques</h1>
          <p className="text-gray-600">Contenu éditorial et pages marketing</p>
        </div>

        <button
          onClick={() => handleEdit()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="fas fa-plus mr-2"></i>
          Nouvelle page
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total des pages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-file-alt text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pages publiées</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.publiees}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-globe text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Brouillons</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.brouillons}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-edit text-yellow-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher par titre ou slug..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filtreStatut}
            onChange={(e) =>
              setFiltreStatut(e.target.value as StatutPage | "tous")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="tous">Tous les statuts</option>
            <option value={StatutPage.PUBLIEE}>Publiées</option>
            <option value={StatutPage.BROUILLON}>Brouillons</option>
            <option value={StatutPage.ARCHIVEE}>Archivées</option>
          </select>
        </div>
      </div>

      {/* Liste des pages */}
      {pagesFiltrees.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <i className="fas fa-file-alt text-4xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {recherche ? "Aucune page trouvée" : "Aucune page statique"}
          </h3>
          <p className="text-gray-500 mb-6">
            {recherche
              ? "Essayez de modifier vos critères de recherche"
              : "Commencez par créer votre première page statique"}
          </p>
          {!recherche && (
            <button
              onClick={() => handleEdit()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Créer une page
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière modification
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagesFiltrees.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {page.titre}
                        </div>
                        <div className="text-sm text-gray-500">
                          /{page.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatutBadge(page.statut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(page.updatedAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPage(page);
                            setShowPreviewModal(true);
                          }}
                          className="text-gray-400 hover:text-blue-600 p-1"
                          title="Aperçu"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => handleEdit(page)}
                          className="text-gray-400 hover:text-blue-600 p-1"
                          title="Modifier"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => toggleStatut(page)}
                          className="text-gray-400 hover:text-green-600 p-1"
                          title={
                            page.statut === StatutPage.PUBLIEE
                              ? "Mettre en brouillon"
                              : "Publier"
                          }
                        >
                          <i
                            className={
                              page.statut === StatutPage.PUBLIEE
                                ? "fas fa-eye-slash"
                                : "fas fa-globe"
                            }
                          ></i>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPage(page);
                            setShowDeleteModal(true);
                          }}
                          className="text-gray-400 hover:text-red-600 p-1"
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
        </div>
      )}

      {/* Modal d'édition */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={selectedPage ? "Modifier la page" : "Nouvelle page"}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre
            </label>
            <input
              type="text"
              value={editingPage.titre || ""}
              onChange={(e) =>
                setEditingPage({ ...editingPage, titre: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Titre de la page"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL)
            </label>
            <input
              type="text"
              value={editingPage.slug || ""}
              onChange={(e) =>
                setEditingPage({ ...editingPage, slug: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="slug-de-la-page"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={editingPage.description || ""}
              onChange={(e) =>
                setEditingPage({ ...editingPage, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description courte de la page"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenu
            </label>
            <textarea
              value={editingPage.contenu || ""}
              onChange={(e) =>
                setEditingPage({ ...editingPage, contenu: e.target.value })
              }
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Contenu de la page en HTML..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={editingPage.statut || StatutPage.BROUILLON}
              onChange={(e) =>
                setEditingPage({
                  ...editingPage,
                  statut: e.target.value as StatutPage,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={StatutPage.BROUILLON}>Brouillon</option>
              <option value={StatutPage.PUBLIEE}>Publiée</option>
              <option value={StatutPage.ARCHIVEE}>Archivée</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowEditModal(false)}
              disabled={saveLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saveLoading || !editingPage.titre || !editingPage.slug}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saveLoading && <LoadingSpinner size="sm" color="white" />}
              {selectedPage ? "Modifier" : "Créer"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal aperçu */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Aperçu de la page"
        size="lg"
      >
        {selectedPage && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {selectedPage.titre}
              </h3>
              <p className="text-sm text-gray-500">/{selectedPage.slug}</p>
            </div>
            {selectedPage.description && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedPage.description}</p>
              </div>
            )}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Contenu</h4>
              <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                <div
                  dangerouslySetInnerHTML={{ __html: selectedPage.contenu }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer la page"
        message={`Êtes-vous sûr de vouloir supprimer la page "${selectedPage?.titre}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        type="danger"
        isLoading={saveLoading}
      />
    </div>
  );
};

export default AdminPages;
