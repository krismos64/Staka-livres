import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  piwikPro, 
  ConsentSettings,
  TrackingEvent,
  EcommerceOrder,
  EcommerceItem 
} from '../../utils/piwikPro';

interface PiwikProContextType {
  hasConsent: boolean;
  consentSettings: ConsentSettings;
  updateConsent: (settings: ConsentSettings) => void;
  trackEvent: (event: TrackingEvent) => void;
  trackConversion: (conversionName: string, value?: number, currency?: string) => void;
  trackEcommercePurchase: (order: EcommerceOrder, items: EcommerceItem[]) => void;
}

const PiwikProContext = createContext<PiwikProContextType | undefined>(undefined);

export const usePiwikPro = () => {
  const context = useContext(PiwikProContext);
  if (!context) {
    throw new Error('usePiwikPro must be used within PiwikProProvider');
  }
  return context;
};

interface PiwikProProviderProps {
  children: React.ReactNode;
}

export const PiwikProProvider: React.FC<PiwikProProviderProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [hasConsent, setHasConsent] = useState(false);
  const [consentSettings, setConsentSettings] = useState<ConsentSettings>({
    analytics: false,
    conversion: false,
    marketing: false,
    remarketing: false,
    preferences: false
  });

  // Initialise Piwik PRO au chargement
  useEffect(() => {
    // Attendre que le DOM soit complètement chargé
    const initializeTracking = () => {
      piwikPro.init();

      // Vérifie le consentement stocké
      const storedConsent = localStorage.getItem('piwik_consent');
      if (storedConsent) {
        try {
          const consent = JSON.parse(storedConsent);
          setConsentSettings(consent);
          setHasConsent(consent.analytics);
        } catch (e) {
          console.error('Failed to parse stored consent', e);
        }
      }
    };

    // Si le document est déjà chargé, initialiser immédiatement
    if (document.readyState === 'complete') {
      initializeTracking();
    } else {
      // Sinon, attendre le chargement complet
      window.addEventListener('load', initializeTracking);
      return () => window.removeEventListener('load', initializeTracking);
    }
  }, []);

  // Track les changements de page
  useEffect(() => {
    if (hasConsent) {
      // Track la page vue
      piwikPro.trackPageView(document.title, {
        path: location.pathname,
        userRole: user?.role || 'anonymous',
        userId: user?.id
      });

      // Track des événements spécifiques selon la page
      const pathname = location.pathname;
      
      // Landing page
      if (pathname === '/') {
        piwikPro.trackEvent({
          category: 'Landing',
          action: 'View',
          name: 'Homepage'
        });
      }
      
      // Pages de connexion/inscription
      if (pathname === '/login') {
        piwikPro.trackEvent({
          category: 'Auth',
          action: 'View',
          name: 'Login Page'
        });
      }
      
      if (pathname === '/signup') {
        piwikPro.trackEvent({
          category: 'Auth',
          action: 'View',
          name: 'Signup Page'
        });
      }

      // Pages de paiement
      if (pathname.includes('/payment/success')) {
        // Le tracking de conversion sera fait par le composant PaymentSuccessPage
        piwikPro.trackEvent({
          category: 'Payment',
          action: 'Success Page View'
        });
      }

      if (pathname.includes('/payment/cancel')) {
        piwikPro.trackEvent({
          category: 'Payment',
          action: 'Cancel Page View'
        });
      }

      // Admin
      if (pathname.startsWith('/admin')) {
        piwikPro.trackEvent({
          category: 'Admin',
          action: 'Page View',
          name: pathname
        });
      }

      // Dashboard utilisateur
      if (pathname.startsWith('/app')) {
        const section = pathname.split('/')[2] || 'dashboard';
        piwikPro.trackEvent({
          category: 'User Dashboard',
          action: 'Section View',
          name: section
        });
      }
    }
  }, [location, hasConsent, user]);

  // Définit l'ID utilisateur quand l'utilisateur se connecte
  useEffect(() => {
    if (user && hasConsent) {
      piwikPro.setUserId(user.id);
      piwikPro.setCustomDimensions({
        userRole: user.role,
        userEmail: user.email
      });
    }
  }, [user, hasConsent]);

  // Fonction pour mettre à jour le consentement
  const updateConsent = (settings: ConsentSettings) => {
    setConsentSettings(settings);
    setHasConsent(settings.analytics);
    piwikPro.setConsentTypes(settings);
  };

  // Wrapper pour trackEvent avec vérification du consentement
  const trackEvent = (event: TrackingEvent) => {
    if (hasConsent) {
      piwikPro.trackEvent(event);
    }
  };

  // Wrapper pour trackConversion
  const trackConversion = (conversionName: string, value?: number, currency?: string) => {
    if (hasConsent && consentSettings.conversion) {
      piwikPro.trackConversion(conversionName, value, currency);
    }
  };

  // Wrapper pour trackEcommercePurchase
  const trackEcommercePurchase = (order: EcommerceOrder, items: EcommerceItem[]) => {
    if (hasConsent) {
      piwikPro.trackEcommercePurchase(order, items);
    }
  };

  return (
    <PiwikProContext.Provider 
      value={{
        hasConsent,
        consentSettings,
        updateConsent,
        trackEvent,
        trackConversion,
        trackEcommercePurchase
      }}
    >
      {children}
    </PiwikProContext.Provider>
  );
};