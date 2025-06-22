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

  // Inverse l'état de visibilité du mot de passe
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl p-8"
      id="login-form-container"
    >
      {/* Le formulaire de connexion appelle onLogin lors de la soumission */}
      <form id="login-form" className="space-y-6" onSubmit={onLogin}>
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="votre@email.com"
              defaultValue="marie.castello@example.com" // Valeur par défaut pour la démo
            />
          </div>
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
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
              defaultValue="demo123" // Valeur par défaut pour la démo
            />
            {/* Bouton pour afficher/cacher le mot de passe */}
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              tabIndex={-1}
            >
              <i
                className={`fas ${
                  isPasswordVisible ? "fa-eye-slash" : "fa-eye"
                } text-gray-400 hover:text-gray-600`}
              ></i>
            </button>
          </div>
        </div>

        {/* Options "Se souvenir de moi" et "Mot de passe oublié" */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition duration-300 transform hover:scale-105"
        >
          <i className="fas fa-sign-in-alt mr-2"></i>
          Se connecter
        </button>
      </form>

      {/* Lien pour basculer vers le formulaire d'inscription */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Pas encore de compte ?{" "}
          <button
            onClick={onShowSignup}
            className="text-blue-600 hover:text-blue-500 font-medium"
            type="button"
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
