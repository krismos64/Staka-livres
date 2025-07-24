import React, { useState, useEffect } from "react";
import { useToast } from "../components/layout/ToastProvider";
import AvatarUploadModal from "../components/modals/AvatarUploadModal";
import { useAuth } from "../contexts/AuthContext";

// Mock user data (à remplacer)
const initialUser = {
  firstName: "Marie",
  lastName: "Castello",
  email: "marie.castello@example.com",
  phone: "06 12 34 56 78",
  address: "123 Rue de la Littérature\n31000 Toulouse",
  bio: "Auteure passionnée depuis plus de 10 ans, je me spécialise dans les romans contemporains et les biographies. J'ai publié plusieurs ouvrages avec Staka Éditions et je suis toujours à la recherche de nouvelles histoires à raconter.",
  avatar:
    "https://ui-avatars.com/api/?name=Marie+Castello&background=6C47FF&color=fff&size=128",
  joinDate: "Mars 2023",
  projects: 12,
  rating: 4.8,
  vip: true,
  emailVerified: false,
};

export default function ProfilePage() {
  const { showToast } = useToast();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(initialUser);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Mettre à jour les données utilisateur quand authUser change
  useEffect(() => {
    if (authUser) {
      setUser({
        firstName: authUser.prenom || "",
        lastName: authUser.nom || "",
        email: authUser.email || "",
        phone: initialUser.phone, // Garder les données mock pour les champs non disponibles
        address: initialUser.address,
        bio: initialUser.bio,
        avatar: authUser.prenom && authUser.nom 
          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.prenom)}+${encodeURIComponent(authUser.nom)}&background=6C47FF&color=fff&size=128`
          : initialUser.avatar,
        joinDate: new Date(authUser.createdAt).toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long' 
        }) || initialUser.joinDate,
        projects: initialUser.projects, // À remplacer par de vraies données
        rating: initialUser.rating, // À remplacer par de vraies données
        vip: authUser.role === 'ADMIN' || initialUser.vip,
        emailVerified: authUser.isActive || false,
      });
    }
  }, [authUser]);

  // Changement de mot de passe mock
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<any>({});

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const validate = () => {
    const newErrors: any = {};
    if (!user.firstName) newErrors.firstName = "Le prénom est requis.";
    if (!user.lastName) newErrors.lastName = "Le nom est requis.";
    if (!user.email) newErrors.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(user.email))
      newErrors.email = "L'email est invalide.";

    // ... validation pour le téléphone, etc.

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      console.log("Saving profile...", user);
      showToast(
        "success",
        "Profil sauvegardé",
        "Vos informations ont été mises à jour."
      );
    } else {
      showToast(
        "error",
        "Erreur de validation",
        "Veuillez corriger les champs en erreur."
      );
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (!pwd.current) newErrors.currentPwd = "Mot de passe actuel requis.";
    if (getPasswordStrength(pwd.next) < 4)
      newErrors.nextPwd = "Le mot de passe est trop faible.";
    if (pwd.next !== pwd.confirm)
      newErrors.confirmPwd = "Les mots de passe ne correspondent pas.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      showToast(
        "success",
        "Mot de passe modifié",
        "Votre mot de passe a été changé avec succès."
      );
      setPwd({ current: "", next: "", confirm: "" });
    } else {
      showToast("error", "Erreur", "Veuillez corriger les erreurs.");
    }
  };

  const handleAvatarChange = (file: File) => {
    const newAvatarUrl = URL.createObjectURL(file);
    setUser((u) => ({ ...u, avatar: newAvatarUrl }));
  };

  const handleResendVerification = () => {
    showToast(
      "info",
      "Email de vérification envoyé",
      `Un nouvel email a été envoyé à ${user.email}.`
    );
  };

  // Pour la bio/adresse multi-ligne
  const handleChange = (field: string, value: string) =>
    setUser((u) => ({ ...u, [field]: value }));

  return (
    <>
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mon profil</h2>
          <p className="text-gray-600">
            Gérez vos informations personnelles et préférences
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Bloc gauche = form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="font-semibold text-lg text-gray-900 mb-6">
                Informations personnelles
              </h3>
              <form
                className="space-y-6"
                onSubmit={handleProfileSubmit}
                noValidate
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
                        errors.firstName
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      value={user.firstName}
                      onChange={(e) =>
                        handleChange("firstName", e.target.value)
                      }
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
                        errors.lastName
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      value={user.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
                        errors.email
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      value={user.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                    {user.emailVerified ? (
                      <div className="absolute inset-y-0 right-3 flex items-center text-sm text-green-600">
                        <i className="fas fa-check-circle mr-1"></i> Vérifié
                      </div>
                    ) : (
                      <div className="absolute inset-y-0 right-3 flex items-center text-sm">
                        <span className="text-yellow-600">
                          <i className="fas fa-exclamation-triangle mr-1"></i>{" "}
                          Non vérifié
                        </span>
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          className="ml-2 text-blue-600 hover:underline text-xs"
                        >
                          Renvoyer
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={user.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  {user.address ? (
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      rows={2}
                      value={user.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  ) : (
                    <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-xl">
                      <p>Aucune adresse fournie.</p>
                      <button
                        type="button"
                        onClick={() => handleChange("address", " ")}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                      >
                        Ajouter une adresse
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biographie
                  </label>
                  {user.bio ? (
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      rows={3}
                      value={user.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                    />
                  ) : (
                    <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-xl">
                      <p>Aucune biographie rédigée.</p>
                      <button
                        type="button"
                        onClick={() => handleChange("bio", " ")}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                      >
                        Ajouter une biographie
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <i className="fas fa-save"></i>
                  Sauvegarder les modifications
                </button>
              </form>
            </div>
            {/* Bloc mot de passe */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="font-semibold text-lg text-gray-900 mb-6">
                Changer le mot de passe
              </h3>
              <form
                className="space-y-6"
                onSubmit={handlePasswordSubmit}
                noValidate
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
                      errors.currentPwd
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    value={pwd.current}
                    onChange={(e) =>
                      setPwd({ ...pwd, current: e.target.value })
                    }
                  />
                  {errors.currentPwd && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.currentPwd}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
                      errors.nextPwd
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    value={pwd.next}
                    onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                  />
                  {pwd.next && <PasswordStrengthMeter password={pwd.next} />}
                  {errors.nextPwd && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.nextPwd}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition ${
                      errors.confirmPwd
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    value={pwd.confirm}
                    onChange={(e) =>
                      setPwd({ ...pwd, confirm: e.target.value })
                    }
                  />
                  {errors.confirmPwd && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirmPwd}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <i className="fas fa-key"></i>
                  Changer le mot de passe
                </button>
              </form>
            </div>
          </div>
          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Carte profil */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
              <div className="relative mb-4">
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-24 h-24 rounded-full border-4 border-blue-100 shadow"
                />
              </div>
              <div className="text-center mb-3">
                <div className="text-lg font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-blue-700 font-medium text-sm mt-1">
                  {user.vip ? "Auteure • Cliente VIP" : "Auteure"}
                </div>
              </div>
              <button
                className="bg-blue-50 text-blue-700 py-2 px-4 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-100 transition"
                onClick={() => setIsAvatarModalOpen(true)}
              >
                <i className="fas fa-camera"></i>Changer la photo
              </button>
            </div>
            {/* Statistiques compte */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-semibold text-md text-gray-900 mb-4">
                Statistiques du compte
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Membre depuis</span>
                  <span className="font-medium text-gray-900">
                    {user.joinDate}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Projets complétés</span>
                  <span className="font-medium text-gray-900">
                    {user.projects}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Note moyenne donnée</span>
                  <span className="font-medium text-gray-900">
                    {user.rating}/5
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Statut</span>
                  <span className="font-medium text-purple-600">
                    {user.vip ? "VIP" : "Standard"}
                  </span>
                </div>
              </div>
            </div>
            {/* Préférences switches */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-semibold text-md text-gray-900 mb-4">
                Préférences
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Notifications email</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={notifEmail}
                      onChange={() => setNotifEmail((v) => !v)}
                    />
                    <div
                      className={`w-10 h-6 rounded-full ${
                        notifEmail ? "bg-blue-600" : "bg-gray-300"
                      } flex items-center transition`}
                    >
                      <div
                        className={`bg-white w-5 h-5 rounded-full shadow transform duration-150 ${
                          notifEmail ? "translate-x-4" : "translate-x-1"
                        }`}
                      />
                    </div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Notifications SMS</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={notifSMS}
                      onChange={() => setNotifSMS((v) => !v)}
                    />
                    <div
                      className={`w-10 h-6 rounded-full ${
                        notifSMS ? "bg-blue-600" : "bg-gray-300"
                      } flex items-center transition`}
                    >
                      <div
                        className={`bg-white w-5 h-5 rounded-full shadow transform duration-150 ${
                          notifSMS ? "translate-x-4" : "translate-x-1"
                        }`}
                      />
                    </div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Mode sombre</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={darkMode}
                      onChange={() => setDarkMode((v) => !v)}
                    />
                    <div
                      className={`w-10 h-6 rounded-full ${
                        darkMode ? "bg-blue-600" : "bg-gray-300"
                      } flex items-center transition`}
                    >
                      <div
                        className={`bg-white w-5 h-5 rounded-full shadow transform duration-150 ${
                          darkMode ? "translate-x-4" : "translate-x-1"
                        }`}
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onAvatarChange={handleAvatarChange}
        currentAvatar={user.avatar}
      />
    </>
  );
}

function PasswordStrengthMeter({ password }: { password?: string }) {
  if (!password) return null;

  const getStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const strength = getStrength();
  const strengthText = [
    "",
    "Très faible",
    "Faible",
    "Moyen",
    "Fort",
    "Très fort",
  ];
  const strengthColor = [
    "",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
  ];

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-gray-600">
          Force du mot de passe
        </span>
        <span className="text-xs font-bold">{strengthText[strength]}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${strengthColor[strength]} transition-all duration-300`}
          style={{ width: `${(strength / 5) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}
