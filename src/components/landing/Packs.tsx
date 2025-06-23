import React from "react";

export default function Packs() {
  return (
    <section id="packs" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choisissez votre{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              pack d'édition
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Des solutions adaptées à chaque étape de votre projet
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Pack KDP */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Pack KDP</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">350€</div>
              <p className="text-gray-500">Idéal pour débuter</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500"></i>
                <span>Maquette intérieure</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500"></i>
                <span>Conception couverture</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500"></i>
                <span>Fichiers ePub & Mobi</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500"></i>
                <span>Accompagnement KDP</span>
              </li>
            </ul>
            <button className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
              Choisir ce pack
            </button>
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">🕒 Délai: 5-7 jours</span>
            </div>
          </div>

          {/* Pack Intégral - Featured */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-yellow-400 text-gray-800 px-4 py-1 rounded-full text-sm font-semibold">
                ⭐ Le plus populaire
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Pack Intégral</h3>
              <div className="text-3xl font-bold mb-2">
                2€<span className="text-lg">/page</span>
              </div>
              <p className="text-blue-100">Solution complète</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-300"></i>
                <span>Correction complète</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-300"></i>
                <span>Maquette intérieure</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-300"></i>
                <span>Conception couverture</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-300"></i>
                <span>Fichiers ePub & Mobi</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-300"></i>
                <span>Support prioritaire</span>
              </li>
            </ul>
            <button className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
              Choisir ce pack
            </button>
            <div className="mt-4 text-center">
              <span className="text-sm text-blue-100">
                🕒 Délai: 10-15 jours
              </span>
            </div>
          </div>

          {/* Pack Rédaction */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Pack Rédaction</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">1450€</div>
              <p className="text-gray-500">Coaching complet</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500"></i>
                <span>Coaching rédactionnel</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500"></i>
                <span>Correction complète</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500"></i>
                <span>Maquette intérieure</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500"></i>
                <span>Conception couverture</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500"></i>
                <span>Fichiers ePub & Mobi</span>
              </li>
            </ul>
            <button className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
              Choisir ce pack
            </button>
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">
                🕒 Délai: 3-6 semaines
              </span>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Pas sûr de votre choix ? Testez notre expertise
          </p>
          <a
            href="#commande-gratuite"
            className="btn-primary text-white px-8 py-4 rounded-xl font-semibold inline-flex items-center gap-3"
          >
            <i className="fas fa-gift"></i>
            Correction gratuite de 10 pages
          </a>
        </div>
      </div>
    </section>
  );
}
