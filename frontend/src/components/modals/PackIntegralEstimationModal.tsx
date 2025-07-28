import React, { useState, useEffect } from "react";
import { calculatePackIntegralPrice, formatPricingBreakdown, PricingResult } from "../../utils/pricing";

interface PackIntegralEstimationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (estimatedPrice: number, pagesCount: number) => void;
  initialPages: number;
  projectTitle: string;
}

export default function PackIntegralEstimationModal({
  open,
  onClose,
  onConfirm,
  initialPages,
  projectTitle,
}: PackIntegralEstimationModalProps) {
  const [pages, setPages] = useState(initialPages);
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Recalculer le prix à chaque changement de pages
  useEffect(() => {
    if (pages > 0) {
      const result = calculatePackIntegralPrice(pages);
      setPricingResult(result);
    } else {
      setPricingResult(null);
    }
  }, [pages]);

  const handleConfirm = async () => {
    if (!pricingResult) return;
    
    setIsConfirming(true);
    try {
      await onConfirm(pricingResult.totalPrice, pages);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-400 hover:text-gray-600 text-2xl z-10"
          onClick={onClose}
          aria-label="Fermer"
        >
          <i className="fas fa-times"></i>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calculator text-2xl text-blue-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Estimation Pack Intégral
          </h2>
          <p className="text-gray-600">
            Projet : <span className="font-semibold">{projectTitle}</span>
          </p>
        </div>

        {/* Grille tarifaire */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <i className="fas fa-info-circle"></i>
            Grille tarifaire Pack Intégral
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>📖 Pages 1-10 :</span>
              <span className="font-semibold text-green-600">Gratuites (0€)</span>
            </div>
            <div className="flex justify-between">
              <span>📖 Pages 11-300 :</span>
              <span className="font-semibold">2€ par page</span>
            </div>
            <div className="flex justify-between">
              <span>📖 Pages 300+ :</span>
              <span className="font-semibold text-orange-600">1€ par page (réduction volume)</span>
            </div>
          </div>
        </div>

        {/* Saisie nombre de pages */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de pages de votre manuscrit
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="2000"
              value={pages}
              onChange={(e) => setPages(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center font-semibold"
              placeholder="150"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              pages
            </div>
          </div>
        </div>

        {/* Résultat du calcul */}
        {pricingResult && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-receipt"></i>
              Détail de votre estimation
            </h3>
            
            {/* Breakdown détaillé */}
            <div className="space-y-3 mb-4">
              {pricingResult.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <span className="text-sm text-gray-600">Pages {item.range}</span>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {item.pages} × {item.unitPrice}€ = {item.subtotal}€
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-gray-300 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total estimé :</span>
                <span className="text-2xl font-bold text-blue-600">
                  {pricingResult.formattedPrice}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Note importante */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <i className="fas fa-exclamation-triangle text-yellow-600 mt-1"></i>
            <div className="text-sm">
              <p className="font-semibold text-yellow-800 mb-1">Vérification administrative</p>
              <p className="text-yellow-700">
                Cette estimation est basée sur le nombre de pages déclaré. 
                Notre équipe vérifiera le nombre réel de pages de votre manuscrit avant le paiement final.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!pricingResult || isConfirming}
            className={`flex-1 font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 ${
              !pricingResult || isConfirming
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isConfirming ? (
              <>
                <i className="fas fa-spinner animate-spin"></i>
                Confirmation...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Confirmer l'estimation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}