import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import ScrollToTopButton from "../components/common/ScrollToTopButton";
import Footer from "../components/landing/Footer";

const MentionsLegalesPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Mentions Légales - Staka Editions";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Mentions légales de Staka Editions - Informations légales et réglementaires du site livrestaka.fr");
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
          <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 tracking-tight">
              Mentions Légales
            </h1>
            <p className="text-xl text-gray-600 mt-4">
              Staka Editions - Blog professionnel pour auteurs
            </p>
          </header>

          <div className="prose lg:prose-lg max-w-none
                         prose-h2:font-bold prose-h2:text-2xl prose-h2:text-blue-900 prose-h2:mb-6 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-3
                         prose-h3:font-bold prose-h3:text-xl prose-h3:text-blue-800 prose-h3:mb-4 prose-h3:mt-8
                         prose-h4:font-semibold prose-h4:text-lg prose-h4:text-gray-800 prose-h4:mb-3 prose-h4:mt-6
                         prose-p:mb-5 prose-p:leading-relaxed prose-p:text-gray-700 prose-p:text-justify
                         prose-strong:text-blue-800 prose-strong:font-semibold
                         prose-ul:mb-5 prose-li:mb-2
                         prose-a:text-blue-700 hover:prose-a:underline">

            <h2>Définitions</h2>
            <ul>
              <li>
                <strong>Client :</strong> tout professionnel ou personne physique
                capable au sens des articles 1123 et suivants du Code civil, ou
                personne morale, qui visite le Site objet des présentes conditions
                générales.
              </li>
              <li>
                <strong>Prestations et Services :</strong> https://www.livrestaka.fr
                met à disposition des Clients : correction et relecture de
                manuscrits, livres et textes littéraires, accompagnement éditorial
                pour auteurs et autrices.
              </li>
              <li>
                <strong>Contenu :</strong> Ensemble des éléments constituants
                l'information présente sur le Site, notamment textes, images,
                vidéos.
              </li>
              <li>
                <strong>Informations clients :</strong> Ci-après dénommé «
                Information(s) » qui correspondent à l'ensemble des données
                personnelles susceptibles d'être détenues par
                https://www.livrestaka.fr pour la gestion de votre compte, de la
                gestion de la relation client et à des fins d'analyses et de
                statistiques.
              </li>
              <li>
                <strong>Utilisateur :</strong> Internaute se connectant, utilisant
                le site susnommé.
              </li>
              <li>
                <strong>Manuscrit :</strong> Tout document littéraire soumis par le
                Client pour correction, relecture ou accompagnement éditorial.
              </li>
            </ul>

            <p>
              Les termes « données à caractère personnel », « personne concernée »,
              « sous traitant » et « données sensibles » ont le sens défini par le
              Règlement Général sur la Protection des Données (RGPD : n° 2016-679)
            </p>

            <h3>1. Présentation du site internet</h3>
            <p>
              En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la
              confiance dans l'économie numérique, il est précisé aux utilisateurs
              du site internet https://www.livrestaka.fr l'identité des différents
              intervenants dans le cadre de sa réalisation et de son suivi :
            </p>

            <div className="bg-blue-50 p-6 border-l-4 border-blue-400 my-8">
              <p><strong>Responsable publication :</strong> Alexis Moreno</p>
              <p><strong>Email :</strong> contact@livrestaka.fr</p>
              <p><strong>Téléphone :</strong> +33 1 84 25 56 78</p>
              <p>
                <strong>Hébergeur :</strong> OVH SAS – 2 rue Kellermann, 59100
                Roubaix, France
              </p>
            </div>

            <h3>2. Conditions générales d'utilisation du site et des services proposés</h3>
            <p>
              Le Site constitue une œuvre de l'esprit protégée par les dispositions
              du Code de la Propriété Intellectuelle et des Réglementations
              Internationales applicables. Le Client ne peut en aucune manière
              réutiliser, céder ou exploiter pour son propre compte tout ou partie
              des éléments ou travaux du Site.
            </p>

            <p>
              L'utilisation du site https://www.livrestaka.fr implique l'acceptation
              pleine et entière des conditions générales d'utilisation ci-après
              décrites. Ces conditions d'utilisation sont susceptibles d'être
              modifiées ou complétées à tout moment, les utilisateurs du site
              https://www.livrestaka.fr sont donc invités à les consulter de manière
              régulière.
            </p>

            <p>
              Ce site internet est normalement accessible à tout moment aux
              utilisateurs. Une interruption pour raison de maintenance technique
              peut être toutefois décidée par https://www.livrestaka.fr, qui
              s'efforcera alors de communiquer préalablement aux utilisateurs les
              dates et heures de l'intervention.
            </p>

            <h3>3. Description des services fournis</h3>
            <p>
              Le site internet https://www.livrestaka.fr a pour objet de fournir des
              services de correction, relecture et accompagnement éditorial pour
              auteurs et autrices. https://www.livrestaka.fr s'efforce de fournir
              des prestations de qualité professionnelle dans les délais convenus.
            </p>

            <p>Les services proposés incluent :</p>
            <ul>
              <li>
                Correction orthographique, grammaticale et syntaxique de manuscrits
              </li>
              <li>
                Relecture stylistique et amélioration de la cohérence narrative
              </li>
              <li>Accompagnement éditorial personnalisé pour auteurs</li>
              <li>Conseils pour l'amélioration de la structure narrative</li>
              <li>Mise en forme professionnelle de manuscrits</li>
            </ul>

            <p>
              Toutefois, il ne pourra être tenu responsable des oublis, des
              inexactitudes et des carences dans la mise à jour, qu'elles soient de
              son fait ou du fait des tiers partenaires qui lui fournissent ces
              informations.
            </p>

            <h3>4. Limitations contractuelles sur les données techniques</h3>
            <p>
              Le site Internet ne pourra être tenu responsable de dommages matériels
              liés à l'utilisation du site. De plus, l'utilisateur du site s'engage
              à accéder au site en utilisant un matériel récent, ne contenant pas de
              virus et avec un navigateur de dernière génération mis-à-jour.
            </p>

            <p>
              Le site https://www.livrestaka.fr est hébergé chez un prestataire sur
              le territoire de l'Union Européenne conformément aux dispositions du
              Règlement Général sur la Protection des Données (RGPD : n° 2016-679)
            </p>

            <h3>5. Propriété intellectuelle et contrefaçons</h3>
            <p>
              https://www.livrestaka.fr est propriétaire des droits de propriété
              intellectuelle et détient les droits d'usage sur tous les éléments
              accessibles sur le site internet, notamment les textes, images,
              graphismes, logos, vidéos, icônes et sons.
            </p>

            <p>
              Toute reproduction, représentation, modification, publication,
              adaptation de tout ou partie des éléments du site, quel que soit le
              moyen ou le procédé utilisé, est interdite, sauf autorisation écrite
              préalable de : https://www.livrestaka.fr
            </p>

            <h3>6. Limitations de responsabilité</h3>
            <p>
              https://www.livrestaka.fr ne pourra être tenu responsable des dommages
              directs et indirects causés au matériel de l'utilisateur, lors de
              l'accès au site internet https://www.livrestaka.fr, et résultant soit
              de l'utilisation d'un matériel ne répondant pas aux spécifications
              indiquées au point 4, soit de l'apparition d'un bug ou d'une
              incompatibilité.
            </p>

            <h3>7. Gestion des données personnelles</h3>
            <p>
              Le Client est informé des réglementations concernant la communication
              marketing, la loi du 21 Juin 2014 pour la confiance dans l'Economie
              Numérique, la Loi Informatique et Liberté du 06 Août 2004 ainsi que du
              Règlement Général sur la Protection des Données (RGPD : n° 2016-679).
            </p>

            <h4>7.1 Responsables de la collecte des données personnelles</h4>
            <p>
              Pour les Données Personnelles collectées dans le cadre de la création
              du compte personnel de l'Utilisateur et de sa navigation sur le Site,
              le responsable du traitement des Données Personnelles est : ALEXIS
              MORENO https://www.livrestaka.fr
            </p>

            <h4>7.2 Finalité des données collectées</h4>
            <p>
              Les données sont collectées pour permettre la navigation sur le Site
              et la gestion et la traçabilité des prestations et services commandés
              par l'utilisateur : données de connexion et d'utilisation du Site,
              facturation, historique des commandes, etc.
            </p>

            <p>
              https://www.livrestaka.fr ne commercialise pas vos données
              personnelles qui sont donc uniquement utilisées par nécessité ou à des
              fins statistiques et d'analyses.
            </p>

            <h4>7.3 Droit d'accès, de rectification et d'opposition</h4>
            <p>
              Conformément à la réglementation européenne en vigueur, les
              Utilisateurs de https://www.livrestaka.fr disposent des droits
              suivants :
            </p>
            <ul>
              <li>
                droit d'accès (article 15 RGPD) et de rectification (article 16
                RGPD), de mise à jour, de complétude des données des Utilisateurs
              </li>
              <li>
                droit de verrouillage ou d'effacement des données des Utilisateurs à
                caractère personnel (article 17 du RGPD)
              </li>
              <li>
                droit de retirer à tout moment un consentement (article 13-2c RGPD)
              </li>
              <li>
                droit à la limitation du traitement des données des Utilisateurs
                (article 18 RGPD)
              </li>
              <li>
                droit d'opposition au traitement des données des Utilisateurs
                (article 21 RGPD)
              </li>
              <li>
                droit à la portabilité des données que les Utilisateurs auront
                fournies (article 20 RGPD)
              </li>
            </ul>

            <div className="bg-green-50 p-6 border-l-4 border-green-400 my-8">
              <p>
                <strong>Pour exercer ces droits, contactez-nous :</strong><br />
                Email : contact@livrestaka.fr<br />
                Téléphone : +33 1 84 25 56 78
              </p>
            </div>

            <h3>8. Cookies</h3>
            <p>
              Un « cookie » est un petit fichier d'information envoyé sur le
              navigateur de l'Utilisateur et enregistré au sein du terminal de
              l'Utilisateur. Ce fichier comprend des informations telles que le nom
              de domaine de l'Utilisateur, le fournisseur d'accès Internet de
              l'Utilisateur, le système d'exploitation de l'Utilisateur, ainsi que
              la date et l'heure d'accès.
            </p>

            <p>
              https://www.livrestaka.fr est susceptible de traiter les informations
              de l'Utilisateur concernant sa visite du Site, telles que les pages
              consultées, les recherches effectuées. Ces informations permettent à
              https://www.livrestaka.fr d'améliorer le contenu du Site, de la
              navigation de l'Utilisateur.
            </p>

            <h3>9. Droit applicable et attribution de juridiction</h3>
            <p>
              Tout litige en relation avec l'utilisation du site
              https://www.livrestaka.fr est soumis au droit français et à la
              juridiction des tribunaux français.
            </p>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500 text-center">
            Dernière mise à jour le{" "}
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

export default MentionsLegalesPage;