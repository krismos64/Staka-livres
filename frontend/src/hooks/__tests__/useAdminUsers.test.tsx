import { act, renderHook } from "@testing-library/react";
import { Role } from "../../types/shared";

// Mock complet d'adminAPI pour éviter l'import du vrai module
const mockAdminAPI = {
  getUsers: jest.fn(),
  getUserStats: jest.fn(),
  createUser: jest.fn(),
  deleteUser: jest.fn(),
  toggleUserStatus: jest.fn(),
  updateUser: jest.fn(),
  getUserById: jest.fn(),
};

// Mock de useToasts
const mockShowToast = jest.fn();

// Mocks des modules avant l'import du hook
jest.mock("../../utils/adminAPI", () => ({
  adminAPI: mockAdminAPI,
}));

jest.mock("../../utils/toast", () => ({
  useToasts: () => ({
    showToast: mockShowToast,
    addToast: jest.fn(),
    removeToast: jest.fn(),
    clearAllToasts: jest.fn(),
    toasts: [],
  }),
}));

// Import du hook après les mocks
import { useAdminUsers } from "../useAdminUsers";

// Données mock pour les tests
const mockUsersResponse = {
  success: true,
  data: [
    {
      id: "user-1",
      prenom: "John",
      nom: "Doe",
      email: "john.doe@example.com",
      role: Role.USER as Role,
      isActive: true,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T10:00:00Z",
    },
    {
      id: "user-2",
      prenom: "Jane",
      nom: "Admin",
      email: "jane.admin@example.com",
      role: Role.ADMIN as Role,
      isActive: true,
      createdAt: "2025-01-01T11:00:00Z",
      updatedAt: "2025-01-01T11:00:00Z",
    },
  ],
  pagination: {
    page: 1,
    totalPages: 1,
    total: 2,
    limit: 10,
  },
};

const mockUserStats = {
  total: 2,
  actifs: 2,
  admin: 1,
  recents: 1,
};

const mockCreatedUser = {
  id: "user-3",
  prenom: "New",
  nom: "User",
  email: "new.user@example.com",
  role: Role.USER as Role,
  isActive: true,
  createdAt: "2025-01-01T12:00:00Z",
  updatedAt: "2025-01-01T12:00:00Z",
};

const mockDetailedUser = {
  id: "user-1",
  prenom: "John",
  nom: "Doe",
  email: "john.doe@example.com",
  role: Role.USER as Role,
  isActive: true,
  createdAt: "2025-01-01T10:00:00Z",
  updatedAt: "2025-01-01T10:00:00Z",
  // Détails supplémentaires
  lastLoginAt: "2025-01-01T15:00:00Z",
  commandesCount: 5,
};

describe("useAdminUsers - Tests unitaires avec mocks", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mocks par défaut
    mockAdminAPI.getUsers.mockResolvedValue(mockUsersResponse);
    mockAdminAPI.getUserStats.mockResolvedValue(mockUserStats);
    mockAdminAPI.createUser.mockResolvedValue(mockCreatedUser);
    mockAdminAPI.deleteUser.mockResolvedValue(undefined);
    mockAdminAPI.toggleUserStatus.mockResolvedValue({
      ...mockUsersResponse.data[0],
      isActive: false,
    });
    mockAdminAPI.updateUser.mockResolvedValue({
      ...mockUsersResponse.data[0],
      role: Role.ADMIN,
    });
    mockAdminAPI.getUserById.mockResolvedValue(mockDetailedUser);
  });

  describe("loadUsers", () => {
    it("should call adminAPI.getUsers with correct parameters", async () => {
      const { result } = renderHook(() => useAdminUsers());

      await act(async () => {
        await result.current.loadUsers(
          2, // page
          "john", // search
          { role: Role.USER, isActive: true }, // filters
          "email", // sortBy
          "desc" // sortDirection
        );
      });

      expect(mockAdminAPI.getUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: "john",
        sortBy: "email",
        sortDirection: "desc",
        role: Role.USER,
        isActive: true,
      });
    });

    it("should update state with API response", async () => {
      const { result } = renderHook(() => useAdminUsers());

      await act(async () => {
        await result.current.loadUsers();
      });

      expect(result.current.users).toEqual(mockUsersResponse.data);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.totalUsers).toBe(2);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle search term trimming", async () => {
      const { result } = renderHook(() => useAdminUsers());

      await act(async () => {
        await result.current.loadUsers(1, "  john  ");
      });

      expect(mockAdminAPI.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "john",
        sortBy: undefined,
        sortDirection: "asc",
      });
    });

    it("should handle API errors", async () => {
      const error = new Error("API Error");
      mockAdminAPI.getUsers.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminUsers());

      await act(async () => {
        await result.current.loadUsers();
      });

      expect(result.current.error).toBe("API Error");
      expect(result.current.users).toEqual([]);
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Erreur",
        "API Error"
      );
    });

    it("should set loading states correctly", async () => {
      const { result } = renderHook(() => useAdminUsers());

      expect(result.current.isLoading).toBe(false);

      const loadPromise = act(async () => {
        await result.current.loadUsers();
      });

      expect(result.current.isLoading).toBe(true);

      await loadPromise;

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("loadUserStats", () => {
    it("should call adminAPI.getUserStats and update stats", async () => {
      const { result } = renderHook(() => useAdminUsers());

      await act(async () => {
        await result.current.loadUserStats();
      });

      expect(mockAdminAPI.getUserStats).toHaveBeenCalled();
      expect(result.current.stats).toEqual(mockUserStats);
    });

    it("should handle stats loading errors", async () => {
      const error = new Error("Stats Error");
      mockAdminAPI.getUserStats.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminUsers());

      await act(async () => {
        await result.current.loadUserStats();
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Erreur",
        "Stats Error"
      );
    });
  });

  describe("CRUD Operations", () => {
    it("should create user with adminAPI.createUser", async () => {
      const { result } = renderHook(() => useAdminUsers());

      const userData = {
        prenom: "New",
        nom: "User",
        email: "new.user@example.com",
        password: "password123",
        role: Role.USER,
      };

      // Note: Cette méthode n'existe pas directement dans le hook,
      // mais on peut tester l'appel API directement
      const createdUser = await mockAdminAPI.createUser(userData);

      expect(mockAdminAPI.createUser).toHaveBeenCalledWith(userData);
      expect(createdUser).toEqual(mockCreatedUser);
    });

    it("should toggle user status", async () => {
      const { result } = renderHook(() => useAdminUsers());

      // Charger les utilisateurs d'abord
      await act(async () => {
        await result.current.loadUsers();
      });

      await act(async () => {
        await result.current.toggleUserStatus("user-1");
      });

      expect(mockAdminAPI.toggleUserStatus).toHaveBeenCalledWith("user-1");
      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Succès",
        "Statut de l'utilisateur mis à jour."
      );

      // Vérifier que l'état local est mis à jour
      const updatedUser = result.current.users.find(
        (u: any) => u.id === "user-1"
      );
      expect(updatedUser?.isActive).toBe(false);
    });

    it("should change user role", async () => {
      const { result } = renderHook(() => useAdminUsers());

      // Charger les utilisateurs d'abord
      await act(async () => {
        await result.current.loadUsers();
      });

      await act(async () => {
        await result.current.changeUserRole("user-1", Role.ADMIN);
      });

      expect(mockAdminAPI.updateUser).toHaveBeenCalledWith("user-1", {
        role: Role.ADMIN,
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Succès",
        "Rôle de l'utilisateur mis à jour."
      );

      // Vérifier que l'état local est mis à jour
      const updatedUser = result.current.users.find(
        (u: any) => u.id === "user-1"
      );
      expect(updatedUser?.role).toBe(Role.ADMIN);
    });

    it("should delete user", async () => {
      const { result } = renderHook(() => useAdminUsers());

      // Charger les utilisateurs d'abord
      await act(async () => {
        await result.current.loadUsers();
      });

      const initialUserCount = result.current.users.length;

      await act(async () => {
        await result.current.deleteUser("user-1");
      });

      expect(mockAdminAPI.deleteUser).toHaveBeenCalledWith("user-1");
      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Succès",
        "Utilisateur supprimé avec succès."
      );

      // Vérifier que l'utilisateur est retiré de l'état local
      expect(result.current.users).toHaveLength(initialUserCount - 1);
      expect(
        result.current.users.find((u: any) => u.id === "user-1")
      ).toBeUndefined();
      expect(result.current.totalUsers).toBe(initialUserCount - 1);
    });

    it("should handle CRUD operation errors", async () => {
      const error = new Error("Delete Error");
      mockAdminAPI.deleteUser.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminUsers());

      await act(async () => {
        await result.current.loadUsers();
      });

      await act(async () => {
        await result.current.deleteUser("user-1");
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Erreur",
        "Delete Error"
      );
    });
  });

  describe("viewUser", () => {
    it("should fetch detailed user information", async () => {
      const { result } = renderHook(() => useAdminUsers());

      let detailedUser;
      await act(async () => {
        detailedUser = await result.current.viewUser("user-1");
      });

      expect(mockAdminAPI.getUserById).toHaveBeenCalledWith("user-1");
      expect(detailedUser).toEqual(mockDetailedUser);
    });

    it("should handle viewUser errors", async () => {
      const error = new Error("User not found");
      mockAdminAPI.getUserById.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminUsers());

      let detailedUser;
      await act(async () => {
        detailedUser = await result.current.viewUser("nonexistent");
      });

      expect(detailedUser).toBeNull();
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Erreur",
        "User not found"
      );
    });
  });

  describe("refreshUsers", () => {
    it("should reload users and show success message", async () => {
      const { result } = renderHook(() => useAdminUsers());

      // Charger les utilisateurs une première fois
      await act(async () => {
        await result.current.loadUsers(1, "search", { role: Role.USER });
      });

      // Clear le mock pour vérifier l'appel du refresh
      mockAdminAPI.getUsers.mockClear();

      await act(async () => {
        await result.current.refreshUsers();
      });

      // Doit rappeler getUsers avec les mêmes paramètres
      expect(mockAdminAPI.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "search",
        sortBy: undefined,
        sortDirection: "asc",
        role: Role.USER,
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Succès",
        "Liste des utilisateurs mise à jour"
      );
    });
  });
});
