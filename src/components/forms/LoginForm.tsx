import React, { useState } from "react";

/**
 * Props du composant LoginForm (version TypeScript)
 */
interface LoginFormProps {
  /** Fonction pour afficher le formulaire d'inscription */
  onShowSignup: () => void;
  /** Fonction pour gérer la soumission du formulaire de connexion */
  onLogin: (e: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * Composant LoginForm (TypeScript)
 * Affiche le formulaire de connexion avec gestion de la visibilité du mot de passe.
 */
const LoginForm: React.FC<LoginFormProps> = ({ onShowSignup, onLogin }) => {
  // État pour gérer la visibilité du mot de passe
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // États pour la gestion du feedback utilisateur
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Inverse l'état de visibilité du mot de passe
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Validation des champs
  const validateFields = (
    formData: FormData
  ): { email?: string; password?: string } => {
    const errors: { email?: string; password?: string } = {};
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || email.trim() === "") {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Veuillez entrer un email valide";
    }

    if (!password || password.trim() === "") {
      errors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    return errors;
  };

  // Simulation d'API avec gestion d'erreur
  const simulateLogin = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulation : échec si email n'est pas celui de démo
        if (email === "marie.castello@example.com" && password === "demo123") {
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            message: "Email ou mot de passe invalide",
          });
        }
      }, 1500); // Délai de 1.5s pour simuler la latence réseau
    });
  };

  // Gestion de la soumission avec états loading/error
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset des erreurs
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    // Validation côté client
    const validationErrors = validateFields(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    // Début du chargement
    setIsLoading(true);

    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const result = await simulateLogin(email, password);

      if (result.success) {
        // Appel de la fonction onLogin fournie par le parent
        onLogin(e);
      } else {
        setError(result.message || "Une erreur s'est produite");
      }
    } catch (err) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl p-8"
      id="login-form-container"
    >
      {/* Le formulaire de connexion */}
      <form id="login-form" className="space-y-6" onSubmit={handleSubmit}>
        {/* Champ caché pour le token CSRF, comme dans l'original */}
        <input type="hidden" name="csrf_token" value="csrf_token_placeholder" />

        {/* Champ Email */}
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
              name="email"
              required
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
                fieldErrors.email
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="votre@email.com"
              defaultValue="marie.castello@example.com" // Valeur par défaut pour la démo
              disabled={isLoading}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Champ Mot de passe */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-lock text-gray-400"></i>
            </div>
            <input
              // Le type de l'input dépend de l'état de visibilité
              type={isPasswordVisible ? "text" : "password"}
              id="password"
              name="password"
              required
              className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
                fieldErrors.password
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="••••••••"
              defaultValue="demo123" // Valeur par défaut pour la démo
              disabled={isLoading}
            />
            {/* Bouton pour afficher/cacher le mot de passe */}
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              tabIndex={-1}
              disabled={isLoading}
            >
              <i
                className={`fas ${
                  isPasswordVisible ? "fa-eye-slash" : "fa-eye"
                } text-gray-400 hover:text-gray-600`}
              ></i>
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* Options "Se souvenir de moi" et "Mot de passe oublié" */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-600">
              Se souvenir de moi
            </span>
          </label>
          <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
            Mot de passe oublié ?
          </a>
        </div>

        {/* Bouton de soumission */}
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
              Connexion...
            </>
          ) : (
            <>
              <i className="fas fa-sign-in-alt mr-2"></i>
              Se connecter
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

      {/* Lien pour basculer vers le formulaire d'inscription */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Pas encore de compte ?{" "}
          <button
            onClick={onShowSignup}
            className="text-blue-600 hover:text-blue-500 font-medium"
            type="button"
            disabled={isLoading}
          >
            Créer un compte
          </button>
        </p>
      </div>

      {/* Boîte d'information pour le compte de démo */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <h4 className="font-semibold text-blue-800 mb-2">
          🎭 Compte de démonstration
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>
            <strong>Email:</strong> marie.castello@example.com
          </div>
          <div>
            <strong>Mot de passe:</strong> demo123
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
