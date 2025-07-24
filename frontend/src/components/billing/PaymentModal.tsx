import React, { useEffect, useState } from "react";
import { Invoice, PaymentMethod } from "../../pages/BillingPage";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  paymentMethods: PaymentMethod[];
  isProcessing: boolean;
}

// Modale de paiement simulant l'intégration Stripe
export function PaymentModal({
  isOpen,
  onClose,
  invoice,
  paymentMethods,
  isProcessing,
}: PaymentModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [saveCard, setSaveCard] = useState(false);
  const [newCardData, setNewCardData] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });
  const [useNewCard, setUseNewCard] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Initialiser avec la carte par défaut
  useEffect(() => {
    const defaultCard = paymentMethods.find((pm) => pm.isDefault);
    if (defaultCard && !selectedPaymentMethod) {
      setSelectedPaymentMethod(defaultCard.id);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  // Gestion de l'échappement et focus
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isProcessing]);

  if (!isOpen) return null;

  // Formatage des données de carte
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) return;

    // La logique de paiement est gérée dans le composant parent
    console.log("Paiement déclenché", {
      invoice: invoice.id,
      paymentMethod: useNewCard ? "new" : selectedPaymentMethod,
      newCard: useNewCard ? newCardData : null,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2
              id="payment-modal-title"
              className="text-xl font-bold text-gray-900"
            >
              Paiement sécurisé
            </h2>
            {!isProcessing && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Fermer"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Corps de la modale */}
        <div className="p-6">
          {/* Récapitulatif de la commande */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Récapitulatif</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Facture #{invoice.id}</span>
              <span className="font-bold text-lg">{invoice.total}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{invoice.projectName}</p>
          </div>

          {!isProcessing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sélection du moyen de paiement */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Moyen de paiement
                </h3>

                {/* Cartes existantes */}
                {paymentMethods.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                          selectedPaymentMethod === method.id && !useNewCard
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={
                            selectedPaymentMethod === method.id && !useNewCard
                          }
                          onChange={() => {
                            setSelectedPaymentMethod(method.id);
                            setUseNewCard(false);
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3 w-full">
                          <i className="fab fa-cc-visa text-blue-700 text-xl"></i>
                          <div className="flex-1">
                            <p className="font-medium">
                              Visa •••• {method.last4}
                            </p>
                            <p className="text-sm text-gray-600">
                              Exp.{" "}
                              {method.expiryMonth.toString().padStart(2, "0")}/
                              {method.expiryYear.toString().slice(-2)}
                            </p>
                          </div>
                          {method.isDefault && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Par défaut
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Nouvelle carte */}
                <div>
                  <label
                    className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                      useNewCard
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={useNewCard}
                      onChange={() => setUseNewCard(true)}
                      className="sr-only"
                    />
                    <i className="fas fa-plus text-blue-600 mr-3"></i>
                    <span className="font-medium">Nouvelle carte</span>
                  </label>

                  {/* Formulaire nouvelle carte */}
                  {useNewCard && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-xl space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro de carte
                        </label>
                        <input
                          type="text"
                          value={newCardData.number}
                          onChange={(e) =>
                            setNewCardData((prev) => ({
                              ...prev,
                              number: formatCardNumber(e.target.value),
                            }))
                          }
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={useNewCard}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            MM/AA
                          </label>
                          <input
                            type="text"
                            value={newCardData.expiry}
                            onChange={(e) =>
                              setNewCardData((prev) => ({
                                ...prev,
                                expiry: formatExpiry(e.target.value),
                              }))
                            }
                            placeholder="12/25"
                            maxLength={5}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={useNewCard}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CVC
                          </label>
                          <input
                            type="text"
                            value={newCardData.cvc}
                            onChange={(e) =>
                              setNewCardData((prev) => ({
                                ...prev,
                                cvc: e.target.value
                                  .replace(/\D/g, "")
                                  .substring(0, 4),
                              }))
                            }
                            placeholder="123"
                            maxLength={4}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={useNewCard}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom sur la carte
                        </label>
                        <input
                          type="text"
                          value={newCardData.name}
                          onChange={(e) =>
                            setNewCardData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Nom du titulaire de la carte"
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={useNewCard}
                        />
                      </div>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          Enregistrer cette carte pour les futurs paiements
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-gray-600">
                    J'accepte les{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700">
                      conditions générales de vente
                    </a>{" "}
                    et la{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700">
                      politique de confidentialité
                    </a>
                  </span>
                </label>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    !acceptTerms || (!selectedPaymentMethod && !useNewCard)
                  }
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <i className="fas fa-lock"></i>
                  Payer {invoice.total}
                </button>
              </div>
            </form>
          ) : (
            /* État de traitement */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-spinner text-blue-600 text-2xl animate-spin"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Traitement du paiement
              </h3>
              <p className="text-gray-600 text-sm">
                Veuillez patienter pendant que nous traitons votre paiement...
              </p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full animate-pulse"
                  style={{ width: "75%" }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec sécurité */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <i className="fas fa-shield-alt text-green-600"></i>
            <span>Paiement sécurisé par SSL • Certifié PCI DSS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
