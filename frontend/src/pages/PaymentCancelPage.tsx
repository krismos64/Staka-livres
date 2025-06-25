import { useNavigate } from "react-router-dom";

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/billing");
  };

  const handleTryAgain = () => {
    navigate("/billing");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icône d'annulation */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Paiement annulé
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Votre paiement a été annulé. Aucun montant n'a été débité de votre
          compte.
        </p>

        {/* Message informatif */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-medium">
              Votre commande est toujours en attente.
            </span>
            <br />
            Vous pouvez la régler à tout moment depuis votre page de
            facturation.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleTryAgain}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Réessayer le paiement
          </button>
          <button
            onClick={handleGoBack}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Retour à la facturation
          </button>
        </div>

        {/* Message d'aide */}
        <p className="text-xs text-gray-500 mt-6">
          Besoin d'aide ? Contactez notre support à{" "}
          <a
            href="mailto:support@staka-editions.com"
            className="text-blue-600 hover:underline"
          >
            support@staka-editions.com
          </a>
        </p>
      </div>
    </div>
  );
}
