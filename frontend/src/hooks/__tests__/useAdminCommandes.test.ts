import { act, renderHook } from "@testing-library/react";
import { StatutCommande } from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";
import { useToasts } from "../../utils/toast";
import { useAdminCommandes } from "../useAdminCommandes";

// Mocks
jest.mock("../../utils/adminAPI");
jest.mock("../../utils/toast");

const mockAdminAPI = adminAPI as jest.Mocked<typeof adminAPI>;
const mockUseToasts = useToasts as jest.MockedFunction<typeof useToasts>;

const mockShowToast = jest.fn();

describe("useAdminCommandes", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseToasts.mockReturnValue({
      showToast: mockShowToast,
      hideToast: jest.fn(),
      toasts: [],
    });

    // Mock de réponse par défaut
    mockAdminAPI.getCommandes.mockResolvedValue({
      data: [
        {
          id: "cmd-1",
          titre: "Test Commande 1",
          statut: StatutCommande.EN_ATTENTE,
          createdAt: "2025-01-15T10:00:00Z",
          updatedAt: "2025-01-15T10:00:00Z",
          user: {
            id: "user-1",
            email: "test@example.com",
            prenom: "John",
            nom: "Doe",
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
        suspendue: 0,
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

      expect(mockAdminAPI.getCommandes).toHaveBeenCalledWith({
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

      expect(mockAdminAPI.getCommandes).toHaveBeenCalledWith({
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
      mockAdminAPI.getCommandes.mockRejectedValue(error);

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
      mockAdminAPI.updateCommande.mockResolvedValue({
        id: "cmd-1",
        titre: "Test Commande 1",
        statut: StatutCommande.EN_COURS,
        createdAt: "2025-01-15T10:00:00Z",
        updatedAt: "2025-01-15T10:30:00Z",
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

      expect(mockAdminAPI.updateCommande).toHaveBeenCalledWith("cmd-1", {
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

    it("should handle errors and refresh data", async () => {
      const error = new Error("Update failed");
      mockAdminAPI.updateCommande.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminCommandes());

      // Load initial data
      await act(async () => {
        await result.current.loadCommandes();
      });

      // Clear previous calls
      mockAdminAPI.getCommandes.mockClear();

      // Attempt update
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

      // Should refresh data
      expect(mockAdminAPI.getCommandes).toHaveBeenCalled();
    });
  });

  describe("deleteCommande", () => {
    beforeEach(() => {
      mockAdminAPI.deleteCommande.mockResolvedValue(undefined);
    });

    it("should delete commande with API call", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      await act(async () => {
        await result.current.deleteCommande("cmd-1");
      });

      expect(mockAdminAPI.deleteCommande).toHaveBeenCalledWith("cmd-1");
      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Succès",
        "Commande supprimée avec succès"
      );
    });

    it("should remove commande from local state optimistically", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      // Load initial data
      await act(async () => {
        await result.current.loadCommandes();
      });

      expect(result.current.commandes).toHaveLength(1);
      expect(result.current.totalCommandes).toBe(1);

      // Delete commande
      await act(async () => {
        await result.current.deleteCommande("cmd-1");
      });

      // Should remove from local state
      expect(result.current.commandes).toHaveLength(0);
      expect(result.current.totalCommandes).toBe(0);
    });

    it("should handle delete errors and refresh data", async () => {
      const error = new Error("Delete failed");
      mockAdminAPI.deleteCommande.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminCommandes());

      // Load initial data
      await act(async () => {
        await result.current.loadCommandes();
      });

      // Clear previous calls
      mockAdminAPI.getCommandes.mockClear();

      // Attempt delete
      await act(async () => {
        const success = await result.current.deleteCommande("cmd-1");
        expect(success).toBe(false);
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Erreur",
        "Delete failed"
      );

      // Should refresh data
      expect(mockAdminAPI.getCommandes).toHaveBeenCalled();
    });
  });

  describe("refreshCommandes", () => {
    it("should refresh with last query parameters", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      // Initial load with specific parameters
      await act(async () => {
        await result.current.loadCommandes(
          2,
          "search term",
          { statut: StatutCommande.EN_COURS },
          "titre",
          "asc"
        );
      });

      // Clear mock calls
      mockAdminAPI.getCommandes.mockClear();

      // Refresh
      await act(async () => {
        await result.current.refreshCommandes();
      });

      // Should use same parameters as last query
      expect(mockAdminAPI.getCommandes).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: "search term",
        sortBy: "titre",
        sortDirection: "asc",
        statut: StatutCommande.EN_COURS,
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Succès",
        "Liste des commandes mise à jour"
      );
    });
  });

  describe("viewCommande", () => {
    beforeEach(() => {
      mockAdminAPI.getCommandeById.mockResolvedValue({
        id: "cmd-1",
        titre: "Test Commande Detail",
        statut: StatutCommande.EN_ATTENTE,
        createdAt: "2025-01-15T10:00:00Z",
        updatedAt: "2025-01-15T10:00:00Z",
        description: "Detailed description",
      });
    });

    it("should fetch commande details", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      let commande;
      await act(async () => {
        commande = await result.current.viewCommande("cmd-1");
      });

      expect(mockAdminAPI.getCommandeById).toHaveBeenCalledWith("cmd-1");
      expect(commande).toEqual({
        id: "cmd-1",
        titre: "Test Commande Detail",
        statut: StatutCommande.EN_ATTENTE,
        createdAt: "2025-01-15T10:00:00Z",
        updatedAt: "2025-01-15T10:00:00Z",
        description: "Detailed description",
      });
    });

    it("should handle fetch errors", async () => {
      const error = new Error("Fetch failed");
      mockAdminAPI.getCommandeById.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminCommandes());

      let commande;
      await act(async () => {
        commande = await result.current.viewCommande("cmd-1");
      });

      expect(commande).toBeNull();
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Erreur",
        "Fetch failed"
      );
    });
  });

  describe("utility functions", () => {
    it("getCommandeById should find commande in current list", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      // Load data
      await act(async () => {
        await result.current.loadCommandes();
      });

      const commande = result.current.getCommandeById("cmd-1");
      expect(commande?.titre).toBe("Test Commande 1");

      const notFound = result.current.getCommandeById("not-found");
      expect(notFound).toBeNull();
    });

    it("isCommandeInCurrentPage should check if commande exists", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      // Load data
      await act(async () => {
        await result.current.loadCommandes();
      });

      expect(result.current.isCommandeInCurrentPage("cmd-1")).toBe(true);
      expect(result.current.isCommandeInCurrentPage("not-found")).toBe(false);
    });

    it("clearError should reset error state", async () => {
      const { result } = renderHook(() => useAdminCommandes());

      // Trigger an error
      mockAdminAPI.getCommandes.mockRejectedValue(new Error("Test error"));
      await act(async () => {
        await result.current.loadCommandes();
      });

      expect(result.current.error).toBe("Test error");

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("custom options", () => {
    it("should use custom initial page and page size", async () => {
      const { result } = renderHook(() =>
        useAdminCommandes({
          initialPage: 3,
          pageSize: 20,
        })
      );

      expect(result.current.currentPage).toBe(3);

      await act(async () => {
        await result.current.loadCommandes();
      });

      expect(mockAdminAPI.getCommandes).toHaveBeenCalledWith({
        page: 3,
        limit: 20,
        search: undefined,
        sortBy: undefined,
        sortDirection: undefined,
      });
    });

    it("should use custom error handler", async () => {
      const customErrorHandler = jest.fn();

      const { result } = renderHook(() =>
        useAdminCommandes({
          onError: customErrorHandler,
        })
      );

      const error = new Error("Custom error test");
      mockAdminAPI.getCommandes.mockRejectedValue(error);

      await act(async () => {
        await result.current.loadCommandes();
      });

      expect(customErrorHandler).toHaveBeenCalledWith(error);
      expect(mockShowToast).not.toHaveBeenCalled(); // Should not use default toast
    });

    it("should use custom success handler", async () => {
      const customSuccessHandler = jest.fn();

      const { result } = renderHook(() =>
        useAdminCommandes({
          onSuccess: customSuccessHandler,
        })
      );

      await act(async () => {
        await result.current.refreshCommandes();
      });

      expect(customSuccessHandler).toHaveBeenCalledWith(
        "Liste des commandes mise à jour"
      );
      expect(mockShowToast).not.toHaveBeenCalled(); // Should not use default toast
    });
  });
});
