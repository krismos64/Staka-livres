import { vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import { StatutCommande } from "../../types/shared";

// Mock des dépendances
vi.mock("../../utils/adminAPI", () => ({
  getCommandes: vi.fn(() => Promise.resolve({
    data: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    stats: { total: 0, enAttente: 0, enCours: 0, termine: 0, annulee: 0, tauxCompletion: 0 },
  })),
  getCommandeById: vi.fn(() => Promise.resolve(null)),
  updateCommande: vi.fn(() => Promise.resolve({})),
  deleteCommande: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../utils/toast", () => ({
  useToasts: vi.fn(() => ({
    showToast: vi.fn(),
    toasts: [],
    addToast: vi.fn(),
    removeToast: vi.fn(),
    clearAllToasts: vi.fn(),
  })),
}));

// Wrapper pour React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useAdminCommandes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render without errors", async () => {
    const { useAdminCommandes } = await import("../useAdminCommandes");
    
    const { result } = renderHook(() => useAdminCommandes(), {
      wrapper: createWrapper(),
    });

    // Vérifier que le hook retourne bien un objet avec les propriétés attendues
    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe("object");
  });

  it("should have initial state", async () => {
    const { useAdminCommandes } = await import("../useAdminCommandes");
    
    const { result } = renderHook(() => useAdminCommandes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.commandes).toEqual([]);
      expect(result.current.isLoadingList).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.currentPage).toBe(1);
    });
  });

  it("should have loadCommandes function", async () => {
    const { useAdminCommandes } = await import("../useAdminCommandes");
    
    const { result } = renderHook(() => useAdminCommandes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(typeof result.current.loadCommandes).toBe("function");
    });
  });

  it("should call API when loadCommandes is invoked", async () => {
    const { getCommandes } = await import("../../utils/adminAPI");
    const { useAdminCommandes } = await import("../useAdminCommandes");
    
    const { result } = renderHook(() => useAdminCommandes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadCommandes).toBeDefined();
    });

    if (result.current.loadCommandes) {
      await result.current.loadCommandes();
      expect(getCommandes).toHaveBeenCalled();
    }
  });

  it("should handle basic operations", async () => {
    const { useAdminCommandes } = await import("../useAdminCommandes");
    
    const { result } = renderHook(() => useAdminCommandes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.clearError).toBeDefined();
      expect(result.current.refreshCommandes).toBeDefined();
      expect(result.current.viewCommande).toBeDefined();
      expect(result.current.updateCommandeStatut).toBeDefined();
      expect(result.current.deleteCommande).toBeDefined();
    });
  });
});