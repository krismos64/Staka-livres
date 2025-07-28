import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders, buildApiUrl } from "../utils/api";

// Interface pour les données de création de commande
export interface CreateCommandeData {
  titre: string;
  description?: string;
  fichierUrl?: string;
  pack?: string;
  type?: string;
  pages?: number;
}

// Interface pour la réponse de création de commande
export interface CommandeResponse {
  message: string;
  commande: {
    id: string;
    titre: string;
    description: string | null;
    fichierUrl: string | null;
    statut: string;
    paymentStatus?: string | null;
    stripeSessionId?: string | null;
    createdAt: string;
    updatedAt?: string;
  };
}

// Fonction pour créer une commande
const createCommande = async (data: CreateCommandeData): Promise<CommandeResponse> => {
  const response = await fetch(buildApiUrl("/commandes"), {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
};

// Hook pour créer une commande
export const useCreateCommande = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCommande,
    onSuccess: (data) => {
      console.log("✅ Commande créée avec succès:", data.commande?.id || data.id);
      
      // Invalider les caches liés aux commandes et projets
      queryClient.invalidateQueries(["commandes"]);
      queryClient.invalidateQueries(["projects"]);
    },
    onError: (error: Error) => {
      console.error("❌ Erreur lors de la création de la commande:", error.message);
    },
  });
};