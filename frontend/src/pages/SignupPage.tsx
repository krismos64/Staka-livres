import SignupForm from "../components/forms/SignupForm";

interface SignupPageProps {
  onBackToLogin: () => void;
  onBackToLanding?: () => void;
}

/**
 * Page d'inscription.
 * Utilise le composant SignupForm avec un layout centré plein écran.
 */
function SignupPage({ onBackToLogin, onBackToLanding }: SignupPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-4">
      <div className="max-w-md w-full">
        {/* Logo et Brand */}
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

        {/* Formulaire d'inscription */}
        <SignupForm onShowLogin={onBackToLogin} />
      </div>
    </div>
  );
}

export default SignupPage;
