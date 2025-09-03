import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { TarifAPI } from "../../utils/api";
import ErrorMessage from "../ui/ErrorMessage";
import Loader from "../ui/Loader";
import { usePricing } from "./hooks/usePricing";

interface Pack {
  id: string;
  nom: string;
  prix: string;
  description: string;
  services: string[];
  delai: string;
  featured?: boolean;
  buttonStyle: string;
}

interface PacksProps {
  onSignupClick?: () => void;
}

// Fonction utilitaire pour détecter le Pack 3
const isPack3Detection = (pack: Pack) => {
  return (
    pack.id === "pack-redaction-default" ||
    pack.id.includes("redaction") ||
    pack.id.includes("coaching") ||
    pack.nom.toLowerCase().includes("rédaction") ||
    pack.nom.toLowerCase().includes("coaching")
  );
};

export default function Packs({ onSignupClick }: PacksProps) {
  // Utilisation du hook usePricing au lieu de useState+useEffect
  const { tarifs, isLoading, error, refreshTarifs } = usePricing({
    enableDebugLogs: process.env.NODE_ENV === "development",
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  // Utilitaire pour générer un slug à partir du nom
  const getSlug = (nom: string) =>
    nom
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

  /**
   * 🎯 COMPORTEMENT SPÉCIAL PACK 3 (Rédaction/Coaching)
   *
   * IMPORTANT: Le Pack 3 a un comportement différent des autres packs :
   * - Services cachés (pas de liste d'inclusions)
   * - Délai masqué
   * - Bouton "Contactez-nous" au lieu de "Choisir ce pack"
   * - Redirection vers formulaire de contact (#contact) au lieu de commande
   *
   * DÉTECTION AUTOMATIQUE : Fonctionne avec :
   * - Pack par défaut : "pack-redaction-default"
   * - Tarifs admin contenant "redaction" ou "coaching" dans l'ID/nom
   *
   * ⚠️ ATTENTION ADMIN : Si vous modifiez les noms des tarifs de coaching/rédaction
   * en admin, assurez-vous qu'ils contiennent "redaction" ou "coaching" pour
   * conserver ce comportement spécial.
   */
  const handlePackClick = (packId: string) => {
    // DEBUG: Console log pour vérifier la détection
    console.log("🐛 DEBUG - Pack cliqué:", packId);
    console.log(
      "🐛 DEBUG - Est Pack 3?",
      packId === "pack-redaction-default" ||
        packId.includes("redaction") ||
        packId.includes("coaching")
    );

    // Pack 3 redirige vers le formulaire de contact
    // CORRECTION: Vérifier aussi par le nom du pack trouvé
    const pack = packs.find((p) => p.id === packId);
    const isPack3 =
      packId === "pack-redaction-default" ||
      packId.includes("redaction") ||
      packId.includes("coaching") ||
      (pack &&
        (pack.nom.toLowerCase().includes("rédaction") ||
          pack.nom.toLowerCase().includes("coaching")));

    if (isPack3) {
      const element = document.getElementById("contact");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    // Pack normal - redirection vers commande
    if (pack) {
      const slug = getSlug(pack.nom);
      navigate(`/commande-invitee?pack=${slug}`);
    }
  };

  const handleFreeTestClick = () => {
    const element = document.getElementById("commande-gratuite");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Générer les packs depuis les tarifs ou utiliser les fallbacks
  const packs = React.useMemo(() => {
    let finalPacks;
    if (!tarifs || tarifs.length === 0) {
      finalPacks = getDefaultPacks();
    } else {
      finalPacks = buildPacksFromTarifs(tarifs);
    }

    // DEBUG: Log des packs générés
    console.log(
      "🐛 DEBUG - Packs générés:",
      finalPacks.map((p) => ({
        id: p.id,
        nom: p.nom,
        isPack3:
          p.id === "pack-redaction-default" ||
          p.id.includes("redaction") ||
          p.id.includes("coaching"),
      }))
    );

    return finalPacks;
  }, [tarifs]);

  // État de chargement
  if (isLoading) {
    return (
      <section id="packs" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <Loader message="Chargement des offres..." size="lg" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="packs" data-testid="packs-section" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choisissez votre{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              pack d'édition
            </span>
          </h2>
          <div className="flex justify-center">
            <p className="text-lg text-gray-600 text-center">
              Des solutions adaptées à chaque étape de votre projet
            </p>
          </div>

          {/* Message d'erreur éventuel */}
          {error && (
            <ErrorMessage
              message="Offres indisponibles, affichage des offres par défaut"
              onRetry={refreshTarifs}
              retryLabel="Recharger"
              variant="warning"
              className="mt-4"
            />
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={`${
                pack.featured
                  ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 relative transform scale-105"
                  : "bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:border-blue-300 transition-all duration-300"
              }`}
            >
              {pack.featured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-gray-800 px-4 py-1 rounded-full text-sm font-semibold">
                    ⭐ Le plus populaire
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-bold mb-2">{pack.nom}</h3>
                {/* 🎯 PACK 3 SPÉCIAL : Masquer le prix pour les packs rédaction/coaching */}
                {!isPack3Detection(pack) && (
                  <div
                    className={`text-4xl font-bold mb-2 ${
                      pack.featured ? "text-white" : "text-blue-600"
                    }`}
                  >
                    {pack.prix}
                  </div>
                )}
                <div
                  className={`inline-block px-3 py-1 rounded-md text-sm ${
                    pack.featured
                      ? "bg-white/20 text-white"
                      : pack.id === "pack-redaction-default"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {pack.description}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {pack.services.map((service, serviceIndex) => (
                  <li key={serviceIndex} className="flex items-center gap-3">
                    <i
                      className={`fas fa-check ${
                        pack.featured ? "text-green-300" : "text-green-500"
                      }`}
                    ></i>
                    <span className="text-sm">{service}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePackClick(pack.id)}
                className={pack.buttonStyle}
              >
                {/* 🎯 PACK 3 SPÉCIAL : Bouton "Contactez-nous" pour packs rédaction/coaching */}
                {isPack3Detection(pack) ? "Contactez-nous" : "Choisir ce pack"}
              </button>

              {/* 🎯 PACK 3 SPÉCIAL : Masquer le délai pour les packs rédaction/coaching */}
              {!isPack3Detection(pack) && (
                <div className="mt-4 text-center">
                  <span
                    className={`text-sm flex items-center justify-center gap-1 ${
                      pack.featured ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    <i className="fas fa-clock"></i>
                    Délai: {pack.delai}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center text-center mt-12">
          <p className="text-gray-600 mb-4 text-center">
            Pas sûr de votre choix ? Testez notre expertise
          </p>
          <button
            onClick={handleFreeTestClick}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-semibold inline-flex items-center gap-3 transition"
          >
            <i className="fas fa-gift"></i>
            Correction gratuite de 10 pages
          </button>
        </div>
      </div>
    </section>
  );
}

// Fonction pour construire les packs depuis les tarifs récupérés
function buildPacksFromTarifs(tarifs: TarifAPI[]): Pack[] {
  const packs: Pack[] = [];

  // Filtrer les tarifs actifs et les ordonner
  const activeTarifs = tarifs
    .filter((t) => t.actif)
    .sort((a, b) => a.ordre - b.ordre);

  // Chercher des tarifs spécifiques pour construire les packs
  const correctionTarifs = activeTarifs.filter(
    (t) =>
      t.typeService === "Correction" ||
      t.nom.toLowerCase().includes("correction")
  );
  const reecritureTarifs = activeTarifs.filter(
    (t) =>
      t.typeService === "Réécriture" ||
      t.nom.toLowerCase().includes("réécriture")
  );

  // Pack KDP - Tarif fixe s'il existe
  const kdpTarif = activeTarifs.find(
    (t) =>
      t.nom.toLowerCase().includes("kdp") ||
      t.nom.toLowerCase().includes("autoédition")
  );
  if (kdpTarif) {
    packs.push({
      id: kdpTarif.id,
      nom: kdpTarif.nom,
      prix: kdpTarif.prixFormate,
      description: kdpTarif.description || "Idéal pour débuter",
      services: [
        "Relecture complète",
        "Maquette intérieure",
        "Conception couverture",
        "Fichiers ePub & Mobi",
        "Accompagnement KDP",
      ],
      delai: kdpTarif.dureeEstimee || "5-7 jours",
      featured: false,
      buttonStyle:
        "w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition",
    });
  }

  // Pack Correction Standard
  const correctionStandard =
    correctionTarifs.find(
      (t) =>
        t.nom.toLowerCase().includes("standard") ||
        t.typeService === "Correction"
    ) || correctionTarifs[0];

  if (correctionStandard) {
    packs.push({
      id: correctionStandard.id,
      nom: correctionStandard.nom || "Pack Intégral",
      prix: correctionStandard.prixFormate,
      description: correctionStandard.description || "Solution complète",
      services: [
        "Correction complète",
        "Maquette intérieure",
        "Conception couverture",
        "Fichiers ePub & Mobi",
        "Rapport de correction détaillé",
        "Support prioritaire",
      ],
      delai: correctionStandard.dureeEstimee || "10-15 jours",
      featured: true,
      buttonStyle:
        "w-full bg-white text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition",
    });
  }

  // Pack Réécriture/Relecture Avancée
  const reecritureAvancee =
    reecritureTarifs.find(
      (t) =>
        t.nom.toLowerCase().includes("avancée") ||
        t.nom.toLowerCase().includes("complète")
    ) ||
    reecritureTarifs[0] ||
    activeTarifs.find(
      (t) =>
        t.typeService === "Relecture" ||
        t.nom.toLowerCase().includes("relecture")
    );

  if (reecritureAvancee) {
    packs.push({
      id: reecritureAvancee.id,
      nom: reecritureAvancee.nom || "Réécriture Avancée",
      prix: reecritureAvancee.prixFormate,
      description:
        reecritureAvancee.description ||
        "Réécriture professionnelle avec suggestions",
      services: [
        "Réécriture approfondie",
        "Restructuration des passages",
        "Amélioration du rythme",
        "Renforcement de la cohérence",
        "Suggestions d'amélioration",
        "Coaching rédactionnel inclus",
      ],
      delai: reecritureAvancee.dureeEstimee || "10-14 jours",
      featured: false,
      buttonStyle:
        "w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition",
    });
  }

  // Si moins de 3 packs, ajouter des tarifs supplémentaires
  if (packs.length < 3) {
    const missingCount = 3 - packs.length;
    const usedIds = new Set(packs.map((p) => p.id));
    const remainingTarifs = activeTarifs
      .filter((t) => !usedIds.has(t.id))
      .slice(0, missingCount);

    remainingTarifs.forEach((tarif) => {
      packs.push({
        id: tarif.id,
        nom: tarif.nom,
        prix: tarif.prixFormate,
        description: tarif.description || `Service ${tarif.typeService}`,
        services: [
          "Coaching rédactionnel",
          "Correction complète",
          "Maquette intérieure",
          "Conception couverture",
          "Fichiers ePub & Mobi",
        ],
        delai: tarif.dureeEstimee || "5-7 jours",
        featured: false,
        buttonStyle:
          "w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition",
      });
    });
  }

  // Si toujours pas assez de packs, utiliser les packs par défaut
  if (packs.length === 0) {
    return getDefaultPacks();
  }

  return packs.slice(0, 3); // Limiter à 3 packs maximum
}

// Fonction pour les packs par défaut (fallback)
function getDefaultPacks(): Pack[] {
  return [
    {
      id: "pack-kdp-default",
      nom: "Pack KDP Autoédition",
      prix: "350€",
      description: "Idéal pour débuter",
      services: [
        "Relecture complète",
        "Maquette intérieure",
        "Couverture personnalisée",
        "Format Kindle (.mobi)",
        "Format ePub optimisé",
        "Fichiers print-ready",
        "Guide de publication inclus",
      ],
      delai: "5-7 jours",
      featured: false,
      buttonStyle:
        "w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition",
    },
    {
      id: "pack-integral-default",
      nom: "Pack Intégral",
      prix: "2€/page",
      description: "Solution complète",
      services: [
        "Correction orthographique",
        "Correction grammaticale",
        "Correction syntaxique",
        "Amélioration du style",
        "Rapport de correction détaillé",
        "2 révisions incluses",
      ],
      delai: "10-15 jours",
      featured: true,
      buttonStyle:
        "w-full bg-white text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition",
    },
    {
      id: "pack-redaction-default",
      nom: "Coaching complet",
      prix: "1450€",
      description: "Service complet de coaching et édition professionnelle",
      services: [
        "Coaching rédactionnel",
        "Correction complète",
        "Maquette intérieure",
        "Conception couverture",
        "Fichiers ePub & Mobi",
      ],
      delai: "3-6 semaines",
      featured: false,
      buttonStyle:
        "w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition",
    },
  ];
}
