import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToasts } from "../utils/toast";
import { buildApiUrl } from "../utils/api";

interface ActivationData {
  user: {
    prenom: string;
    nom: string;
    email: string;
  };
  isAlreadyActive: boolean;
  expiresAt: string;
}

interface ActivationResult {
  success: boolean;
  user: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    role: string;
  };
  token: string;
  redirectUrl: string;
}

export default function ActivateAccountPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToasts();

  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activationData, setActivationData] = useState<ActivationData | null>(null);
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);

  // Vérifier le token au chargement
  useEffect(() => {
    if (!token) {
      setError("Token d'activation manquant");
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(buildApiUrl(`/public/activate/${token}/verify`));
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Token invalide ou expiré");
        return;
      }

      setActivationData(data);
    } catch (err) {
      console.error('Erreur lors de la vérification du token:', err);
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const activateAccount = async () => {
    if (!token) return;

    setActivating(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`/public/activate/${token}`));
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur lors de l'activation");
        return;
      }

      setActivationResult(data);
      
      // Connexion automatique avec le token JWT
      if (data.token) {
        localStorage.setItem("token", data.token);
        login(data.user);
        
        showToast({
          type: 'success',
          message: `Bienvenue ${data.user.prenom} ! Votre compte a été activé avec succès.`,
          duration: 5000
        });

        // Redirection vers le dashboard après un court délai
        setTimeout(() => {
          navigate('/app/dashboard');
        }, 2000);
      }

    } catch (err) {
      console.error('Erreur lors de l\'activation:', err);
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Vérification en cours...
            </h2>
            <p className="text-gray-600">
              Nous vérifions votre lien d'activation, patientez un instant.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 via-red-500 to-pink-600">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Activation impossible
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Aller à la connexion
              </button>
              <a
                href="mailto:contact@staka.fr"
                className="block w-full text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                Contacter le support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activationResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 via-green-500 to-emerald-600">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              🎉 Compte activé !
            </h2>
            <p className="text-gray-600 mb-4">
              Bienvenue <strong>{activationResult.user.prenom}</strong> ! Votre compte a été activé avec succès.
            </p>
            <div className="bg-green-50 p-4 rounded-md mb-6">
              <p className="text-sm text-green-800">
                <strong>Connexion automatique en cours...</strong><br />
                Vous serez redirigé vers votre espace client dans quelques secondes.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Accéder à mon espace client
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activationData?.isAlreadyActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-600 via-yellow-500 to-orange-600">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Compte déjà activé
            </h2>
            <p className="text-gray-600 mb-4">
              Bonjour <strong>{activationData.user.prenom}</strong>, votre compte est déjà activé.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Vous pouvez vous connecter normalement avec vos identifiants.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0a2 2 0 102 2h10a2 2 0 100-2m-10 0V7a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Activer votre compte
          </h2>
          {activationData && (
            <>
              <p className="text-gray-600 mb-4">
                Bonjour <strong>{activationData.user.prenom} {activationData.user.nom}</strong>
              </p>
              <div className="bg-blue-50 p-4 rounded-md mb-6 text-left">
                <h3 className="font-medium text-blue-900 mb-2">📧 Détails du compte</h3>
                <p className="text-sm text-blue-800">
                  <strong>Email :</strong> {activationData.user.email}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Expire le :</strong> {new Date(activationData.expiresAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Cliquez sur le bouton ci-dessous pour activer votre compte et accéder à votre espace client.
              </p>
              <button
                onClick={activateAccount}
                disabled={activating}
                className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
                  activating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
              >
                {activating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Activation en cours...
                  </span>
                ) : (
                  '🔓 Activer mon compte'
                )}
              </button>
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Une fois activé, vous serez automatiquement connecté et redirigé vers votre espace client.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}