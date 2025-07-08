import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageStatique, StatutPage } from "../types/shared";
import {
  createPage,
  deletePage,
  getPageById,
  getPages,
  publishPage,
  unpublishPage,
  updatePage,
} from "../utils/adminAPI";
import { useToasts } from "../utils/toast";

// Types pour les paramètres
export interface AdminPagesParams {
  page?: number;
  limit?: number;
  search?: string;
  statut?: StatutPage;
}

export interface CreatePageData {
  titre: string;
  slug: string;
  contenu: string;
  description?: string;
  statut: StatutPage;
}

export interface UpdatePageData {
  titre?: string;
  slug?: string;
  contenu?: string;
  description?: string;
  statut?: StatutPage;
}

// Clés de cache React Query
export const pageKeys = {
  all: ["pages"] as const,
  lists: () => [...pageKeys.all, "list"] as const,
  list: (params: AdminPagesParams) => [...pageKeys.lists(), params] as const,
  details: () => [...pageKeys.all, "detail"] as const,
  detail: (id: string) => [...pageKeys.details(), id] as const,
};

// Hook principal pour lister les pages
export const useAdminPages = (params: AdminPagesParams = {}) => {
  const { page = 1, limit = 10, search, statut } = params;

  return useQuery({
    queryKey: pageKeys.list(params),
    queryFn: () => getPages(page, limit, search, statut),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (anciennement cacheTime)
  });
};

// Hook pour récupérer une page par ID
export const useAdminPage = (id: string) => {
  return useQuery({
    queryKey: pageKeys.detail(id),
    queryFn: () => getPageById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

// Hook pour créer une page
export const useCreatePage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToasts();

  return useMutation({
    mutationFn: (pageData: CreatePageData) => createPage(pageData),
    onSuccess: (newPage) => {
      // Invalider et refetch la liste des pages
      queryClient.invalidateQueries({ queryKey: pageKeys.lists() });

      // Ajouter la nouvelle page au cache localement pour un update optimiste
      queryClient.setQueryData(
        pageKeys.list({}),
        (oldData: PageStatique[] | undefined) => {
          if (!oldData) return [newPage];
          return [newPage, ...oldData];
        }
      );

      showToast("success", "Page créée", "La page a été créée avec succès");
    },
    onError: (error: Error) => {
      showToast(
        "error",
        "Erreur",
        error.message || "Erreur lors de la création de la page"
      );
    },
  });
};

// Hook pour mettre à jour une page
export const useUpdatePage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToasts();

  return useMutation({
    mutationFn: ({ id, pageData }: { id: string; pageData: UpdatePageData }) =>
      updatePage(id, pageData),
    onSuccess: (updatedPage) => {
      // Invalider les listes et détails
      queryClient.invalidateQueries({ queryKey: pageKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: pageKeys.detail(updatedPage.id),
      });

      // Mettre à jour le cache localement
      queryClient.setQueryData(pageKeys.detail(updatedPage.id), updatedPage);

      queryClient.setQueryData(
        pageKeys.list({}),
        (oldData: PageStatique[] | undefined) => {
          if (!oldData) return [updatedPage];
          return oldData.map((page) =>
            page.id === updatedPage.id ? updatedPage : page
          );
        }
      );

      showToast(
        "success",
        "Page modifiée",
        "La page a été mise à jour avec succès"
      );
    },
    onError: (error: Error) => {
      showToast(
        "error",
        "Erreur",
        error.message || "Erreur lors de la modification de la page"
      );
    },
  });
};

// Hook pour supprimer une page
export const useDeletePage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToasts();

  return useMutation({
    mutationFn: (id: string) => deletePage(id),
    onSuccess: (_, deletedId) => {
      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: pageKeys.lists() });

      // Supprimer du cache localement
      queryClient.removeQueries({ queryKey: pageKeys.detail(deletedId) });

      queryClient.setQueryData(
        pageKeys.list({}),
        (oldData: PageStatique[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter((page) => page.id !== deletedId);
        }
      );

      showToast(
        "success",
        "Page supprimée",
        "La page a été supprimée avec succès"
      );
    },
    onError: (error: Error) => {
      showToast(
        "error",
        "Erreur",
        error.message || "Erreur lors de la suppression de la page"
      );
    },
  });
};

// Hook pour publier une page
export const usePublishPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToasts();

  return useMutation({
    mutationFn: (id: string) => publishPage(id),
    onSuccess: (updatedPage) => {
      // Invalider les listes et détails
      queryClient.invalidateQueries({ queryKey: pageKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: pageKeys.detail(updatedPage.id),
      });

      // Mettre à jour le cache localement
      queryClient.setQueryData(pageKeys.detail(updatedPage.id), updatedPage);

      queryClient.setQueryData(
        pageKeys.list({}),
        (oldData: PageStatique[] | undefined) => {
          if (!oldData) return [updatedPage];
          return oldData.map((page) =>
            page.id === updatedPage.id ? updatedPage : page
          );
        }
      );

      showToast("success", "Page publiée", "La page est maintenant visible");
    },
    onError: (error: Error) => {
      showToast(
        "error",
        "Erreur",
        error.message || "Erreur lors de la publication de la page"
      );
    },
  });
};

// Hook pour dépublier une page
export const useUnpublishPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToasts();

  return useMutation({
    mutationFn: (id: string) => unpublishPage(id),
    onSuccess: (updatedPage) => {
      // Invalider les listes et détails
      queryClient.invalidateQueries({ queryKey: pageKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: pageKeys.detail(updatedPage.id),
      });

      // Mettre à jour le cache localement
      queryClient.setQueryData(pageKeys.detail(updatedPage.id), updatedPage);

      queryClient.setQueryData(
        pageKeys.list({}),
        (oldData: PageStatique[] | undefined) => {
          if (!oldData) return [updatedPage];
          return oldData.map((page) =>
            page.id === updatedPage.id ? updatedPage : page
          );
        }
      );

      showToast(
        "success",
        "Page dépubliée",
        "La page est maintenant en brouillon"
      );
    },
    onError: (error: Error) => {
      showToast(
        "error",
        "Erreur",
        error.message || "Erreur lors de la dépublication de la page"
      );
    },
  });
};

// Hook utilitaire pour basculer le statut de publication
export const useTogglePageStatus = () => {
  const publishMutation = usePublishPage();
  const unpublishMutation = useUnpublishPage();

  const toggleStatus = (page: PageStatique) => {
    if (page.statut === StatutPage.PUBLIEE) {
      return unpublishMutation.mutate(page.id);
    } else {
      return publishMutation.mutate(page.id);
    }
  };

  return {
    toggleStatus,
    isLoading: publishMutation.isPending || unpublishMutation.isPending,
    error: publishMutation.error || unpublishMutation.error,
  };
};

// Hook pour les statistiques des pages
export const usePageStats = (pages: PageStatique[]) => {
  return {
    total: pages.length,
    publiees: pages.filter((p) => p.statut === StatutPage.PUBLIEE).length,
    brouillons: pages.filter((p) => p.statut === StatutPage.BROUILLON).length,
    archivees: pages.filter((p) => p.statut === StatutPage.ARCHIVEE).length,
  };
};
