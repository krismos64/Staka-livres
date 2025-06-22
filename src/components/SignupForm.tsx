import React from "react";

/**
 * Props pour le composant SignupForm.
 */
interface SignupFormProps {
  /** Fonction pour ré-afficher le formulaire de connexion */
  onShowLogin: () => void;
}

/**
 * Composant pour le formulaire d'inscription.
 */
function SignupForm({ onShowLogin }: SignupFormProps) {
  /**
   * Gère la soumission du formulaire d'inscription.
   * Dans une vraie app, on enverrait les données à une API.
   */
  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
    // On pourrait vouloir rediriger ou connecter automatiquement l'utilisateur ici.
    onShowLogin(); // Pour l'exemple, on retourne simplement au login.
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl p-8"
      id="signup-form-container"
    >
      {/* Titre du formulaire */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Créer un compte</h2>
        <p className="text-gray-500">Rejoignez notre communauté d'auteurs</p>
      </div>

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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Marie"
            />
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Castello"
            />
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="votre@email.com"
          />
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="••••••••"
          />
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
          />
        </div>

        {/* Case à cocher pour les conditions d'utilisation */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              required
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">
              J'accepte les{" "}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                conditions d'utilisation
              </a>
            </span>
          </label>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition duration-300 transform hover:scale-105"
        >
          Créer mon compte
        </button>
      </form>

      {/* Lien pour basculer vers le formulaire de connexion */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Déjà un compte ?{" "}
          <button
            onClick={onShowLogin}
            className="text-blue-600 hover:text-blue-500 font-medium"
            type="button"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignupForm;
