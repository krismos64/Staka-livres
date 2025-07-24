import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCreateSetupIntent, useAddPaymentMethod } from "../../hooks/usePaymentMethods";
import { useToast } from "../layout/ToastProvider";

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddPaymentMethodModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: AddPaymentMethodModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [isStripeLoaded, setIsStripeLoaded] = useState(false);

  const { showToast } = useToast();
  const createSetupIntentMutation = useCreateSetupIntent();
  const addPaymentMethodMutation = useAddPaymentMethod();

  // Simuler Stripe Elements (en mode mock)
  useEffect(() => {
    if (isOpen) {
      // Dans un vrai environnement, on initialiserait Stripe Elements ici
      setIsStripeLoaded(true);
      
      // Créer le Setup Intent
      createSetupIntentMutation.mutate(undefined, {
        onSuccess: (data) => {
          setClientSecret(data.clientSecret);
        },
        onError: (error) => {
          showToast(
            "error",
            "Erreur d'initialisation",
            error instanceof Error ? error.message : "Impossible de préparer l'ajout de carte"
          );
          onClose();
        }
      });
    } else {
      setClientSecret(null);
      setCardElement(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !isProcessing) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientSecret) {
      showToast("error", "Erreur", "Formulaire non initialisé");
      return;
    }

    setIsProcessing(true);

    try {
      // En mode mock, simuler l'ajout d'une carte
      const mockPaymentMethodId = `pm_mock_${Date.now()}`;
      
      // Simuler un délai pour l'expérience utilisateur
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dans un vrai environnement, on utiliserait Stripe.confirmSetup()
      // const { setupIntent, error } = await stripe.confirmSetup({
      //   elements,
      //   confirmParams: { return_url: window.location.origin }
      // });

      // Simuler le succès
      await addPaymentMethodMutation.mutateAsync(mockPaymentMethodId);
      
      showToast(
        "success",
        "Carte ajoutée",
        "Votre carte de paiement a été ajoutée avec succès."
      );
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      showToast(
        "error",
        "Erreur d'ajout",
        error instanceof Error ? error.message : "Impossible d'ajouter la carte"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      aria-labelledby="add-payment-method-title"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
      >
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-credit-card text-blue-600"></i>
              </div>
              <div>
                <h3
                  id="add-payment-method-title"
                  className="text-lg font-bold text-gray-900"
                >
                  Ajouter une carte
                </h3>
                <p className="text-sm text-gray-600">
                  Ajoutez un nouveau moyen de paiement
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg disabled:opacity-50"
              aria-label="Fermer"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Zone de carte simulée */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Informations de la carte
            </label>
            
            {/* Formulaire de carte mockée pour le développement */}
            <div className="border border-gray-300 rounded-xl p-4 bg-gray-50">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  disabled={isProcessing}
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    disabled={isProcessing}
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    disabled={isProcessing}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Nom sur la carte"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  disabled={isProcessing}
                />
              </div>
              
              {/* Message de développement */}
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <i className="fas fa-info-circle"></i>
                  <span>Mode développement - Les données ne sont pas traitées</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informations de sécurité */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <i className="fas fa-shield-alt"></i>
              <span>Vos données sont sécurisées par chiffrement SSL 256-bit</span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isProcessing || !clientSecret}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Ajout en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i>
                  Ajouter la carte
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}