import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield, ChevronDown, ChevronUp } from 'lucide-react';
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
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" />
      
      {/* Bannière */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-[9999] max-h-[90vh] overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Cookie className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Paramètres de confidentialité
                </h2>
                <p className="text-gray-600 mt-1">
                  Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Description principale */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="mb-2">
                  <strong>Votre confidentialité est importante pour nous.</strong> Nous utilisons Piwik PRO, 
                  une solution d'analyse respectueuse du RGPD, pour comprendre comment vous utilisez notre site 
                  et améliorer nos services.
                </p>
                <p>
                  Les cookies essentiels sont toujours actifs car ils sont nécessaires au bon fonctionnement du site. 
                  Vous pouvez personnaliser vos préférences pour les autres types de cookies.
                </p>
              </div>
            </div>
          </div>

          {/* Toggle détails */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-5 h-5 mr-1" />
                Masquer les détails
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5 mr-1" />
                Personnaliser les préférences
              </>
            )}
          </button>

          {/* Détails des cookies */}
          {showDetails && (
            <div className="space-y-4 mb-6 bg-gray-50 rounded-lg p-4">
              {/* Cookies essentiels - toujours activés */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Cookies essentiels
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Nécessaires au fonctionnement du site (authentification, sécurité, navigation)
                    </p>
                  </div>
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    Toujours actifs
                  </span>
                </div>
              </div>

              {/* Cookies analytiques */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-semibold text-gray-900">
                      Cookies analytiques
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Nous aident à comprendre comment vous utilisez le site (pages visitées, durée, sources de trafic)
                    </p>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Cookies de conversion */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-semibold text-gray-900">
                      Cookies de conversion
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mesurent l'efficacité de nos campagnes publicitaires (Google Ads, Instagram)
                    </p>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Cookies marketing */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-semibold text-gray-900">
                      Cookies marketing
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Permettent de vous proposer des publicités pertinentes sur d'autres sites
                    </p>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Cookies de remarketing */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-semibold text-gray-900">
                      Cookies de remarketing
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Permettent de vous recontacter avec des offres personnalisées
                    </p>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Cookies de préférences */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <h3 className="font-semibold text-gray-900">
                      Cookies de préférences
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mémorisent vos choix et préférences pour améliorer votre expérience
                    </p>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRejectAll}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Refuser tout
            </button>
            
            {showDetails && (
              <button
                onClick={handleSaveCustom}
                className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Enregistrer mes préférences
              </button>
            )}
            
            <button
              onClick={handleAcceptAll}
              className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium flex-1 sm:flex-initial"
            >
              Accepter tout
            </button>
          </div>

          {/* Liens légaux */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              En continuant sur notre site, vous acceptez notre{' '}
              <a href="/mentions-legales" className="text-blue-600 hover:underline">
                politique de confidentialité
              </a>
              . Vous pouvez modifier vos préférences à tout moment dans les paramètres.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};