import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Page de réinitialisation de mot de passe
 * Conforme aux exigences RGPD/CNIL
 */
const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    complexity: false,
    match: false,
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Validation en temps réel du mot de passe
  useEffect(() => {
    const { newPassword, confirmPassword } = formData;
    
    // Vérifier la longueur
    const hasMinLength = newPassword.length >= 12 || 
      (newPassword.length >= 8 && checkPasswordComplexity(newPassword));
    
    // Vérifier la correspondance
    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
    
    setPasswordValidation({
      length: hasMinLength,
      complexity: checkPasswordComplexity(newPassword),
      match: passwordsMatch,
    });
  }, [formData]);

  const checkPasswordComplexity = (password: string): boolean => {
    if (password.length < 8) return false;
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigits = /[0-9]/.test(password);
    const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
    
    const typeCount = [hasUppercase, hasLowercase, hasDigits, hasSpecialChars]
      .filter(Boolean).length;
    
    return typeCount >= 3;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation côté client
    if (!passwordValidation.length || !passwordValidation.match) {
      setError("Veuillez corriger les erreurs de validation");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
        }),
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
              <i className="fas fa-check text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Succès</h1>
            <p className="text-blue-100">Staka Éditions</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-green-600 text-2xl"></i>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Mot de passe réinitialisé
              </h2>
              
              <p className="text-gray-600 mb-6">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              
              <button
                onClick={handleBackToLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transform hover:scale-105 transition duration-300"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Se connecter
              </button>
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
            <i className="fas fa-lock text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Nouveau mot de passe</h1>
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
              Choisissez votre nouveau mot de passe
            </h2>
            <p className="text-gray-600">
              Votre nouveau mot de passe doit respecter les critères de sécurité.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nouveau mot de passe */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  <i
                    className={`fas ${
                      isPasswordVisible ? "fa-eye-slash" : "fa-eye"
                    } text-gray-400 hover:text-gray-600`}
                  ></i>
                </button>
              </div>
            </div>

            {/* Confirmation du mot de passe */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  <i
                    className={`fas ${
                      isConfirmPasswordVisible ? "fa-eye-slash" : "fa-eye"
                    } text-gray-400 hover:text-gray-600`}
                  ></i>
                </button>
              </div>
            </div>

            {/* Indicateurs de validation */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h4 className="font-semibold text-gray-700 mb-2">
                Critères de sécurité :
              </h4>
              <div className="space-y-1 text-sm">
                <div className={`flex items-center ${passwordValidation.length ? "text-green-600" : "text-gray-500"}`}>
                  <i className={`fas ${passwordValidation.length ? "fa-check" : "fa-times"} mr-2`}></i>
                  Au moins 12 caractères OU 8 caractères avec complexité
                </div>
                <div className={`flex items-center ${passwordValidation.complexity ? "text-green-600" : "text-gray-500"}`}>
                  <i className={`fas ${passwordValidation.complexity ? "fa-check" : "fa-times"} mr-2`}></i>
                  3 types parmi : majuscules, minuscules, chiffres, symboles
                </div>
                <div className={`flex items-center ${passwordValidation.match ? "text-green-600" : "text-gray-500"}`}>
                  <i className={`fas ${passwordValidation.match ? "fa-check" : "fa-times"} mr-2`}></i>
                  Les mots de passe correspondent
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwordValidation.length || !passwordValidation.match}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition duration-300 ${
                isLoading || !passwordValidation.length || !passwordValidation.match
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 transform hover:scale-105"
              }`}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Réinitialisation...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Réinitialiser le mot de passe
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
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;