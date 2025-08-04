import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface PaymentSuccessPageProps {
  onBackToApp: () => void;
}

export default function PaymentSuccessPage({
  onBackToApp,
}: PaymentSuccessPageProps) {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId && !processingComplete) {
      setIsProcessing(true);
      
      // En développement local, utiliser la simulation de webhook
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        // Simulation de webhook en développement
        fetch('/api/payments/dev-webhook-simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })
        .then(response => response.json())
        .then(data => {
          console.log('Webhook simulation result:', data);
          if (data.success) {
            setProcessingComplete(true);
          } else {
            setError('Erreur lors du traitement de la commande');
          }
        })
        .catch(error => {
          console.error('Webhook simulation error:', error);
          setError('Erreur de connexion lors du traitement');
        })
        .finally(() => {
          setIsProcessing(false);
        });
      } else {
        // En production, le webhook Stripe réel s'occupe du traitement
        // On marque directement comme traité après un délai de sécurité
        setTimeout(() => {
          setProcessingComplete(true);
          setIsProcessing(false);
        }, 3000);
      }
    }
  }, [sessionId, processingComplete]);

  // Google Ads conversion tracking
  useEffect(() => {
    // N'injecter le script que si le paiement est complètement traité
    if (processingComplete && sessionId) {
      // Vérifier si le script n'est pas déjà injecté
      if (!window.gtag && !document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
        
        // Injecter le script gtag.js de manière asynchrone
        const gtagScript = document.createElement('script');
        gtagScript.async = true;
        gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=AW-958038378';
        document.head.appendChild(gtagScript);

        // Initialiser gtag et configurer Google Ads
        gtagScript.onload = () => {
          window.dataLayer = window.dataLayer || [];
          function gtag(...args: any[]) {
            window.dataLayer?.push(args);
          }
          
          // Attacher gtag à window pour usage global
          window.gtag = gtag;
          
          gtag('js', new Date());
          gtag('config', 'AW-958038378');
          
          console.log('[Google Ads] Tag de conversion injecté');
        };

        // Gérer les erreurs de chargement
        gtagScript.onerror = () => {
          console.error('[Google Ads] Erreur lors du chargement du script');
        };
      } else if (window.gtag) {
        // Si gtag existe déjà, juste logger la conversion
        console.log('[Google Ads] Tag de conversion déjà présent - événement enregistré');
      }
    }
  }, [processingComplete, sessionId]);

  const handleRetryProcessing = () => {
    setError(null);
    setIsProcessing(true);
    
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      // Retry simulation en développement
      fetch('/api/payments/dev-webhook-simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Webhook simulation retry result:', data);
        if (data.success) {
          setProcessingComplete(true);
        } else {
          setError('Erreur lors du traitement de la commande');
        }
      })
      .catch(error => {
        console.error('Webhook simulation retry error:', error);
        setError('Erreur de connexion lors du traitement');
      })
      .finally(() => {
        setIsProcessing(false);
      });
    } else {
      // En production, marquer directement comme réussi
      setTimeout(() => {
        setProcessingComplete(true);
        setIsProcessing(false);
      }, 1000);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-spinner fa-spin text-blue-600 text-3xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Traitement en cours...
          </h1>
          <p className="text-gray-600">
            Nous finalisons votre commande et créons votre compte.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Erreur de traitement
          </h1>
          <p className="text-gray-600 mb-6">
            {error}. Votre paiement a été accepté mais il y a eu un problème lors de la finalisation de votre commande.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetryProcessing}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              Réessayer le traitement
            </button>
            <button
              onClick={onBackToApp}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors duration-200"
            >
              Retourner à l'application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-check-circle text-green-600 text-3xl"></i>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement réussi !
        </h1>

        <p className="text-gray-600 mb-8">
          Votre paiement a été traité avec succès ! Votre compte a été créé et un email d'activation vous a été envoyé. 
          Consultez votre boîte mail pour activer votre compte et accéder à vos commandes.
        </p>

        <button
          onClick={onBackToApp}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors duration-200"
        >
          Retourner à l'application
        </button>
      </div>
    </div>
  );
}
