import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { buildApiUrl } from "../../utils/api";
import { useToast } from "../layout/ToastProvider";
import { usePricing } from "../landing/hooks/usePricing";
import FileUploadSection, { FileAttachment } from "./FileUploadSection";

// Schéma de validation Zod - Formulaire simplifié sans adresse ni mot de passe
const createGuestOrderSchema = (services: Service[] = []) => z.object({
  prenom: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Format d'email invalide").max(255),
  telephone: z.string().optional(),
  serviceId: z.string().min(1, "Veuillez sélectionner un service"),
  nombrePages: z.number().min(1, "Le nombre de pages doit être au minimum 1").max(1000, "Maximum 1000 pages").optional(),
  titre: z.string().max(200, "Le titre ne peut pas dépasser 200 caractères").optional(),
  description: z.string().max(2000, "La description ne peut pas dépasser 2000 caractères").optional(),
  consentementRgpd: z
    .boolean()
    .refine((val) => val === true, "Le consentement RGPD est obligatoire"),
}).refine((data) => {
  // Vérifier si le service sélectionné nécessite un nombre de pages
  const selectedService = services.find(s => s.id === data.serviceId);
  const isPageBasedService = selectedService?.nom.toLowerCase().includes("à la page") ||
    selectedService?.nom.toLowerCase().includes("tarification dégressive") ||
    selectedService?.prixFormate?.includes("€/page") ||
    selectedService?.nom.toLowerCase().includes("2€/page") ||
    selectedService?.nom.toLowerCase().includes("intégral") ||
    (selectedService?.nom.toLowerCase().includes("correction") && 
     selectedService?.nom.toLowerCase().includes("manuscrit") &&
     selectedService?.nom.toLowerCase().includes("page"));
  
  // Si c'est un service à la page, le nombre de pages est obligatoire
  if (isPageBasedService && !data.nombrePages) {
    return false;
  }
  return true;
}, {
  message: "Le nombre de pages est obligatoire pour ce service",
  path: ["nombrePages"]
});

type GuestOrderFormData = z.infer<ReturnType<typeof createGuestOrderSchema>>;

interface Service {
  id: string;
  nom: string;
  description: string;
  prix: number;
  prixFormate: string;
  dureeEstimee?: string;
}

interface GuestOrderFormProps {
  onOrderCreated?: (data: {
    checkoutUrl: string;
    pendingCommandeId: string;
  }) => void;
  className?: string;
}

export default function GuestOrderForm({
  onOrderCreated,
  className = "",
}: GuestOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const defaultPackSlug = searchParams.get("pack") ?? undefined;
  const preCalculatedPages = searchParams.get("pages") ? parseInt(searchParams.get("pages")!) : undefined;
  const preCalculatedPrice = searchParams.get("calculatedPrice") ? parseFloat(searchParams.get("calculatedPrice")!) : undefined;
  const [showPageInput, setShowPageInput] = useState(false);
  
  // Hook de tarification pour calculer les prix dynamiques
  const { calculatePrice, pricing, setPages } = usePricing({
    initialPages: preCalculatedPages || 150,
    enableDebugLogs: process.env.NODE_ENV === "development",
  });
  // Utilitaire pour générer un slug à partir du nom
  const getSlug = (nom: string) =>
    nom
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

  // Récupérer la liste des services disponibles
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["tarifs"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/tarifs"));
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des services");
      }
      const data = await response.json();
      return data.data || [];
    },
  });

  // Créer le schéma dynamiquement avec les services chargés
  const guestOrderSchema = React.useMemo(() => createGuestOrderSchema(services || []), [services]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    clearErrors,
  } = useForm<GuestOrderFormData>({
    resolver: zodResolver(guestOrderSchema),
    defaultValues: {
      consentementRgpd: false,
      nombrePages: preCalculatedPages || 150,
    },
  });

  // Préselectionner le service si le slug correspond
  useEffect(() => {
    if (services && defaultPackSlug) {
      const found = services.find((s) => getSlug(s.nom) === defaultPackSlug);
      if (found) {
        setValue("serviceId", found.id, { shouldValidate: true });
      }
    }
  }, [services, defaultPackSlug, setValue]);

  const selectedServiceId = watch("serviceId");
  const nombrePages = watch("nombrePages");
  const selectedService = services?.find(
    (service) => service.id === selectedServiceId
  );
  
  // Déterminer si le service sélectionné est un pack à tarification dégressive
  // Seuls les services explicitement conçus pour la tarification à la page
  const isPageBasedService = selectedService?.nom.toLowerCase().includes("à la page") ||
    selectedService?.nom.toLowerCase().includes("tarification dégressive") ||
    selectedService?.prixFormate?.includes("€/page") ||
    selectedService?.nom.toLowerCase().includes("2€/page") ||
    selectedService?.nom.toLowerCase().includes("intégral") ||
    (selectedService?.nom.toLowerCase().includes("correction") && 
     selectedService?.nom.toLowerCase().includes("manuscrit") &&
     selectedService?.nom.toLowerCase().includes("page"));
  
  
  // Calculer le prix dynamique pour les services à la page
  // Utiliser le prix pré-calculé si disponible, sinon calculer
  const dynamicPrice = isPageBasedService && nombrePages ? 
    (preCalculatedPrice && nombrePages === preCalculatedPages ? preCalculatedPrice : calculatePrice(nombrePages)) 
    : null;
  
  // Mettre à jour le nombre de pages dans le hook pricing
  useEffect(() => {
    if (nombrePages && isPageBasedService) {
      setPages(nombrePages);
      // Nettoyer l'erreur de validation si l'utilisateur a saisi un nombre de pages
      if (errors.nombrePages) {
        clearErrors("nombrePages");
      }
    }
  }, [nombrePages, isPageBasedService, setPages, errors.nombrePages, clearErrors]);
  
  // Afficher/masquer le champ nombre de pages selon le service
  useEffect(() => {
    setShowPageInput(Boolean(isPageBasedService));
  }, [isPageBasedService]);

  const onSubmit = async (data: GuestOrderFormData) => {
    setIsSubmitting(true);

    try {
      // Préparer les données avec le prix calculé si applicable
      const orderData = {
        ...data,
        ...(isPageBasedService && nombrePages && {
          nombrePages,
          prixCalcule: dynamicPrice
        })
      };

      // Créer FormData pour supporter les fichiers
      const formData = new FormData();
      
      // Ajouter les données du formulaire
      Object.entries(orderData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Ajouter les fichiers
      attachedFiles.forEach((fileAttachment, index) => {
        formData.append(`files`, fileAttachment.file);
        formData.append(`fileMetadata_${index}`, JSON.stringify({
          title: fileAttachment.title,
          description: fileAttachment.description,
          originalName: fileAttachment.file.name,
        }));
      });
      
      const response = await fetch(buildApiUrl("/public/order"), {
        method: "POST",
        body: formData, // Pas de Content-Type header pour FormData
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Erreur lors de la commande:', { status: response.status, result });
        
        if (response.status === 409) {
          console.log('🔔 Affichage du toast pour erreur 409');
          showToast(
            "error",
            "Email déjà utilisé",
            "Un compte existe déjà avec cette adresse email. Veuillez utiliser une autre adresse ou vous connecter à votre compte existant.",
            { duration: 8000 }
          );
        } else if (result.details && Array.isArray(result.details)) {
          // Erreurs de validation Zod
          const errorMessages = result.details
            .map((error: any) => error.message)
            .join(", ");
          showToast(
            "error",
            "Erreurs de validation",
            `Erreurs de validation : ${errorMessages}`,
            { duration: 6000 }
          );
        } else {
          showToast(
            "error",
            "Erreur",
            result.message || "Erreur lors de la création de la commande",
            { duration: 5000 }
          );
        }
        setIsSubmitting(false);
        return;
      }

      showToast(
        "success",
        "Succès",
        "Commande créée ! Redirection vers le paiement...",
        { duration: 3000 }
      );

      // Redirection vers Stripe Checkout
      if (result.checkoutUrl) {
        if (onOrderCreated) {
          onOrderCreated({
            checkoutUrl: result.checkoutUrl,
            pendingCommandeId: result.pendingCommandeId,
          });
        } else {
          // Redirection directe si pas de callback
          window.location.href = result.checkoutUrl;
        }
      }
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error);
      showToast(
        "error",
        "Erreur de connexion",
        "Erreur de connexion. Veuillez réessayer.",
        { duration: 5000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 ${className}`}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Commandez votre correction
        </h2>
        <p className="text-gray-600">
          Remplissez ce formulaire pour créer votre commande et procéder au
          paiement sécurisé.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations personnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="prenom"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Prénom *
            </label>
            <input
              type="text"
              id="prenom"
              {...register("prenom")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.prenom ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Votre prénom"
            />
            {errors.prenom && (
              <p className="mt-1 text-sm text-red-600">
                {errors.prenom.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="nom"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom *
            </label>
            <input
              type="text"
              id="nom"
              {...register("nom")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nom ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Votre nom"
            />
            {errors.nom && (
              <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Adresse email *
          </label>
          <input
            type="email"
            id="email"
            {...register("email")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="votre@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Cette adresse sera utilisée pour créer votre compte et recevoir les
            notifications. Si vous avez déjà un compte, veuillez vous connecter.
          </p>
        </div>

        {/* Informations de contact optionnelles */}
        <div>
          <label
            htmlFor="telephone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Téléphone
          </label>
          <input
            type="tel"
            id="telephone"
            {...register("telephone")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+33 1 23 45 67 89"
          />
          <p className="mt-1 text-xs text-gray-500">
            L'adresse de facturation sera collectée lors du paiement sécurisé.
          </p>
        </div>

        {/* Sélection du service */}
        <div>
          <label
            htmlFor="serviceId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Service de correction *
          </label>
          <select
            id="serviceId"
            {...register("serviceId")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.serviceId ? "border-red-500" : "border-gray-300"
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
            <p className="mt-1 text-sm text-red-600">
              {errors.serviceId.message}
            </p>
          )}
          {servicesLoading && (
            <p className="mt-1 text-sm text-gray-500">
              Chargement des services...
            </p>
          )}
        </div>

        {/* Champ nombre de pages (conditionnel) */}
        {showPageInput && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            {preCalculatedPages && (
              <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded text-sm text-blue-800">
                <i className="fas fa-calculator mr-1"></i>
                <strong>Valeurs pré-calculées</strong> depuis le calculateur de prix
              </div>
            )}
            <label
              htmlFor="nombrePages"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nombre de pages de votre manuscrit {isPageBasedService ? '*' : ''}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                id="nombrePages"
                {...register("nombrePages", { valueAsNumber: true })}
                min="1"
                max="1000"
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nombrePages ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="150"
              />
              <span className="text-gray-500 text-sm">pages</span>
            </div>
            {errors.nombrePages && (
              <p className="mt-1 text-sm text-red-600">
                {errors.nombrePages.message}
              </p>
            )}
            {isPageBasedService && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-800 font-medium mb-1">⚠️ Nombre de pages obligatoire pour calculer le prix</p>
              </div>
            )}
            <div className="mt-2 text-xs text-yellow-800">
              <p>📍 Tarification dégressive :</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>10 premières pages : <strong>GRATUITES</strong></li>
                <li>Pages 11 à 300 : <strong>2€ par page</strong></li>
                <li>Au-delà de 300 pages : <strong>1€ par page</strong></li>
              </ul>
            </div>
          </div>
        )}

        {/* Détails du service sélectionné */}
        {selectedService && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">
              {selectedService.nom}
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              {selectedService.description}
            </p>
            
            {/* Calcul de prix dynamique pour les services à la page */}
            {isPageBasedService && nombrePages && dynamicPrice !== null ? (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">💰 Calcul de votre tarif</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">10 premières pages</span>
                      <span className="font-bold text-green-600">GRATUIT</span>
                    </div>
                    
                    {pricing.tier2Pages > 0 && (
                      <div className="flex justify-between">
                        <span>Pages 11-{Math.min(nombrePages, 300)} ({pricing.tier2Pages} pages)</span>
                        <span className="font-bold">{pricing.tier2}€</span>
                      </div>
                    )}
                    
                    {pricing.tier3Pages > 0 && (
                      <div className="flex justify-between">
                        <span>Pages 301+ ({pricing.tier3Pages} pages)</span>
                        <span className="font-bold">{pricing.tier3}€</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-blue-600">{dynamicPrice}€</span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Soit {pricing.avgPricePerPage}€ par page en moyenne
                    </div>
                  </div>
                </div>
                
                {nombrePages > 10 && (
                  <div className="bg-green-100 text-green-800 px-3 py-2 rounded text-sm">
                    💰 Vous économisez {pricing.savings}€ grâce aux 10 pages gratuites !
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-blue-900">
                  {selectedService.prixFormate}
                </span>
                {selectedService.dureeEstimee && (
                  <span className="text-sm text-blue-700">
                    ⏱️ {selectedService.dureeEstimee}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description du projet */}
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <i className="fas fa-edit mr-2 text-green-600"></i>
              Décrivez votre projet
              <span className="ml-2 text-sm font-normal text-gray-500">(optionnel)</span>
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
              {/* Titre du projet */}
              <div>
                <label
                  htmlFor="titre"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Titre de votre projet
                </label>
                <input
                  type="text"
                  id="titre"
                  {...register("titre")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.titre ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Exemple : Mon premier roman, Mémoire de fin d'études..."
                />
                {errors.titre && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.titre.message}
                  </p>
                )}
              </div>

              {/* Description du projet */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description du projet
                </label>
                <textarea
                  id="description"
                  {...register("description")}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Genre, thématique, public cible, délais particuliers..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section des pièces jointes */}
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <i className="fas fa-paperclip mr-2 text-blue-600"></i>
              Pièces jointes
              <span className="ml-2 text-sm font-normal text-gray-500">(optionnel)</span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Ajoutez vos documents à corriger ou toute information complémentaire. 
              Vous pourrez également les envoyer plus tard via votre espace client.
            </p>
            
            <FileUploadSection
              files={attachedFiles}
              onFilesChange={setAttachedFiles}
              maxFileSize={50 * 1024 * 1024} // 50MB
              maxFiles={10}
              className="mt-4"
            />
          </div>
        </div>

        {/* Consentement RGPD */}
        <div className="space-y-3">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="consentementRgpd"
              {...register("consentementRgpd")}
              className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                errors.consentementRgpd ? "border-red-500" : ""
              }`}
            />
            <label
              htmlFor="consentementRgpd"
              className="ml-2 block text-sm text-gray-700"
            >
              J'accepte le traitement de mes données personnelles conformément à
              la{" "}
              <a
                href="/pages/politique-de-confidentialite"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                politique de confidentialité
              </a>{" "}
              et aux{" "}
              <a
                href="/pages/conditions-generales"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                conditions générales d'utilisation
              </a>
              . *
            </label>
          </div>
          {errors.consentementRgpd && (
            <p className="text-sm text-red-600">
              {errors.consentementRgpd.message}
            </p>
          )}
        </div>

        {/* Informations importantes */}
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">
            📋 Processus de commande
          </h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>
              Validation de vos informations et redirection vers le paiement
              sécurisé (adresse collectée automatiquement)
            </li>
            <li>
              Après paiement confirmé, réception d'un email d'activation de
              compte
            </li>
            <li>
              Activation de votre compte via le lien reçu par email (48h max)
            </li>
            <li>Définition de votre mot de passe lors de la première connexion</li>
            <li>Accès à votre espace client pour suivre votre projet</li>
          </ol>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={isSubmitting || servicesLoading}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Traitement en cours...
            </span>
          ) : (
            `Procéder au paiement${
              isPageBasedService && dynamicPrice !== null 
                ? ` (${dynamicPrice}€)` 
                : selectedService 
                ? ` (${selectedService.prixFormate})` 
                : ""
            }`
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          🔒 Paiement sécurisé par Stripe • Aucun frais caché • Satisfaction
          garantie
        </p>
      </form>
    </div>
  );
}
