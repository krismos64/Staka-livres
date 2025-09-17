import React, { useState, useEffect } from 'react';
import { X, Cookie, ChevronDown, ChevronUp } from 'lucide-react';
import { usePiwikPro } from './PiwikProProvider';
import { ConsentSettings } from '../../utils/piwikPro';

export const CookieConsentBanner: React.FC = () => {
  const { consentSettings, updateConsent, hasConsent } = usePiwikPro();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [customSettings, setCustomSettings] = useState<ConsentSettings>({
    analytics: true,
    conversion: true,
    marketing: false,
    remarketing: false,
    preferences: true
  });

  useEffect(() => {
    // Vérifie s'il faut afficher la bannière
    const consentDate = localStorage.getItem('piwik_consent_date');
    const hideUntil = localStorage.getItem('piwik_consent_hide_until');
    
    if (!consentDate) {
      // Pas de consentement enregistré
      setShowBanner(true);
    } else if (hideUntil) {
      // Vérifier si la période de masquage est expirée
      const hideUntilDate = new Date(hideUntil);
      if (new Date() > hideUntilDate) {
        setShowBanner(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const fullConsent: ConsentSettings = {
      analytics: true,
      conversion: true,
      marketing: true,
      remarketing: true,
      preferences: true
    };
    updateConsent(fullConsent);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const minimalConsent: ConsentSettings = {
      analytics: false,
      conversion: false,
      marketing: false,
      remarketing: false,
      preferences: false
    };
    updateConsent(minimalConsent);
    setShowBanner(false);
  };

  const handleSaveCustom = () => {
    updateConsent(customSettings);
    setShowBanner(false);
  };

  const handleClose = () => {
    // Cache la bannière pour 30 jours
    const hideUntil = new Date();
    hideUntil.setDate(hideUntil.getDate() + 30);
    localStorage.setItem('piwik_consent_hide_until', hideUntil.toISOString());
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Bannière plus discrète sans overlay */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md bg-white rounded-xl shadow-lg border border-gray-200 z-[9999] max-h-[80vh] overflow-y-auto">
        <div className="p-4">
          {/* Header compact */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <Cookie className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Cookies
                </h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description courte */}
          <p className="text-xs text-gray-600 mb-3">
            Nous utilisons des cookies pour améliorer votre expérience.
          </p>

          {/* Toggle détails */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-3 text-sm"
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Masquer
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Personnaliser
              </>
            )}
          </button>

          {/* Détails des cookies */}
          {showDetails && (
            <div className="space-y-3 mb-4 bg-gray-50 rounded-lg p-3 text-xs">
              {/* Cookies essentiels - toujours activés */}
              <div className="border-b border-gray-200 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xs">
                      Essentiels
                    </h3>
                  </div>
                  <span className="text-xs text-green-600">
                    Toujours actifs
                  </span>
                </div>
              </div>

              {/* Cookies analytiques */}
              <div className="border-b border-gray-200 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <h3 className="font-semibold text-gray-900 text-xs">
                      Analytiques
                    </h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customSettings.analytics}
                      onChange={(e) => setCustomSettings({
                        ...customSettings,
                        analytics: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Cookies de conversion */}
              <div className="border-b border-gray-200 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <h3 className="font-semibold text-gray-900 text-xs">
                      Conversion
                    </h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customSettings.conversion}
                      onChange={(e) => setCustomSettings({
                        ...customSettings,
                        conversion: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Cookies marketing */}
              <div className="border-b border-gray-200 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <h3 className="font-semibold text-gray-900 text-xs">
                      Marketing
                    </h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customSettings.marketing}
                      onChange={(e) => setCustomSettings({
                        ...customSettings,
                        marketing: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Cookies de remarketing */}
              <div className="border-b border-gray-200 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <h3 className="font-semibold text-gray-900 text-xs">
                      Remarketing
                    </h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customSettings.remarketing}
                      onChange={(e) => setCustomSettings({
                        ...customSettings,
                        remarketing: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Cookies de préférences */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <h3 className="font-semibold text-gray-900 text-xs">
                      Préférences
                    </h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customSettings.preferences}
                      onChange={(e) => setCustomSettings({
                        ...customSettings,
                        preferences: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2">
            <button
              onClick={handleRejectAll}
              className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Refuser
            </button>

            {showDetails && (
              <button
                onClick={handleSaveCustom}
                className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Enregistrer
              </button>
            )}

            <button
              onClick={handleAcceptAll}
              className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors flex-1"
            >
              Accepter
            </button>
          </div>

          {/* Lien légal minimal */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <a href="/mentions-legales" className="text-xs text-gray-500 hover:text-blue-600 hover:underline">
              Politique de confidentialité
            </a>
          </div>
        </div>
      </div>
    </>
  );
};