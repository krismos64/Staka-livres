import { useMutation, useQuery, useQueryClient } from "react-query";
import { adminAPI } from "../utils/adminAPI";

/**
 * Hook pour la gestion des factures dans l'espace admin
 *
 * @example
 * ```tsx
 * // Dans un composant admin
 * function AdminFactures() {
 *   const [page, setPage] = useState(1);
 *   const [search, setSearch] = useState('');
 *
 *   // Récupérer la liste des factures
 *   const { data: facturesData, isLoading, error } = useAdminFactures({
 *     page,
 *     limit: 10,
 *     search,
 *     status: 'PAID'
 *   });
 *
 *   // Récupérer les statistiques
 *   const { data: stats } = useFactureStats();
 *
 *   // Mutations
 *   const downloadMutation = useDownloadFacture();
 *   const reminderMutation = useSendReminder();
 *   const deleteMutation = useDeleteFacture();
 *
 *   const handleDownload = (id: string) => {
 *     downloadMutation.mutate(id);
 *   };
 *
 *   const handleSendReminder = (id: string) => {
 *     reminderMutation.mutate(id);
 *   };
 *
 *   const handleDelete = (id: string) => {
 *     if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
 *       deleteMutation.mutate(id);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {stats && <FactureStatsCard stats={stats} />}
 *       {facturesData?.data?.map((facture) => (
 *         <FactureCard
 *           key={facture.id}
 *           facture={facture}
 *           onDownload={() => handleDownload(facture.id)}
 *           onSendReminder={() => handleSendReminder(facture.id)}
 *           onDelete={() => handleDelete(facture.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 */

// Interface pour les paramètres de pagination et filtres
export interface AdminFacturesParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Hook principal pour lister les factures avec pagination et filtres
export function useAdminFactures(params: AdminFacturesParams) {
  const queryClient = useQueryClient();

  return useQuery(
    ["admin-factures", params],
    async () => {
      const response = await adminAPI.getFactures(
        params.page,
        params.limit,
        params.status as any,
        params.search,
        params.sortBy,
        params.sortOrder
      );
      return response;
    },
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );
}

// Hook pour récupérer les statistiques des factures
export function useFactureStats() {
  return useQuery("admin-facture-stats", () => adminAPI.getFactureStats(), {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Hook pour récupérer les détails d'une facture spécifique
export function useFactureDetails(id: string) {
  return useQuery(["admin-facture", id], () => adminAPI.getFactureById(id), {
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Hook pour télécharger le PDF d'une facture
export function useDownloadFacture() {
  return useMutation((id: string) => adminAPI.getFacturePdf(id), {
    onSuccess: (blob: Blob, id: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${id}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error: any) => {
      console.error("❌ Erreur lors du téléchargement:", error);
    },
  });
}

// Hook pour envoyer un rappel de facture
export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation((id: string) => adminAPI.sendFactureReminder(id), {
    onSuccess: () => {
      // Invalider le cache des factures pour refléter les changements
      queryClient.invalidateQueries("admin-factures");
      queryClient.invalidateQueries("admin-facture-stats");
    },
    onError: (error: any) => {
      console.error("❌ Erreur lors de l'envoi du rappel:", error);
    },
  });
}

// Hook pour supprimer une facture
export function useDeleteFacture() {
  const queryClient = useQueryClient();

  return useMutation((id: string) => adminAPI.deleteFacture(id), {
    onSuccess: () => {
      // Invalider le cache des factures et des stats
      queryClient.invalidateQueries("admin-factures");
      queryClient.invalidateQueries("admin-facture-stats");
    },
    onError: (error: any) => {
      console.error("❌ Erreur lors de la suppression:", error);
    },
  });
}

// Hook pour mettre à jour le statut d'une facture
export function useUpdateFactureStatus() {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, statut }: { id: string; statut: any }) =>
      adminAPI.updateFacture(id, { statut }),
    {
      onSuccess: (_, { id }) => {
        // Invalider le cache pour cette facture spécifique et la liste
        queryClient.invalidateQueries(["admin-facture", id]);
        queryClient.invalidateQueries("admin-factures");
        queryClient.invalidateQueries("admin-facture-stats");
      },
      onError: (error: any) => {
        console.error("❌ Erreur lors de la mise à jour du statut:", error);
      },
    }
  );
}

// Hook utilitaire pour invalider manuellement le cache des factures
export function useInvalidateFactures() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries("admin-factures");
      queryClient.invalidateQueries("admin-facture-stats");
    },
    invalidateFacture: (id: string) => {
      queryClient.invalidateQueries(["admin-facture", id]);
    },
    invalidateList: () => {
      queryClient.invalidateQueries("admin-factures");
    },
    invalidateStats: () => {
      queryClient.invalidateQueries("admin-facture-stats");
    },
  };
}

// Hook pour précharger une facture (optimisation UX)
export function usePrefetchFacture() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery(
      ["admin-facture", id],
      () => adminAPI.getFactureById(id),
      {
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    );
  };
}
