import { useEffect, useState } from "react";

interface NavigationProps {
  onLoginClick?: () => void;
}

export default function Navigation({ onLoginClick }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showPromo, setShowPromo] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  const navLinks = [
    { href: "#services", text: "Services" },
    { href: "#packs", text: "Packs" },
    { href: "#temoignages", text: "Témoignages" },
    { href: "#blog", text: "Blog" },
    { href: "#qui-sommes-nous", text: "À propos" },
    { href: "#faq", text: "FAQ" },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-sm shadow-md" : "bg-white"
        }`}
      >
        {/* Navigation Bar */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="#" className="flex items-center gap-2">
                <i className="fas fa-book-open text-blue-600 text-2xl"></i>
                <span className="font-bold text-xl text-blue-600">
                  Staka Éditions
                </span>
              </a>
            </div>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {link.text}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href="#chat"
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-600 transition-all shadow-sm flex items-center gap-2"
              >
                <i className="fas fa-comments"></i>
                Chat
              </a>
              <a
                href="#contact"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all shadow-sm"
              >
                Contact
              </a>
              <button
                onClick={handleLoginClick}
                className="text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Connexion
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 focus:outline-none"
                aria-label="Menu"
              >
                <i className="fas fa-bars text-2xl"></i>
              </button>
            </div>
          </div>
        </nav>

        {/* Promo Banner */}
        {showPromo && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-2.5 text-sm font-medium relative">
            🎉 <span className="hidden sm:inline">Offre limitée :</span> 10
            pages gratuites + 20% de réduction !
            <button
              onClick={() => setShowPromo(false)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-green-200 transition-colors"
              aria-label="Fermer la bannière promotionnelle"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4">
            <a href="#" className="flex items-center gap-2">
              <i className="fas fa-book-open text-blue-600 text-2xl"></i>
              <span className="font-bold text-xl text-blue-600">
                Staka Éditions
              </span>
            </a>
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-500 hover:text-gray-800"
              aria-label="Fermer le menu"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>

          {/* Promo Banner in Mobile Menu */}
          {showPromo && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-2.5 text-sm font-medium relative">
              🎉 10 pages gratuites + 20% de réduction !
              <button
                onClick={() => setShowPromo(false)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-green-200 transition-colors"
                aria-label="Fermer la bannière promotionnelle"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          <nav className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={toggleMobileMenu}
                className="text-2xl font-medium text-gray-700 hover:text-blue-600"
              >
                {link.text}
              </a>
            ))}
          </nav>

          <div className="p-6 border-t border-gray-100 space-y-3">
            <a
              href="#chat"
              onClick={toggleMobileMenu}
              className="flex items-center justify-center w-full text-center bg-green-500 text-white px-5 py-3 rounded-lg font-semibold text-base hover:bg-green-600 transition-all shadow-sm"
            >
              <i className="fas fa-comments mr-2"></i>Chat
            </a>
            <a
              href="#contact"
              onClick={toggleMobileMenu}
              className="block w-full text-center bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold text-base hover:bg-blue-700 transition-all shadow-sm"
            >
              Contact
            </a>
            <button
              onClick={() => {
                handleLoginClick();
                toggleMobileMenu();
              }}
              className="w-full text-center text-base font-medium text-gray-700 bg-gray-100 px-4 py-3 rounded-lg hover:bg-gray-200"
            >
              Connexion
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
