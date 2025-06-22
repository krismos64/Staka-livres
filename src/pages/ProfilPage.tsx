import React, { useState } from "react";

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
};

export default function ProfilePage() {
  const [user, setUser] = useState(initialUser);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Changement de mot de passe mock
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  // Pour la bio/adresse multi-ligne
  const handleChange = (field: string, value: string) =>
    setUser((u) => ({ ...u, [field]: value }));

  return (
    <section className="max-w-7xl mx-auto py-8 px-4">
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
              onSubmit={(e) => {
                e.preventDefault();
                alert("Profil mis à jour (démo)");
              }}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={user.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={user.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={user.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
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
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  rows={2}
                  value={user.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biographie
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  rows={3}
                  value={user.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                />
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
              onSubmit={(e) => {
                e.preventDefault();
                alert("Mot de passe modifié (démo)");
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={pwd.current}
                  onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={pwd.next}
                  onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={pwd.confirm}
                  onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                />
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
              onClick={() => alert("Ouvre la modale d'upload photo (démo)")}
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
  );
}
