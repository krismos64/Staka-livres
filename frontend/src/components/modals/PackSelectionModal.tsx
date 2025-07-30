import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../../contexts/AuthContext";
import { buildApiUrl, getAuthHeaders } from "../../utils/api";
import { useToast } from "../layout/ToastProvider";
import { usePricing } from "../landing/hooks/usePricing";
import FileUploadSection, { FileAttachment } from "../forms/FileUploadSection";

// Schéma de validation pour utilisateur connecté (moins de champs requis)
const userProjectSchema = z.object({
  serviceId: z.string().min(1, "Veuillez sélectionner un service"),
  nombrePages: z.number().min(1, "Le nombre de pages doit être au minimum 1").max(1000, "Maximum 1000 pages").optional(),
  titre: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(200),
  description: z.string().optional(),
});

type UserProjectFormData = z.infer<typeof userProjectSchema>;

interface Service {
  id: string;
  nom: string;
  description: string;
  prix: number;
  prixFormate: string;
  dureeEstimee?: string;
}

interface PackSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (data: {
    checkoutUrl: string;
    pendingCommandeId: string;
  }) => void;
}

export default function PackSelectionModal({ 
  isOpen, 
  onClose, 
  onOrderCreated 
}: PackSelectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPageInput, setShowPageInput] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Hook de tarification pour calculer les prix dynamiques
  const { calculatePrice, pricing, setPages } = usePricing({
    initialPages: 150,
    enableDebugLogs: process.env.NODE_ENV === "development",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<UserProjectFormData>({
    resolver: zodResolver(userProjectSchema),
    defaultValues: {
      nombrePages: 150,
      titre: "",
      description: "",
    },
  });

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

  const selectedServiceId = watch("serviceId");
  const nombrePages = watch("nombrePages");
  const selectedService = services?.find(
    (service) => service.id === selectedServiceId
  );
  
  // Déterminer si le service sélectionné est un pack à tarification dégressive
  const isPageBasedService = selectedService?.nom.toLowerCase().includes("standard") || 
    selectedService?.nom.toLowerCase().includes("correction") ||
    selectedService?.nom.toLowerCase().includes("page");
  
  // Calculer le prix dynamique pour les services à la page
  const dynamicPrice = isPageBasedService && nombrePages ? calculatePrice(nombrePages) : null;
  
  // Mettre à jour le nombre de pages dans le hook pricing
  useEffect(() => {
    if (nombrePages && isPageBasedService) {
      setPages(nombrePages);
    }
  }, [nombrePages, isPageBasedService, setPages]);
  
  // Afficher/masquer le champ nombre de pages selon le service
  useEffect(() => {
    setShowPageInput(isPageBasedService);
  }, [isPageBasedService]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
      setAttachedFiles([]);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: UserProjectFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);

    try {
      // Préparer les données avec le prix calculé si applicable
      const orderData = {
        ...data,
        ...(isPageBasedService && nombrePages && {
          nombrePages,
          prixCalcule: dynamicPrice
        }),
        // Données pré-remplies de l'utilisateur connecté
        userId: user.id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
      };

      // Debug: afficher les données avant envoi
      console.log('📝 [PACK MODAL] Données à envoyer:', orderData);
      console.log('📎 [PACK MODAL] Fichiers attachés:', attachedFiles.length);

      // Créer FormData pour supporter les fichiers
      const formData = new FormData();
      
      // Ajouter les données du formulaire
      Object.entries(orderData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`📝 [PACK MODAL] Ajout ${key}:`, value);
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

      const response = await fetch(buildApiUrl("/commandes/create-paid-project"), {
        method: "POST",
        headers: {
          // Ne pas mettre Content-Type pour FormData - le navigateur le définit automatiquement
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [PACK MODAL] Erreur lors de la commande:', { 
          status: response.status, 
          result,
          sentData: orderData,
          filesCount: attachedFiles.length
        });
        
        if (result.details && Array.isArray(result.details)) {
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
            result.message || "Erreur lors de la création du projet",
            { duration: 5000 }
          );
        }
        setIsSubmitting(false);
        return;
      }

      showToast(
        "success",
        "Succès",
        "Projet créé ! Redirection vers le paiement...",
        { duration: 3000 }
      );

      // Fermer le modal
      onClose();

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
      console.error("Erreur lors de la création du projet:", error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Nouveau projet payant
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              disabled={isSubmitting}
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Sélectionnez un pack et créez votre nouveau projet
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Informations utilisateur (affichage uniquement) */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <i className="fas fa-user mr-2 text-blue-600"></i>
              Vos informations
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nom :</span>
                <span className="ml-2 font-medium">{user?.nom} {user?.prenom}</span>
              </div>
              <div>
                <span className="text-gray-600">Email :</span>
                <span className="ml-2 font-medium">{user?.email}</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Ces informations seront utilisées pour la facturation
            </p>
          </div>

          {/* Titre du projet */}
          <div>
            <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-2">
              Titre du projet *
            </label>
            <input
              {...register("titre")}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Mon premier roman, Guide de cuisine..."
              disabled={isSubmitting}
            />
            {errors.titre && (
              <p className="text-red-500 text-sm mt-1">{errors.titre.message}</p>
            )}
          </div>

          {/* Description (optionnelle) */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnelle)
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Décrivez brièvement votre projet..."
              disabled={isSubmitting}
            />
          </div>

          {/* Sélection du service */}
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-2">
              Choisissez votre pack *
            </label>
            {servicesLoading ? (
              <div className="text-center py-4">
                <i className="fas fa-spinner fa-spin text-blue-500"></i>
                <p className="text-gray-600 mt-2">Chargement des services...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {services?.map((service) => (
                  <label
                    key={service.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedServiceId === service.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        {...register("serviceId")}
                        type="radio"
                        value={service.id}
                        className="mr-3 text-blue-600"
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{service.nom}</h4>
                            <p className="text-sm text-gray-600">{service.description}</p>
                            {service.dureeEstimee && (
                              <p className="text-xs text-gray-500 mt-1">
                                <i className="fas fa-clock mr-1"></i>
                                Délai: {service.dureeEstimee}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-blue-600">
                              {dynamicPrice && selectedServiceId === service.id && isPageBasedService 
                                ? `${dynamicPrice.toFixed(2)}€`
                                : service.prixFormate
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {errors.serviceId && (
              <p className="text-red-500 text-sm mt-1">{errors.serviceId.message}</p>
            )}
          </div>

          {/* Nombre de pages (conditionnel) */}
          {showPageInput && (
            <div>
              <label htmlFor="nombrePages" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de pages de votre manuscrit
              </label>
              <input
                {...register("nombrePages", { valueAsNumber: true })}
                type="number"
                min="1"
                max="1000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="150"
                disabled={isSubmitting}
              />
              {errors.nombrePages && (
                <p className="text-red-500 text-sm mt-1">{errors.nombrePages.message}</p>
              )}
              {dynamicPrice && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <i className="fas fa-calculator mr-2"></i>
                    Prix calculé : <span className="font-bold">{dynamicPrice.toFixed(2)}€</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section upload de fichiers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vos documents (optionnel)
            </label>
            <FileUploadSection
              files={attachedFiles}
              onFilesChange={setAttachedFiles}
              maxFileSize={20 * 1024 * 1024} // 20MB
              acceptedFormats={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.zip', '.rar']}
              maxFiles={5}
              className="mb-4"
            />
            <p className="text-xs text-gray-500">
              Vous pourrez également ajouter des fichiers après la création du projet
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !selectedServiceId}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Création...
                </>
              ) : (
                <>
                  <i className="fas fa-credit-card mr-2"></i>
                  Procéder au paiement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}