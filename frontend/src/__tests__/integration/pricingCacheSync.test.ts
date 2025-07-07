import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { usePricing } from "../../components/landing/hooks/usePricing";
import { useTarifInvalidation } from "../../hooks/useTarifInvalidation";

// Mock des utilitaires API
import { vi } from "vitest";

const mockFetchTarifs = vi.fn();

vi.mock("../../utils/api", () => ({
  fetchTarifs: mockFetchTarifs,
}));

// Mock des tarifs pour les tests
const mockTarifs = [
  {
    id: "tarif-1",
    nom: "Correction Standard",
    description: "Correction orthographique complète",
    prix: 299,
    prixFormate: "2,99 €",
    typeService: "Correction",
    dureeEstimee: "5-7 jours",
    actif: true,
    ordre: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "tarif-2",
    nom: "Correction Premium",
    description: "Correction + amélioration du style",
    prix: 499,
    prixFormate: "4,99 €",
    typeService: "Correction",
    dureeEstimee: "7-10 jours",
    actif: true,
    ordre: 2,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

const mockTarifsUpdated = [
  ...mockTarifs,
  {
    id: "tarif-3",
    nom: "Service Express",
    description: "Correction rapide en 48h",
    prix: 50,
    prixFormate: "50 %",
    typeService: "supplément",
    dureeEstimee: "48h",
    actif: true,
    ordre: 3,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
];

describe("Cache Synchronization between Admin and Landing Page", () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    // Créer un nouveau QueryClient pour chaque test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 5 * 60 * 1000, // 5 minutes
        },
      },
    });

    // Wrapper avec QueryClientProvider
    wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );

    // Reset des mocks
    vi.clearAllMocks();
    mockFetchTarifs.mockResolvedValue(mockTarifs);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("usePricing hook behavior", () => {
    it("should load initial tarifs and cache them", async () => {
      const { result } = renderHook(
        () => usePricing({ enableDebugLogs: true }),
        { wrapper }
      );

      // Vérifier l'état initial
      expect(result.current.isLoading).toBe(true);
      expect(result.current.tarifs).toEqual([]);

      // Attendre le chargement
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Vérifier que les tarifs sont chargés
      expect(result.current.tarifs).toEqual(mockTarifs);
      expect(mockFetchTarifs).toHaveBeenCalledTimes(1);
    });

    it("should refresh tarifs when explicitly requested", async () => {
      const { result } = renderHook(
        () => usePricing({ enableDebugLogs: true }),
        { wrapper }
      );

      // Attendre le chargement initial
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Modifier les données du mock pour simuler une mise à jour
      mockFetchTarifs.mockResolvedValue(mockTarifsUpdated);

      // Forcer le refresh
      await act(async () => {
        await result.current.refreshTarifs();
      });

      // Vérifier que les nouvelles données sont chargées
      await waitFor(() => {
        expect(result.current.tarifs).toEqual(mockTarifsUpdated);
      });

      expect(mockFetchTarifs).toHaveBeenCalledTimes(2);
    });

    it("should detect stale cache correctly", async () => {
      const { result } = renderHook(
        () =>
          usePricing({
            enableDebugLogs: true,
            staleTime: 100, // Très court pour le test
          }),
        { wrapper }
      );

      // Attendre le chargement initial
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initialement, le cache ne devrait pas être périmé
      expect(result.current.isCacheStale()).toBe(false);

      // Attendre que le cache expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Maintenant le cache devrait être périmé
      expect(result.current.isCacheStale()).toBe(true);
    });
  });

  describe("Cache invalidation from admin", () => {
    it("should invalidate pricing cache when admin updates tarifs", async () => {
      // Configurer deux hooks : un pour pricing, un pour admin
      const { result: pricingResult } = renderHook(
        () => usePricing({ enableDebugLogs: true }),
        { wrapper }
      );

      const { result: adminResult } = renderHook(() => useTarifInvalidation(), {
        wrapper,
      });

      // Attendre le chargement initial du pricing
      await waitFor(() => {
        expect(pricingResult.current.isLoading).toBe(false);
      });

      expect(pricingResult.current.tarifs).toEqual(mockTarifs);

      // Simuler une mise à jour admin des tarifs
      mockFetchTarifs.mockResolvedValue(mockTarifsUpdated);

      // Invalider le cache depuis l'admin
      await act(async () => {
        await adminResult.current.invalidatePublicTarifs();
      });

      // Vérifier que les nouvelles données sont automatiquement chargées
      await waitFor(() => {
        expect(pricingResult.current.tarifs).toEqual(mockTarifsUpdated);
      });

      // Vérifier qu'un nouveau fetch a été effectué
      expect(mockFetchTarifs).toHaveBeenCalledTimes(2);
    });

    it("should handle multiple rapid invalidations gracefully", async () => {
      const { result: pricingResult } = renderHook(
        () => usePricing({ enableDebugLogs: true }),
        { wrapper }
      );

      const { result: adminResult } = renderHook(() => useTarifInvalidation(), {
        wrapper,
      });

      // Attendre le chargement initial
      await waitFor(() => {
        expect(pricingResult.current.isLoading).toBe(false);
      });

      // Simuler plusieurs invalidations rapides
      await act(async () => {
        await Promise.all([
          adminResult.current.invalidatePublicTarifs(),
          adminResult.current.invalidatePublicTarifs(),
          adminResult.current.invalidatePublicTarifs(),
        ]);
      });

      // React Query devrait gérer les doublons automatiquement
      await waitFor(() => {
        expect(pricingResult.current.isLoading).toBe(false);
      });

      // On devrait avoir fait au maximum quelques appels supplémentaires
      expect(mockFetchTarifs).toHaveBeenCalledTimes(2); // Initial + 1 invalidation
    });
  });

  describe("Error handling and fallback behavior", () => {
    it("should show error and allow retry when fetch fails", async () => {
      // Simuler une erreur lors du fetch
      mockFetchTarifs.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(
        () => usePricing({ enableDebugLogs: true }),
        { wrapper }
      );

      // Attendre que l'erreur soit gérée
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Vérifier l'état d'erreur
      expect(result.current.error).toBe("Network error");
      expect(result.current.tarifs).toEqual([]);

      // Simuler la résolution du problème
      mockFetchTarifs.mockResolvedValue(mockTarifs);

      // Retry avec refreshTarifs
      await act(async () => {
        await result.current.refreshTarifs();
      });

      // Vérifier la récupération
      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.tarifs).toEqual(mockTarifs);
      });
    });

    it("should use fallback pricing rules when no tarifs are available", async () => {
      // Simuler un retour vide
      mockFetchTarifs.mockResolvedValue([]);

      const { result } = renderHook(
        () => usePricing({ enableDebugLogs: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Vérifier que les règles de fallback sont utilisées
      expect(result.current.tarifs).toEqual([]);

      // Le pricing devrait toujours fonctionner avec les règles par défaut
      const price100 = result.current.calculatePrice(100);
      expect(price100).toBeGreaterThan(0); // Devrait calculer avec les règles par défaut
    });
  });

  describe("Performance and caching behavior", () => {
    it("should not fetch tarifs multiple times when cache is still fresh", async () => {
      // Premier hook
      const { result: result1 } = renderHook(
        () => usePricing({ enableDebugLogs: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      // Deuxième hook utilisant le même cache
      const { result: result2 } = renderHook(
        () => usePricing({ enableDebugLogs: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Les deux hooks devraient avoir les mêmes données
      expect(result1.current.tarifs).toEqual(result2.current.tarifs);

      // Mais un seul fetch devrait avoir été effectué
      expect(mockFetchTarifs).toHaveBeenCalledTimes(1);
    });
  });
});
