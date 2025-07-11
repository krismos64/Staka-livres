import React from "react";
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

export default function Packs() {
  // Utilisation du hook usePricing au lieu de useState+useEffect
  const { tarifs, isLoading, error, refreshTarifs } = usePricing({
    enableDebugLogs: process.env.NODE_ENV === "development",
  });

  const handlePackClick = (packId: string) => {
    console.log(`Pack sélectionné: ${packId}`);
    // TODO: Rediriger vers le formulaire de commande ou ouvrir une modal
  };

  const handleFreeTestClick = () => {
    const element = document.getElementById("commande-gratuite");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Générer les packs depuis les tarifs ou utiliser les fallbacks
  const packs = React.useMemo(() => {
    if (!tarifs || tarifs.length === 0) {
      return getDefaultPacks();
    }
    return buildPacksFromTarifs(tarifs);
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

          {/* Message d'erreur avec bouton retry */}
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
          {packs.map((pack, index) => (
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
                <div
                  className={`text-4xl font-bold mb-2 ${
                    pack.featured ? "text-white" : "text-blue-600"
                  }`}
                >
                  {pack.prix}
                </div>
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
                Choisir ce pack
              </button>

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
  const maquetteTarifs = activeTarifs.filter(
    (t) =>
      t.typeService === "Mise en forme" ||
      t.nom.toLowerCase().includes("maquette")
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
      nom: correctionStandard.nom || "Correction Standard",
      prix: correctionStandard.prixFormate,
      description:
        correctionStandard.description ||
        "Correction complète de votre manuscrit",
      services: [
        "Correction complète",
        "Maquette intérieure",
        "Conception couverture",
        "Fichiers ePub & Mobi",
        "Support prioritaire",
      ],
      delai: correctionStandard.dureeEstimee || "7-10 jours",
      featured: true,
      buttonStyle:
        "w-full bg-white text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition border-2 border-white",
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
        "w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition",
    });
  }

  // Si moins de 3 packs, ajouter des tarifs supplémentaires
  if (packs.length < 3) {
    const missingCount = 3 - packs.length;
    const usedIds = new Set(packs.map((p) => p.id));
    const remainingTarifs = activeTarifs
      .filter((t) => !usedIds.has(t.id))
      .slice(0, missingCount);

    remainingTarifs.forEach((tarif, index) => {
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
      nom: "Pack Rédaction Complète",
      prix: "1450€",
      description: "Coaching complet",
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
