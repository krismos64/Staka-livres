import React from "react";

export default function Services() {
  const handleConsultationBooking = () => {
    // TODO: Implémenter la logique de réservation
    console.log("Réservation de consultation demandée");
    // On pourrait rediriger vers un calendly, ouvrir une modal, etc.
  };

  const handleTimeSlotClick = (day: string, time: string) => {
    console.log(`Créneau sélectionné: ${day} ${time}`);
    // TODO: Logique de sélection de créneau
  };

  return (
    <section id="services" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nos{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              services d'édition
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Une expertise complète pour donner vie à votre projet éditorial
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl hover:transform hover:-translate-y-2 transition-all duration-300 flex flex-col">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 flex-shrink-0">
              <i className="fas fa-spell-check text-blue-600 text-2xl"></i>
            </div>
            <h3 className="font-bold text-xl mb-4">Correction complète</h3>
            <p className="text-gray-600 mb-6 flex-grow">
              Orthographe, grammaire, syntaxe, style et cohérence narrative par
              nos correcteurs expérimentés.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <i className="fas fa-check text-green-500"></i>
                Correction orthographique
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-check text-green-500"></i>
                Amélioration du style
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-check text-green-500"></i>
                Cohérence narrative
              </li>
            </ul>
            <div className="mt-6">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Délai: 7-10 jours
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl hover:transform hover:-translate-y-2 transition-all duration-300 flex flex-col">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 flex-shrink-0">
              <i className="fas fa-palette text-purple-600 text-2xl"></i>
            </div>
            <h3 className="font-bold text-xl mb-4">Design professionnel</h3>
            <p className="text-gray-600 mb-6 flex-grow">
              Mise en page soignée et conception de couverture qui captent
              l'attention des lecteurs.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <i className="fas fa-check text-green-500"></i>
                Maquette intérieure
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-check text-green-500"></i>
                Couverture sur mesure
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-check text-green-500"></i>
                Prêt pour impression
              </li>
            </ul>
            <div className="mt-6">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                Délai: 5-7 jours
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl hover:transform hover:-translate-y-2 transition-all duration-300 flex flex-col">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 flex-shrink-0">
              <i className="fas fa-rocket text-green-600 text-2xl"></i>
            </div>
            <h3 className="font-bold text-xl mb-4">
              Accompagnement publication
            </h3>
            <p className="text-gray-600 mb-6 flex-grow">
              Support complet pour l'autoédition et la diffusion sur les
              plateformes numériques.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <i className="fas fa-check text-green-500"></i>
                Coaching Amazon KDP
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-check text-green-500"></i>
                Formats ePub/Mobi
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-check text-green-500"></i>
                Stratégie de lancement
              </li>
            </ul>
            <div className="mt-6">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Support continu
              </span>
            </div>
          </div>
        </div>

        {/* Consultation gratuite */}
        <div className="mt-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              📅 Réservez votre consultation gratuite
            </h3>
            <div className="flex justify-center">
              <p className="text-lg opacity-90 text-center max-w-2xl mx-auto">
                30 minutes d'échange avec un expert pour définir vos besoins
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h4 className="font-bold text-xl mb-4 text-center lg:text-left">
                Ce que vous obtiendrez :
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <i className="fas fa-phone text-green-300"></i>
                  <span>Appel téléphonique personnalisé</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-file-alt text-blue-300"></i>
                  <span>Analyse de votre manuscrit</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-calculator text-purple-300"></i>
                  <span>Devis personnalisé</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-route text-yellow-300"></i>
                  <span>Plan d'action détaillé</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <h4 className="font-bold text-lg mb-4">
                Créneaux disponibles cette semaine:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => handleTimeSlotClick("Lundi", "14h-14h30")}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-3 text-center transition"
                >
                  <div className="font-medium">Lundi</div>
                  <div className="text-sm">14h-14h30</div>
                </button>
                <button
                  onClick={() => handleTimeSlotClick("Mardi", "10h-10h30")}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-3 text-center transition"
                >
                  <div className="font-medium">Mardi</div>
                  <div className="text-sm">10h-10h30</div>
                </button>
                <button
                  onClick={() => handleTimeSlotClick("Mercredi", "16h-16h30")}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-3 text-center transition"
                >
                  <div className="font-medium">Mercredi</div>
                  <div className="text-sm">16h-16h30</div>
                </button>
                <button
                  onClick={() => handleTimeSlotClick("Jeudi", "11h-11h30")}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-3 text-center transition"
                >
                  <div className="font-medium">Jeudi</div>
                  <div className="text-sm">11h-11h30</div>
                </button>
              </div>
              <button
                onClick={handleConsultationBooking}
                className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                Réserver ce créneau
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
