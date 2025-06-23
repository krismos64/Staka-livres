import React from "react";

export default function Hero() {
  return (
    <section className="pt-20 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white overflow-hidden relative">
      {/* Floating elements for visual appeal */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-bounce"></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-yellow-300/20 rounded-full animate-bounce"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-bounce"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 mb-6">
              <i className="fas fa-star text-yellow-300"></i>
              <span className="text-sm font-medium">
                4.9/5 • 127 avis clients
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Transformez votre
              <span className="text-yellow-300"> manuscrit</span>
              en livre professionnel
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90 leading-relaxed">
              15 ans d'expertise éditoriale • 1500+ auteurs accompagnés •
              Standard des grandes maisons d'édition
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#commande-gratuite"
                className="bg-blue-700 hover:bg-blue-800 animate-pulse text-white font-semibold py-4 px-8 rounded-xl shadow-lg inline-flex items-center justify-center gap-3 transition"
              >
                <i className="fas fa-gift"></i>
                10 pages gratuites
              </a>
              <a
                href="#calculateur-prix"
                className="bg-white/20 backdrop-blur text-white font-semibold py-4 px-8 rounded-xl hover:bg-white/30 transition inline-flex items-center justify-center gap-3"
              >
                <i className="fas fa-calculator"></i>
                Calculer le prix
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 mt-8 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <i className="fas fa-shield-alt text-green-300"></i>
                <span>100% français</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-robot text-red-300"></i>
                <span>Sans IA</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-sync-alt text-blue-300"></i>
                <span>Corrections illimitées</span>
              </div>
            </div>
          </div>
          <div
            className="animate-fade-in-up hidden md:block"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-3xl transform rotate-6"></div>
              <div className="relative bg-white/20 backdrop-blur rounded-3xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-green-300"></i>
                    <span>Correction orthographique et grammaticale</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-green-300"></i>
                    <span>Mise en page professionnelle</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-green-300"></i>
                    <span>Conception de couverture</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-green-300"></i>
                    <span>Formats ePub et Mobi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
