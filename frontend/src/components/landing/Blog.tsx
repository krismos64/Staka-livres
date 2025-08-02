import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface BlogArticle {
  id: string;
  category: string;
  categoryIcon: string;
  title: string;
  summary: string;
  readTime: string;
  bgGradient: string;
  icon?: string;
  iconColor?: string;
  image?: string;
}

export default function Blog() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const navigate = useNavigate();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter blog inscription:", newsletterEmail);
    setNewsletterEmail("");
  };

  const blogArticles: BlogArticle[] = [
    {
      id: "premier-chapitre",
      category: "📝 Écriture",
      categoryIcon: "fas fa-pen-fancy",
      title: "Comment écrire un premier chapitre captivant",
      summary:
        "Découvrez les techniques des auteurs à succès pour accrocher vos lecteurs dès les premières lignes.",
      readTime: "5 min de lecture",
      bgGradient: "bg-gradient-to-br from-blue-400 to-blue-600",
      image: "/images/chapitre-captivant.webp",
    },
    {
      id: "amazon-kdp-guide",
      category: "📈 Marketing",
      categoryIcon: "fas fa-chart-line",
      title: "Guide complet Amazon KDP 2025",
      summary:
        "Tout ce que vous devez savoir pour publier et vendre votre livre sur la plus grande plateforme mondiale.",
      readTime: "12 min de lecture",
      bgGradient: "bg-gradient-to-br from-green-400 to-green-600",
      image: "/images/Amazon-KDP-2025.webp",
    },
    {
      id: "erreurs-autoedition",
      category: "",
      categoryIcon: "",
      title: "Les 10 erreurs courantes en autoédition",
      summary:
        "Évitez les pièges les plus fréquents et maximisez vos chances de succès avec nos conseils d'experts.",
      readTime: "8 min de lecture",
      bgGradient: "bg-gradient-to-br from-purple-400 to-purple-600",
      image: "/images/Les-erreurs-courantes-en-auto-edition.webp",
    },
  ];

  const handleArticleClick = (articleId: string) => {
    const routes = {
      "premier-chapitre": "/blog/premier-chapitre",
      "amazon-kdp-guide": "/blog/amazon-kdp-guide",
      "erreurs-autoedition": "/blog/erreurs-autoedition",
    };

    const route = routes[articleId as keyof typeof routes];
    if (route) {
      navigate(route);
    }
  };

  return (
    <section
      id="blog"
      className="py-16 bg-gradient-to-br from-gray-50 to-blue-50"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nos{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              conseils d'experts
            </span>
          </h2>
          <div className="flex justify-center">
            <p className="text-lg text-gray-600 text-center">
              Découvrez nos guides et astuces pour réussir votre projet
              d'édition
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {blogArticles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="h-48 relative overflow-hidden rounded-t-2xl">
                {article.image ? (
                  <img
                    src={article.image}
                    alt={`Illustration de l'article : ${article.title}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width="320"
                    height="192"
                  />
                ) : (
                  <i
                    className={`${article.icon} ${article.iconColor} text-4xl`}
                    aria-hidden="true"
                  ></i>
                )}
                {article.category && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full px-3 py-1 text-sm font-medium shadow-lg">
                    {article.category}
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl mb-3">{article.title}</h3>
                <p className="text-gray-600 mb-4">{article.summary}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {article.readTime}
                  </span>
                  <button
                    onClick={() => handleArticleClick(article.id)}
                    className="text-blue-600 font-medium hover:text-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                    aria-label={`Lire l'article: ${article.title}`}
                  >
                    Lire l'article →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter subscription */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              📚 Restez informé de nos derniers conseils
            </h3>
            <div className="flex justify-center mb-6">
              <p className="text-gray-600 text-center">
                Recevez chaque semaine nos meilleurs conseils d'écriture et
                d'édition
              </p>
            </div>
          </div>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Votre adresse email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              required
              aria-label="Votre adresse email pour la newsletter"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-6 py-3 rounded-xl font-semibold text-white transition"
            >
              S'abonner
            </button>
          </form>
          <div className="flex justify-center">
            <p className="text-sm text-gray-500 mt-3 text-center">
              Désabonnement facile • Aucun spam
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
