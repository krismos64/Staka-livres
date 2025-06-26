interface PaymentCancelPageProps {
  onBackToApp: () => void;
}

export default function PaymentCancelPage({
  onBackToApp,
}: PaymentCancelPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-times-circle text-red-600 text-3xl"></i>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement annulé
        </h1>

        <p className="text-gray-600 mb-8">
          Votre paiement a été annulé. Aucun montant n'a été débité. Vous pouvez
          réessayer à tout moment.
        </p>

        <div className="space-y-3">
          <button
            onClick={onBackToApp}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors duration-200"
          >
            Retourner à la facturation
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors duration-200"
          >
            Accueil
          </button>
        </div>
      </div>
    </div>
  );
}
