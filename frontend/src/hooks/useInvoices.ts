import { useQuery, useQueryClient } from "react-query";
import {
  fetchInvoice,
  fetchInvoices,
  InvoiceAPI,
  InvoicesResponse,
} from "../utils/api";

// Hook pour récupérer la liste des factures avec pagination
export function useInvoices(page = 1, limit = 10) {
  return useQuery<InvoicesResponse, Error>(
    ["invoices", page, limit],
    () => fetchInvoices(page, limit),
    {
      keepPreviousData: true, // Garde les données précédentes pendant le chargement
      staleTime: 5 * 60 * 1000, // 5 minutes - les données restent "fraîches"
      cacheTime: 10 * 60 * 1000, // 10 minutes - garde en cache
      retry: 2, // Nombre de tentatives en cas d'erreur
      refetchOnWindowFocus: false, // Ne recharge pas automatiquement au focus
    }
  );
}

// Hook pour récupérer les détails d'une facture spécifique
export function useInvoice(id: string) {
  return useQuery<InvoiceAPI, Error>(["invoice", id], () => fetchInvoice(id), {
    enabled: !!id, // Ne déclenche la requête que si l'id existe
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Hook pour invalider le cache des factures (utile après un paiement)
export function useInvalidateInvoices() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries(["invoices"]);
  };
}

// Hook pour précharger une facture (optimisation UX)
export function usePrefetchInvoice() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery(["invoice", id], () => fetchInvoice(id), {
      staleTime: 5 * 60 * 1000,
    });
  };
}
