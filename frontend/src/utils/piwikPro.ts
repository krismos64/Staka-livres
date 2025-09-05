// Configuration et initialisation de Piwik PRO Analytics
// Documentation: https://developers.piwik.pro/en/latest/data_collection/web/javascript_tracking_client/api.html

declare global {
  interface Window {
    dataLayer: any[];
    ppms: {
      tm?: {
        api?: (command: string, ...args: any[]) => void;
      };
      cm?: {
        api?: (command: string, ...args: any[]) => void;
      };
    };
    _paq?: any[];
  }
}

export const PIWIK_CONTAINER_ID = 'a6698d95-0435-4197-a9d4-c5d2e9f0af08';
export const PIWIK_CONTAINER_URL = 'https://staka.containers.piwik.pro/';

export interface PiwikProConfig {
  containerId: string;
  containerUrl: string;
  dataLayerName?: string;
  nonce?: string;
}

export interface ConsentSettings {
  analytics: boolean;
  conversion: boolean;
  marketing: boolean;
  remarketing: boolean;
  preferences: boolean;
}

// Types d'événements trackés
export interface TrackingEvent {
  category: string;
  action: string;
  name?: string;
  value?: number;
  customDimensions?: Record<string, any>;
}

// Types pour le e-commerce tracking
export interface EcommerceItem {
  sku: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
}

export interface EcommerceOrder {
  orderId: string;
  grandTotal: number;
  subTotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
}

class PiwikProTracker {
  private initialized = false;
  private config: PiwikProConfig;
  private consentGiven = false;
  private pendingEvents: (() => void)[] = [];

  constructor() {
    this.config = {
      containerId: PIWIK_CONTAINER_ID,
      containerUrl: PIWIK_CONTAINER_URL,
      dataLayerName: 'dataLayer'
    };
  }

  // Initialise Piwik PRO
  init(customConfig?: Partial<PiwikProConfig>) {
    if (this.initialized) {
      console.warn('Piwik PRO already initialized');
      return;
    }

    // Merge avec la config par défaut
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // Créer le dataLayer si nécessaire
    window.dataLayer = window.dataLayer || [];
    
    // Ajouter l'événement de démarrage
    window.dataLayer.push({
      start: new Date().getTime(),
      event: 'stg.start'
    });

    // Charger le script Piwik PRO
    this.loadScript();
    
    // Initialiser les API ppms
    this.initializePpmsAPIs();

    // Vérifier le consentement stocké
    this.checkStoredConsent();

    this.initialized = true;
  }

  // Charge le script Piwik PRO de manière asynchrone
  private loadScript() {
    const scripts = document.getElementsByTagName('script')[0];
    const piwikScript = document.createElement('script');
    
    const queryParams: string[] = [];
    if (this.config.dataLayerName !== 'dataLayer') {
      queryParams.push(`data_layer_name=${this.config.dataLayerName}`);
    }
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    piwikScript.async = true;
    piwikScript.src = `${this.config.containerUrl}${this.config.containerId}.js${queryString}`;
    
    if (this.config.nonce) {
      piwikScript.nonce = this.config.nonce;
    }

    scripts.parentNode?.insertBefore(piwikScript, scripts);
  }

  // Initialise les APIs ppms pour Tag Manager et Consent Manager
  private initializePpmsAPIs() {
    window.ppms = window.ppms || {};
    const apis = ['tm', 'cm'] as const;
    
    apis.forEach(apiName => {
      window.ppms[apiName] = window.ppms[apiName] || {};
      window.ppms[apiName]!.api = window.ppms[apiName]!.api || function() {
        const args = Array.from(arguments);
        const command = args[0];
        if (typeof command === 'string' && window.dataLayer) {
          window.dataLayer.push({
            event: `ppms.${apiName}:${command}`,
            parameters: args.slice(1)
          });
        }
      };
    });
  }

  // Vérifie le consentement stocké dans localStorage
  private checkStoredConsent() {
    const storedConsent = localStorage.getItem('piwik_consent');
    if (storedConsent) {
      try {
        const consent = JSON.parse(storedConsent);
        this.setConsentTypes(consent);
      } catch (e) {
        console.error('Failed to parse stored consent', e);
      }
    }
  }

  // Définit les types de consentement
  setConsentTypes(consent: ConsentSettings) {
    this.consentGiven = consent.analytics;
    
    // Stocker le consentement
    localStorage.setItem('piwik_consent', JSON.stringify(consent));
    localStorage.setItem('piwik_consent_date', new Date().toISOString());

    // Appliquer le consentement via Consent Manager API
    if (window.ppms?.cm?.api) {
      // Activer/désactiver les différents types de tracking
      Object.entries(consent).forEach(([type, enabled]) => {
        window.ppms.cm!.api!('consent', type, enabled ? 'grant' : 'deny');
      });

      // Si le consentement analytics est donné, traiter les événements en attente
      if (consent.analytics && this.pendingEvents.length > 0) {
        this.pendingEvents.forEach(event => event());
        this.pendingEvents = [];
      }
    }
  }

  // Track un événement personnalisé
  trackEvent(event: TrackingEvent) {
    const trackingFunction = () => {
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'customEvent',
          category: event.category,
          action: event.action,
          name: event.name,
          value: event.value,
          customDimensions: event.customDimensions
        });
      }
    };

    if (this.consentGiven) {
      trackingFunction();
    } else {
      // Stocker l'événement pour l'envoyer après le consentement
      this.pendingEvents.push(trackingFunction);
    }
  }

  // Track une page vue
  trackPageView(pageTitle?: string, customDimensions?: Record<string, any>) {
    if (!this.consentGiven) return;

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'pageView',
        pageTitle: pageTitle || document.title,
        pageUrl: window.location.href,
        customDimensions
      });
    }
  }

  // Track une conversion (utilisé pour Google Ads et campagnes)
  trackConversion(conversionName: string, value?: number, currency?: string) {
    if (!this.consentGiven) return;

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'conversion',
        conversionName,
        conversionValue: value,
        conversionCurrency: currency || 'EUR'
      });
    }
  }

  // Track un achat e-commerce
  trackEcommercePurchase(order: EcommerceOrder, items: EcommerceItem[]) {
    if (!this.consentGiven) return;

    if (window.dataLayer) {
      // Ajouter les items au panier
      items.forEach(item => {
        window.dataLayer.push({
          event: 'ecommerce.addItem',
          ...item
        });
      });

      // Enregistrer la commande
      window.dataLayer.push({
        event: 'ecommerce.purchase',
        ...order
      });
    }
  }

  // Track l'ajout au panier
  trackAddToCart(item: EcommerceItem) {
    if (!this.consentGiven) return;

    this.trackEvent({
      category: 'Ecommerce',
      action: 'Add to Cart',
      name: item.name,
      value: item.price * item.quantity,
      customDimensions: {
        sku: item.sku,
        category: item.category
      }
    });
  }

  // Track la suppression du panier
  trackRemoveFromCart(item: EcommerceItem) {
    if (!this.consentGiven) return;

    this.trackEvent({
      category: 'Ecommerce',
      action: 'Remove from Cart',
      name: item.name,
      value: item.price * item.quantity,
      customDimensions: {
        sku: item.sku,
        category: item.category
      }
    });
  }

  // Track une recherche sur le site
  trackSiteSearch(keyword: string, category?: string, resultsCount?: number) {
    if (!this.consentGiven) return;

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'siteSearch',
        keyword,
        category,
        resultsCount
      });
    }
  }

  // Track un téléchargement de fichier
  trackDownload(fileName: string, fileType?: string) {
    if (!this.consentGiven) return;

    this.trackEvent({
      category: 'Downloads',
      action: 'Download',
      name: fileName,
      customDimensions: {
        fileType
      }
    });
  }

  // Track un clic sur un lien externe
  trackOutboundLink(url: string) {
    if (!this.consentGiven) return;

    this.trackEvent({
      category: 'Outbound Links',
      action: 'Click',
      name: url
    });
  }

  // Track l'engagement utilisateur (scroll, temps passé, etc.)
  trackEngagement(type: 'scroll' | 'time_on_page' | 'interaction', value?: number) {
    if (!this.consentGiven) return;

    this.trackEvent({
      category: 'User Engagement',
      action: type,
      value
    });
  }

  // Track les objectifs (goals) configurés dans Piwik PRO
  trackGoal(goalId: number, customRevenue?: number) {
    if (!this.consentGiven) return;

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'goal',
        goalId,
        customRevenue
      });
    }
  }

  // Définit des dimensions personnalisées pour l'utilisateur
  setCustomDimensions(dimensions: Record<string, any>) {
    if (!this.consentGiven) return;

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'setCustomDimensions',
        dimensions
      });
    }
  }

  // Définit l'ID utilisateur pour le tracking cross-device
  setUserId(userId: string) {
    if (!this.consentGiven) return;

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'setUserId',
        userId
      });
    }
  }

  // Réinitialise le consentement (pour la bannière cookies)
  resetConsent() {
    localStorage.removeItem('piwik_consent');
    localStorage.removeItem('piwik_consent_date');
    this.consentGiven = false;
    this.pendingEvents = [];
  }

  // Vérifie si le consentement a été donné
  hasConsent(): boolean {
    return this.consentGiven;
  }

  // Récupère la date du dernier consentement
  getConsentDate(): Date | null {
    const date = localStorage.getItem('piwik_consent_date');
    return date ? new Date(date) : null;
  }
}

// Export d'une instance unique
export const piwikPro = new PiwikProTracker();

// Helper functions pour faciliter l'utilisation
export const trackEvent = (event: TrackingEvent) => piwikPro.trackEvent(event);
export const trackPageView = (pageTitle?: string, customDimensions?: Record<string, any>) => 
  piwikPro.trackPageView(pageTitle, customDimensions);
export const trackConversion = (conversionName: string, value?: number, currency?: string) => 
  piwikPro.trackConversion(conversionName, value, currency);
export const trackEcommercePurchase = (order: EcommerceOrder, items: EcommerceItem[]) => 
  piwikPro.trackEcommercePurchase(order, items);
export const setUserId = (userId: string) => piwikPro.setUserId(userId);