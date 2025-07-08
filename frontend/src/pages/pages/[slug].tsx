import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ScrollToTopButton from "../../components/common/ScrollToTopButton";
import Footer from "../../components/landing/Footer";

interface StaticPage {
  id: string;
  titre: string;
  slug: string;
  contenu: string;
  metaTitle?: string;
  metaDescription?: string;
  updatedAt?: string;
}

const formatContentToHtml = (text: string): string => {
  if (!text) return "";

  const titleRegex = /^\d+\.\s|:\s*$/;
  const definitionRegex = /^(\w+\s*et\s*\w+|\w+)\s*:/;

  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => {
      const lines = block.split("\n");
      const firstLine = lines[0];

      if (titleRegex.test(firstLine)) {
        return `<h3>${firstLine}</h3><p>${lines.slice(1).join("<br />")}</p>`;
      }

      const match = firstLine.match(definitionRegex);
      if (match) {
        const term = match[1];
        const restOfLine = firstLine.substring(match[0].length).trim();
        const definition = [restOfLine, ...lines.slice(1)].join("<br />");
        return `<p><strong>${term} :</strong> ${definition}</p>`;
      }

      return `<p>${lines.join("<br />")}</p>`;
    })
    .join("");
};

const StaticPageBySlug: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    window.scrollTo(0, 0);
    fetch(`/api/pages/slug/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Page non trouvée");
        const data = await res.json();
        const p = data.data || {};
        setPage({
          id: p.id,
          titre: p.titre || p.title || "",
          slug: p.slug,
          contenu: p.contenu || p.content || "",
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          updatedAt: p.updatedAt || p.createdAt,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (page) {
      document.title = page.metaTitle || page.titre;
      const meta = document.querySelector('meta[name="description"]');
      if (meta && page.metaDescription) {
        meta.setAttribute("content", page.metaDescription);
      }
    }
  }, [page]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center text-gray-500 py-20">Chargement...</div>
      );
    }
    if (error || !page) {
      return (
        <div className="text-center text-red-500 py-20">
          <h2 className="text-3xl font-bold mb-4">Page introuvable</h2>
          <p>
            {error ||
              "La page que vous cherchez n'existe pas ou a été déplacée."}
          </p>
        </div>
      );
    }

    return (
      <article>
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 tracking-tight">
            {page.titre}
          </h1>
        </header>

        <div
          className="prose lg:prose-lg max-w-none
                     prose-h3:font-bold prose-h3:text-xl prose-h3:text-blue-900 prose-h3:mb-4
                     prose-p:mb-5 prose-p:leading-relaxed prose-p:text-gray-700 prose-p:text-justify
                     prose-strong:text-blue-800 prose-strong:font-semibold
                     prose-a:text-blue-700 hover:prose-a:underline"
          dangerouslySetInnerHTML={{
            __html: formatContentToHtml(page.contenu),
          }}
        />
        {page.updatedAt && (
          <div className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500 text-center">
            Dernière mise à jour le{" "}
            <time dateTime={page.updatedAt}>
              {new Date(page.updatedAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="bg-white font-serif min-h-screen">
      <div className="max-w-5xl mx-auto py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link
            to="/"
            className="inline-flex items-center text-blue-800 hover:text-blue-900 font-semibold transition-colors group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Retour à l'accueil
          </Link>
        </div>
        {renderContent()}
      </div>
      <ScrollToTopButton />
      <Footer />
    </div>
  );
};

export default StaticPageBySlug;
