import React, { useState } from "react";
import LoginForm from "../components/forms/LoginForm"; // Import du vrai composant

// --- Placeholder Temporaire pour SignupForm ---
const SignupForm = ({ onShowLogin }: { onShowLogin: () => void }) => (
  <div className="bg-white rounded-2xl shadow-2xl p-8">
    <h2 className="text-xl font-bold mb-4">Inscription (Placeholder)</h2>
    <p>Le formulaire d'inscription viendra ici.</p>
    <button
      onClick={onShowLogin}
      className="mt-4 text-blue-600 hover:underline"
    >
      Déjà un compte ? Se connecter
    </button>
  </div>
);

// --- Interface et Composant LoginPage ---
interface LoginPageProps {
  onLogin: (e: React.FormEvent) => void;
  onBackToLanding?: () => void;
}

/**
 * Page de connexion/inscription.
 * Ce composant gère l'affichage du formulaire de connexion ou d'inscription.
 */
function LoginPage({ onLogin, onBackToLanding }: LoginPageProps) {
  const [isShowingSignup, setIsShowingSignup] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-book-open text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Espace Client</h1>
          <p className="text-blue-100">Staka Éditions</p>
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="mt-4 text-blue-200 hover:text-white transition underline text-sm"
            >
              ← Retour à l'accueil
            </button>
          )}
        </div>
        {isShowingSignup ? (
          <SignupForm onShowLogin={() => setIsShowingSignup(false)} />
        ) : (
          <LoginForm
            onShowSignup={() => setIsShowingSignup(true)}
            onLogin={onLogin}
          />
        )}
      </div>
    </div>
  );
}

export default LoginPage;
