import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl, getAuthHeaders } from "../utils/api";
import { useToasts } from "../utils/toast";

interface PaymentStatus {
  status: string;
  metadata: {
    userId: string;
    commandeId: string;
  };
}

export default function PaymentSuccessPage() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToasts();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (sessionId) {
      fetchPaymentStatus(sessionId);
    } else {
      setLoading(false);
      showToast("error", "Erreur", "ID de session manquant");
    }
  }, []);

  const fetchPaymentStatus = async (sessionId: string) => {
    try {
      const response = await fetch(
        buildApiUrl(`/payments/status/${sessionId}`),
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data);
        showToast(
          "success",
          "Paiement réussi",
          "Votre commande a été confirmée !"
        );
      } else {
        throw new Error("Erreur lors de la vérification du paiement");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      showToast(
        "error",
        "Erreur",
        "Impossible de vérifier le statut du paiement"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleGoToProjects = () => {
    navigate("/projects");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icône de succès */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Paiement réussi !
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Votre commande a été confirmée et sera traitée dans les plus brefs
          délais.
        </p>

        {/* Informations du paiement */}
        {paymentStatus && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Statut</span>
              <span className="text-sm font-medium text-green-600">
                {paymentStatus.status === "paid"
                  ? "Payé"
                  : paymentStatus.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Commande</span>
              <span className="text-sm font-medium text-gray-900">
                {paymentStatus.metadata.commandeId.slice(0, 8)}...
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleGoToProjects}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Voir mes projets
          </button>
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>

        {/* Message additionnel */}
        <p className="text-xs text-gray-500 mt-6">
          Un email de confirmation vous sera envoyé sous peu.
        </p>
      </div>
    </div>
  );
}
