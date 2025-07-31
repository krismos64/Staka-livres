import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/layout/ToastProvider";
import { buildApiUrl } from "../utils/api";

// Schéma de validation pour le mot de passe
const passwordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(100),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

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
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activationData, setActivationData] = useState<ActivationData | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Form pour le mot de passe
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  });

  const password = watch("password");

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
      
      if (data.isAlreadyActive) {
        showToast("info", "Compte déjà activé", "Votre compte est déjà activé. Vous pouvez vous connecter.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setShowPasswordForm(true);
      }
    } catch (err) {
      console.error('Erreur lors de la vérification du token:', err);
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    if (!token) return;

    setActivating(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`/public/activate/${token}/set-password`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: data.password })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details && Array.isArray(result.details)) {
          const errorMessages = result.details
            .map((error: any) => error.message)
            .join(", ");
          setError(`Erreurs de validation : ${errorMessages}`);
        } else {
          setError(result.message || "Erreur lors de l'activation");
        }
        return;
      }

      // Succès - connecter automatiquement l'utilisateur
      showToast("success", "Compte activé !", 
        `Bienvenue ${result.user.prenom} ! Votre compte est maintenant actif.`);

      // Connexion automatique
      await login(result.user, result.token);
      
      // Redirection
      navigate(result.redirectUrl || '/app/dashboard');

    } catch (err) {
      console.error('Erreur lors de l\'activation:', err);
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Vérification du lien d'activation...
            </h2>
            <p className="text-gray-600">Veuillez patienter.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erreur d'activation
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
              >
                Réessayer
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!showPasswordForm || !activationData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <i className="fas fa-user-check text-green-600 text-xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Activation de votre compte
          </h2>
          <p className="text-gray-600">
            Bienvenue <strong>{activationData.user.prenom} {activationData.user.nom}</strong>!
            <br />
            Définissez votre mot de passe pour finaliser l'activation.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-6">
          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe *
            </label>
            <input
              type="password"
              id="password"
              {...register("password")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Votre mot de passe"
              disabled={activating}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            
            {/* Indicateur de force du mot de passe */}
            {password && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">Force du mot de passe :</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      password.length >= 12 ? 'bg-green-500 w-full' :
                      password.length >= 8 ? 'bg-yellow-500 w-2/3' :
                      'bg-red-500 w-1/3'
                    }`}
                  ></div>
                </div>
                <div className="text-xs mt-1 text-gray-500">
                  {password.length >= 12 ? 'Fort' :
                   password.length >= 8 ? 'Moyen' : 'Faible'}
                </div>
              </div>
            )}
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe *
            </label>
            <input
              type="password"
              id="confirmPassword"
              {...register("confirmPassword")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Confirmez votre mot de passe"
              disabled={activating}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Conseils de sécurité */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              💡 Conseils pour un mot de passe sécurisé :
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Au moins 8 caractères (12+ recommandés)</li>
              <li>• Mélangez majuscules, minuscules, chiffres et symboles</li>
              <li>• Évitez les mots du dictionnaire</li>
              <li>• Utilisez un gestionnaire de mots de passe</li>
            </ul>
          </div>

          {/* Bouton d'activation */}
          <button
            type="submit"
            disabled={activating}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
              <>
                <i className="fas fa-check mr-2"></i>
                Activer mon compte
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            🔒 Vos données sont sécurisées et chiffrées
          </p>
        </form>
      </div>
    </div>
  );
}