interface AboutProps {
  onChatClick?: () => void;
}

export default function About({ onChatClick }: AboutProps) {
  const handleChatClick = () => {
    if (onChatClick) {
      onChatClick();
    } else {
      // Simulation d'ouverture du chat (fallback)
      console.log("Ouverture du chat...");
      alert("Chat en cours d'ouverture... 💬");
    }
  };

  const handleBookingClick = () => {
    // Simulation d'ouverture de la modal de réservation
    console.log("Ouverture de la modal de réservation...");
    // Ici on pourrait intégrer un vrai système de réservation
    alert("Système de réservation en cours d'ouverture... 📅");
  };

  return (
    <section
      id="qui-sommes-nous"
      className="py-16 bg-white relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Qui sommes-nous ?
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Staka Éditions est né de la fusion des expertises reconnues de{" "}
              <strong>Staka.fr</strong>, <strong>Entremises.fr</strong> et{" "}
              <strong>Uppreditions.fr</strong>.
            </p>
            <p className="text-gray-600 mb-6">
              Notre équipe de correcteurs et d'éditeurs professionnels applique
              une méthode éditoriale rigoureuse, développée au fil des années et
              éprouvée sur plus de 1500 projets d'auteurs.
            </p>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-gray-500">Service français</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">0%</div>
                <div className="text-sm text-gray-500">
                  Intelligence artificielle
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <a
                href="#commande-gratuite"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Tester gratuitement
              </a>
              <button
                onClick={handleChatClick}
                className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition"
              >
                Nous contacter
              </button>
            </div>
          </div>
          <div className="relative">
            {/* Fond coloré étendu */}
            <div className="absolute -inset-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl transform rotate-1"></div>
            <div className="absolute -inset-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl transform rotate-2"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold mb-6 text-center">
                🌟 Pourquoi nous choisir ?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-phone text-green-600"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Téléphone</h4>
                    <a
                      href="tel:+33615078152"
                      className="text-green-600 hover:underline"
                    >
                      06 15 07 81 52
                    </a>
                    <p className="text-sm text-gray-500">Lun-Ven 9h-18h</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <i className="fab fa-whatsapp text-green-600"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">WhatsApp</h4>
                    <a
                      href="https://wa.me/33615078152?text=Bonjour,%20j'aimerais%20des%20informations%20sur%20vos%20services%20de%20correction%20de%20manuscrit"
                      target="_blank"
                      className="text-green-600 hover:underline"
                    >
                      06 15 07 81 52
                    </a>
                    <p className="text-sm text-gray-500">
                      Chat direct instantané
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-calendar text-purple-600"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">
                      Consultation gratuite
                    </h4>
                    <p className="text-gray-600">
                      Échange téléphonique de 30 min
                    </p>
                    <button
                      onClick={handleBookingClick}
                      className="text-purple-600 hover:underline text-sm font-medium"
                    >
                      Réserver un créneau →
                    </button>
                  </div>
                </div>

                {/* Live chat status */}
                <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-green-800">
                      Expert en ligne
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Un de nos conseillers est disponible pour répondre à vos
                    questions
                  </p>
                  <button
                    onClick={handleChatClick}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                  >
                    <i className="fas fa-comments mr-2"></i>
                    Démarrer le chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section images professionnelles */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Notre équipe à votre service
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez l'univers de Staka Éditions : des professionnels passionnés 
              qui accompagnent chaque auteur dans la réalisation de son projet éditorial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="/images/Qui-sommes-nous-1-.webp"
                  alt="Notre expertise éditoriale"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h4 className="text-white font-bold text-lg mb-2">Expertise éditoriale</h4>
                <p className="text-white/90 text-sm">
                  Une équipe de professionnels dédiée à l'excellence littéraire
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="/images/Qui-sommes-nous-2-.webp"
                  alt="Accompagnement personnalisé"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h4 className="text-white font-bold text-lg mb-2">Accompagnement personnalisé</h4>
                <p className="text-white/90 text-sm">
                  Un suivi sur-mesure pour chaque projet d'auteur
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="/images/Qui-sommes-nous-3-.webp"
                  alt="Passion de l'écriture"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h4 className="text-white font-bold text-lg mb-2">Passion de l'écriture</h4>
                <p className="text-white/90 text-sm">
                  L'amour des mots au cœur de notre métier
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
