import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import ScrollToTopButton from "../components/common/ScrollToTopButton";
import Footer from "../components/landing/Footer";

const CGVPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Conditions Générales de Vente - Staka Editions";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Conditions générales de vente de Staka Editions - Services de correction et relecture de manuscrits");
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
              Conditions Générales de Vente
            </h1>
            <p className="text-xl text-gray-600 mt-4">
              Staka Editions - Services de correction et relecture
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

            <h3>Article 1 - Objet</h3>
            <p>
              Les présentes conditions générales de vente s'appliquent à toutes les
              prestations de services conclues sur le site Internet livrestaka.fr.
            </p>

            <p>
              Le client déclare avoir pris connaissance et avoir accepté les
              conditions générales de vente antérieurement à la passation de la
              commande. La validation de la commande vaut donc acceptation des
              conditions générales de vente.
            </p>

            <h3>Article 2 - Services proposés</h3>
            <p>
              Les présentes conditions générales de vente s'appliquent de plein
              droit aux prestations de services suivantes :
            </p>
            <ul>
              <li>
                <strong>Correction orthographique et grammaticale :</strong>
                Correction des fautes d'orthographe, de grammaire, de conjugaison et
                de syntaxe
              </li>
              <li>
                <strong>Relecture stylistique :</strong> Amélioration du style, de
                la fluidité de lecture et de la cohérence narrative
              </li>
              <li>
                <strong>Accompagnement éditorial :</strong> Conseils personnalisés
                pour l'amélioration de la structure, du rythme et de l'impact du
                récit
              </li>
              <li>
                <strong>Mise en forme professionnelle :</strong> Mise en page,
                typographie et présentation selon les standards éditoriaux
              </li>
              <li>
                <strong>Rapport de correction :</strong> Document détaillé
                expliquant les corrections apportées et les conseils d'amélioration
              </li>
            </ul>

            <div className="bg-orange-50 p-6 border-l-4 border-orange-400 my-8">
              <p><strong>Limites des prestations :</strong></p>
              <ul>
                <li>
                  Le service de correction se limite à la forme et non au fond du
                  texte
                </li>
                <li>
                  Aucune réécriture complète n'est effectuée sans accord express du
                  client
                </li>
                <li>
                  L'accompagnement éditorial consiste en des conseils et ne garantit
                  pas la publication
                </li>
                <li>
                  Le client reste seul propriétaire et responsable de son œuvre
                </li>
              </ul>
            </div>

            <h3>Article 3 - Tarifs et modalités de paiement</h3>
            <p>
              Les prix sont fermes et définitifs. Sauf conditions particulières
              expresses propres à la vente, les prix des prestations effectuées sont
              ceux figurant sur le site au jour de la commande. Ils sont exprimés en
              euros toutes taxes comprises.
            </p>

            <p>La tarification s'effectue selon les modalités suivantes :</p>
            <ul>
              <li>
                <strong>Correction simple :</strong> Tarif au mot ou forfait selon
                la longueur du manuscrit
              </li>
              <li>
                <strong>Relecture approfondie :</strong> Tarif majoré incluant les
                conseils stylistiques
              </li>
              <li>
                <strong>Accompagnement éditorial :</strong> Forfait selon l'ampleur
                du projet
              </li>
              <li>
                <strong>Services combinés :</strong> Tarifs dégressifs pour les
                prestations multiples
              </li>
            </ul>

            <p>
              Le prix correspond à un maximum de 300 mots par page standard. Les
              documents de formats particuliers font l'objet d'un devis
              personnalisé.
            </p>

            <p>
              Le paiement du prix s'effectue comptant à la commande via notre
              plateforme de paiement sécurisée Stripe, qui accepte les moyens de
              paiement suivants :
            </p>
            <ul>
              <li>Carte bancaire (Visa, Mastercard, American Express)</li>
              <li>Cartes de débit</li>
              <li>Apple Pay et Google Pay</li>
              <li>Virements SEPA</li>
            </ul>

            <p>
              Toutes les transactions sont sécurisées par Stripe, certifié PCI DSS
              niveau 1. Les données bancaires ne sont jamais stockées sur nos
              serveurs. Aucune commande ne pourra être prise en compte à défaut d'un
              complet paiement à cette date.
            </p>

            <h3>Article 4 - Exécution des prestations</h3>
            <p>
              Les prestations commandées seront livrées dans les délais convenus
              lors de la commande, généralement :
            </p>
            <ul>
              <li>
                <strong>Correction simple :</strong> 3 à 7 jours ouvrés selon la
                longueur
              </li>
              <li><strong>Relecture approfondie :</strong> 5 à 10 jours ouvrés</li>
              <li>
                <strong>Accompagnement éditorial :</strong> 7 à 15 jours ouvrés
              </li>
              <li>
                <strong>Prestations urgentes :</strong> Possibles avec supplément
                tarifaire
              </li>
            </ul>

            <p>
              Les délais courent à compter de la réception du paiement intégral et
              de la transmission complète du manuscrit dans un format exploitable
              (.doc, .docx, .odt).
            </p>

            <p>
              En cas de retard dans la livraison, le client sera informé par email
              des nouvelles modalités de livraison. Un retard de plus de 7 jours
              ouvrés par rapport au délai convenu ouvre droit à remboursement
              intégral.
            </p>

            <div className="bg-green-50 p-6 border-l-4 border-green-400 my-8">
              <p><strong>Modalités de livraison :</strong></p>
              <ul>
                <li>Document corrigé avec suivi des modifications</li>
                <li>Version finale "propre" sans les marques de correction</li>
                <li>
                  Rapport de correction détaillé (selon la prestation choisie)
                </li>
                <li>Livraison par email sécurisé</li>
              </ul>
            </div>

            <h3>Article 5 - Droit de rétractation</h3>
            <p>
              Conformément à l'article L. 121-20 du Code de la consommation, le
              consommateur dispose d'un délai de quatorze jours francs pour exercer
              son droit de rétractation sans avoir à justifier de motifs ni à payer
              de pénalités.
            </p>

            <p>
              Le délai court à compter de l'acceptation de l'offre pour les
              prestations de services.
            </p>

            <div className="bg-blue-50 p-6 border-l-4 border-blue-400 my-8">
              <p><strong>Exceptions au droit de rétractation :</strong></p>
              <ul>
                <li>
                  <strong>Prestations commencées :</strong> Aucun remboursement
                  n'est possible après le début effectif des travaux de correction
                </li>
                <li>
                  <strong>Prestations personnalisées :</strong> Les services sur
                  mesure ne peuvent faire l'objet d'une rétractation une fois
                  entamés
                </li>
                <li>
                  <strong>Prestations express :</strong> Les corrections urgentes
                  acceptées expressément par le client
                </li>
              </ul>
            </div>

            <p>
              <strong>Modalités de rétractation :</strong> La rétractation doit être
              notifiée par email à contact@livrestaka.fr avant le début des travaux.
            </p>

            <p>
              livrestaka.fr doit rembourser l'acheteur de la totalité des sommes
              versées, au plus tard dans les 14 jours à compter de la date à
              laquelle il est informé de la décision de l'acheteur de se rétracter.
            </p>

            <h3>Article 6 - Obligations du client</h3>
            <p>Le client s'engage à :</p>
            <ul>
              <li>
                <strong>Fournir un manuscrit exploitable :</strong> Document dans un
                format traitement de texte (.doc, .docx, .odt) lisible et complet
              </li>
              <li>
                <strong>Respecter les droits d'auteur :</strong> Garantir qu'il est
                bien l'auteur du texte ou détient les droits pour le faire corriger
              </li>
              <li>
                <strong>Payer intégralement :</strong> Régler le prix des
                prestations avant le début des travaux
              </li>
              <li>
                <strong>Communiquer clairement :</strong> Préciser ses attentes et
                consignes particulières lors de la commande
              </li>
              <li>
                <strong>Respecter les délais :</strong> Transmettre le document dans
                les 48h suivant la commande
              </li>
              <li>
                <strong>Valider la commande :</strong> Confirmer la réception et
                l'acceptation des travaux dans un délai de 7 jours
              </li>
            </ul>

            <div className="bg-orange-50 p-6 border-l-4 border-orange-400 my-8">
              <p>
                <strong>Documents acceptés :</strong> Seuls les textes littéraires
                originaux sont acceptés. Les traductions, plagiats ou contenus
                illégaux sont refusés. Le client garantit l'originalité de son
                œuvre.
              </p>
            </div>

            <h3>Article 7 - Propriété intellectuelle et confidentialité</h3>
            <p>
              <strong>Propriété des œuvres :</strong> Le client reste l'unique
              propriétaire de son manuscrit et de son œuvre littéraire. La
              correction et la relecture n'affectent en rien ses droits d'auteur.
            </p>

            <p>
              <strong>Confidentialité absolue :</strong> livrestaka.fr s'engage à :
            </p>
            <ul>
              <li>
                Traiter tous les manuscrits avec la plus stricte confidentialité
              </li>
              <li>Ne jamais divulguer le contenu des œuvres à des tiers</li>
              <li>
                Supprimer définitivement les fichiers clients après livraison (sauf
                demande contraire)
              </li>
              <li>
                Faire signer des clauses de confidentialité à tous ses correcteurs
              </li>
            </ul>

            <p>
              <strong>Droits de livrestaka.fr :</strong> Les méthodes de correction,
              la méthodologie et les outils développés par livrestaka.fr restent sa
              propriété intellectuelle exclusive.
            </p>

            <p>
              <strong>Utilisation des témoignages :</strong> Sauf opposition
              expresse du client, livrestaka.fr peut utiliser des témoignages
              anonymisés à des fins commerciales, sans jamais révéler le contenu des
              œuvres.
            </p>

            <h3>Article 8 - Responsabilité et garanties</h3>
            <p>
              <strong>Garantie de qualité :</strong> livrestaka.fr s'engage à
              fournir des services de correction et relecture conformes aux
              standards professionnels de l'édition.
            </p>

            <p>
              <strong>Limites de responsabilité :</strong> livrestaka.fr ne peut
              être tenu responsable de :
            </p>
            <ul>
              <li>L'acceptation ou le refus du manuscrit par un éditeur</li>
              <li>L'insuccès commercial de l'œuvre</li>
              <li>
                L'interprétation personnelle du style ou du contenu par les lecteurs
              </li>
              <li>Les choix éditoriaux finaux du client</li>
              <li>La violation de droits d'auteur par le client</li>
            </ul>

            <p>
              <strong>Décharge de responsabilité envers les tiers :</strong>
              livrestaka.fr décline toute responsabilité envers des tiers pour
              l'utilisation de ses services par le client. Le client s'engage à
              garantir et tenir indemne livrestaka.fr contre toute réclamation,
              action en justice ou demande de dommages-intérêts émanant de tiers et
              résultant de :
            </p>
            <ul>
              <li>L'utilisation des services de correction et relecture fournis</li>
              <li>La publication ou diffusion du manuscrit corrigé</li>
              <li>
                Toute violation de droits de propriété intellectuelle de tiers
              </li>
              <li>Tout préjudice causé à des tiers par le contenu de l'œuvre</li>
              <li>
                L'utilisation commerciale ou non commerciale de l'œuvre corrigée
              </li>
            </ul>

            <p>
              <strong>Garantie satisfaction :</strong> En cas d'insatisfaction
              justifiée concernant la qualité de la correction, livrestaka.fr
              s'engage à reprendre gratuitement le travail ou à rembourser la
              prestation.
            </p>

            <p>
              <strong>Réclamations :</strong> Toute réclamation doit être formulée
              dans les 7 jours suivant la livraison pour être prise en compte.
            </p>

            <h3>Article 9 - Force majeure</h3>
            <p>
              La responsabilité de livrestaka.fr ne peut être engagée en cas de
              force majeure ou de circonstances indépendantes de sa volonté.
            </p>

            <h3>Article 10 - Résiliation</h3>
            <p>
              livrestaka.fr se réserve le droit d'annuler les commandes pour
              non-respect des dispositions légales et/ou des présentes conditions
              générales de vente.
            </p>

            <p>
              L'annulation et le remboursement de la commande entraîne la suspension
              et la clôture du compte personnel sans délais et sans préjudice.
            </p>

            <h3>Article 11 - Données personnelles</h3>
            <p>
              En application de la réglementation applicable aux données à caractère
              personnel, les utilisateurs disposent des droits mentionnés dans les
              mentions légales, qu'ils peuvent exercer en faisant leur demande à
              l'adresse suivante : contact@livrestaka.fr
            </p>

            <h3>Article 12 - Droit applicable</h3>
            <p>
              Les présentes conditions générales de vente sont soumises à la loi
              française. En cas de litige, et après recherche d'une solution
              amiable, les tribunaux français seront seuls compétents.
            </p>

            <div className="bg-blue-50 p-6 border-l-4 border-blue-400 my-8">
              <h4>Contact</h4>
              <p>
                <strong>Staka Editions</strong><br />
                Email : contact@livrestaka.fr<br />
                Téléphone : +33 1 84 25 56 78<br />
                Disponible 24h/7j
              </p>
            </div>
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

export default CGVPage;