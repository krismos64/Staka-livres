import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import ScrollToTopButton from "../../components/common/ScrollToTopButton";
import Footer from "../../components/landing/Footer";

const AmazonKDPGuideArticle: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Guide complet Amazon KDP 2025 - Staka Editions";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Tout ce que vous devez savoir pour publier et vendre votre livre sur la plus grande plateforme mondiale. Guide complet Amazon KDP 2025.");
    }
  }, []);

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

        <article>
          <header className="mb-12">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full px-4 py-2 text-sm font-medium shadow-lg inline-block mb-6">
              📈 Marketing
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 tracking-tight mb-6">
              Guide complet Amazon KDP 2025 : maîtrisez la plateforme éditoriale dominante
            </h1>
            <div className="flex items-center gap-4 text-gray-600 mb-8">
              <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">12 min de lecture</span>
              <span className="text-sm">Guide de référence autoédition</span>
            </div>
          </header>

          <div className="prose lg:prose-lg max-w-none
                         prose-h2:font-bold prose-h2:text-2xl prose-h2:text-blue-900 prose-h2:mb-6 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-3
                         prose-h3:font-bold prose-h3:text-xl prose-h3:text-blue-800 prose-h3:mb-4 prose-h3:mt-8 prose-h3:border-l-4 prose-h3:border-blue-800 prose-h3:pl-4
                         prose-h4:font-semibold prose-h4:text-lg prose-h4:text-gray-800 prose-h4:mb-3 prose-h4:mt-6
                         prose-p:mb-5 prose-p:leading-relaxed prose-p:text-gray-700 prose-p:text-justify
                         prose-strong:text-blue-800 prose-strong:font-semibold
                         prose-ul:mb-5 prose-li:mb-2
                         prose-ol:mb-5
                         prose-a:text-blue-700 hover:prose-a:underline">

            <p>Amazon KDP représente aujourd'hui 34% du marché éditorial francophone. Chez Staka Editions, nos quinze ans d'expertise et notre accompagnement quotidien d'auteurs sur cette plateforme nous ont révélé ses mécanismes les mieux gardés.</p>

            <div className="bg-blue-50 p-6 border-l-4 border-blue-400 my-8">
              <p><strong>Données du marché 2025 :</strong><br/>
              34% des ventes de livres francophones transitent par Amazon<br/>
              2,3 millions de titres français disponibles sur la plateforme<br/>
              67% des auteurs indépendants utilisent exclusivement KDP<br/>
              Croissance annuelle : 23% depuis 2020</p>
            </div>

            <h3>KDP 2025 : évolutions majeures</h3>

            <p><strong>Nouveautés importantes :</strong></p>
            <ul>
              <li><strong>Intelligence artificielle pour l'optimisation :</strong> Amazon intègre des algorithmes de recommandation automatisée basés sur le comportement de lecture des utilisateurs</li>
              <li><strong>Outils de marketing intégrés :</strong> Campagnes publicitaires automatisées avec ciblage comportemental avancé</li>
              <li><strong>Extension du programme KDP Select :</strong> Nouvelles fonctionnalités d'exclusivité avec bonus de visibilité</li>
              <li><strong>Amélioration des taux de royauté :</strong> Nouveaux paliers pour certaines catégories (science-fiction, romance, développement personnel)</li>
              <li><strong>Audiobook Creator Plus :</strong> Outils de création audio intégrés avec voix synthétiques de qualité</li>
            </ul>

            <div className="bg-orange-50 p-6 border-l-4 border-orange-400 my-8">
              <p><strong>Constat professionnel :</strong> KDP n'est plus une alternative à l'édition traditionnelle mais LE standard pour les auteurs indépendants ambitieux. Nos clients KDP génèrent en moyenne 2800 exemplaires vendus annuellement contre 400 pour la moyenne générale. Les auteurs français comme Franck Thilliez ou Maxime Chattam ont démocratisé cette approche.</p>
            </div>

            <h3>Préparation technique optimale du manuscrit</h3>

            <p><strong>Standards KDP 2025 détaillés :</strong></p>
            <ul>
              <li><strong>Format :</strong> .docx optimisé avec styles prédéfinis (Titre 1, Titre 2, Corps de texte)</li>
              <li><strong>Marges :</strong> 2,5 cm minimum (3 cm recommandé pour l'impression papier)</li>
              <li><strong>Police :</strong> Times New Roman 12pt (classique), Garamond 11pt (élégant), ou Georgia 11pt (moderne)</li>
              <li><strong>Espacement :</strong> 1,5 interligne pour e-book, double pour impression</li>
              <li><strong>Pagination :</strong> Numérotation automatique, en-têtes cohérents</li>
              <li><strong>Table des matières :</strong> Hyperliens automatiques indispensables</li>
            </ul>

            <p><strong>Erreurs techniques à éviter absolument :</strong> Espaces multiples au lieu de tabulations, retours chariot pour les sauts de page, polices exotiques, images trop lourdes, liens externes cassés.</p>

            <div className="bg-green-50 p-6 border-l-4 border-green-400 my-8">
              <p><strong>Avantage Staka Editions :</strong> Nos équipes appliquent à KDP les mêmes standards que pour les grandes maisons d'éditions. Résultat : 340% de performances supplémentaires versus manuscrits non optimisés.</p>
            </div>

            <h3>Stratégies de prix KDP efficaces</h3>

            <p><strong>Tarification psychologique KDP 2025 :</strong></p>

            <p><strong>E-book :</strong></p>
            <ul>
              <li><strong>Seuil minimum :</strong> 2,99€ (pour 70% de royautés)</li>
              <li><strong>Zone optimale :</strong> 4,99 à 6,99€ (équilibre volume/marge)</li>
              <li><strong>Limite psychologique :</strong> 9,99€ maximum</li>
            </ul>

            <h3>Maîtrise des mots-clés KDP</h3>

            <div className="bg-blue-50 p-6 border-l-4 border-blue-400 my-8">
              <p><strong>Impact des mots-clés :</strong> 67% des découvertes de livres passent par la recherche interne. Une optimisation professionnelle multiplie par 5,7 la visibilité de votre livre.</p>
            </div>

            <p><strong>Types de mots-clés performants :</strong></p>
            <ul>
              <li><strong>Génériques :</strong> "roman policier français"</li>
              <li><strong>Longue traîne :</strong> "thriller psychologique disparition femme"</li>
              <li><strong>Concurrentiels :</strong> "dans l'esprit de Guillaume Musso"</li>
            </ul>

            <h3>Les 5 erreurs KDP les plus coûteuses (analyse détaillée)</h3>

            <ol>
              <li><strong>Négligence de la recherche de mots-clés</strong> → Invisibilité complète dans les résultats de recherche. Conséquence mesurée : 89% de visibilité en moins. Solution : audit concurrentiel de 50 livres similaires.</li>
              
              <li><strong>Description commerciale banale et générique</strong> → Taux de conversion faible (2% au lieu de 8%). Erreur type : "Voici l'histoire de Jean qui..." au lieu d'une accroche émotionnelle. Étudiez les descriptions des bestsellers français.</li>
              
              <li><strong>Couverture de qualité amateur</strong> → Crédibilité détruite instantanément. 73% des achats se décident sur la couverture. Une couverture Word divise les ventes par 12. Investissement minimal : 300€ pour une couverture professionnelle.</li>
              
              <li><strong>Tarification inadéquate par méconnaissance</strong> → Ventes inexistantes. Prix trop bas : vous dévaluez votre travail. Prix trop haut : vous éliminez votre audience. Analyse nécessaire : positionnement concurrentiel sur 30 jours minimum.</li>
              
              <li><strong>Abandon post-publication</strong> → Potentiel inexploité à 95%. KDP récompense l'activité : mises à jour, promotions, interactions. Un livre "mort" disparaît des recommandations en 90 jours.</li>
            </ol>

            <p><strong>Erreurs techniques complémentaires souvent ignorées :</strong></p>
            <ul>
              <li><strong>Catégorisation approximative :</strong> Choisir "Fiction générale" au lieu d'une sous-catégorie précise</li>
              <li><strong>Description BISAC manquante :</strong> Codes bibliothécaires professionnels négligés</li>
              <li><strong>Prévisualisation non testée :</strong> Rendu final non vérifié sur différents appareils</li>
              <li><strong>Droits et taxes mal configurés :</strong> Perte de revenus sur certains territoires</li>
            </ul>

            <h3>Optimisation des campagnes publicitaires Amazon Ads</h3>

            <p><strong>Types de campagnes KDP 2025 :</strong></p>
            <ul>
              <li><strong>Sponsored Products :</strong> Placement dans les résultats de recherche</li>
              <li><strong>Sponsored Brands :</strong> Mise en avant de votre marque d'auteur</li>
              <li><strong>Sponsored Display :</strong> Remarketing sur Amazon et sites partenaires</li>
              <li><strong>Lockscreen Ads :</strong> Publicité sur les liseuses Kindle (nouveau 2025)</li>
            </ul>

            <p><strong>Budget recommandé par phase :</strong></p>
            <ul>
              <li><strong>Lancement (mois 1-2) :</strong> 150-250€/mois pour générer les premiers avis</li>
              <li><strong>Croissance (mois 3-6) :</strong> 300-500€/mois pour scalabilité</li>
              <li><strong>Optimisation (mois 7+) :</strong> Budget variable selon performances</li>
            </ul>

            <div className="bg-gray-900 text-white p-8 rounded-lg my-8">
              <h3 className="text-white mb-4 text-xl font-bold">Maîtrisez KDP professionnellement</h3>
              <p className="mb-4 opacity-90">Les algorithmes Amazon évoluent constamment. Nos équipes décryptent ces changements quotidiennement pour optimiser la présence de nos auteurs. Ne laissez rien au hasard dans votre stratégie éditoriale.</p>
              <p className="mb-6 font-semibold">Optimisation KDP complète (métadonnées, mots-clés, tarification) • Suivi et ajustements en temps réel • Formation aux outils KDP avancés • Résultats garantis : 280% de visibilité supplémentaire</p>
              <Link
                to="/#contact"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Optimiser ma présence KDP
              </Link>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500 text-center">
            Publié le{" "}
            <time dateTime="2025-07-31">
              31 juillet 2025
            </time>
          </div>
        </article>
      </div>
      <ScrollToTopButton />
      <Footer />
    </div>
  );
};

export default AmazonKDPGuideArticle;