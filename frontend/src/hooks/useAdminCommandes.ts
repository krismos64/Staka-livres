import { useCallback, useState } from "react";
import {
  Commande,
  CommandeDetailed,
  CommandeStats,
  PaginatedResponse,
  StatutCommande,
} from "../types/shared";
import { adminAPI, AdminCommandesParams } from "../utils/adminAPI";
import { useToasts } from "../utils/toast";

export interface CommandeFilters {
  statut?: StatutCommande;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UseAdminCommandesOptions {
  initialPage?: number;
  pageSize?: number;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export interface UseAdminCommandesReturn {
  // État
  commandes: Commande[];
  stats: CommandeStats | null;
  isLoadingList: boolean;
  isLoadingStats: boolean;
  isOperationLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCommandes: number;

  // Actions de chargement
  loadCommandes: (
    page?: number,
    search?: string,
    filters?: CommandeFilters,
    sortBy?: string,
    sortDirection?: "asc" | "desc"
  ) => Promise<void>;
  refreshCommandes: () => Promise<void>;
  loadCommandeStats: () => Promise<void>;

  // Actions commande atomiques
  viewCommande: (commandeId: string) => Promise<CommandeDetailed | null>;
  updateCommandeStatut: (
    commandeId: string,
    statut: StatutCommande,
    noteCorrecteur?: string
  ) => Promise<Commande | null>;
  deleteCommande: (commandeId: string) => Promise<boolean>;

  // Utilitaires
  setCurrentPage: (page: number) => void;
  clearError: () => void;
  getCommandeById: (commandeId: string) => Commande | null;
  isCommandeInCurrentPage: (commandeId: string) => boolean;
}

export const useAdminCommandes = (
  options: UseAdminCommandesOptions = {}
): UseAdminCommandesReturn => {
  const { initialPage = 1, pageSize = 10, onError, onSuccess } = options;

  const { showToast } = useToasts();

  // État local
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [stats, setStats] = useState<CommandeStats | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCommandes, setTotalCommandes] = useState(0);

  // État de la dernière requête pour refresh intelligent
  const [lastQuery, setLastQuery] = useState<{
    page: number;
    search?: string;
    filters?: CommandeFilters;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }>({
    page: initialPage,
  });

  // Gestionnaire d'erreur centralisé
  const handleError = useCallback(
    (err: unknown, defaultMessage: string) => {
      const errorMessage = err instanceof Error ? err.message : defaultMessage;
      setError(errorMessage);

      if (onError) {
        onError(err instanceof Error ? err : new Error(defaultMessage));
      } else {
        showToast("error", "Erreur", errorMessage);
      }

      console.error(defaultMessage, err);
    },
    [onError, showToast]
  );

  // Gestionnaire de succès centralisé
  const handleSuccess = useCallback(
    (message: string) => {
      if (onSuccess) {
        onSuccess(message);
      } else {
        showToast("success", "Succès", message);
      }
    },
    [onSuccess, showToast]
  );

  // Chargement des commandes
  const loadCommandes = useCallback(
    async (
      page = currentPage,
      search?: string,
      filters?: CommandeFilters,
      sortBy?: string,
      sortDirection?: "asc" | "desc"
    ) => {
      try {
        setIsLoadingList(true);
        setError(null);

        const params: AdminCommandesParams = {
          page,
          limit: pageSize,
          search: search?.trim() || undefined,
          sortBy,
          sortDirection,
          ...filters,
        };

        console.log(`🔍 [DEBUG HOOK] loadCommandes avec paramètres:`, params);

        const response: PaginatedResponse<Commande> & { stats: CommandeStats } =
          await adminAPI.getCommandes(params);

        setCommandes(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalCommandes(response.pagination?.total || 0);
        setCurrentPage(page);

        // Sauvegarder les paramètres de la requête pour refresh
        setLastQuery({ page, search, filters, sortBy, sortDirection });

        console.log(
          `🔍 [DEBUG HOOK] Commandes chargées:`,
          response.data?.length || 0
        );
      } catch (err) {
        handleError(err, "Erreur de chargement des commandes");
        setCommandes([]);
        setTotalPages(1);
        setTotalCommandes(0);
      } finally {
        setIsLoadingList(false);
      }
    },
    [currentPage, pageSize, handleError]
  );

  // Rafraîchissement avec derniers paramètres
  const refreshCommandes = useCallback(async () => {
    try {
      await loadCommandes(
        lastQuery.page,
        lastQuery.search,
        lastQuery.filters,
        lastQuery.sortBy,
        lastQuery.sortDirection
      );
      handleSuccess("Liste des commandes mise à jour");
    } catch (err) {
      handleError(err, "Erreur de rafraîchissement");
    }
  }, [lastQuery, loadCommandes, handleSuccess, handleError]);

  // Chargement des statistiques
  const loadCommandeStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      // Les stats sont retournées avec getCommandes, mais on peut aussi les charger séparément
      const response = await adminAPI.getCommandes({ page: 1, limit: 1 });
      setStats(response.stats);
    } catch (err) {
      handleError(err, "Erreur de chargement des statistiques");
    } finally {
      setIsLoadingStats(false);
    }
  }, [handleError]);

  // Voir une commande
  const viewCommande = useCallback(
    async (commandeId: string): Promise<CommandeDetailed | null> => {
      try {
        setIsOperationLoading(true);
        const commande = await adminAPI.getCommandeById(commandeId);
        return commande;
      } catch (err) {
        handleError(err, "Erreur de récupération de la commande");
        return null;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [handleError]
  );

  // Mettre à jour le statut d'une commande
  const updateCommandeStatut = useCallback(
    async (
      commandeId: string,
      statut: StatutCommande,
      noteCorrecteur?: string
    ): Promise<Commande | null> => {
      try {
        setIsOperationLoading(true);
        const updatedCommande = await adminAPI.updateCommande(commandeId, {
          statut,
          noteCorrecteur,
        });

        // Mise à jour optimiste de la liste
        setCommandes((prev) =>
          prev.map((cmd) =>
            cmd.id === commandeId
              ? {
                  ...cmd,
                  statut,
                  noteCorrecteur: noteCorrecteur || cmd.noteCorrecteur,
                }
              : cmd
          )
        );

        handleSuccess(`Statut de la commande modifié vers ${statut}`);
        return updatedCommande;
      } catch (err) {
        handleError(err, "Erreur de mise à jour du statut");
        // Rafraîchir en cas d'erreur pour rétablir l'état correct
        await refreshCommandes();
        return null;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [handleError, handleSuccess, refreshCommandes]
  );

  // Supprimer une commande
  const deleteCommande = useCallback(
    async (commandeId: string): Promise<boolean> => {
      try {
        setIsOperationLoading(true);
        await adminAPI.deleteCommande(commandeId);

        // Mise à jour optimiste de la liste
        setCommandes((prev) => prev.filter((cmd) => cmd.id !== commandeId));
        setTotalCommandes((prev) => prev - 1);

        handleSuccess("Commande supprimée avec succès");

        // Si la page actuelle devient vide, retourner à la page précédente
        if (commandes.length === 1 && currentPage > 1) {
          const newPage = currentPage - 1;
          setCurrentPage(newPage);
          await loadCommandes(
            newPage,
            lastQuery.search,
            lastQuery.filters,
            lastQuery.sortBy,
            lastQuery.sortDirection
          );
        }

        return true;
      } catch (err) {
        handleError(err, "Erreur de suppression de la commande");
        // Rafraîchir en cas d'erreur pour rétablir l'état correct
        await refreshCommandes();
        return false;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [
      handleError,
      handleSuccess,
      refreshCommandes,
      commandes.length,
      currentPage,
      lastQuery,
      loadCommandes,
    ]
  );

  // Utilitaires
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getCommandeById = useCallback(
    (commandeId: string): Commande | null => {
      return commandes.find((cmd) => cmd.id === commandeId) || null;
    },
    [commandes]
  );

  const isCommandeInCurrentPage = useCallback(
    (commandeId: string): boolean => {
      return commandes.some((cmd) => cmd.id === commandeId);
    },
    [commandes]
  );

  return {
    // État
    commandes,
    stats,
    isLoadingList,
    isLoadingStats,
    isOperationLoading,
    error,
    currentPage,
    totalPages,
    totalCommandes,

    // Actions
    loadCommandes,
    refreshCommandes,
    loadCommandeStats,
    viewCommande,
    updateCommandeStatut,
    deleteCommande,

    // Utilitaires
    setCurrentPage,
    clearError,
    getCommandeById,
    isCommandeInCurrentPage,
  };
};
