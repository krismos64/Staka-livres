import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useToasts } from "../../utils/toast";
import { buildApiUrl } from "../../utils/api";

// Schéma de validation Zod
const guestOrderSchema = z.object({
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères").max(100),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Format d'email invalide").max(255),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(100),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  serviceId: z.string().min(1, "Veuillez sélectionner un service"),
  consentementRgpd: z.boolean().refine(val => val === true, "Le consentement RGPD est obligatoire")
});

type GuestOrderFormData = z.infer<typeof guestOrderSchema>;

interface Service {
  id: string;
  nom: string;
  description: string;
  prix: number;
  prixFormate: string;
  dureeEstimee?: string;
}

interface GuestOrderFormProps {
  onOrderCreated?: (data: { checkoutUrl: string; pendingCommandeId: string }) => void;
  className?: string;
}

export default function GuestOrderForm({ onOrderCreated, className = "" }: GuestOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToasts();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<GuestOrderFormData>({
    resolver: zodResolver(guestOrderSchema),
    defaultValues: {
      consentementRgpd: false
    }
  });

  // Récupérer la liste des services disponibles
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['tarifs'],
    queryFn: async () => {
      const response = await fetch(buildApiUrl('/tarifs'));
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des services');
      }
      const data = await response.json();
      return data.tarifs || [];
    }
  });

  const selectedServiceId = watch('serviceId');
  const selectedService = services?.find(service => service.id === selectedServiceId);

  const onSubmit = async (data: GuestOrderFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(buildApiUrl('/public/order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          showToast({
            type: 'error',
            message: 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.',
            duration: 6000
          });
        } else if (result.details && Array.isArray(result.details)) {
          // Erreurs de validation Zod
          const errorMessages = result.details.map((error: any) => error.message).join(', ');
          showToast({
            type: 'error',
            message: `Erreurs de validation : ${errorMessages}`,
            duration: 6000
          });
        } else {
          showToast({
            type: 'error',
            message: result.message || 'Erreur lors de la création de la commande',
            duration: 5000
          });
        }
        return;
      }

      showToast({
        type: 'success',
        message: 'Commande créée ! Redirection vers le paiement...',
        duration: 3000
      });

      // Redirection vers Stripe Checkout
      if (result.checkoutUrl) {
        if (onOrderCreated) {
          onOrderCreated({
            checkoutUrl: result.checkoutUrl,
            pendingCommandeId: result.pendingCommandeId
          });
        } else {
          // Redirection directe si pas de callback
          window.location.href = result.checkoutUrl;
        }
      }

    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      showToast({
        type: 'error',
        message: 'Erreur de connexion. Veuillez réessayer.',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 ${className}`}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Commandez votre correction
        </h2>
        <p className="text-gray-600">
          Remplissez ce formulaire pour créer votre commande et procéder au paiement sécurisé.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations personnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
              Prénom *
            </label>
            <input
              type="text"
              id="prenom"
              {...register('prenom')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.prenom ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Votre prénom"
            />
            {errors.prenom && (
              <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              id="nom"
              {...register('nom')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nom ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Votre nom"
            />
            {errors.nom && (
              <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
            )}
          </div>
        </div>

        {/* Email et mot de passe */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Adresse email *
          </label>
          <input
            type="email"
            id="email"
            {...register('email')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="votre@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Cette adresse sera utilisée pour créer votre compte et recevoir les notifications.
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe *
          </label>
          <input
            type="password"
            id="password"
            {...register('password')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Votre mot de passe"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Minimum 8 caractères. Vous utiliserez ce mot de passe pour vous connecter après activation.
          </p>
        </div>

        {/* Informations de contact optionnelles */}
        <div>
          <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            type="tel"
            id="telephone"
            {...register('telephone')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+33 1 23 45 67 89"
          />
        </div>

        <div>
          <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-1">
            Adresse
          </label>
          <textarea
            id="adresse"
            {...register('adresse')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Votre adresse complète"
          />
        </div>

        {/* Sélection du service */}
        <div>
          <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-1">
            Service de correction *
          </label>
          <select
            id="serviceId"
            {...register('serviceId')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.serviceId ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={servicesLoading}
          >
            <option value="">Sélectionnez un service...</option>
            {services?.map((service) => (
              <option key={service.id} value={service.id}>
                {service.nom} - {service.prixFormate}
                {service.dureeEstimee && ` (${service.dureeEstimee})`}
              </option>
            ))}
          </select>
          {errors.serviceId && (
            <p className="mt-1 text-sm text-red-600">{errors.serviceId.message}</p>
          )}
          {servicesLoading && (
            <p className="mt-1 text-sm text-gray-500">Chargement des services...</p>
          )}
        </div>

        {/* Détails du service sélectionné */}
        {selectedService && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">{selectedService.nom}</h3>
            <p className="text-sm text-blue-800 mb-2">{selectedService.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-blue-900">{selectedService.prixFormate}</span>
              {selectedService.dureeEstimee && (
                <span className="text-sm text-blue-700">⏱️ {selectedService.dureeEstimee}</span>
              )}
            </div>
          </div>
        )}

        {/* Consentement RGPD */}
        <div className="space-y-3">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="consentementRgpd"
              {...register('consentementRgpd')}
              className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                errors.consentementRgpd ? 'border-red-500' : ''
              }`}
            />
            <label htmlFor="consentementRgpd" className="ml-2 block text-sm text-gray-700">
              J'accepte le traitement de mes données personnelles conformément à la{' '}
              <a href="/pages/politique-de-confidentialite" target="_blank" className="text-blue-600 hover:underline">
                politique de confidentialité
              </a>{' '}
              et aux{' '}
              <a href="/pages/conditions-generales" target="_blank" className="text-blue-600 hover:underline">
                conditions générales d'utilisation
              </a>
              . *
            </label>
          </div>
          {errors.consentementRgpd && (
            <p className="text-sm text-red-600">{errors.consentementRgpd.message}</p>
          )}
        </div>

        {/* Informations importantes */}
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">📋 Processus de commande</h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Validation de vos informations et redirection vers le paiement sécurisé</li>
            <li>Après paiement confirmé, réception d'un email d'activation de compte</li>
            <li>Activation de votre compte via le lien reçu par email (48h max)</li>
            <li>Accès à votre espace client pour suivre votre projet</li>
          </ol>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={isSubmitting || servicesLoading}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Traitement en cours...
            </span>
          ) : (
            `Procéder au paiement${selectedService ? ` (${selectedService.prixFormate})` : ''}`
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          🔒 Paiement sécurisé par Stripe • Aucun frais caché • Satisfaction garantie
        </p>
      </form>
    </div>
  );
}