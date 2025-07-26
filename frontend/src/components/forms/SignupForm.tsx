import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToasts } from "../../utils/toast";

/**
 * Props pour le composant SignupForm.
 */
interface SignupFormProps {
  /** Fonction pour ré-afficher le formulaire de connexion */
  onBackToLogin: () => void;
  onSignupSuccess: () => void;
}

/**
 * Interface pour les erreurs de champs
 */
interface FieldErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  terms?: string;
}

/**
 * Composant pour le formulaire d'inscription.
 */
export default function SignupForm({
  onBackToLogin,
  onSignupSuccess,
}: SignupFormProps) {
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();
  const { showToast } = useToasts();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Validation des champs
  const validateFields = (formData: FormData): FieldErrors => {
    const errors: FieldErrors = {};
    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const terms = formData.get("terms") as string;

    if (!firstName || firstName.trim() === "") {
      errors.first_name = "Le prénom est requis";
    }

    if (!lastName || lastName.trim() === "") {
      errors.last_name = "Le nom est requis";
    }

    if (!email || email.trim() === "") {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Veuillez entrer un email valide";
    }

    if (!password || password.trim() === "") {
      errors.password = "Le mot de passe est requis";
    } else if (password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères";
    } else {
      // Validation avancée : au moins 3 types de caractères
      let typeCount = 0;
      if (/[a-z]/.test(password)) typeCount++; // minuscules
      if (/[A-Z]/.test(password)) typeCount++; // majuscules  
      if (/[0-9]/.test(password)) typeCount++; // chiffres
      if (/[^a-zA-Z0-9]/.test(password)) typeCount++; // caractères spéciaux
      
      if (password.length < 12 && typeCount < 3) {
        errors.password = "Le mot de passe doit contenir au moins 3 types de caractères (majuscules, minuscules, chiffres, caractères spéciaux) ou faire au moins 12 caractères";
      }
    }

    if (!terms) {
      errors.terms = "Vous devez accepter les conditions d'utilisation";
    }

    return errors;
  };

  // Fonction pour extraire les données du formulaire
  const extractFormData = (formData: FormData) => {
    return {
      prenom: formData.get("first_name") as string,
      nom: formData.get("last_name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      telephone: formData.get("phone") as string || undefined,
    };
  };

  /**
   * Gère la soumission du formulaire d'inscription avec gestion d'état.
   */
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset des erreurs
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    // Validation côté client
    const validationErrors = validateFields(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    // Début du chargement
    setLoading(true);

    try {
      const userData = extractFormData(formData);
      
      const success = await register(userData);

      if (success) {
        showToast(
          "success",
          "Inscription réussie !",
          "Vous allez être redirigé vers votre espace client."
        );
        onSignupSuccess();
      } else {
        // L'erreur est déjà gérée dans le contexte auth
        setError("Une erreur s'est produite lors de l'inscription");
      }
    } catch (err) {
      console.error("Erreur lors de l'inscription:", err);
      setError("Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl p-8"
      id="signup-form-container"
    >
      {/* Le formulaire d'inscription */}
      <form id="signup-form" className="space-y-6" onSubmit={handleSignup}>
        <input type="hidden" name="csrf_token" value="csrf_token_placeholder" />

        {/* Champs Prénom et Nom */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Prénom
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              required
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
                fieldErrors.first_name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Votre prénom"
              disabled={loading}
              onChange={handleChange}
            />
            {fieldErrors.first_name && (
              <p className="text-red-600 text-sm mt-1">
                {fieldErrors.first_name}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nom
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              required
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
                fieldErrors.last_name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Votre nom"
              disabled={loading}
              onChange={handleChange}
            />
            {fieldErrors.last_name && (
              <p className="text-red-600 text-sm mt-1">
                {fieldErrors.last_name}
              </p>
            )}
          </div>
        </div>

        {/* Champ Email */}
        <div>
          <label
            htmlFor="signup_email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email
          </label>
          <input
            type="email"
            id="signup_email"
            name="email"
            required
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
              fieldErrors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="votre@email.com"
            disabled={loading}
            onChange={handleChange}
          />
          {fieldErrors.email && (
            <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Champ Mot de passe */}
        <div>
          <label
            htmlFor="signup_password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Mot de passe
          </label>
          <input
            type="password"
            id="signup_password"
            name="password"
            required
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
              fieldErrors.password
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="••••••••"
            disabled={loading}
            onChange={handleChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            Au moins 8 caractères avec 3 types : majuscules, minuscules, chiffres, caractères spéciaux
          </p>
          {fieldErrors.password && (
            <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* Champ Téléphone (optionnel) */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Téléphone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="06 12 34 56 78"
            disabled={loading}
            onChange={handleChange}
          />
        </div>

        {/* Case à cocher pour les conditions d'utilisation */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="terms"
              required
              className={`rounded text-blue-600 focus:ring-blue-500 ${
                fieldErrors.terms ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            />
            <span className="ml-2 text-sm text-gray-600">
              J'accepte les{" "}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                conditions d'utilisation
              </a>
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="text-red-600 text-sm mt-1">{fieldErrors.terms}</p>
          )}
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition duration-300 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 transform hover:scale-105"
          }`}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Création en cours...
            </>
          ) : (
            <>
              <i className="fas fa-user-plus mr-2"></i>
              Créer mon compte
            </>
          )}
        </button>

        {/* Message d'erreur global */}
        {error && (
          <div className="text-red-600 bg-red-50 rounded-xl p-2 mt-3 text-sm">
            {error}
          </div>
        )}
      </form>

      {/* Lien pour basculer vers le formulaire de connexion */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Déjà un compte ?{" "}
          <button
            onClick={onBackToLogin}
            className="text-blue-600 hover:text-blue-500 font-medium"
            type="button"
            disabled={loading}
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
