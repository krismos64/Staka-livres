import React, { useState } from "react";

interface NavigationProps {
  onLoginClick?: () => void;
}

export default function Navigation({ onLoginClick }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPromoBannerVisible, setIsPromoBannerVisible] = useState(true);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const closePromoBanner = () => {
    setIsPromoBannerVisible(false);
  };

  const handleMobileLinkClick = () => {
    closeMobileMenu();
  };

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  return (
    <>
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        Aller au contenu principal
      </a>

      {/* Promo Banner */}
      {isPromoBannerVisible && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-2 text-sm">
          🎉 <strong>Offre limitée:</strong> 10 pages gratuites + 20% de
          réduction sur votre première commande !
          <button
            onClick={closePromoBanner}
            className="ml-4 text-green-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fas fa-book-open text-blue-600 text-xl"></i>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Staka Éditions
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#services" className="hover:text-blue-600 transition">
              Services
            </a>
            <a href="#packs" className="hover:text-blue-600 transition">
              Packs
            </a>
            <a href="#temoignages" className="hover:text-blue-600 transition">
              Témoignages
            </a>
            <a href="#blog" className="hover:text-blue-600 transition">
              Blog
            </a>
            <a
              href="#qui-sommes-nous"
              className="hover:text-blue-600 transition"
            >
              À propos
            </a>
            <a href="#faq" className="hover:text-blue-600 transition">
              FAQ
            </a>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
              <i className="fas fa-comments mr-1"></i> Chat
            </button>
            <button
              onClick={handleLoginClick}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-600 transition flex items-center gap-2"
            >
              <i className="fas fa-sign-in-alt"></i>
              Connexion
            </button>
            <a
              href="#contact"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Contact
            </a>
          </div>
          <button className="md:hidden" onClick={toggleMobileMenu}>
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-white z-40 transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Menu
            </span>
            <button onClick={closeMobileMenu}>
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <div className="space-y-4">
            <a
              href="#services"
              className="block py-2 hover:text-blue-600 transition"
              onClick={handleMobileLinkClick}
            >
              Services
            </a>
            <a
              href="#packs"
              className="block py-2 hover:text-blue-600 transition"
              onClick={handleMobileLinkClick}
            >
              Packs
            </a>
            <a
              href="#temoignages"
              className="block py-2 hover:text-blue-600 transition"
              onClick={handleMobileLinkClick}
            >
              Témoignages
            </a>
            <a
              href="#blog"
              className="block py-2 hover:text-blue-600 transition"
              onClick={handleMobileLinkClick}
            >
              Blog
            </a>
            <a
              href="#qui-sommes-nous"
              className="block py-2 hover:text-blue-600 transition"
              onClick={handleMobileLinkClick}
            >
              À propos
            </a>
            <a
              href="#faq"
              className="block py-2 hover:text-blue-600 transition"
              onClick={handleMobileLinkClick}
            >
              FAQ
            </a>
            <button className="block w-full text-left py-2 hover:text-green-600 transition">
              <i className="fas fa-comments mr-2"></i>Chat en direct
            </button>
            <button
              onClick={() => {
                handleLoginClick();
                handleMobileLinkClick();
              }}
              className="block w-full text-left py-2 hover:text-blue-600 transition"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>Connexion
            </button>
            <a
              href="#contact"
              className="block py-2 hover:text-blue-600 transition"
              onClick={handleMobileLinkClick}
            >
              Contact
            </a>
          </div>
        </div>
      </div>

      {/* Sticky CTA Bar */}
      <div
        id="sticky-cta"
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 shadow-lg z-40 transform translate-y-full transition-transform duration-300"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i className="fas fa-gift text-yellow-300 text-xl"></i>
            <div>
              <div className="font-semibold">10 pages gratuites</div>
              <div className="text-sm opacity-90">
                Testez notre expertise sans engagement
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                document
                  .getElementById("sticky-cta")!
                  .classList.add("translate-y-full")
              }
              className="text-blue-200 hover:text-white"
            >
              <i className="fas fa-times"></i>
            </button>
            <a
              href="#commande-gratuite"
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Commencer
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
