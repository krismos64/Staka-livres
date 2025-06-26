interface PaymentSuccessPageProps {
  onBackToApp: () => void;
}

export default function PaymentSuccessPage({
  onBackToApp,
}: PaymentSuccessPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-check-circle text-green-600 text-3xl"></i>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement réussi !
        </h1>

        <p className="text-gray-600 mb-8">
          Votre paiement a été traité avec succès. Vous allez recevoir un email
          de confirmation sous peu.
        </p>

        <button
          onClick={onBackToApp}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors duration-200"
        >
          Retourner à l'application
        </button>
      </div>
    </div>
  );
}
