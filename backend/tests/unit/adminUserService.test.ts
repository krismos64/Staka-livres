import { Role } from "@prisma/client";
import {
  AdminUserService,
  CreateUserData,
  UpdateUserData,
} from "../../src/services/adminUserService";

// Mock de Prisma
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    commande: {
      deleteMany: jest.fn(),
    },
    notification: {
      deleteMany: jest.fn(),
    },
    message: {
      deleteMany: jest.fn(),
    },
    file: {
      deleteMany: jest.fn(),
    },
    paymentMethod: {
      deleteMany: jest.fn(),
    },
    supportRequest: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
  Role: {
    USER: "USER",
    ADMIN: "ADMIN",
  },
}));

// Mock de bcryptjs
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
}));

const mockPrisma = new (require("@prisma/client").PrismaClient)();

describe("AdminUserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUsers", () => {
    it("devrait récupérer les utilisateurs avec pagination", async () => {
      const mockUsers = [
        {
          id: "1",
          prenom: "Jean",
          nom: "Dupont",
          email: "jean@example.com",
          role: Role.USER,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await AdminUserService.getUsers(
        {},
        { page: 1, limit: 10 }
      );

      expect(result.users).toEqual(mockUsers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.objectContaining({
          id: true,
          prenom: true,
          nom: true,
          email: true,
          role: true,
          isActive: true,
        }),
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
    });

    it("devrait appliquer les filtres de recherche", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await AdminUserService.getUsers(
        { search: "Jean", role: Role.USER, isActive: true },
        { page: 1, limit: 10 }
      );

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { prenom: { contains: "Jean", mode: "insensitive" } },
            { nom: { contains: "Jean", mode: "insensitive" } },
            { email: { contains: "Jean", mode: "insensitive" } },
          ],
          role: Role.USER,
          isActive: true,
        },
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
    });
  });

  describe("getUserById", () => {
    it("devrait récupérer un utilisateur par ID", async () => {
      const mockUser = {
        id: "1",
        prenom: "Jean",
        nom: "Dupont",
        email: "jean@example.com",
        role: Role.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          commandes: 2,
          sentMessages: 5,
          receivedMessages: 3,
          notifications: 1,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await AdminUserService.getUserById("1");

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        select: expect.objectContaining({
          _count: expect.any(Object),
        }),
      });
    });

    it("devrait lever une erreur si l'utilisateur n'existe pas", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(AdminUserService.getUserById("inexistant")).rejects.toThrow(
        "Utilisateur avec l'ID inexistant introuvable"
      );
    });
  });

  describe("createUser", () => {
    it("devrait créer un nouvel utilisateur", async () => {
      const userData: CreateUserData = {
        prenom: "Jean",
        nom: "Dupont",
        email: "jean@example.com",
        password: "password123",
        role: Role.USER,
      };

      const mockCreatedUser = {
        id: "1",
        prenom: "Jean",
        nom: "Dupont",
        email: "jean@example.com",
        role: Role.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null); // Email n'existe pas
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await AdminUserService.createUser(userData);

      expect(result).toEqual(mockCreatedUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: "hashedPassword",
          isActive: true,
        },
        select: expect.any(Object),
      });
    });

    it("devrait lever une erreur si l'email existe déjà", async () => {
      const userData: CreateUserData = {
        prenom: "Jean",
        nom: "Dupont",
        email: "jean@example.com",
        password: "password123",
        role: Role.USER,
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: "existing" });

      await expect(AdminUserService.createUser(userData)).rejects.toThrow(
        "Un utilisateur avec l'email jean@example.com existe déjà"
      );
    });
  });

  describe("updateUser", () => {
    it("devrait mettre à jour un utilisateur", async () => {
      const updateData: UpdateUserData = {
        prenom: "Jean-Pierre",
        isActive: false,
      };

      const existingUser = {
        id: "1",
        email: "jean@example.com",
        role: Role.USER,
        isActive: true,
      };

      const updatedUser = {
        ...existingUser,
        ...updateData,
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await AdminUserService.updateUser("1", updateData);

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: updateData,
        select: expect.any(Object),
      });
    });

    it("devrait empêcher la désactivation du dernier admin", async () => {
      const updateData: UpdateUserData = { isActive: false };

      const existingUser = {
        id: "1",
        email: "admin@example.com",
        role: Role.ADMIN,
        isActive: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.count.mockResolvedValue(1); // Un seul admin actif

      await expect(
        AdminUserService.updateUser("1", updateData)
      ).rejects.toThrow("Impossible de désactiver le dernier administrateur");
    });
  });

  describe("deleteUser", () => {
    it("devrait supprimer un utilisateur et ses données (RGPD)", async () => {
      const existingUser = {
        id: "1",
        email: "user@example.com",
        role: Role.USER,
        isActive: true,
        _count: {
          commandes: 1,
          sentMessages: 2,
          receivedMessages: 1,
          notifications: 3,
          files: 1,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          file: { deleteMany: jest.fn() },
          notification: { deleteMany: jest.fn() },
          message: { deleteMany: jest.fn() },
          commande: { deleteMany: jest.fn() },
          paymentMethod: { deleteMany: jest.fn() },
          supportRequest: { deleteMany: jest.fn() },
          user: { delete: jest.fn() },
        };
        return callback(tx);
      });

      mockPrisma.$transaction.mockImplementation(mockTransaction);

      const result = await AdminUserService.deleteUser("1");

      expect(result.message).toBe("Utilisateur supprimé définitivement (RGPD)");
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("devrait empêcher la suppression du dernier admin actif", async () => {
      const existingUser = {
        id: "1",
        email: "admin@example.com",
        role: Role.ADMIN,
        isActive: true,
        _count: {},
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.count.mockResolvedValue(1); // Un seul admin actif

      await expect(AdminUserService.deleteUser("1")).rejects.toThrow(
        "Impossible de supprimer le dernier administrateur actif"
      );
    });
  });

  describe("getUserStats", () => {
    it("devrait retourner les statistiques des utilisateurs", async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(95) // actifs
        .mockResolvedValueOnce(2) // admins
        .mockResolvedValueOnce(10); // récents

      const result = await AdminUserService.getUserStats();

      expect(result).toEqual({
        total: 100,
        actifs: 95,
        inactifs: 5,
        admin: 2,
        users: 98,
        recents: 10,
      });
    });
  });

  describe("toggleUserStatus", () => {
    it("devrait activer un utilisateur inactif", async () => {
      const user = {
        id: "1",
        email: "user@example.com",
        role: Role.USER,
        isActive: false,
      };

      const updatedUser = { ...user, isActive: true };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await AdminUserService.toggleUserStatus("1");

      expect(result.isActive).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { isActive: true },
        select: expect.any(Object),
      });
    });

    it("devrait empêcher la désactivation du dernier admin", async () => {
      const user = {
        id: "1",
        email: "admin@example.com",
        role: Role.ADMIN,
        isActive: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.count.mockResolvedValue(1); // Un seul admin actif

      await expect(AdminUserService.toggleUserStatus("1")).rejects.toThrow(
        "Impossible de désactiver le dernier administrateur"
      );
    });
  });
});
