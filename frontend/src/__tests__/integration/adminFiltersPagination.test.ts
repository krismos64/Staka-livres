/**
 * Tests d'intégration pour valider la synchronisation des filtres,
 * tri et pagination entre frontend et backend
 */

import { vi } from "vitest";
import { Role, StatutCommande } from "../../types/shared";
import {
  adminAPI,
  AdminCommandesParams,
  AdminUsersParams,
} from "../../utils/adminAPI";

// Mock fetch pour intercepter les appels HTTP
global.fetch = vi.fn();
const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe("Admin Filters and Pagination Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock de réponse par défaut
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
        stats: { total: 0 },
      }),
    } as Response);

    // Mock de l'API token
    process.env.REACT_APP_API_URL = "http://localhost:3001";
    localStorage.setItem("token", "mock-jwt-token");
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("AdminUsers API Parameters", () => {
    it("should pass all filter parameters correctly to backend", async () => {
      const params: AdminUsersParams = {
        page: 2,
        limit: 20,
        search: "john doe",
        role: Role.ADMIN,
        isActive: true,
        sortBy: "email",
        sortDirection: "desc",
      };

      await adminAPI.getUsers(params);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/admin/users?page=2&limit=20&search=john+doe&role=ADMIN&isActive=true&sortBy=email&sortDirection=desc",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-token",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should handle optional parameters correctly", async () => {
      const params: AdminUsersParams = {
        page: 1,
        limit: 10,
        // search, role, isActive sont undefined
      };

      await adminAPI.getUsers(params);

      // Seuls page et limit doivent être présents
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/admin/users?page=1&limit=10",
        expect.any(Object)
      );
    });

    it("should encode special characters in search", async () => {
      const params: AdminUsersParams = {
        page: 1,
        limit: 10,
        search: "email@test.com & special chars",
      };

      await adminAPI.getUsers(params);

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("search=email%40test.com+%26+special+chars");
    });

    it("should validate role enum values", async () => {
      const validRoles = [Role.ADMIN, Role.MODERATEUR, Role.CLIENT];

      for (const role of validRoles) {
        mockFetch.mockClear();

        await adminAPI.getUsers({
          page: 1,
          limit: 10,
          role,
        });

        const callUrl = mockFetch.mock.calls[0][0] as string;
        expect(callUrl).toContain(`role=${role}`);
      }
    });

    it("should validate boolean isActive parameter", async () => {
      // Test avec true
      await adminAPI.getUsers({
        page: 1,
        limit: 10,
        isActive: true,
      });

      let callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("isActive=true");

      mockFetch.mockClear();

      // Test avec false
      await adminAPI.getUsers({
        page: 1,
        limit: 10,
        isActive: false,
      });

      callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("isActive=false");
    });
  });

  describe("AdminCommandes API Parameters", () => {
    it("should pass all filter parameters correctly to backend", async () => {
      const params: AdminCommandesParams = {
        page: 3,
        limit: 15,
        search: "commande test",
        statut: StatutCommande.EN_COURS,
        clientId: "user-123",
        dateFrom: "2025-01-01",
        dateTo: "2025-01-31",
        sortBy: "createdAt",
        sortDirection: "desc",
      };

      await adminAPI.getCommandes(params);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/admin/commandes?page=3&limit=15&search=commande+test&statut=EN_COURS&clientId=user-123&dateFrom=2025-01-01&dateTo=2025-01-31&sortBy=createdAt&sortDirection=desc",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-token",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should handle date filters correctly", async () => {
      const params: AdminCommandesParams = {
        page: 1,
        limit: 10,
        dateFrom: "2025-01-01T00:00:00.000Z",
        dateTo: "2025-12-31T23:59:59.999Z",
      };

      await adminAPI.getCommandes(params);

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("dateFrom=2025-01-01T00%3A00%3A00.000Z");
      expect(callUrl).toContain("dateTo=2025-12-31T23%3A59%3A59.999Z");
    });

    it("should validate StatutCommande enum values", async () => {
      const validStatuts = [
        StatutCommande.EN_ATTENTE,
        StatutCommande.EN_COURS,
        StatutCommande.TERMINE,
        StatutCommande.ANNULEE,
        StatutCommande.SUSPENDUE,
      ];

      for (const statut of validStatuts) {
        mockFetch.mockClear();

        await adminAPI.getCommandes({
          page: 1,
          limit: 10,
          statut,
        });

        const callUrl = mockFetch.mock.calls[0][0] as string;
        expect(callUrl).toContain(`statut=${statut}`);
      }
    });

    it("should handle search with special characters", async () => {
      const params: AdminCommandesParams = {
        page: 1,
        limit: 10,
        search: "cmd-123 & title: test",
      };

      await adminAPI.getCommandes(params);

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("search=cmd-123+%26+title%3A+test");
    });
  });

  describe("Sort Parameters Validation", () => {
    it("should validate sortDirection values", async () => {
      const validDirections = ["asc", "desc"] as const;

      for (const direction of validDirections) {
        mockFetch.mockClear();

        await adminAPI.getUsers({
          page: 1,
          limit: 10,
          sortBy: "email",
          sortDirection: direction,
        });

        const callUrl = mockFetch.mock.calls[0][0] as string;
        expect(callUrl).toContain(`sortDirection=${direction}`);
      }
    });

    it("should handle sortBy parameter for different columns", async () => {
      const commonSortColumns = [
        "createdAt",
        "email",
        "role",
        "titre",
        "statut",
      ];

      for (const column of commonSortColumns) {
        mockFetch.mockClear();

        await adminAPI.getUsers({
          page: 1,
          limit: 10,
          sortBy: column,
          sortDirection: "asc",
        });

        const callUrl = mockFetch.mock.calls[0][0] as string;
        expect(callUrl).toContain(`sortBy=${column}`);
      }
    });
  });

  describe("Pagination Edge Cases", () => {
    it("should handle large page numbers", async () => {
      await adminAPI.getUsers({
        page: 9999,
        limit: 100,
      });

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("page=9999");
      expect(callUrl).toContain("limit=100");
    });

    it("should handle minimum page and limit values", async () => {
      await adminAPI.getUsers({
        page: 1,
        limit: 1,
      });

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("page=1");
      expect(callUrl).toContain("limit=1");
    });

    it("should default to page 1 and limit 10 when not specified", async () => {
      await adminAPI.getUsers({});

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("page=1");
      expect(callUrl).toContain("limit=10");
    });
  });

  describe("Error Handling", () => {
    it("should throw error when API returns error status", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ message: "Invalid parameters" }),
      } as Response);

      await expect(
        adminAPI.getUsers({
          page: 1,
          limit: 10,
        })
      ).rejects.toThrow();
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(
        adminAPI.getCommandes({
          page: 1,
          limit: 10,
        })
      ).rejects.toThrow("Network error");
    });

    it("should handle malformed JSON responses", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as Response);

      await expect(
        adminAPI.getUsers({
          page: 1,
          limit: 10,
        })
      ).rejects.toThrow("Invalid JSON");
    });
  });

  describe("Authentication and Headers", () => {
    it("should include Authorization header when token is present", async () => {
      localStorage.setItem("token", "test-jwt-token");

      await adminAPI.getUsers({ page: 1, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-jwt-token",
          }),
        })
      );
    });

    it("should handle missing token gracefully", async () => {
      localStorage.removeItem("token");

      await adminAPI.getUsers({ page: 1, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });

    it("should set correct Content-Type header", async () => {
      await adminAPI.getCommandes({ page: 1, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("URL Construction", () => {
    it("should construct correct base URLs", async () => {
      await adminAPI.getUsers({ page: 1, limit: 10 });
      let callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toMatch(/^http:\/\/localhost:3001\/admin\/users/);

      mockFetch.mockClear();

      await adminAPI.getCommandes({ page: 1, limit: 10 });
      callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toMatch(/^http:\/\/localhost:3001\/admin\/commandes/);
    });

    it("should handle query parameter encoding correctly", async () => {
      const complexParams: AdminUsersParams = {
        page: 1,
        limit: 10,
        search: "test search with spaces & symbols",
        role: Role.ADMIN,
        isActive: true,
        sortBy: "email",
        sortDirection: "desc",
      };

      await adminAPI.getUsers(complexParams);

      const callUrl = mockFetch.mock.calls[0][0] as string;
      const url = new URL(callUrl);

      // Vérifier que tous les paramètres sont présents
      expect(url.searchParams.get("page")).toBe("1");
      expect(url.searchParams.get("limit")).toBe("10");
      expect(url.searchParams.get("search")).toBe(
        "test search with spaces & symbols"
      );
      expect(url.searchParams.get("role")).toBe("ADMIN");
      expect(url.searchParams.get("isActive")).toBe("true");
      expect(url.searchParams.get("sortBy")).toBe("email");
      expect(url.searchParams.get("sortDirection")).toBe("desc");
    });
  });
});
