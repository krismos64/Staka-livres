import React, { useState } from "react";

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implémenter l'inscription newsletter
    console.log("Newsletter inscription:", newsletterEmail);
    setNewsletterEmail("");
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-book-open text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                  Staka Éditions
                </h3>
                <p className="text-gray-400 text-sm">
                  Excellence éditoriale depuis 2010
                </p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Nous transformons vos manuscrits en livres professionnels dignes
              des plus grandes maisons d'édition. Une expertise de 15 ans au
              service de votre passion littéraire.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition"
                aria-label="Suivez-nous sur Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition"
                aria-label="Suivez-nous sur Twitter"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition"
                aria-label="Suivez-nous sur LinkedIn"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition"
                aria-label="Suivez-nous sur Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="https://wa.me/33615078152?text=Bonjour,%20j'aimerais%20des%20informations%20sur%20vos%20services%20de%20correction%20de%20manuscrit"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center hover:bg-green-700 transition relative group"
                aria-label="Contactez-nous sur WhatsApp"
              >
                <i className="fab fa-whatsapp"></i>
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  Chat WhatsApp
                </div>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="fas fa-cogs text-blue-400"></i>
              Nos Services
            </h4>
            <ul className="space-y-3 text-gray-300">
              <li>
                <a
                  href="#services"
                  className="hover:text-blue-400 transition flex items-center gap-2"
                >
                  <i className="fas fa-chevron-right text-xs text-blue-400"></i>
                  Correction de manuscrits
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-blue-400 transition flex items-center gap-2"
                >
                  <i className="fas fa-chevron-right text-xs text-blue-400"></i>
                  Mise en page professionnelle
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-blue-400 transition flex items-center gap-2"
                >
                  <i className="fas fa-chevron-right text-xs text-blue-400"></i>
                  Conception de couverture
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-blue-400 transition flex items-center gap-2"
                >
                  <i className="fas fa-chevron-right text-xs text-blue-400"></i>
                  Coaching rédactionnel
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-blue-400 transition flex items-center gap-2"
                >
                  <i className="fas fa-chevron-right text-xs text-blue-400"></i>
                  Accompagnement Amazon KDP
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="fas fa-address-card text-blue-400"></i>
              Contact & Infos
            </h4>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <i className="fas fa-envelope text-blue-400 mt-1"></i>
                <div>
                  <div className="font-medium">Email</div>
                  <a
                    href="mailto:contact@staka.fr"
                    className="text-gray-400 hover:text-blue-400 transition"
                  >
                    contact@staka.fr
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-phone text-blue-400 mt-1"></i>
                <div>
                  <div className="font-medium">Téléphone</div>
                  <a
                    href="tel:+33615078152"
                    className="text-gray-400 hover:text-blue-400 transition"
                  >
                    06 15 07 81 52
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <i className="fab fa-whatsapp text-green-400 mt-1"></i>
                <div>
                  <div className="font-medium">WhatsApp</div>
                  <a
                    href="https://wa.me/33615078152?text=Bonjour,%20j'aimerais%20des%20informations%20sur%20vos%20services%20de%20correction%20de%20manuscrit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-green-400 transition"
                  >
                    06 15 07 81 52
                  </a>
                  <div className="text-xs text-gray-500">
                    Chat direct instantané
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-clock text-blue-400 mt-1"></i>
                <div>
                  <div className="font-medium">Horaires</div>
                  <div className="text-gray-400 text-sm">
                    Lun-Ven: 9h-18h
                    <br />
                    Réponse sous 24h
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-2xl p-8 text-center">
            <h4 className="text-xl font-semibold mb-3">
              📚 Restez informé de nos actualités
            </h4>
            <p className="text-gray-300 mb-6">
              Conseils d'écriture, offres spéciales et nouveautés éditoriales
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="Votre adresse email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition"
              >
                S'abonner
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Partners Section */}
      <div className="border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <h4 className="text-center text-gray-400 text-sm mb-6">
            Nos sites partenaires
          </h4>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <a
              href="https://staka.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100 transition"
            >
              <div className="bg-gray-700 px-4 py-2 rounded text-white text-sm font-semibold">
                Staka.fr
              </div>
            </a>
            <a
              href="https://entremises.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100 transition"
            >
              <div className="bg-gray-700 px-4 py-2 rounded text-white text-sm font-semibold">
                Entremises.fr
              </div>
            </a>
            <a
              href="https://uppreditions.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100 transition"
            >
              <div className="bg-gray-700 px-4 py-2 rounded text-white text-sm font-semibold">
                Uppreditions.fr
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800 py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <span>© 2025 Staka Éditions. Tous droits réservés.</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="hover:text-blue-400 transition">
                Mentions légales
              </a>
              <a href="#" className="hover:text-blue-400 transition">
                Politique de confidentialité
              </a>
              <a href="#" className="hover:text-blue-400 transition">
                CGV
              </a>
              <a href="#" className="hover:text-blue-400 transition">
                RGPD
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
