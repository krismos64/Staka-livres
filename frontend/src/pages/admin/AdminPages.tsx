import React, { useEffect, useMemo, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { PageStatique, StatutPage } from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";
import { useToasts } from "../../utils/toast";

const AdminPages: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<PageStatique[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<StatutPage | "tous">("tous");
  const [recherche, setRecherche] = useState("");
  const [selectedPage, setSelectedPage] = useState<PageStatique | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<PageStatique>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const { showToast } = useToasts();

  const loadPages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.getPages(
        filtreStatut !== "tous" ? filtreStatut : undefined,
        recherche || undefined
      );
      setPages(response);

      showToast("success", "Pages chargées", "Liste des pages mise à jour");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de chargement des pages";
      setError(errorMessage);
      showToast("error", "Erreur", errorMessage);
      console.error("Erreur chargement pages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  // Recharger quand les filtres changent
  useEffect(() => {
    if (!loading) {
      loadPages();
    }
  }, [filtreStatut, recherche]);

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
    const archivees = pages.filter(
      (p) => p.statut === StatutPage.ARCHIVEE
    ).length;

    return { total, publiees, brouillons, archivees };
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
    if (!editingPage.titre || !editingPage.slug || !editingPage.contenu) {
      showToast("error", "Erreur", "Veuillez remplir tous les champs requis");
      return;
    }

    setSaveLoading(true);

    try {
      if (selectedPage) {
        // Modification
        const updatedPage = await adminAPI.updatePage(selectedPage.id, {
          titre: editingPage.titre,
          slug: editingPage.slug,
          contenu: editingPage.contenu,
          description: editingPage.description,
          statut: editingPage.statut as StatutPage,
        });

        setPages(
          pages.map((p) => (p.id === selectedPage.id ? updatedPage : p))
        );
        showToast(
          "success",
          "Page modifiée",
          "La page a été mise à jour avec succès"
        );
      } else {
        // Création
        const nouvellePage = await adminAPI.createPage({
          titre: editingPage.titre!,
          slug: editingPage.slug!,
          contenu: editingPage.contenu!,
          statut: editingPage.statut as StatutPage,
          description: editingPage.description || "",
        });

        setPages([nouvellePage, ...pages]);
        showToast(
          "success",
          "Page créée",
          "La nouvelle page a été ajoutée avec succès"
        );
      }

      setShowEditModal(false);
      setEditingPage({});
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de sauvegarde de la page";
      showToast("error", "Erreur", errorMessage);
      console.error("Erreur sauvegarde page:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPage) return;

    setSaveLoading(true);

    try {
      await adminAPI.deletePage(selectedPage.id);
      setPages(pages.filter((p) => p.id !== selectedPage.id));
      setShowDeleteModal(false);
      setSelectedPage(null);
      showToast(
        "success",
        "Page supprimée",
        "La page a été supprimée avec succès"
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de suppression de la page";
      showToast("error", "Erreur", errorMessage);
      console.error("Erreur suppression page:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleStatut = async (page: PageStatique) => {
    try {
      setIsOperationLoading(true);

      const nouveauStatut: StatutPage =
        page.statut === StatutPage.PUBLIEE
          ? StatutPage.BROUILLON
          : StatutPage.PUBLIEE;

      let updatedPage: PageStatique;

      if (nouveauStatut === StatutPage.PUBLIEE) {
        updatedPage = await adminAPI.publishPage(page.id);
        showToast("success", "Page publiée", "La page est maintenant visible");
      } else {
        updatedPage = await adminAPI.unpublishPage(page.id);
        showToast(
          "success",
          "Page dépubliée",
          "La page est maintenant en brouillon"
        );
      }

      setPages(pages.map((p) => (p.id === page.id ? updatedPage : p)));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de modification du statut";
      showToast("error", "Erreur", errorMessage);
      console.error("Erreur changement statut:", err);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handlePreview = async (page: PageStatique) => {
    try {
      const pageDetails = await adminAPI.getPageById(page.id);
      setSelectedPage(pageDetails);
      setShowPreviewModal(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de chargement de la page";
      showToast("error", "Erreur", errorMessage);
    }
  };

  const handleRefresh = () => {
    loadPages();
  };

  const generateSlug = (titre: string) => {
    return titre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitreChange = (titre: string) => {
    setEditingPage({
      ...editingPage,
      titre,
      slug: generateSlug(titre),
    });
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

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pages statiques</h1>
          <p className="text-gray-600">Contenu éditorial et pages marketing</p>
        </div>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-redo mr-2"></i>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pages statiques</h1>
          <p className="text-gray-600">Contenu éditorial et pages marketing</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isOperationLoading}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <i className="fas fa-redo mr-2"></i>
            Actualiser
          </button>
          <button
            onClick={() => handleEdit()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Nouvelle page
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-file-alt text-gray-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Publiées</p>
              <p className="text-xl font-bold text-green-600">
                {stats.publiees}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Brouillons</p>
              <p className="text-xl font-bold text-yellow-600">
                {stats.brouillons}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-edit text-yellow-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Archivées</p>
              <p className="text-xl font-bold text-gray-600">
                {stats.archivees}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-archive text-gray-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Titre ou slug..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={filtreStatut}
              onChange={(e) =>
                setFiltreStatut(e.target.value as StatutPage | "tous")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tous">Tous les statuts</option>
              <option value={StatutPage.PUBLIEE}>Publiées</option>
              <option value={StatutPage.BROUILLON}>Brouillons</option>
              <option value={StatutPage.ARCHIVEE}>Archivées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des pages */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {pagesFiltrees.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <i className="fas fa-file-alt text-4xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune page trouvée
            </h3>
            <p className="text-gray-600 mb-4">
              {recherche || filtreStatut !== "tous"
                ? "Aucune page ne correspond aux critères de recherche"
                : "Commencez par créer votre première page"}
            </p>
            <button
              onClick={() => handleEdit()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Créer une page
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
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
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {page.titre}
                        </h3>
                        <p className="text-sm text-gray-500">/{page.slug}</p>
                        {page.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {page.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatutBadge(page.statut)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(page.updatedAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handlePreview(page)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Prévisualiser"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => handleEdit(page)}
                          className="text-green-600 hover:text-green-800 text-sm"
                          title="Modifier"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => toggleStatut(page)}
                          disabled={isOperationLoading}
                          className={`text-sm ${
                            page.statut === StatutPage.PUBLIEE
                              ? "text-yellow-600 hover:text-yellow-800"
                              : "text-green-600 hover:text-green-800"
                          } disabled:opacity-50`}
                          title={
                            page.statut === StatutPage.PUBLIEE
                              ? "Dépublier"
                              : "Publier"
                          }
                        >
                          <i
                            className={`fas ${
                              page.statut === StatutPage.PUBLIEE
                                ? "fa-eye-slash"
                                : "fa-check"
                            }`}
                          ></i>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPage(page);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
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
        )}
      </div>

      {/* Modal d'édition */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={selectedPage ? "Modifier la page" : "Nouvelle page"}
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <input
                type="text"
                value={editingPage.titre || ""}
                onChange={(e) => handleTitreChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Titre de la page"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                value={editingPage.slug || ""}
                onChange={(e) =>
                  setEditingPage({ ...editingPage, slug: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="url-de-la-page"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description SEO
            </label>
            <input
              type="text"
              value={editingPage.description || ""}
              onChange={(e) =>
                setEditingPage({ ...editingPage, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description pour les moteurs de recherche"
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">
              {editingPage.description?.length || 0}/160 caractères
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={StatutPage.BROUILLON}>Brouillon</option>
              <option value={StatutPage.PUBLIEE}>Publiée</option>
              <option value={StatutPage.ARCHIVEE}>Archivée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenu *
            </label>
            <textarea
              value={editingPage.contenu || ""}
              onChange={(e) =>
                setEditingPage({ ...editingPage, contenu: e.target.value })
              }
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contenu de la page (HTML autorisé)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setShowEditModal(false)}
              disabled={saveLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={
                saveLoading ||
                !editingPage.titre ||
                !editingPage.slug ||
                !editingPage.contenu
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {saveLoading && <LoadingSpinner size="sm" className="mr-2" />}
              {selectedPage ? "Modifier" : "Créer"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Prévisualisation"
        size="xl"
      >
        {selectedPage && (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedPage.titre}
              </h2>
              <p className="text-sm text-gray-500">/{selectedPage.slug}</p>
              {selectedPage.description && (
                <p className="text-sm text-gray-600 mt-2">
                  {selectedPage.description}
                </p>
              )}
              <div className="mt-2">{getStatutBadge(selectedPage.statut)}</div>
            </div>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedPage.contenu }}
            />
          </div>
        )}
      </Modal>

      {/* Modal de confirmation suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer la page"
        message={`Êtes-vous sûr de vouloir supprimer la page "${selectedPage?.titre}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        isLoading={saveLoading}
        type="danger"
      />
    </div>
  );
};

export default AdminPages;
