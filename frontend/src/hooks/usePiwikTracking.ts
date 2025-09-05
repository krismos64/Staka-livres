import { useCallback } from 'react';
import { usePiwikPro } from '../components/analytics/PiwikProProvider';
import { EcommerceItem } from '../utils/piwikPro';

// Hook principal pour le tracking Piwik PRO
export const usePiwikTracking = () => {
  const { trackEvent, trackConversion, trackEcommercePurchase } = usePiwikPro();

  // Track les interactions utilisateur
  const trackUserInteraction = useCallback((action: string, label?: string, value?: number) => {
    trackEvent({
      category: 'User Interaction',
      action,
      name: label,
      value
    });
  }, [trackEvent]);

  // Track les clics sur les boutons
  const trackButtonClick = useCallback((buttonName: string, location?: string) => {
    trackEvent({
      category: 'Button Click',
      action: buttonName,
      name: location
    });
  }, [trackEvent]);

  // Track les soumissions de formulaires
  const trackFormSubmit = useCallback((formName: string, success: boolean) => {
    trackEvent({
      category: 'Form',
      action: success ? 'Submit Success' : 'Submit Error',
      name: formName
    });
  }, [trackEvent]);

  // Track les erreurs
  const trackError = useCallback((errorMessage: string, errorLocation?: string) => {
    trackEvent({
      category: 'Error',
      action: 'Error Occurred',
      name: errorMessage,
      customDimensions: {
        location: errorLocation
      }
    });
  }, [trackEvent]);

  // Track les téléchargements de fichiers
  const trackFileDownload = useCallback((fileName: string, fileType: string) => {
    trackEvent({
      category: 'File',
      action: 'Download',
      name: fileName,
      customDimensions: {
        fileType
      }
    });
  }, [trackEvent]);

  // Track les uploads de fichiers
  const trackFileUpload = useCallback((fileName: string, fileSize: number) => {
    trackEvent({
      category: 'File',
      action: 'Upload',
      name: fileName,
      value: fileSize
    });
  }, [trackEvent]);

  // Track les recherches
  const trackSearch = useCallback((searchQuery: string, resultsCount: number) => {
    trackEvent({
      category: 'Search',
      action: 'Search Performed',
      name: searchQuery,
      value: resultsCount
    });
  }, [trackEvent]);

  // Track l'engagement (temps passé, scroll, etc.)
  const trackEngagement = useCallback((type: string, value?: number) => {
    trackEvent({
      category: 'Engagement',
      action: type,
      value
    });
  }, [trackEvent]);

  // Track les partages sociaux
  const trackSocialShare = useCallback((platform: string, content: string) => {
    trackEvent({
      category: 'Social',
      action: 'Share',
      name: platform,
      customDimensions: {
        content
      }
    });
  }, [trackEvent]);

  return {
    trackUserInteraction,
    trackButtonClick,
    trackFormSubmit,
    trackError,
    trackFileDownload,
    trackFileUpload,
    trackSearch,
    trackEngagement,
    trackSocialShare,
    trackEvent,
    trackConversion,
    trackEcommercePurchase
  };
};

// Hook spécifique pour le tracking des campagnes marketing
export const useMarketingTracking = () => {
  const { trackConversion, trackEvent } = usePiwikPro();

  // Track une conversion de campagne
  const trackCampaignConversion = useCallback(
    (campaignName: string, value?: number) => {
      trackConversion(`Campaign: ${campaignName}`, value, 'EUR');
    },
    [trackConversion]
  );

  // Track un clic sur une publicité
  const trackAdClick = useCallback(
    (adSource: 'google' | 'instagram' | 'facebook' | 'other', adName: string) => {
      trackEvent({
        category: 'Advertising',
        action: 'Ad Click',
        name: adName,
        customDimensions: {
          source: adSource
        }
      });
    },
    [trackEvent]
  );

  // Track l'affichage d'une landing page de campagne
  const trackLandingPageView = useCallback(
    (campaignName: string, source: string) => {
      trackEvent({
        category: 'Campaign',
        action: 'Landing Page View',
        name: campaignName,
        customDimensions: {
          source,
          timestamp: new Date().toISOString()
        }
      });
    },
    [trackEvent]
  );

  return {
    trackCampaignConversion,
    trackAdClick,
    trackLandingPageView
  };
};

// Hook spécifique pour le tracking e-commerce (Stripe)
export const useEcommerceTracking = () => {
  const { trackEcommercePurchase, trackEvent, trackConversion } = usePiwikPro();

  // Track une commande complète
  const trackOrderComplete = useCallback(
    (
      orderId: string,
      total: number,
      items: Array<{
        name: string;
        price: number;
        quantity?: number;
        category?: string;
      }>
    ) => {
      // Préparer les items pour Piwik
      const piwikItems: EcommerceItem[] = items.map(item => ({
        sku: item.name.toLowerCase().replace(/\s+/g, '-'),
        name: item.name,
        category: item.category || 'Service',
        price: item.price,
        quantity: item.quantity || 1
      }));

      // Track l'achat
      trackEcommercePurchase(
        {
          orderId,
          grandTotal: total,
          subTotal: total,
          tax: 0,
          shipping: 0,
          discount: 0
        },
        piwikItems
      );

      // Track aussi comme conversion pour les campagnes
      trackConversion('Purchase', total, 'EUR');
    },
    [trackEcommercePurchase, trackConversion]
  );

  // Track l'ajout au panier
  const trackAddToCart = useCallback(
    (itemName: string, price: number, category?: string) => {
      trackEvent({
        category: 'Ecommerce',
        action: 'Add to Cart',
        name: itemName,
        value: price,
        customDimensions: {
          category: category || 'Service'
        }
      });
    },
    [trackEvent]
  );

  // Track la vue d'un produit/service
  const trackProductView = useCallback(
    (productName: string, price: number, category?: string) => {
      trackEvent({
        category: 'Ecommerce',
        action: 'Product View',
        name: productName,
        value: price,
        customDimensions: {
          category: category || 'Service'
        }
      });
    },
    [trackEvent]
  );

  // Track le début du checkout
  const trackCheckoutStart = useCallback(
    (total: number, itemsCount: number) => {
      trackEvent({
        category: 'Ecommerce',
        action: 'Checkout Start',
        value: total,
        customDimensions: {
          itemsCount
        }
      });
    },
    [trackEvent]
  );

  // Track l'abandon de panier
  const trackCartAbandonment = useCallback(
    (total: number, reason?: string) => {
      trackEvent({
        category: 'Ecommerce',
        action: 'Cart Abandoned',
        value: total,
        name: reason
      });
    },
    [trackEvent]
  );

  return {
    trackOrderComplete,
    trackAddToCart,
    trackProductView,
    trackCheckoutStart,
    trackCartAbandonment
  };
};

// Hook pour le tracking des performances
export const usePerformanceTracking = () => {
  const { trackEvent } = usePiwikPro();

  // Track le temps de chargement d'une page
  const trackPageLoadTime = useCallback(
    (pageName: string, loadTime: number) => {
      trackEvent({
        category: 'Performance',
        action: 'Page Load Time',
        name: pageName,
        value: Math.round(loadTime)
      });
    },
    [trackEvent]
  );

  // Track une erreur de performance
  const trackPerformanceIssue = useCallback(
    (issueType: string, details: string) => {
      trackEvent({
        category: 'Performance',
        action: 'Performance Issue',
        name: issueType,
        customDimensions: {
          details
        }
      });
    },
    [trackEvent]
  );

  return {
    trackPageLoadTime,
    trackPerformanceIssue
  };
};