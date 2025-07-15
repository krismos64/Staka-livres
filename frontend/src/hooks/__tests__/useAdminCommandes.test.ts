import { vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { CommandeDetailed, Role, StatutCommande } from "../../types/shared";
import {
  deleteCommande,
  getCommandeById,
  getCommandes,
  updateCommande,
} from "../../utils/adminAPI";
import { useToasts } from "../../utils/toast";
import { useAdminCommandes } from "../useAdminCommandes";

// Mocks
vi.mock("../../utils/adminAPI", () => ({
  getCommandes: vi.fn(),
  getCommandeById: vi.fn(),
  updateCommande: vi.fn(),
  deleteCommande: vi.fn(),
}));
vi.mock("../../utils/toast");

const mockGetCommandes = getCommandes as ReturnType<typeof vi.fn>;
const mockGetCommandeById = getCommandeById as ReturnType<typeof vi.fn>;
const mockUpdateCommande = updateCommande as ReturnType<typeof vi.fn>;
const mockDeleteCommande = deleteCommande as ReturnType<typeof vi.fn>;

const mockUseToasts = useToasts as ReturnType<typeof vi.fn>;

const mockShowToast = vi.fn();

const mockDetailedCommande: CommandeDetailed = {
  id: "cmd-1",
  userId: "user-1",
  titre: "Test Commande Detail",
  statut: StatutCommande.EN_COURS,
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:30:00Z",
  user: {
    id: "user-1",
    email: "test@example.com",
    prenom: "John",
    nom: "Doe",
    role: Role.USER,
    isActive: true,
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
  },
  paymentStatus: "paid",
  amount: 1000,
};

describe("useAdminCommandes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseToasts.mockReturnValue({
      showToast: mockShowToast,
      toasts: [],
      addToast: vi.fn(),
      removeToast: vi.fn(),
      clearAllToasts: vi.fn(),
    });

    // Mock de réponse par défaut
    mockGetCommandes.mockResolvedValue({
      data: [
        {
          id: "cmd-1",
          titre: "Test Commande 1",
          statut: StatutCommande.EN_ATTENTE,
          createdAt: "2025-01-15T10:00:00Z",
          updatedAt: "2025-01-15T10:00:00Z",
          userId: "user-1",
          user: {
            id: "user-1",
            email: "test@example.com",
            prenom: "John",
            nom: "Doe",
            role: Role.USER,
            isActive: true,
            createdAt: "2025-01-15T10:00:00Z",
            updatedAt: "2025-01-15T10:00:00Z",
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
      stats: {
        total: 1,
        enAttente: 1,
        enCours: 0,
        termine: 0,
        annulee: 0,
        tauxCompletion: 0,
      },
    });
  });

  describe("loadCommandes", () => {
    it("should load commandes with correct API parameters", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      await act(async () => {
        await result.current.loadCommandes(
          2, // page
          "test search", // search
          { statut: StatutCommande.EN_COURS }, // filters
          "createdAt", // sortBy
          "desc" // sortDirection
        );
      });

      expect(mockGetCommandes).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: "test search",
        sortBy: "createdAt",
        sortDirection: "desc",
        statut: StatutCommande.EN_COURS,
      });
    });

    it("should trim search and handle empty values", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      await act(async () => {
        await result.current.loadCommandes(
          1,
          "  spaced search  ", // search with spaces
          {}, // empty filters
          undefined, // no sort
          undefined
        );
      });

      expect(mockGetCommandes).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "spaced search",
        sortBy: undefined,
        sortDirection: undefined,
      });
    });

    it("should set loading state correctly", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      expect(result.current.isLoadingList).toBe(false);

      const loadPromise = act(async () => {
        await result.current.loadCommandes();
      });

      // During loading
      expect(result.current.isLoadingList).toBe(true);

      await loadPromise;

      // After loading
      expect(result.current.isLoadingList).toBe(false);
    });

    it("should update state with API response", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      await act(async () => {
        await result.current.loadCommandes();
      });

      expect(result.current.commandes).toHaveLength(1);
      expect(result.current.commandes[0].titre).toBe("Test Commande 1");
      expect(result.current.totalPages).toBe(1);
      expect(result.current.totalCommandes).toBe(1);
      expect(result.current.currentPage).toBe(1);
    });

    it("should handle API errors and show toast", async () => {
      const error = new Error("API Error");
      mockGetCommandes.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminCommandes());

      await act(async () => {
        await result.current.loadCommandes();
      });

      expect(result.current.error).toBe("API Error");
      expect(result.current.commandes).toEqual([]);
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Erreur",
        "API Error"
      );
    });
  });

  describe("updateCommandeStatut", () => {
    beforeEach(() => {
      mockUpdateCommande.mockResolvedValue({
        id: "cmd-1",
        titre: "Test Commande 1",
        statut: StatutCommande.EN_COURS,
        createdAt: "2025-01-15T10:00:00Z",
        updatedAt: "2025-01-15T10:30:00Z",
        userId: "user-1",
      });
    });

    it("should update commande status with API call", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      // Load initial data
      await act(async () => {
        await result.current.loadCommandes();
      });

      // Update status
      await act(async () => {
        await result.current.updateCommandeStatut(
          "cmd-1",
          StatutCommande.EN_COURS,
          "Note test"
        );
      });

      expect(mockUpdateCommande).toHaveBeenCalledWith("cmd-1", {
        statut: StatutCommande.EN_COURS,
        noteCorrecteur: "Note test",
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Succès",
        "Statut de la commande modifié vers EN_COURS"
      );
    });

    it("should update local state optimistically", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      // Load initial data
      await act(async () => {
        await result.current.loadCommandes();
      });

      expect(result.current.commandes[0].statut).toBe(
        StatutCommande.EN_ATTENTE
      );

      // Update status
      await act(async () => {
        await result.current.updateCommandeStatut(
          "cmd-1",
          StatutCommande.EN_COURS
        );
      });

      // Should update local state
      expect(result.current.commandes[0].statut).toBe(StatutCommande.EN_COURS);
    });

    it("should set operation loading state", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      expect(result.current.isOperationLoading).toBe(false);

      const updatePromise = act(async () => {
        await result.current.updateCommandeStatut(
          "cmd-1",
          StatutCommande.EN_COURS
        );
      });

      // During operation
      expect(result.current.isOperationLoading).toBe(true);

      await updatePromise;

      // After operation
      expect(result.current.isOperationLoading).toBe(false);
    });

    it("should handle errors and show toast", async () => {
      const error = new Error("Update failed");
      mockUpdateCommande.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminCommandes());

      await act(async () => {
        await result.current.updateCommandeStatut(
          "cmd-1",
          StatutCommande.EN_COURS
        );
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Erreur",
        "Update failed"
      );
    });
  });

  describe("deleteCommande", () => {
    beforeEach(() => {
      mockDeleteCommande.mockResolvedValue(undefined);
    });

    it("should delete a commande and show success toast", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      // Load initial data
      await act(async () => {
        await result.current.loadCommandes();
      });

      // Delete commande
      await act(async () => {
        await result.current.deleteCommande("cmd-1");
      });

      expect(mockDeleteCommande).toHaveBeenCalledWith("cmd-1");

      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Succès",
        "Commande supprimée"
      );
    });

    it("should optimistically remove commande from list", async () => {
      const { result } = renderHook(() => useAdminCommandes());
      await act(async () => {
        await result.current.loadCommandes();
      });
      expect(result.current.commandes).toHaveLength(1);

      await act(async () => {
        await result.current.deleteCommande("cmd-1");
      });

      expect(result.current.commandes).toHaveLength(0);
    });

    it("should handle errors and show toast", async () => {
      const error = new Error("Delete failed");
      mockDeleteCommande.mockRejectedValue(error);
      const { result } = renderHook(() => useAdminCommandes());

      await act(async () => {
        await result.current.deleteCommande("cmd-1");
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Erreur",
        "Delete failed"
      );
    });
  });

  describe("refreshCommandes", () => {
    it("should call loadCommandes with the last used parameters", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      // Initial load to set parameters
      await act(async () => {
        await result.current.loadCommandes(
          3,
          "refresh test",
          { statut: StatutCommande.TERMINE },
          "updatedAt",
          "asc"
        );
      });

      // Clear the mock to ensure refresh is the one calling it
      mockGetCommandes.mockClear();

      await act(async () => {
        await result.current.refreshCommandes();
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Succès",
        "Liste des commandes mise à jour"
      );

      expect(mockGetCommandes).toHaveBeenCalledTimes(1);
      expect(mockGetCommandes).toHaveBeenCalledWith({
        page: 3,
        limit: 10,
        search: "refresh test",
        filters: { statut: StatutCommande.TERMINE },
        sortBy: "updatedAt",
        sortDirection: "asc",
      });
    });

    it("should handle errors during refresh", async () => {
      const error = new Error("Refresh failed");
      mockGetCommandes.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminCommandes());

      await act(async () => {
        await result.current.loadCommandes(); // First load to set lastQuery
      });

      mockGetCommandes.mockRejectedValue(error); // Ensure the refresh call fails

      await act(async () => {
        await result.current.refreshCommandes();
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Erreur",
        "Refresh failed"
      );
    });
  });

  describe("viewCommande", () => {
    beforeEach(() => {
      mockGetCommandeById.mockResolvedValue(mockDetailedCommande);
    });

    it("should fetch a single commande by ID", async () => {
      const { result } = renderHook(() => useAdminCommandes());
      let commande;

      await act(async () => {
        commande = await result.current.viewCommande("cmd-1");
      });

      expect(mockGetCommandeById).toHaveBeenCalledWith("cmd-1");
      expect(commande).toEqual(mockDetailedCommande);
    });

    it("should handle fetch errors", async () => {
      const error = new Error("Fetch failed");
      mockGetCommandeById.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminCommandes());
      let commande;

      await act(async () => {
        commande = await result.current.viewCommande("cmd-1");
      });

      expect(commande).toBeNull();
      expect(result.current.error).toBe("Fetch failed");
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Erreur",
        "Fetch failed"
      );
    });
  });

  describe("utility functions", () => {
    it("clearError should reset the error state", async () => {
      const error = new Error("Test error");
      mockGetCommandes.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminCommandes());

      // Trigger an error
      await act(async () => {
        await result.current.loadCommandes();
      });
      expect(result.current.error).not.toBeNull();

      // Clear the error
      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    });
  });

  // Test for options
  describe("options", () => {
    it("should use initialPage and pageSize from options", async () => {
      const { result } = renderHook(() =>
        useAdminCommandes({ initialPage: 3, pageSize: 20 })
      );

      await act(async () => {
        await result.current.loadCommandes();
      });

      expect(result.current.currentPage).toBe(3);
      expect(mockGetCommandes).toHaveBeenCalledWith({
        page: 3,
        limit: 20,
        search: undefined,
        sortBy: undefined,
        sortDirection: undefined,
      });
    });

    it("should call onError and onSuccess callbacks", async () => {
      const onError = vi.fn();
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useAdminCommandes({ onError, onSuccess })
      );

      // Test onSuccess
      mockUpdateCommande.mockResolvedValue({
        id: "cmd-1",
        statut: StatutCommande.EN_COURS,
      } as any);
      await act(async () => {
        await result.current.updateCommandeStatut(
          "cmd-1",
          StatutCommande.EN_COURS
        );
      });
      expect(onSuccess).toHaveBeenCalledWith(
        "Statut de la commande modifié vers EN_COURS"
      );

      // Test onError
      const error = new Error("Custom error test");
      mockGetCommandes.mockRejectedValue(error);

      await act(async () => {
        await result.current.loadCommandes();
      });
      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
