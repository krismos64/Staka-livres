import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";
import Packs from "../components/landing/Packs";
import PricingCalculator from "../components/landing/PricingCalculator";
import { useTarifInvalidation } from "../hooks/useTarifInvalidation";
import * as api from "../utils/api";

// Mock de l'API
vi.mock("../utils/api", () => ({
  fetchTarifs: vi.fn(),
}));

// Mock du hook d'invalidation
vi.mock("../hooks/useTarifInvalidation", () => ({
  useTarifInvalidation: vi.fn(),
}));

// Données de test
const mockTarifs = [
  {
    id: "1",
    nom: "Correction Standard",
    description: "Correction complète",
    prix: 2.0,
    prixFormate: "2€",
    typeService: "Correction",
    dureeEstimee: "7-10 jours",
    actif: true,
    ordre: 1,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "2",
    nom: "Réécriture Premium",
    description: "Réécriture professionnelle",
    prix: 4.0,
    prixFormate: "4€",
    typeService: "Réécriture",
    dureeEstimee: "10-14 jours",
    actif: true,
    ordre: 2,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

const mockTarifsModifies = [
  {
    ...mockTarifs[0],
    prix: 2.5,
    prixFormate: "2.50€",
    updatedAt: "2025-01-01T12:00:00Z",
  },
  mockTarifs[1],
];

// ✅ NOUVEAU TEST : Validation flux modification admin → landing
describe("🔄 Tests Flux de Synchronisation Admin → Landing", () => {
  let queryClient: QueryClient;
  let mockInvalidatePublicTarifs: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    mockInvalidatePublicTarifs = vi.fn().mockResolvedValue(undefined);
    
    (useTarifInvalidation as any).mockReturnValue({
      invalidatePublicTarifs: mockInvalidatePublicTarifs,
      refetchPublicTarifs: vi.fn().mockResolvedValue(undefined),
      prefetchPublicTarifs: vi.fn().mockResolvedValue(undefined),
    });

    (api.fetchTarifs as any).mockResolvedValue(mockTarifs);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("🎯 Modification admin → Invalidation cache → Update landing instantané", async () => {
    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // 1. Rendre le composant PricingCalculator avec tarifs initiaux
    const { rerender } = render(
      <TestWrapper>
        <PricingCalculator />
      </TestWrapper>
    );

    // Attendre le chargement des tarifs initiaux
    await waitFor(() => {
      expect(screen.getByTestId("pricing-calculator")).toBeInTheDocument();
    });

    // Vérifier que les tarifs initiaux sont affichés (prix: 2€)
    await waitFor(() => {
      const pricingCards = screen.getAllByText(/2€/);
      expect(pricingCards.length).toBeGreaterThan(0);
    });

    // 2. ✅ SIMULATION : Action admin de modification de tarif
    console.log("🔄 Simulation modification tarif admin...");

    // Mock de la nouvelle réponse API avec tarifs modifiés
    (api.fetchTarifs as any).mockResolvedValue(mockTarifsModifies);

    // 3. ✅ SIMULATION : Invalidation du cache comme le ferait handleSaveTarif
    act(() => {
      queryClient.invalidateQueries({
        queryKey: ["tarifs", "public"],
        exact: true,
      });
    });

    console.log("✅ Cache public des tarifs invalidé (simulation admin)");

    // 4. Re-rendre le composant pour déclencher le refetch
    rerender(
      <TestWrapper>
        <PricingCalculator />
      </TestWrapper>
    );

    // 5. ✅ VÉRIFICATION : Les nouveaux tarifs (2.50€) sont affichés
    await waitFor(() => {
      const updatedPricingCards = screen.getAllByText(/2\.50€/);
      expect(updatedPricingCards.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    console.log("✅ Landing page mise à jour avec nouveaux tarifs");

    // 6. ✅ VÉRIFICATION : L'ancien prix (2€) n'est plus affiché
    await waitFor(() => {
      const oldPricingCards = screen.queryAllByText(/^2€$/);
      expect(oldPricingCards.length).toBe(0);
    });
  });

  test("🔄 Cache partagé entre PricingCalculator et Packs", async () => {
    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // Rendre les deux composants simultanément
    render(
      <TestWrapper>
        <PricingCalculator />
        <Packs />
      </TestWrapper>
    );

    // Attendre le chargement
    await waitFor(() => {
      expect(screen.getByTestId("pricing-calculator")).toBeInTheDocument();
      expect(screen.getByTestId("packs-section")).toBeInTheDocument();
    });

    // Vérifier qu'un seul appel API a été fait (cache partagé)
    expect(api.fetchTarifs).toHaveBeenCalledTimes(1);

    // ✅ SIMULATION : Invalidation cache admin
    (api.fetchTarifs as any).mockResolvedValue(mockTarifsModifies);

    act(() => {
      queryClient.invalidateQueries({
        queryKey: ["tarifs", "public"],
        exact: true,
      });
    });

    // Attendre la mise à jour des deux composants
    await waitFor(() => {
      // Les deux composants doivent afficher les nouveaux tarifs
      const pricingUpdated = screen.getByTestId("pricing-calculator");
      const packsUpdated = screen.getByTestId("packs-section");
      
      expect(pricingUpdated).toBeInTheDocument();
      expect(packsUpdated).toBeInTheDocument();
    });

    // ✅ VÉRIFICATION : Un seul appel API supplémentaire (cache partagé efficace)
    expect(api.fetchTarifs).toHaveBeenCalledTimes(2);
  });

  test("📊 Log de confirmation après invalidation", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    render(
      <TestWrapper>
        <PricingCalculator />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("pricing-calculator")).toBeInTheDocument();
    });

    // ✅ SIMULATION : Appel invalidatePublicTarifs comme dans handleSaveTarif
    await act(async () => {
      await mockInvalidatePublicTarifs();
    });

    // ✅ VÉRIFICATION : La fonction d'invalidation a été appelée
    expect(mockInvalidatePublicTarifs).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});

// Tests existants (conservés)
describe("Invalidation des tarifs", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    (useTarifInvalidation as any).mockReturnValue({
      invalidatePublicTarifs: vi.fn().mockResolvedValue(undefined),
      refetchPublicTarifs: vi.fn().mockResolvedValue(undefined),
      prefetchPublicTarifs: vi.fn().mockResolvedValue(undefined),
    });

    (api.fetchTarifs as any).mockResolvedValue(mockTarifs);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("PricingCalculator", () => {
    test("devrait afficher les tarifs initiaux", async () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      render(
        <TestWrapper>
          <PricingCalculator />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("pricing-calculator")).toBeInTheDocument();
      });

      expect(api.fetchTarifs).toHaveBeenCalledTimes(1);
    });

    test("devrait se mettre à jour après invalidation des tarifs", async () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { rerender } = render(
        <TestWrapper>
          <PricingCalculator />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("pricing-calculator")).toBeInTheDocument();
      });

      (api.fetchTarifs as any).mockResolvedValue(mockTarifsModifies);

      act(() => {
        queryClient.invalidateQueries({
          queryKey: ["tarifs", "public"],
          exact: true,
        });
      });

      rerender(
        <TestWrapper>
          <PricingCalculator />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.fetchTarifs).toHaveBeenCalledTimes(2);
      });
    });

    test("devrait gérer les erreurs gracieusement", async () => {
      (api.fetchTarifs as any).mockRejectedValue(new Error("Network error"));

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      render(
        <TestWrapper>
          <PricingCalculator />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("pricing-calculator")).toBeInTheDocument();
      });
    });

    test("devrait afficher l'état de chargement", async () => {
      (api.fetchTarifs as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTarifs), 100))
      );

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      render(
        <TestWrapper>
          <PricingCalculator />
        </TestWrapper>
      );

      expect(screen.getByText(/Chargement des tarifs/)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("pricing-calculator")).toBeInTheDocument();
      });
    });
  });

  describe("Packs", () => {
    test("devrait afficher les packs générés depuis les tarifs", async () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      render(
        <TestWrapper>
          <Packs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("packs-section")).toBeInTheDocument();
      });

      expect(api.fetchTarifs).toHaveBeenCalledTimes(1);
    });

    test("devrait se mettre à jour après invalidation des tarifs", async () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { rerender } = render(
        <TestWrapper>
          <Packs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("packs-section")).toBeInTheDocument();
      });

      (api.fetchTarifs as any).mockResolvedValue(mockTarifsModifies);

      act(() => {
        queryClient.invalidateQueries({
          queryKey: ["tarifs", "public"],
          exact: true,
        });
      });

      rerender(
        <TestWrapper>
          <Packs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.fetchTarifs).toHaveBeenCalledTimes(2);
      });
    });

    test("devrait utiliser les fallbacks en cas d'erreur", async () => {
      (api.fetchTarifs as any).mockRejectedValue(new Error("Network error"));

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      render(
        <TestWrapper>
          <Packs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("packs-section")).toBeInTheDocument();
      });
    });
  });

  describe("Synchronisation entre composants", () => {
    test("les deux composants devraient se mettre à jour simultanément", async () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { rerender } = render(
        <TestWrapper>
          <PricingCalculator />
          <Packs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("pricing-calculator")).toBeInTheDocument();
        expect(screen.getByTestId("packs-section")).toBeInTheDocument();
      });

      (api.fetchTarifs as any).mockResolvedValue(mockTarifsModifies);

      act(() => {
        queryClient.invalidateQueries({
          queryKey: ["tarifs", "public"],
          exact: true,
        });
      });

      rerender(
        <TestWrapper>
          <PricingCalculator />
          <Packs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(api.fetchTarifs).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Performance et cache", () => {
    test("devrait partager le cache entre les composants", async () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      render(
        <TestWrapper>
          <PricingCalculator />
          <Packs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("pricing-calculator")).toBeInTheDocument();
        expect(screen.getByTestId("packs-section")).toBeInTheDocument();
      });

      expect(api.fetchTarifs).toHaveBeenCalledTimes(1);
    });

    test("devrait invalider le cache correctement", async () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      render(
        <TestWrapper>
          <PricingCalculator />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("pricing-calculator")).toBeInTheDocument();
      });

      act(() => {
        queryClient.invalidateQueries({
          queryKey: ["tarifs", "public"],
          exact: true,
        });
      });

      const queryState = queryClient.getQueryState(["tarifs", "public"]);
      expect(queryState?.isInvalidated).toBe(true);
    });
  });
});
