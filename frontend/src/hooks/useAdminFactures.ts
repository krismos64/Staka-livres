import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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

  return useQuery({
    queryKey: ["admin-factures", params],
    queryFn: async () => {
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
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Hook pour récupérer les statistiques des factures
export function useFactureStats() {
  return useQuery({
    queryKey: ["admin-facture-stats"],
    queryFn: () => adminAPI.getFactureStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Hook pour récupérer les détails d'une facture spécifique
export function useFactureDetails(id: string) {
  return useQuery({
    queryKey: ["admin-facture", id],
    queryFn: () => adminAPI.getFactureById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Hook pour télécharger le PDF d'une facture
export function useDownloadFacture() {
  return useMutation({
    mutationFn: (id: string) => adminAPI.getFacturePdf(id),
    onSuccess: (
      response: { message: string; factureNumber: string; info: string },
      id: string
    ) => {
      // Afficher un message à l'utilisateur au lieu de télécharger
      alert(
        `${response.message}\n\nFacture: ${response.factureNumber}\n\n${response.info}`
      );
      console.log("📄 Réponse PDF:", response);
    },
    onError: (error: any) => {
      console.error("❌ Erreur lors du téléchargement:", error);
    },
  });
}

// Hook pour envoyer un rappel de facture
export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminAPI.sendFactureReminder(id),
    onSuccess: () => {
      // Invalider le cache des factures pour refléter les changements
      queryClient.invalidateQueries({ queryKey: ["admin-factures"] });
      queryClient.invalidateQueries({ queryKey: ["admin-facture-stats"] });
    },
    onError: (error: any) => {
      console.error("❌ Erreur lors de l'envoi du rappel:", error);
    },
  });
}

// Hook pour supprimer une facture
export function useDeleteFacture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminAPI.deleteFacture(id),
    onSuccess: () => {
      // Invalider le cache des factures et des stats
      queryClient.invalidateQueries({ queryKey: ["admin-factures"] });
      queryClient.invalidateQueries({ queryKey: ["admin-facture-stats"] });
    },
    onError: (error: any) => {
      console.error("❌ Erreur lors de la suppression:", error);
    },
  });
}

// Hook pour mettre à jour le statut d'une facture
export function useUpdateFactureStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: any }) =>
      adminAPI.updateFacture(id, { statut }),
    onSuccess: (_, { id }) => {
      // Invalider le cache pour cette facture spécifique et la liste
      queryClient.invalidateQueries({ queryKey: ["admin-facture", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-factures"] });
      queryClient.invalidateQueries({ queryKey: ["admin-facture-stats"] });
    },
    onError: (error: any) => {
      console.error("❌ Erreur lors de la mise à jour du statut:", error);
    },
  });
}

// Hook utilitaire pour invalider manuellement le cache des factures
export function useInvalidateFactures() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-factures"] });
      queryClient.invalidateQueries({ queryKey: ["admin-facture-stats"] });
    },
    invalidateFacture: (id: string) => {
      queryClient.invalidateQueries({ queryKey: ["admin-facture", id] });
    },
    invalidateList: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-factures"] });
    },
    invalidateStats: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-facture-stats"] });
    },
  };
}

// Hook pour précharger une facture (optimisation UX)
export function usePrefetchFacture() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ["admin-facture", id],
      queryFn: () => adminAPI.getFactureById(id),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };
}
