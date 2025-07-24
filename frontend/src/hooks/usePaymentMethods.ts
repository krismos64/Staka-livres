import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

// Types pour les moyens de paiement
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

// API functions
async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await fetch(buildApiUrl("/payment-methods"), {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

async function setDefaultPaymentMethod(id: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(buildApiUrl(`/payment-methods/${id}/default`), {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

async function deletePaymentMethod(id: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(buildApiUrl(`/payment-methods/${id}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

async function createSetupIntent(): Promise<{ clientSecret: string; setupIntentId: string }> {
  const response = await fetch(buildApiUrl("/payment-methods/setup-intent"), {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

async function addPaymentMethod(paymentMethodId: string): Promise<{ success: boolean; message: string; paymentMethod: PaymentMethod }> {
  const response = await fetch(buildApiUrl("/payment-methods"), {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentMethodId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

// Hook pour récupérer les moyens de paiement
export function usePaymentMethods() {
  return useQuery<PaymentMethod[], Error>({
    queryKey: ["paymentMethods"],
    queryFn: fetchPaymentMethods,
    staleTime: 2 * 60 * 1000, // 2 minutes - staleTime selon spécifications
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Hook pour définir un moyen de paiement par défaut
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => {
      // Invalider le cache des moyens de paiement
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: (error) => {
      console.error("❌ [PaymentMethods] Erreur définition par défaut:", error);
    },
  });
}

// Hook pour supprimer un moyen de paiement
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      // Invalider le cache des moyens de paiement
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: (error) => {
      console.error("❌ [PaymentMethods] Erreur suppression:", error);
    },
  });
}

// Hook pour créer un Setup Intent
export function useCreateSetupIntent() {
  return useMutation({
    mutationFn: createSetupIntent,
    onError: (error) => {
      console.error("❌ [PaymentMethods] Erreur création Setup Intent:", error);
    },
  });
}

// Hook pour ajouter un moyen de paiement
export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: () => {
      // Invalider le cache des moyens de paiement
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: (error) => {
      console.error("❌ [PaymentMethods] Erreur ajout moyen de paiement:", error);
    },
  });
}

// Hook pour invalider le cache des moyens de paiement (utile après l'ajout d'un nouveau moyen de paiement)
export function useInvalidatePaymentMethods() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
  };
}