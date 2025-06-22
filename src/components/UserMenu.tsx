import React, { useEffect, useRef, useState } from "react";

type SectionName = "profile" | "settings" | "billing";

/**
 * Props pour le composant UserMenu.
 */
interface UserMenuProps {
  /** Fonction pour changer la section affichée (profil, paramètres, etc.) */
  onSectionChange: (section: SectionName) => void;
  /** Fonction pour gérer la déconnexion de l'utilisateur */
  onLogout: () => void;
}

/**
 * Menu déroulant pour l'utilisateur.
 * Affiche l'avatar, le nom, et des liens vers le profil, les paramètres,
 * et la déconnexion.
 */
function UserMenu({ onSectionChange, onLogout }: UserMenuProps) {
  // État pour contrôler la visibilité du menu déroulant
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Hook pour fermer le menu si l'utilisateur clique en dehors.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Gère le clic sur un item du menu, change la section et ferme le menu.
   * @param section - La section à afficher.
   */
  const handleItemClick = (section: SectionName) => {
    onSectionChange(section);
    setIsOpen(false);
  };

  /**
   * Gère la déconnexion et ferme le menu.
   */
  const handleLogoutClick = () => {
    onLogout();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton principal qui affiche les infos utilisateur et ouvre le menu */}
      <button
        className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 transition"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">MC</span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">Marie Castello</p>
          <p className="text-xs text-gray-500">Auteure</p>
        </div>
        <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
      </button>

      {/* Le menu déroulant, qui s'affiche si isOpen est true */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in">
          <div className="py-2">
            <button
              onClick={() => handleItemClick("profile")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <i className="fas fa-user w-4 text-center"></i>
              <span>Mon profil</span>
            </button>
            <button
              onClick={() => handleItemClick("settings")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <i className="fas fa-cog w-4 text-center"></i>
              <span>Paramètres</span>
            </button>
            <button
              onClick={() => handleItemClick("billing")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <i className="fas fa-credit-card w-4 text-center"></i>
              <span>Facturation</span>
            </button>
            <hr className="my-2" />
            <button
              onClick={handleLogoutClick}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
            >
              <i className="fas fa-sign-out-alt w-4 text-center"></i>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
