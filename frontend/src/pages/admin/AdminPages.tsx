import React, { useMemo, useState } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { useAdminPages, useUpdatePage } from "../../hooks/useAdminPages";
import { PageStatique } from "../../types/shared";
import { useToasts } from "../../utils/toast";

// Liste des slugs légaux à afficher
const LEGAL_SLUGS = [
  "mentions-legales",
  "politique-confidentialite",
  "cgv",
  "rgpd",
];

const LABELS: Record<string, string> = {
  "mentions-legales": "Mentions légales",
  "politique-confidentialite": "Politique de confidentialité",
  cgv: "Conditions Générales de Vente",
  rgpd: "RGPD",
};

const AdminPages: React.FC = () => {
  const [selectedPage, setSelectedPage] = useState<PageStatique | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(null); // State pour l'accordéon
  const { showToast } = useToasts();

  // Récupère toutes les pages, puis filtre sur les slugs légaux
  const { data: rawPages, isLoading, error, refetch } = useAdminPages();
  const updatePageMutation = useUpdatePage();

  const legalPages = useMemo(() => {
    const pagesRaw = Array.isArray(rawPages)
      ? rawPages
      : rawPages && Array.isArray((rawPages as any).data)
      ? (rawPages as any).data
      : [];
    return LEGAL_SLUGS.map((slug) => {
      const page = pagesRaw.find((p: any) => p.slug === slug);
      return page
        ? {
            ...page,
            titre: LABELS[slug],
            contenu: page.contenu || page.content || "",
          }
        : null;
    }).filter(Boolean) as PageStatique[];
  }, [rawPages]);

  const handleToggleAccordion = (slug: string) => {
    setOpenSlug(openSlug === slug ? null : slug);
  };

  const handleEdit = (page: PageStatique) => {
    setSelectedPage(page);
    setEditingContent(page.contenu);
    setShowEditModal(true);
  };

  const handleSave = () => {
    if (!selectedPage) return;
    updatePageMutation.mutate(
      { id: selectedPage.id, pageData: { contenu: editingContent } },
      {
        onSuccess: () => {
          setShowEditModal(false);
          showToast("success", "Page modifiée", "Contenu mis à jour");
          refetch();
        },
      }
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (error)
    return (
      <div className="p-8 text-red-500">
        Erreur lors du chargement des pages.
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Gestion des pages légales
        </h1>
        <p className="text-slate-500 mt-1">
          Modifiez le contenu des pages légales du site.
        </p>
      </header>
      <div className="space-y-4">
        {legalPages.map((page) => (
          <div
            key={page.slug}
            className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden"
          >
            <button
              onClick={() => handleToggleAccordion(page.slug)}
              className="w-full flex justify-between items-center p-5 text-left font-semibold text-lg text-slate-700 hover:bg-gray-50 transition-colors"
            >
              <span>{LABELS[page.slug]}</span>
              <div className="flex items-center gap-4">
                <span
                  className="text-sm font-normal text-blue-600 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation(); // Empêche l'accordéon de se fermer
                    handleEdit(page);
                  }}
                >
                  Modifier
                </span>
                <svg
                  className={`w-6 h-6 transform transition-transform duration-300 ${
                    openSlug === page.slug ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>
            <div
              className={`transition-all duration-500 ease-in-out ${
                openSlug === page.slug
                  ? "max-h-[1000px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div
                className="prose max-w-none p-5 pt-0 text-slate-600"
                dangerouslySetInnerHTML={{
                  __html: page.contenu.replace(/\n/g, "<br />"),
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={selectedPage ? `Modifier : ${LABELS[selectedPage.slug]}` : ""}
      >
        <textarea
          className="w-full h-80 border rounded-md p-3 font-mono text-sm"
          value={editingContent}
          onChange={(e) => setEditingContent(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            onClick={() => setShowEditModal(false)}
          >
            Annuler
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSave}
            disabled={updatePageMutation.isPending}
          >
            {updatePageMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPages;
