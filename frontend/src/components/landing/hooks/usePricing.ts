import { useMemo, useState } from "react";

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

export function usePricing(initialPages: number = 150) {
  const [pages, setPages] = useState<number>(initialPages);

  const pricing = useMemo((): PricingBreakdown => {
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
  }, [pages]);

  const calculatePrice = (pageCount: number): number => {
    if (pageCount <= 10) return 0;
    if (pageCount <= 300) return (pageCount - 10) * 2;
    return 290 * 2 + (pageCount - 300) * 1;
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
  };
}
