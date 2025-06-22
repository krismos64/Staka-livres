import React, { useEffect, useRef, useState } from "react";

/**
 * Composant pour afficher les notifications.
 * Gère l'ouverture et la fermeture du menu déroulant des notifications.
 */
function Notifications() {
  // État pour contrôler la visibilité du menu déroulant
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Hook pour fermer le menu déroulant si l'utilisateur clique en dehors.
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
    // Ajoute l'écouteur d'événements
    document.addEventListener("mousedown", handleClickOutside);
    // Nettoie l'écouteur lors du démontage du composant
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton pour ouvrir/fermer les notifications */}
      <button
        className="relative p-2 text-gray-400 hover:text-gray-600 transition"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <i className="fas fa-bell text-lg"></i>
        {/* Point rouge indiquant de nouvelles notifications */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full notification-dot"></span>
      </button>

      {/* Menu déroulant des notifications (s'affiche si isOpen est true) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-fade-in">
          {/* En-tête du menu */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {/* Notification 1 */}
            <div className="p-4 hover:bg-gray-50 transition cursor-pointer border-b border-gray-50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-check text-green-600 text-xs"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Correction terminée
                  </p>
                  <p className="text-xs text-gray-600">
                    Votre roman "L'Écho du Temps" est prêt.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Il y a 2 heures</p>
                </div>
              </div>
            </div>
            {/* Notification 2 */}
            <div className="p-4 hover:bg-gray-50 transition cursor-pointer border-b border-gray-50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-comment text-blue-600 text-xs"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Nouveau message
                  </p>
                  <p className="text-xs text-gray-600">
                    Sarah a répondu à votre question sur le projet "Mémoires
                    d'une Vie".
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Hier</p>
                </div>
              </div>
            </div>
            {/* Notification 3 */}
            <div className="p-4 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-clock text-yellow-600 text-xs"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Deadline approche
                  </p>
                  <p className="text-xs text-gray-600">
                    La correction du projet "Nouvelles du Cœur" est prévue dans
                    2 jours.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Il y a 3 jours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pied du menu */}
          <div className="p-4 border-t border-gray-100 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Voir toutes les notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
