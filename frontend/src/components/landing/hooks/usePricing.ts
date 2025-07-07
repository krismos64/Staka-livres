import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
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

interface UsePricingOptions {
  /** Configuration du cache React Query */
  staleTime?: number;
  /** Pages initiales du calculateur */
  initialPages?: number;
  /** Active les logs de débogage */
  enableDebugLogs?: boolean;
}

export function usePricing(options: UsePricingOptions = {}) {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes par défaut
    initialPages = 150,
    enableDebugLogs = false,
  } = options;

  const [pages, setPages] = useState<number>(initialPages);
  const queryClient = useQueryClient();

  const {
    data: tarifs = [],
    isLoading,
    error,
    refetch,
  } = useQuery<TarifAPI[]>({
    queryKey: ["tarifs", "public"],
    queryFn: async () => {
      if (enableDebugLogs) {
        console.log("🔄 Fetching tarifs publics...");
      }
      const data = await fetchTarifs();
      if (enableDebugLogs) {
        console.log("✅ Tarifs publics récupérés:", data.length, "tarifs");
      }
      return data;
    },
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Gestion des erreurs avec un effet séparé
  if (error && enableDebugLogs) {
    console.error("❌ Erreur lors du fetch des tarifs:", error);
  }

  const pricingRules = useMemo(() => {
    const tarifsArray = Array.isArray(tarifs) ? tarifs : [];
    if (tarifsArray.length > 0) {
      if (enableDebugLogs) {
        console.log(
          "📊 Calcul des règles de pricing depuis",
          tarifsArray.length,
          "tarifs"
        );
      }
      return extractPricingRules(tarifsArray);
    }
    // Fallback sur les règles par défaut si les tarifs ne sont pas disponibles
    if (enableDebugLogs) {
      console.log("⚠️ Utilisation des règles de pricing par défaut");
    }
    return [
      { threshold: 10, price: 0, isFree: true },
      { threshold: 300, price: 2 },
      { threshold: Infinity, price: 1 },
    ];
  }, [tarifs, enableDebugLogs]);

  const pricing = useMemo(() => {
    return calculatePricingFromRules(pages, pricingRules);
  }, [pages, pricingRules]);

  const calculatePrice = useCallback(
    (pageCount: number): number => {
      return calculatePriceFromRules(pageCount, pricingRules);
    },
    [pricingRules]
  );

  const getComparisonPrices = useCallback(
    () => ({
      100: calculatePrice(100),
      200: calculatePrice(200),
      300: calculatePrice(300),
      500: calculatePrice(500),
    }),
    [calculatePrice]
  );

  /**
   * Force le refetch des tarifs sans attendre l'expiration du cache
   * Utile après mise à jour en admin
   */
  const refreshTarifs = useCallback(async () => {
    if (enableDebugLogs) {
      console.log("🔄 Force refresh des tarifs publics...");
    }
    try {
      await refetch();
      if (enableDebugLogs) {
        console.log("✅ Tarifs publics rafraîchis avec succès");
      }
    } catch (error) {
      if (enableDebugLogs) {
        console.error("❌ Erreur lors du refresh des tarifs:", error);
      }
    }
  }, [refetch, enableDebugLogs]);

  /**
   * Invalide manuellement le cache des tarifs
   * Pour forcer un nouveau fetch à la prochaine utilisation
   */
  const invalidateCache = useCallback(async () => {
    if (enableDebugLogs) {
      console.log("🗑️ Invalidation du cache des tarifs publics...");
    }
    await queryClient.invalidateQueries({
      queryKey: ["tarifs", "public"],
      exact: true,
    });
  }, [queryClient, enableDebugLogs]);

  /**
   * Vérifie si le cache est périmé
   */
  const isCacheStale = useCallback(() => {
    const queryState = queryClient.getQueryState(["tarifs", "public"]);
    if (!queryState) return true;

    const now = Date.now();
    const dataUpdatedAt = queryState.dataUpdatedAt || 0;
    const isStale = now - dataUpdatedAt > staleTime;

    if (enableDebugLogs && isStale) {
      console.log(
        "⏰ Cache des tarifs périmé, âge:",
        (now - dataUpdatedAt) / 1000,
        "secondes"
      );
    }

    return isStale;
  }, [queryClient, staleTime, enableDebugLogs]);

  const tarifsArray = Array.isArray(tarifs) ? tarifs : [];

  return {
    // États principaux
    pages,
    setPages,
    pricing,
    tarifs: tarifsArray,
    isLoading,
    error: error instanceof Error ? error.message : null,

    // Fonctions de calcul
    calculatePrice,
    getComparisonPrices,

    // Gestion du cache
    refreshTarifs,
    invalidateCache,
    isCacheStale,

    // Debug
    debugInfo: enableDebugLogs
      ? {
          cacheAge: queryClient.getQueryState(["tarifs", "public"])
            ?.dataUpdatedAt,
          rulesCount: pricingRules.length,
          tarifsCount: tarifsArray.length,
        }
      : undefined,
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
