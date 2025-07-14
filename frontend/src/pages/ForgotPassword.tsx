import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Page de demande de réinitialisation de mot de passe
 * Conforme aux exigences RGPD/CNIL
 */
const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.error || "Une erreur s'est produite");
      }
    } catch (err) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-envelope text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Email envoyé</h1>
            <p className="text-blue-100">Staka Éditions</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-green-600 text-2xl"></i>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Vérifiez vos emails
              </h2>
              
              <p className="text-gray-600 mb-6">
                Un lien de réinitialisation a été envoyé à votre adresse email. 
                Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                  <div className="text-sm text-yellow-800">
                    <strong>Important :</strong> Le lien n'est valable que pendant 1 heure.
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleBackToLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transform hover:scale-105 transition duration-300"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Retour à la connexion
                </button>
                
                <p className="text-sm text-gray-500">
                  Vous n'avez pas reçu l'email ? Vérifiez vos spams ou réessayez dans quelques minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-key text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Mot de passe oublié</h1>
          <p className="text-blue-100">Staka Éditions</p>
          <button
            onClick={handleBackToLogin}
            className="mt-4 text-blue-200 hover:text-white transition underline text-sm"
          >
            ← Retour à la connexion
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Réinitialiser votre mot de passe
            </h2>
            <p className="text-gray-600">
              Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="votre@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition duration-300 ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 transform hover:scale-105"
              }`}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Envoyer le lien de réinitialisation
                </>
              )}
            </button>

            {error && (
              <div className="text-red-600 bg-red-50 rounded-xl p-3 text-sm">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <h4 className="font-semibold text-blue-800 mb-2">
              <i className="fas fa-info-circle mr-2"></i>
              Informations importantes
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Le lien de réinitialisation est valable pendant 1 heure</p>
              <p>• Vous ne pouvez utiliser le lien qu'une seule fois</p>
              <p>• Vérifiez vos spams si vous ne recevez pas l'email</p>
              <p>• Seuls 5 demandes par heure sont autorisées</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;