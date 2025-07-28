export default function Hero() {
  return (
    <section className="pt-20 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white overflow-hidden relative">
      {/* Floating expert avatars - positioned in empty spaces */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top left corner - above text area */}
        <div
          className="absolute top-10 left-5 w-16 h-16 rounded-full bg-white/20 backdrop-blur border-2 border-white/30 overflow-hidden"
          style={{ animation: "bounce 3s ease-in-out infinite" }}
        >
          <img
            src="/images/footer/Correcteur2-min.webp"
            alt="Expert correcteur"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Top right - empty space above right column */}
        <div
          className="absolute top-16 right-10 w-14 h-14 rounded-full bg-white/20 backdrop-blur border-2 border-white/30 overflow-hidden"
          style={{
            animation: "bounce 3s ease-in-out infinite",
            animationDelay: "1s",
          }}
        >
          <img
            src="/images/footer/Correcteur4-min.webp"
            alt="Expert correcteur"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Bottom left - below text content */}
        <div
          className="absolute bottom-10 left-8 w-12 h-12 rounded-full bg-white/20 backdrop-blur border-2 border-white/30 overflow-hidden"
          style={{
            animation: "bounce 3s ease-in-out infinite",
            animationDelay: "2s",
          }}
        >
          <img
            src="/images/footer/Correcteur8-min.webp"
            alt="Expert correcteur"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Center area - between columns on larger screens */}
        <div
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur border-2 border-white/30 overflow-hidden hidden md:block"
          style={{
            animation: "bounce 3s ease-in-out infinite",
            animationDelay: "0.5s",
          }}
        >
          <img
            src="/images/footer/Correcteur5-min.webp"
            alt="Expert correcteur"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Bottom right - empty space below right column */}
        <div
          className="absolute bottom-16 right-12 w-14 h-14 rounded-full bg-white/20 backdrop-blur border-2 border-white/30 overflow-hidden"
          style={{
            animation: "bounce 3s ease-in-out infinite",
            animationDelay: "1.5s",
          }}
        >
          <img
            src="/images/footer/Correcteur3-min.webp"
            alt="Expert correcteur"
            className="w-full h-full object-cover"
          />
        </div>
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              Transformez votre
              <span className="text-yellow-300"> manuscrit</span> en livre
              professionnel
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
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm opacity-80">
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
            className="animate-fade-in-up mt-12 md:mt-0"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-3xl transform rotate-6"></div>
              <div className="relative bg-white/20 backdrop-blur rounded-3xl p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-4 text-center sm:text-left">
                  Nos packs incluent :
                </h3>
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
