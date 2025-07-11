import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchInvoice,
  fetchInvoices,
  InvoiceAPI,
  InvoicesResponse,
} from "../utils/api";

// Hook pour récupérer la liste des factures avec pagination
export function useInvoices(page = 1, limit = 10) {
  return useQuery<InvoicesResponse, Error>({
    queryKey: ["invoices", page, limit],
    queryFn: () => fetchInvoices(page, limit),
    placeholderData: keepPreviousData, // Garde les données précédentes pendant le chargement
    staleTime: 5 * 60 * 1000, // 5 minutes - les données restent "fraîches"
    retry: 2, // Nombre de tentatives en cas d'erreur
    refetchOnWindowFocus: false, // Ne recharge pas automatiquement au focus
  });
}

// Hook pour récupérer les détails d'une facture spécifique
export function useInvoice(id: string) {
  return useQuery<InvoiceAPI, Error>({
    queryKey: ["invoice", id],
    queryFn: () => fetchInvoice(id),
    enabled: !!id, // Ne déclenche la requête que si l'id existe
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Hook pour invalider le cache des factures (utile après un paiement)
export function useInvalidateInvoices() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };
}

// Hook pour précharger une facture (optimisation UX)
export function usePrefetchInvoice() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ["invoice", id],
      queryFn: () => fetchInvoice(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}
