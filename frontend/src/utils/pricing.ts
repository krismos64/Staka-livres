/**
 * Utilitaires de calcul tarifaire pour les packs Staka
 */

export interface PricingResult {
  totalPrice: number;
  breakdown: PricingBreakdown[];
  formattedPrice: string;
}

export interface PricingBreakdown {
  range: string;
  pages: number;
  unitPrice: number;
  subtotal: number;
  description: string;
}

/**
 * Calcule le prix du Pack Intégral selon la grille tarifaire :
 * - Pages 1-10 : Gratuites (0€)
 * - Pages 11-300 : 2€ par page
 * - Pages 300+ : 1€ par page
 */
export const calculatePackIntegralPrice = (totalPages: number): PricingResult => {
  const breakdown: PricingBreakdown[] = [];
  let totalPrice = 0;

  if (totalPages <= 0) {
    return {
      totalPrice: 0,
      breakdown: [],
      formattedPrice: "0€"
    };
  }

  // Pages 1-10 : Gratuites
  if (totalPages >= 1) {
    const freePages = Math.min(totalPages, 10);
    breakdown.push({
      range: "1-10",
      pages: freePages,
      unitPrice: 0,
      subtotal: 0,
      description: "Pages gratuites"
    });
  }

  // Pages 11-300 : 2€ par page
  if (totalPages > 10) {
    const paidPages = Math.min(totalPages - 10, 290); // max 290 pages à 2€
    const subtotal = paidPages * 2;
    totalPrice += subtotal;
    
    breakdown.push({
      range: "11-300",
      pages: paidPages,
      unitPrice: 2,
      subtotal,
      description: "Pages standard"
    });
  }

  // Pages 300+ : 1€ par page
  if (totalPages > 300) {
    const discountPages = totalPages - 300;
    const subtotal = discountPages * 1;
    totalPrice += subtotal;
    
    breakdown.push({
      range: "300+",
      pages: discountPages,
      unitPrice: 1,
      subtotal,
      description: "Pages réduction volume"
    });
  }

  return {
    totalPrice,
    breakdown,
    formattedPrice: `${totalPrice}€`
  };
};

/**
 * Formatage détaillé de l'estimation pour affichage
 */
export const formatPricingBreakdown = (result: PricingResult): string => {
  if (result.breakdown.length === 0) {
    return "Aucune page saisie";
  }

  let details = "Détail du calcul :\n";
  
  result.breakdown.forEach(item => {
    if (item.unitPrice === 0) {
      details += `• Pages ${item.range} : ${item.pages} pages gratuites = 0€\n`;
    } else {
      details += `• Pages ${item.range} : ${item.pages} pages × ${item.unitPrice}€ = ${item.subtotal}€\n`;
    }
  });
  
  details += `\nTotal : ${result.formattedPrice}`;
  return details;
};

/**
 * Exemples de calculs pour la documentation
 */
export const getPricingExamples = () => [
  { pages: 5, result: calculatePackIntegralPrice(5) },
  { pages: 50, result: calculatePackIntegralPrice(50) },
  { pages: 150, result: calculatePackIntegralPrice(150) },
  { pages: 300, result: calculatePackIntegralPrice(300) },
  { pages: 350, result: calculatePackIntegralPrice(350) },
  { pages: 500, result: calculatePackIntegralPrice(500) },
];