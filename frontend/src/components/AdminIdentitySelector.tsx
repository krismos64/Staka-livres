import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

interface AdminIdentity {
  firstName: string;
  lastName: string;
  role?: string;
}

interface AdminIdentitySelectorProps {
  currentIdentity?: AdminIdentity;
  onIdentitySelect: (identity: AdminIdentity) => void;
  disabled?: boolean;
  className?: string;
}

// Identités prédéfinies pour l'admin (supprimées selon demande)

const AdminIdentitySelector: React.FC<AdminIdentitySelectorProps> = ({
  currentIdentity,
  onIdentitySelect,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customIdentity, setCustomIdentity] = useState<AdminIdentity>({
    firstName: "",
    lastName: "",
    role: "",
  });
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const [savedIdentities, setSavedIdentities] = useState<AdminIdentity[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les identités sauvegardées depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-identities');
    if (saved) {
      try {
        setSavedIdentities(JSON.parse(saved));
      } catch (error) {
        console.error('Erreur lors du chargement des identités:', error);
      }
    }
  }, []);

  // Sauvegarder une nouvelle identité
  const saveIdentity = (identity: AdminIdentity) => {
    const newIdentities = [...savedIdentities];
    const existingIndex = newIdentities.findIndex(
      (saved) => saved.firstName === identity.firstName && saved.lastName === identity.lastName
    );
    
    if (existingIndex >= 0) {
      // Mettre à jour l'identité existante
      newIdentities[existingIndex] = identity;
    } else {
      // Ajouter la nouvelle identité
      newIdentities.push(identity);
    }
    
    // Limiter à 10 identités max
    if (newIdentities.length > 10) {
      newIdentities.shift();
    }
    
    setSavedIdentities(newIdentities);
    localStorage.setItem('admin-identities', JSON.stringify(newIdentities));
  };

  // Calcul de la position optimale du dropdown
  const calculateDropdownPosition = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = 500; // Hauteur estimée du dropdown mise à jour
    
    // Espace disponible en bas
    const spaceBelow = windowHeight - rect.bottom;
    // Espace disponible en haut
    const spaceAbove = rect.top;
    
    // Si pas assez d'espace en bas, ouvrir vers le haut
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  };

  // Effet pour recalculer la position quand le menu s'ouvre
  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
      
      // Recalculer si la fenêtre change de taille
      const handleResize = () => calculateDropdownPosition();
      window.addEventListener('resize', handleResize);
      
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen]);

  const handleIdentitySelect = (identity: AdminIdentity) => {
    onIdentitySelect(identity);
    setIsOpen(false);
    setShowCustomForm(false);
    toast.success(`Identité changée en ${identity.firstName} ${identity.lastName}`);
  };

  const handleCustomIdentitySubmit = () => {
    // Si aucun champ n'est rempli, utiliser l'identité par défaut
    if (!customIdentity.firstName.trim() && !customIdentity.lastName.trim() && !customIdentity.role?.trim()) {
      const defaultIdentity: AdminIdentity = {
        firstName: "Équipe",
        lastName: "Support",
        role: "Staka"
      };
      handleIdentitySelect(defaultIdentity);
      setCustomIdentity({ firstName: "", lastName: "", role: "" });
      return;
    }
    
    // Utiliser les valeurs saisies ou des valeurs par défaut
    const identity: AdminIdentity = {
      firstName: customIdentity.firstName.trim() || "Équipe",
      lastName: customIdentity.lastName.trim() || "Support",
      role: customIdentity.role?.trim() || "Staka"
    };
    
    // Sauvegarder l'identité personnalisée
    if (customIdentity.firstName.trim() || customIdentity.lastName.trim() || customIdentity.role?.trim()) {
      saveIdentity(identity);
    }
    
    handleIdentitySelect(identity);
    setCustomIdentity({ firstName: "", lastName: "", role: "" });
  };

  const getCurrentDisplayName = () => {
    if (currentIdentity) {
      return `${currentIdentity.firstName} ${currentIdentity.lastName}`;
    }
    return "Équipe Support";
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Bouton de sélection */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full px-3 py-2 text-sm
          border border-gray-300 rounded-lg bg-white shadow-sm
          hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {currentIdentity ? 
              `${currentIdentity.firstName.charAt(0)}${currentIdentity.lastName.charAt(0)}` : 
              "ES"
            }
          </div>
          <span className="text-gray-700">{getCurrentDisplayName()}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu déroulant */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ 
              opacity: 0, 
              y: dropdownPosition === 'bottom' ? -10 : 10, 
              scale: 0.95 
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              y: dropdownPosition === 'bottom' ? -10 : 10, 
              scale: 0.95 
            }}
            transition={{ duration: 0.15 }}
            className={`
              absolute left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 
              max-h-96 overflow-y-auto min-w-0 backdrop-blur-sm
              ${dropdownPosition === 'bottom' 
                ? 'top-full mt-2' 
                : 'bottom-full mb-2'
              }
              w-full min-w-80 max-w-md
            `}
            style={{
              maxHeight: dropdownPosition === 'bottom' 
                ? 'min(24rem, calc(100vh - var(--dropdown-top, 0px) - 2rem))'
                : 'min(24rem, calc(var(--dropdown-bottom, 100vh) - 2rem))'
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    Identité d'affichage
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Cette identité sera visible par les clients
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Identité par défaut */}
            <div className="p-4">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleIdentitySelect({ firstName: "Équipe", lastName: "Support", role: "Staka" })}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg
                  hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-200
                  ${!currentIdentity ? "bg-blue-100 border-blue-200" : "bg-gray-50"}
                `}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  ES
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Équipe Support
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    Staka
                  </div>
                </div>
                {!currentIdentity && (
                  <div className="ml-auto">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </motion.button>
            </div>

            {/* Identités sauvegardées */}
            {savedIdentities.length > 0 && (
              <div className="p-4 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-500 px-1 mb-3">
                  Identités récentes
                </div>
                <div className="space-y-2">
                  {savedIdentities.map((identity, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleIdentitySelect(identity)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg
                        hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-200
                        ${currentIdentity?.firstName === identity.firstName && 
                          currentIdentity?.lastName === identity.lastName && 
                          currentIdentity?.role === identity.role ? 
                          "bg-blue-100 border-blue-200" : "bg-gray-50"}
                      `}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {identity.firstName.charAt(0)}{identity.lastName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {identity.firstName} {identity.lastName}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {identity.role}
                        </div>
                      </div>
                      {currentIdentity?.firstName === identity.firstName && 
                       currentIdentity?.lastName === identity.lastName && 
                       currentIdentity?.role === identity.role && (
                        <div className="ml-auto">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Séparateur */}
            <div className="border-t border-gray-100"></div>

            {/* Identité personnalisée */}
            <div className="p-4">
              {!showCustomForm ? (
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg hover:bg-indigo-50 transition-all duration-200 border border-dashed border-indigo-200 hover:border-indigo-300"
                >
                  <div className="w-10 h-10 border-2 border-dashed border-indigo-300 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-50">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Identité personnalisée
                    </div>
                    <div className="text-xs text-gray-500">
                      Créer votre propre identité
                    </div>
                  </div>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200"
                >
                  <div className="text-sm font-semibold text-gray-800">
                    Personnaliser votre identité
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        type="text"
                        placeholder="Prénom (optionnel)"
                        value={customIdentity.firstName}
                        onChange={(e) => setCustomIdentity(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Nom (optionnel)"
                        value={customIdentity.lastName}
                        onChange={(e) => setCustomIdentity(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Rôle (optionnel)"
                        value={customIdentity.role || ""}
                        onChange={(e) => setCustomIdentity(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="text-xs text-gray-500 px-1">
                      Laisser vide pour utiliser "Équipe Support" avec rôle "Staka"
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCustomIdentitySubmit}
                      className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                    >
                      Utiliser
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomForm(false);
                        setCustomIdentity({ firstName: "", lastName: "", role: "" });
                      }}
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminIdentitySelector;