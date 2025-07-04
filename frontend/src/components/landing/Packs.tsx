import { useEffect, useState } from "react";
import { fetchTarifs, TarifAPI } from "../../utils/api";

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
  const [packs, setPacks] = useState<Pack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPacks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const tarifs = await fetchTarifs();
        const dynamicPacks = buildPacksFromTarifs(tarifs);
        setPacks(dynamicPacks);
      } catch (err) {
        console.error("Erreur chargement packs:", err);
        setError(err instanceof Error ? err.message : "Erreur de chargement");
        // Fallback sur les packs par défaut
        setPacks(getDefaultPacks());
      } finally {
        setIsLoading(false);
      }
    };

    loadPacks();
  }, []);

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

  if (isLoading) {
    return (
      <section id="packs" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span>Chargement des offres...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="packs" className="py-16 bg-white">
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

          {error && (
            <div className="mt-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg inline-block">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Offres indisponibles, affichage des offres par défaut
            </div>
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
                <h3 className="text-2xl font-bold mb-2">{pack.nom}</h3>
                <div className="text-3xl font-bold mb-2">{pack.prix}</div>
                <p
                  className={pack.featured ? "text-blue-100" : "text-gray-500"}
                >
                  {pack.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {pack.services.map((service, serviceIndex) => (
                  <li key={serviceIndex} className="flex items-center gap-3">
                    <i
                      className={`fas fa-check ${
                        pack.featured ? "text-green-300" : "text-green-500"
                      }`}
                    ></i>
                    <span>{service}</span>
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
                  className={`text-sm ${
                    pack.featured ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  🕒 Délai: {pack.delai}
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

  // Chercher des tarifs spécifiques pour construire les packs
  const correctionTarifs = tarifs.filter(
    (t) =>
      t.typeService === "Correction" ||
      t.nom.toLowerCase().includes("correction")
  );
  const maquetteTarifs = tarifs.filter(
    (t) =>
      t.typeService === "Mise en forme" ||
      t.nom.toLowerCase().includes("maquette")
  );
  const couvertureTarifs = tarifs.filter((t) =>
    t.nom.toLowerCase().includes("couverture")
  );

  // Pack KDP - Tarif fixe s'il existe
  const kdpTarif = tarifs.find(
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
      buttonStyle:
        "w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition",
    });
  } else {
    // Pack KDP par défaut
    packs.push({
      id: "pack-kdp",
      nom: "Pack KDP",
      prix: "350€",
      description: "Idéal pour débuter",
      services: [
        "Maquette intérieure",
        "Conception couverture",
        "Fichiers ePub & Mobi",
        "Accompagnement KDP",
      ],
      delai: "5-7 jours",
      buttonStyle:
        "w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition",
    });
  }

  // Pack Intégral - Utiliser les tarifs de correction s'ils existent
  const correctionPrincipal =
    correctionTarifs.find((t) => t.actif) || correctionTarifs[0];
  if (correctionPrincipal) {
    packs.push({
      id: correctionPrincipal.id,
      nom: "Pack Intégral",
      prix: `${correctionPrincipal.prix}€/page`,
      description: "Solution complète",
      services: [
        "Correction complète",
        "Maquette intérieure",
        "Conception couverture",
        "Fichiers ePub & Mobi",
        "Support prioritaire",
      ],
      delai: correctionPrincipal.dureeEstimee || "10-15 jours",
      featured: true,
      buttonStyle:
        "w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition",
    });
  } else {
    // Pack Intégral par défaut
    packs.push({
      id: "pack-integral",
      nom: "Pack Intégral",
      prix: "2€/page",
      description: "Solution complète",
      services: [
        "Correction complète",
        "Maquette intérieure",
        "Conception couverture",
        "Fichiers ePub & Mobi",
        "Support prioritaire",
      ],
      delai: "10-15 jours",
      featured: true,
      buttonStyle:
        "w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition",
    });
  }

  // Pack Rédaction - Chercher un tarif spécifique ou utiliser par défaut
  const redactionTarif = tarifs.find(
    (t) =>
      t.nom.toLowerCase().includes("rédaction") ||
      t.nom.toLowerCase().includes("coaching") ||
      t.typeService === "Rédaction"
  );

  if (redactionTarif) {
    packs.push({
      id: redactionTarif.id,
      nom: redactionTarif.nom,
      prix: redactionTarif.prixFormate,
      description: redactionTarif.description || "Coaching complet",
      services: [
        "Coaching rédactionnel",
        "Correction complète",
        "Maquette intérieure",
        "Conception couverture",
        "Fichiers ePub & Mobi",
      ],
      delai: redactionTarif.dureeEstimee || "3-6 semaines",
      buttonStyle:
        "w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition",
    });
  } else {
    // Pack Rédaction par défaut
    packs.push({
      id: "pack-redaction",
      nom: "Pack Rédaction",
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
      buttonStyle:
        "w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition",
    });
  }

  return packs;
}

// Packs par défaut en cas d'erreur
function getDefaultPacks(): Pack[] {
  return [
    {
      id: "pack-kdp-default",
      nom: "Pack KDP",
      prix: "350€",
      description: "Idéal pour débuter",
      services: [
        "Maquette intérieure",
        "Conception couverture",
        "Fichiers ePub & Mobi",
        "Accompagnement KDP",
      ],
      delai: "5-7 jours",
      buttonStyle:
        "w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition",
    },
    {
      id: "pack-integral-default",
      nom: "Pack Intégral",
      prix: "2€/page",
      description: "Solution complète",
      services: [
        "Correction complète",
        "Maquette intérieure",
        "Conception couverture",
        "Fichiers ePub & Mobi",
        "Support prioritaire",
      ],
      delai: "10-15 jours",
      featured: true,
      buttonStyle:
        "w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition",
    },
    {
      id: "pack-redaction-default",
      nom: "Pack Rédaction",
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
      buttonStyle:
        "w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition",
    },
  ];
}
