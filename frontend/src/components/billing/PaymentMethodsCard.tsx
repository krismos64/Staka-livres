import React from "react";
import { PaymentMethodUI } from "../../pages/BillingPage";

interface PaymentMethodsCardProps {
  paymentMethods: PaymentMethodUI[];
  onAdd: () => void;
  onRemove: (paymentMethodId: string) => void;
  onSetDefault?: (paymentMethodId: string) => void;
}

// Composant pour gérer les moyens de paiement
export function PaymentMethodsCard({
  paymentMethods,
  onAdd,
  onRemove,
  onSetDefault,
}: PaymentMethodsCardProps) {
  // Fonction pour obtenir l'icône selon le type de carte
  const getCardIcon = (type: PaymentMethodUI["type"]) => {
    const cardIcons = {
      visa: "fab fa-cc-visa text-blue-700",
      mastercard: "fab fa-cc-mastercard text-red-600",
      amex: "fab fa-cc-amex text-green-600",
    };

    return cardIcons[type];
  };

  // Fonction pour formater l'affichage de la carte
  const formatCardDisplay = (method: PaymentMethodUI) => {
    const cardNames = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "American Express",
    };

    return `${cardNames[method.type]} se terminant par ${method.last4}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Moyens de paiement
      </h3>

      <div className="space-y-3">
        {/* Liste des cartes existantes */}
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {/* Icône de la carte */}
              <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
                <i className={`${getCardIcon(method.type)} text-lg`}></i>
              </div>

              {/* Informations de la carte */}
              <div>
                <p className="font-medium text-gray-900">
                  {formatCardDisplay(method)}
                </p>
                <p className="text-sm text-gray-600">
                  Exp. {method.expiryMonth.toString().padStart(2, "0")}/
                  {method.expiryYear.toString().slice(-2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Badge par défaut */}
              {method.isDefault && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  Par défaut
                </span>
              )}

              {/* Bouton définir par défaut (si pas déjà par défaut) */}
              {!method.isDefault && onSetDefault && (
                <button
                  onClick={() => onSetDefault(method.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 transition-all rounded-lg hover:bg-blue-50"
                  aria-label={`Définir ${formatCardDisplay(method)} comme méthode par défaut`}
                  title="Définir comme méthode par défaut"
                >
                  <i className="fas fa-star text-sm"></i>
                </button>
              )}

              {/* Bouton de suppression au hover */}
              <button
                onClick={() => onRemove(method.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 transition-all rounded-lg hover:bg-red-50"
                aria-label={`Supprimer la carte ${formatCardDisplay(method)}`}
                title="Supprimer cette carte"
              >
                <i className="fas fa-trash text-sm"></i>
              </button>
            </div>
          </div>
        ))}

        {/* Affichage si aucune carte */}
        {paymentMethods.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
            <i className="fas fa-credit-card text-gray-300 text-2xl mb-2"></i>
            <p className="text-gray-500 text-sm">Aucun moyen de paiement</p>
          </div>
        )}

        {/* Bouton d'ajout de carte */}
        <button
          onClick={onAdd}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-3 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all group"
          aria-label="Ajouter une nouvelle carte de paiement"
        >
          <div className="flex items-center justify-center gap-2">
            <i className="fas fa-plus group-hover:scale-110 transition-transform"></i>
            Ajouter une carte
          </div>
        </button>
      </div>

      {/* Informations de sécurité */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <i className="fas fa-shield-alt text-green-600"></i>
          <span>Vos données bancaires sont sécurisées par chiffrement SSL</span>
        </div>
      </div>
    </div>
  );
}
