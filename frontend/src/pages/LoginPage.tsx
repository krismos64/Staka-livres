import React from "react";
import LoginForm from "../components/forms/LoginForm"; // Import du vrai composant

// --- Interface et Composant LoginPage ---
interface LoginPageProps {
  onLogin: (e: React.FormEvent) => void;
  onBackToLanding?: () => void;
  onGoToSignup?: () => void;
  authError?: string | null;
  clearAuthError?: () => void;
}

/**
 * Page de connexion/inscription.
 * Ce composant gère l'affichage du formulaire de connexion ou d'inscription.
 */
function LoginPage({ onLogin, onBackToLanding, onGoToSignup, authError, clearAuthError }: LoginPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-4">
      <div className="max-w-md w-full">
        {/* Bouton retour à l'accueil */}
        <div className="flex justify-start mb-6">
          <button
            onClick={onBackToLanding || (() => window.location.href = '/')}
            className="group flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden"
          >
            <i className="fas fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform duration-300"></i>
            <span className="text-sm font-medium">Retour à l'accueil</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-book-open text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Espace Client</h1>
          <p className="text-blue-100">Staka Éditions</p>
        </div>
        <LoginForm onShowSignup={onGoToSignup} onLogin={onLogin} authError={authError} clearAuthError={clearAuthError} />
      </div>
    </div>
  );
}

export default LoginPage;
