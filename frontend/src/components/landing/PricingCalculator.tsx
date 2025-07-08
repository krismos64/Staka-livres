import React, { useState } from "react";
import ErrorMessage from "../ui/ErrorMessage";
import Loader from "../ui/Loader";
import { usePricing } from "./hooks/usePricing";

export default function PricingCalculator() {
  const {
    pages,
    setPages,
    pricing,
    tarifs,
    getComparisonPrices,
    isLoading,
    error,
    refreshTarifs,
    isCacheStale,
  } = usePricing({
    initialPages: 150,
    enableDebugLogs: process.env.NODE_ENV === "development",
  });
  const [selectedPreset, setSelectedPreset] = useState(150);

  const comparisonPrices = getComparisonPrices();

  const handlePageChange = (newPages: number) => {
    const validPages = Math.max(1, Math.min(1000, newPages));
    setPages(validPages);
  };

  const handlePresetClick = (presetPages: number) => {
    setPages(presetPages);
    setSelectedPreset(presetPages);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPages = parseInt(e.target.value);
    handlePageChange(newPages);
  };

  const handleOrderClick = () => {
    console.log(`Commande pour ${pricing.total}€, ${pages} pages`);
    // TODO: Rediriger vers le formulaire de commande ou ouvrir une modal
  };

  const handleFreeTestClick = () => {
    console.log("Redirection vers test gratuit 10 pages");
    // TODO: Rediriger vers #commande-gratuite
    const element = document.getElementById("commande-gratuite");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleExpertChatClick = () => {
    console.log("Ouverture chat expert");
    // TODO: Ouvrir le chat ou rediriger vers contact
  };

  // Fonction pour générer les cartes de tarification depuis les règles de pricing
  const getPricingCards = () => {
    // Utiliser les règles de pricing pour construire les cartes selon la maquette
    // La structure doit toujours être : GRATUIT | TIER2 | TIER3

    // Récupérer les règles depuis le hook usePricing
    const { debugInfo } = usePricing({
      enableDebugLogs: process.env.NODE_ENV === "development",
    });

    // Si on a accès aux règles de pricing via les tarifs
    if (tarifs && tarifs.length > 0) {
      const correctionTarifs = tarifs
        .filter(
          (t) =>
            t.actif &&
            (t.typeService === "Correction" ||
              t.nom.toLowerCase().includes("correction"))
        )
        .sort((a, b) => a.ordre - b.ordre);

      if (correctionTarifs.length > 0) {
        // Utiliser le prix du premier tarif de correction pour le tier2
        const prixTier2 = correctionTarifs[0].prix / 100; // Convertir centimes → euros
        const prixTier3 =
          correctionTarifs.length > 1
            ? correctionTarifs[1].prix / 100
            : Math.max(1, prixTier2 - 1); // Prix dégressif ou fallback à prixTier2 - 1

        return [
          {
            id: "free",
            value: "10",
            unit: "premières pages",
            label: "GRATUITES",
            description: "Offre découverte",
          },
          {
            id: "tier2",
            value: `${prixTier2}€`,
            unit: "pages 11 à 300",
            label: "par page",
            description: "Tarif standard",
          },
          {
            id: "tier3",
            value: `${prixTier3}€`,
            unit: "au-delà de 300",
            label: "par page",
            description: "Tarif dégressif",
          },
        ];
      }
    }

    // Fallback sur les cartes par défaut (selon la maquette)
    return [
      {
        id: "free",
        value: "10",
        unit: "premières pages",
        label: "GRATUITES",
        description: "Offre découverte",
      },
      {
        id: "tier2",
        value: "2€",
        unit: "pages 11 à 300",
        label: "par page",
        description: "Tarif standard",
      },
      {
        id: "tier3",
        value: "1€",
        unit: "au-delà de 300",
        label: "par page",
        description: "Tarif dégressif",
      },
    ];
  };

  const pricingCards = getPricingCards();

  return (
    <section
      id="calculateur-prix"
      data-testid="pricing-calculator"
      className="py-16 bg-gradient-to-br from-green-50 to-blue-50"
    >
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Calculateur de prix
            </span>{" "}
            intelligent
          </h2>
          <div className="flex justify-center">
            <p className="text-lg text-gray-600 text-center">
              Découvrez le coût exact de votre correction avec notre
              tarification dégressive
            </p>
          </div>

          {/* Indicateur de chargement */}
          {isLoading && (
            <Loader message="Chargement des tarifs..." className="mt-4" />
          )}

          {/* Message d'erreur */}
          {error && (
            <ErrorMessage
              message="Tarifs indisponibles, utilisation des tarifs par défaut"
              onRetry={refreshTarifs}
              retryLabel="Retry"
              variant="warning"
              className="mt-4"
            />
          )}

          {/* Indicateur cache périmé (dev only) */}
          {process.env.NODE_ENV === "development" &&
            !isLoading &&
            !error &&
            isCacheStale() && (
              <ErrorMessage
                message="Cache des tarifs périmé"
                onRetry={refreshTarifs}
                retryLabel="Refresh"
                variant="info"
                className="mt-4"
              />
            )}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Pricing Rules Display - Version Dynamique */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <h3 className="text-xl font-bold mb-6 text-center">
              🎯 Notre tarification intelligente
            </h3>
            <div
              className={`grid gap-6 ${
                pricingCards.length === 3
                  ? "md:grid-cols-3"
                  : pricingCards.length === 2
                  ? "md:grid-cols-2"
                  : "md:grid-cols-1"
              }`}
            >
              {pricingCards.map((card) => (
                <div
                  key={card.id}
                  className="text-center bg-white/10 backdrop-blur rounded-2xl p-4"
                  title={card.description}
                >
                  <div
                    className={`text-3xl font-bold ${
                      card.id === "free"
                        ? "text-green-300"
                        : card.id === "tier2"
                        ? "text-yellow-300"
                        : "text-orange-300"
                    }`}
                  >
                    {card.value}
                  </div>
                  <div className="text-sm">{card.unit}</div>
                  <div className="text-lg font-semibold mt-2">{card.label}</div>
                  {card.description && (
                    <div className="text-xs text-white/80 mt-1 truncate">
                      {card.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Calculator Interface */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Input Section */}
              <div>
                <label
                  htmlFor="page-count"
                  className="block mb-3 font-semibold text-gray-700 text-lg"
                >
                  Nombre de pages de votre manuscrit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="page-count"
                    min="1"
                    max="1000"
                    value={pages}
                    onChange={(e) =>
                      handlePageChange(parseInt(e.target.value) || 0)
                    }
                    className="w-full border-3 border-blue-200 rounded-2xl p-4 text-2xl font-bold text-center focus:border-blue-500 focus:outline-none transition"
                    placeholder="150"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                    pages
                  </div>
                </div>

                {/* Page Range Slider */}
                <div className="mt-6">
                  <input
                    type="range"
                    id="page-slider"
                    min="1"
                    max="500"
                    value={Math.min(pages, 500)}
                    onChange={handleSliderChange}
                    className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>1 page</span>
                    <span>500+ pages</span>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-600 mb-3">
                    Tailles courantes :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { pages: 50, label: "Nouvelle (50p)" },
                      { pages: 150, label: "Roman court (150p)" },
                      { pages: 250, label: "Roman (250p)" },
                      { pages: 400, label: "Roman long (400p)" },
                    ].map((preset) => (
                      <button
                        key={preset.pages}
                        onClick={() => handlePresetClick(preset.pages)}
                        className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                          selectedPreset === preset.pages
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-gray-100 hover:bg-blue-100"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery time estimation */}
                <div className="mt-6 bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-clock text-blue-600"></i>
                    <span className="font-semibold text-blue-800">
                      Délai de livraison estimé
                    </span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {pricing.deliveryTime}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    Correction + mise en page incluses
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-6 text-center text-gray-800">
                    💰 Détail de votre devis
                  </h3>

                  {/* Pricing Breakdown */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-green-600 font-medium">
                        10 premières pages
                      </span>
                      <span className="font-bold text-green-600">GRATUIT</span>
                    </div>
                    {pricing.tier2Pages > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-700">
                          Pages 11-{Math.min(pages, 300)} ({pricing.tier2Pages}{" "}
                          pages)
                        </span>
                        <span className="font-bold">{pricing.tier2}€</span>
                      </div>
                    )}
                    {pricing.tier3Pages > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-700">
                          Pages 301+ ({pricing.tier3Pages} pages)
                        </span>
                        <span className="font-bold">{pricing.tier3}€</span>
                      </div>
                    )}
                  </div>

                  {/* Total Price */}
                  <div className="bg-white rounded-xl p-4 text-center border-2 border-blue-200">
                    <div className="text-sm text-gray-600 mb-1">Prix total</div>
                    <div
                      className="text-4xl font-bold text-blue-600"
                      data-testid="total-price"
                    >
                      {pricing.total}€
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Soit{" "}
                      <span className="font-medium">
                        {pricing.avgPricePerPage}€
                      </span>{" "}
                      par page en moyenne
                    </div>
                  </div>

                  {/* Savings Display */}
                  <div className="mt-4 text-center">
                    {pages > 10 ? (
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg inline-block">
                        <i className="fas fa-gift mr-2"></i>
                        <span className="font-medium">
                          Vous économisez {pricing.savings}€ grâce aux 10 pages
                          gratuites !
                        </span>
                      </div>
                    ) : (
                      <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg inline-block">
                        <i className="fas fa-star mr-2"></i>
                        <span className="font-medium">
                          Votre correction est entièrement gratuite !
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleOrderClick}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-4 rounded-xl font-semibold text-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    disabled={isLoading}
                  >
                    <i className="fas fa-shopping-cart mr-2"></i>
                    {isLoading
                      ? "Chargement..."
                      : `Commander pour ${pricing.total}€`}
                  </button>
                  <button
                    onClick={handleFreeTestClick}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                  >
                    <i className="fas fa-gift mr-2"></i>
                    D'abord tester avec 10 pages gratuites
                  </button>
                  <button
                    onClick={handleExpertChatClick}
                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                  >
                    <i className="fas fa-comments mr-2"></i>
                    Discuter avec un expert
                  </button>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-bold text-center mb-6">
                📊 Comparaison avec la concurrence
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-4 text-left font-semibold">
                        Nombre de pages
                      </th>
                      <th className="p-4 text-center font-semibold text-blue-600">
                        Staka Éditions
                      </th>
                      <th className="p-4 text-center font-semibold text-gray-500">
                        Concurrent A
                      </th>
                      <th className="p-4 text-center font-semibold text-gray-500">
                        Concurrent B
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { pages: 100, competitorA: 250, competitorB: 220 },
                      { pages: 200, competitorA: 500, competitorB: 440 },
                      { pages: 300, competitorA: 750, competitorB: 660 },
                      { pages: 500, competitorA: 1250, competitorB: 1100 },
                    ].map((row, index) => (
                      <tr
                        key={row.pages}
                        className={index % 2 === 1 ? "bg-blue-50" : "border-b"}
                      >
                        <td className="p-4 font-medium">{row.pages} pages</td>
                        <td className="p-4 text-center font-bold text-green-600">
                          {
                            comparisonPrices[
                              row.pages as keyof typeof comparisonPrices
                            ]
                          }
                          €
                        </td>
                        <td className="p-4 text-center text-gray-600">
                          {row.competitorA}€
                        </td>
                        <td className="p-4 text-center text-gray-600">
                          {row.competitorB}€
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
