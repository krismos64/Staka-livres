import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Hook pour gérer l'invalidation du cache des tarifs publics
 * Utilisé dans l'espace admin pour synchroniser les changements
 * avec la landing page
 */
export function useTarifInvalidation() {
  const queryClient = useQueryClient();

  /**
   * Invalide le cache des tarifs publics
   * Force le re-fetch immédiat des données sur la landing page
   */
  const invalidatePublicTarifs = useCallback(async () => {
    try {
      // Invalider le cache des tarifs publics (utilisé par usePricing)
      await queryClient.invalidateQueries({
        queryKey: ["tarifs", "public"],
        exact: true,
      });

      // Invalider aussi les tarifs admin pour cohérence
      await queryClient.invalidateQueries({
        queryKey: ["admin", "tarifs"],
        exact: false,
      });

      console.log("✅ Cache des tarifs publics invalidé avec succès");
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'invalidation du cache des tarifs:",
        error
      );
    }
  }, [queryClient]);

  /**
   * Force le refetch des tarifs publics sans attendre l'invalidation
   * Utile pour les mises à jour critiques
   */
  const refetchPublicTarifs = useCallback(async () => {
    try {
      await queryClient.refetchQueries({
        queryKey: ["tarifs", "public"],
        exact: true,
      });
      console.log("✅ Refetch des tarifs publics effectué");
    } catch (error) {
      console.error("❌ Erreur lors du refetch des tarifs:", error);
    }
  }, [queryClient]);

  /**
   * Précharge les tarifs publics (optimisation UX)
   */
  const prefetchPublicTarifs = useCallback(async () => {
    try {
      const { fetchTarifs } = await import("../utils/api");
      await queryClient.prefetchQuery({
        queryKey: ["tarifs", "public"],
        queryFn: fetchTarifs,
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
      console.log("✅ Préchargement des tarifs publics effectué");
    } catch (error) {
      console.error("❌ Erreur lors du préchargement des tarifs:", error);
    }
  }, [queryClient]);

  return {
    invalidatePublicTarifs,
    refetchPublicTarifs,
    prefetchPublicTarifs,
  };
}
