import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchTarifs, TarifAPI } from "../../../utils/api";

interface PricingBreakdown {
  free: number;
  tier2: number;
  tier3: number;
  tier2Pages: number;
  tier3Pages: number;
  total: number;
  avgPricePerPage: number;
  savings: number;
  deliveryTime: string;
}

interface PricingRule {
  threshold: number;
  price: number;
  isFree?: boolean;
}

export function usePricing(initialPages: number = 150) {
  const [pages, setPages] = useState<number>(initialPages);

  const {
    data: tarifs = [],
    isLoading,
    error,
  } = useQuery<TarifAPI[]>({
    queryKey: ["tarifs", "public"],
    queryFn: fetchTarifs,
  });

  const pricingRules = useMemo(() => {
    if (tarifs.length > 0) {
      return extractPricingRules(tarifs);
    }
    // Fallback sur les règles par défaut si les tarifs ne sont pas disponibles
    return [
      { threshold: 10, price: 0, isFree: true },
      { threshold: 300, price: 2 },
      { threshold: Infinity, price: 1 },
    ];
  }, [tarifs]);

  const pricing = useMemo(() => {
    return calculatePricingFromRules(pages, pricingRules);
  }, [pages, pricingRules]);

  const calculatePrice = (pageCount: number): number => {
    return calculatePriceFromRules(pageCount, pricingRules);
  };

  const getComparisonPrices = () => ({
    100: calculatePrice(100),
    200: calculatePrice(200),
    300: calculatePrice(300),
    500: calculatePrice(500),
  });

  return {
    pages,
    setPages,
    pricing,
    calculatePrice,
    getComparisonPrices,
    isLoading,
    error: error instanceof Error ? error.message : null,
    tarifs,
  };
}

// Fonction de fallback avec les valeurs par défaut
function calculateDefaultPricing(pages: number): PricingBreakdown {
  let total = 0;
  let breakdown = {
    free: 0,
    tier2: 0,
    tier3: 0,
    tier2Pages: 0,
    tier3Pages: 0,
  };

  if (pages <= 10) {
    breakdown.free = pages;
    total = 0;
  } else if (pages <= 300) {
    breakdown.free = 10;
    breakdown.tier2Pages = pages - 10;
    breakdown.tier2 = breakdown.tier2Pages * 2;
    total = breakdown.tier2;
  } else {
    breakdown.free = 10;
    breakdown.tier2Pages = 290;
    breakdown.tier3Pages = pages - 300;
    breakdown.tier2 = breakdown.tier2Pages * 2;
    breakdown.tier3 = breakdown.tier3Pages * 1;
    total = breakdown.tier2 + breakdown.tier3;
  }

  const avgPricePerPage = pages > 0 ? total / pages : 0;
  const savings = pages > 10 ? 20 : pages * 2;

  // Calcul du délai de livraison
  let deliveryTime = "7-8 jours";
  if (pages <= 50) deliveryTime = "7-8 jours";
  else if (pages <= 150) deliveryTime = "10-12 jours";
  else if (pages <= 300) deliveryTime = "12-15 jours";
  else deliveryTime = "15-20 jours";

  return {
    ...breakdown,
    total,
    avgPricePerPage: Number(avgPricePerPage.toFixed(2)),
    savings,
    deliveryTime,
  };
}

function calculateDefaultPrice(pageCount: number): number {
  if (pageCount <= 10) return 0;
  if (pageCount <= 300) return (pageCount - 10) * 2;
  return 290 * 2 + (pageCount - 300) * 1;
}

// Extraire les règles de tarification depuis les tarifs récupérés
function extractPricingRules(tarifs: TarifAPI[]): PricingRule[] {
  // Chercher des tarifs qui correspondent à notre système de tarification dégressive
  const correctionTarifs = tarifs.filter(
    (t) =>
      t.typeService === "Correction" ||
      t.nom.toLowerCase().includes("correction") ||
      t.nom.toLowerCase().includes("page")
  );

  // Si on trouve des tarifs spécifiques, les utiliser
  if (correctionTarifs.length > 0) {
    // Organiser par prix croissant pour détecter la progressivité
    const sortedTarifs = correctionTarifs.sort((a, b) => a.prix - b.prix);

    // Construire les règles basées sur les tarifs trouvés
    const rules: PricingRule[] = [
      { threshold: 10, price: 0, isFree: true }, // 10 premières pages gratuites
    ];

    // Ajouter les règles basées sur les tarifs récupérés
    if (sortedTarifs.length > 0) {
      rules.push({ threshold: 300, price: sortedTarifs[0].prix });
      if (sortedTarifs.length > 1) {
        rules.push({ threshold: Infinity, price: sortedTarifs[1].prix });
      } else {
        rules.push({
          threshold: Infinity,
          price: Math.max(1, sortedTarifs[0].prix - 1),
        });
      }
    } else {
      // Fallback
      rules.push({ threshold: 300, price: 2 });
      rules.push({ threshold: Infinity, price: 1 });
    }

    return rules;
  }

  // Fallback sur les règles par défaut
  return [
    { threshold: 10, price: 0, isFree: true },
    { threshold: 300, price: 2 },
    { threshold: Infinity, price: 1 },
  ];
}

// Calculer le prix selon les règles extraites
function calculatePricingFromRules(
  pages: number,
  rules: PricingRule[]
): PricingBreakdown {
  let total = 0;
  let breakdown = {
    free: 0,
    tier2: 0,
    tier3: 0,
    tier2Pages: 0,
    tier3Pages: 0,
  };

  let remainingPages = pages;
  let currentThreshold = 0;

  for (const rule of rules) {
    const pagesToProcess = Math.min(
      remainingPages,
      rule.threshold - currentThreshold
    );

    if (pagesToProcess <= 0) break;

    if (rule.isFree) {
      breakdown.free = pagesToProcess;
    } else if (breakdown.tier2Pages === 0) {
      breakdown.tier2Pages = pagesToProcess;
      breakdown.tier2 = pagesToProcess * rule.price;
      total += breakdown.tier2;
    } else {
      breakdown.tier3Pages = pagesToProcess;
      breakdown.tier3 = pagesToProcess * rule.price;
      total += breakdown.tier3;
    }

    remainingPages -= pagesToProcess;
    currentThreshold = rule.threshold;
  }

  const avgPricePerPage = pages > 0 ? total / pages : 0;
  const savings = pages > 10 ? 20 : pages * 2;

  // Calcul du délai de livraison (logique conservée)
  let deliveryTime = "7-8 jours";
  if (pages <= 50) deliveryTime = "7-8 jours";
  else if (pages <= 150) deliveryTime = "10-12 jours";
  else if (pages <= 300) deliveryTime = "12-15 jours";
  else deliveryTime = "15-20 jours";

  return {
    ...breakdown,
    total,
    avgPricePerPage: Number(avgPricePerPage.toFixed(2)),
    savings,
    deliveryTime,
  };
}

function calculatePriceFromRules(
  pageCount: number,
  rules: PricingRule[]
): number {
  let total = 0;
  let remainingPages = pageCount;
  let currentThreshold = 0;

  for (const rule of rules) {
    const pagesToProcess = Math.min(
      remainingPages,
      rule.threshold - currentThreshold
    );

    if (pagesToProcess <= 0) break;

    if (!rule.isFree) {
      total += pagesToProcess * rule.price;
    }

    remainingPages -= pagesToProcess;
    currentThreshold = rule.threshold;
  }

  return total;
}
