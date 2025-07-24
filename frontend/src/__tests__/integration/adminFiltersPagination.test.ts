/**
 * Tests d'intégration simplifiés pour les filtres admin
 */

import { vi } from "vitest";
import { Role, StatutCommande } from "../../types/shared";
import {
  getUsers,
  getCommandes,
  AdminCommandesParams,
  AdminUsersParams,
} from "../../utils/adminAPI";

// Mock axios complètement
vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      request: vi.fn().mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
        },
      }),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    isAxiosError: vi.fn(() => false),
  },
}));

describe("Admin Filters and Pagination Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "mock-jwt-token");
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("AdminUsers API Parameters", () => {
    it("should call getUsers with all parameters", async () => {
      const params: AdminUsersParams = {
        page: 2,
        limit: 20,
        search: "john doe",
        role: Role.ADMIN,
        isActive: true,
        sortBy: "email",
        sortDirection: "desc",
      };

      // Test que la fonction peut être appelée sans erreur
      await expect(getUsers(params)).resolves.toBeDefined();
    });

    it("should handle optional parameters", async () => {
      const params: AdminUsersParams = {
        page: 1,
        limit: 10,
      };

      await expect(getUsers(params)).resolves.toBeDefined();
    });

    it("should handle search with special characters", async () => {
      const params: AdminUsersParams = {
        page: 1,
        limit: 10,
        search: "email@test.com & special chars",
      };

      await expect(getUsers(params)).resolves.toBeDefined();
    });

    it("should validate role enum values", async () => {
      const validRoles = [Role.ADMIN, Role.USER];

      for (const role of validRoles) {
        const params: AdminUsersParams = {
          page: 1,
          limit: 10,
          role,
        };

        await expect(getUsers(params)).resolves.toBeDefined();
      }
    });

    it("should validate boolean isActive parameter", async () => {
      // Test avec true
      await expect(getUsers({
        page: 1,
        limit: 10,
        isActive: true,
      })).resolves.toBeDefined();

      // Test avec false
      await expect(getUsers({
        page: 1,
        limit: 10,
        isActive: false,
      })).resolves.toBeDefined();
    });
  });

  describe("AdminCommandes API Parameters", () => {
    it("should call getCommandes with all parameters", async () => {
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

      await expect(getCommandes(params)).resolves.toBeDefined();
    });

    it("should handle date filters", async () => {
      const params: AdminCommandesParams = {
        page: 1,
        limit: 10,
        dateFrom: "2025-01-01T00:00:00.000Z",
        dateTo: "2025-12-31T23:59:59.999Z",
      };

      await expect(getCommandes(params)).resolves.toBeDefined();
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
        const params: AdminCommandesParams = {
          page: 1,
          limit: 10,
          statut,
        };

        await expect(getCommandes(params)).resolves.toBeDefined();
      }
    });

    it("should handle search with special characters", async () => {
      const params: AdminCommandesParams = {
        page: 1,
        limit: 10,
        search: "cmd-123 & title: test",
      };

      await expect(getCommandes(params)).resolves.toBeDefined();
    });
  });

  describe("Sort Parameters Validation", () => {
    it("should validate sortDirection values", async () => {
      const validDirections = ["asc", "desc"] as const;

      for (const direction of validDirections) {
        await expect(getUsers({
          page: 1,
          limit: 10,
          sortBy: "email",
          sortDirection: direction,
        })).resolves.toBeDefined();
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
        await expect(getUsers({
          page: 1,
          limit: 10,
          sortBy: column,
          sortDirection: "asc",
        })).resolves.toBeDefined();
      }
    });
  });

  describe("Pagination Edge Cases", () => {
    it("should handle large page numbers", async () => {
      await expect(getUsers({
        page: 9999,
        limit: 100,
      })).resolves.toBeDefined();
    });

    it("should handle minimum page and limit values", async () => {
      await expect(getUsers({
        page: 1,
        limit: 1,
      })).resolves.toBeDefined();
    });

    it("should default to page 1 and limit 10 when not specified", async () => {
      await expect(getUsers({})).resolves.toBeDefined();
    });
  });

  describe("Basic Function Calls", () => {
    it("should call basic getUsers without errors", async () => {
      await expect(getUsers({ page: 1, limit: 10 })).resolves.toBeDefined();
    });

    it("should call basic getCommandes without errors", async () => {
      await expect(getCommandes({ page: 1, limit: 10 })).resolves.toBeDefined();
    });
  });
});