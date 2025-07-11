import { PrismaClient, StatutCommande } from "@prisma/client";
import { ProjectModel } from "../../src/models/projectModel";

// Mock Prisma
jest.mock("@prisma/client");

const mockPrisma = {
  commande: {
    findMany: jest.fn(),
  },
} as any;

// Mock du constructeur PrismaClient
(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

describe("ProjectModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByUserAndStatus", () => {
    const mockCommandes = [
      {
        id: "cmd-1",
        titre: "Projet 1",
        statut: StatutCommande.EN_COURS,
        updatedAt: new Date("2024-01-02"),
      },
      {
        id: "cmd-2",
        titre: "Projet 2",
        statut: StatutCommande.EN_COURS,
        updatedAt: new Date("2024-01-01"),
      },
    ];

    const expectedProjects = [
      {
        id: "cmd-1",
        title: "Projet 1",
        status: StatutCommande.EN_COURS,
        updatedAt: new Date("2024-01-02"),
      },
      {
        id: "cmd-2",
        title: "Projet 2",
        status: StatutCommande.EN_COURS,
        updatedAt: new Date("2024-01-01"),
      },
    ];

    it("should return projects for valid user and status", async () => {
      mockPrisma.commande.findMany.mockResolvedValue(mockCommandes);

      const result = await ProjectModel.findByUserAndStatus(
        "user-123",
        StatutCommande.EN_COURS,
        3,
        mockPrisma
      );

      expect(result).toEqual(expectedProjects);
      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          statut: StatutCommande.EN_COURS,
        },
        select: {
          id: true,
          titre: true,
          statut: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 3,
      });
    });

    it("should use default status EN_COURS when status not provided", async () => {
      mockPrisma.commande.findMany.mockResolvedValue(mockCommandes);

      await ProjectModel.findByUserAndStatus("user-123", undefined, 3, mockPrisma);

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          statut: StatutCommande.EN_COURS,
        },
        select: {
          id: true,
          titre: true,
          statut: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 3,
      });
    });

    it("should use default limit 3 when limit not provided", async () => {
      mockPrisma.commande.findMany.mockResolvedValue(mockCommandes);

      await ProjectModel.findByUserAndStatus("user-123", StatutCommande.EN_COURS, undefined, mockPrisma);

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          statut: StatutCommande.EN_COURS,
        },
        select: {
          id: true,
          titre: true,
          statut: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 3,
      });
    });

    it("should throw error for empty userId", async () => {
      await expect(
        ProjectModel.findByUserAndStatus("", StatutCommande.EN_COURS, 3, mockPrisma)
      ).rejects.toThrow("userId est requis");
    });

    it("should throw error for null userId", async () => {
      await expect(
        ProjectModel.findByUserAndStatus(null as any, StatutCommande.EN_COURS, 3, mockPrisma)
      ).rejects.toThrow("userId est requis");
    });

    it("should throw error for limit less than 1", async () => {
      await expect(
        ProjectModel.findByUserAndStatus("user-123", StatutCommande.EN_COURS, 0, mockPrisma)
      ).rejects.toThrow("limit doit être entre 1 et 20");
    });

    it("should throw error for limit greater than 20", async () => {
      await expect(
        ProjectModel.findByUserAndStatus("user-123", StatutCommande.EN_COURS, 21, mockPrisma)
      ).rejects.toThrow("limit doit être entre 1 et 20");
    });

    it("should throw error for invalid status", async () => {
      await expect(
        ProjectModel.findByUserAndStatus("user-123", "INVALID_STATUS" as any, 3, mockPrisma)
      ).rejects.toThrow("Statut invalide");
    });

    it("should handle different valid statuses", async () => {
      const statuses = [
        StatutCommande.EN_ATTENTE,
        StatutCommande.EN_COURS,
        StatutCommande.TERMINE,
        StatutCommande.ANNULEE,
        StatutCommande.SUSPENDUE,
      ];

      for (const status of statuses) {
        mockPrisma.commande.findMany.mockResolvedValue([]);
        
        await ProjectModel.findByUserAndStatus("user-123", status, 3, mockPrisma);
        
        expect(mockPrisma.commande.findMany).toHaveBeenCalledWith({
          where: {
            userId: "user-123",
            statut: status,
          },
          select: {
            id: true,
            titre: true,
            statut: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 3,
        });
      }
    });

    it("should handle empty results", async () => {
      mockPrisma.commande.findMany.mockResolvedValue([]);

      const result = await ProjectModel.findByUserAndStatus(
        "user-123",
        StatutCommande.EN_COURS,
        3,
        mockPrisma
      );

      expect(result).toEqual([]);
    });

    it("should respect the limit parameter", async () => {
      const mockData = Array.from({ length: 5 }, (_, i) => ({
        id: `cmd-${i}`,
        titre: `Projet ${i}`,
        statut: StatutCommande.EN_COURS,
        updatedAt: new Date(),
      }));

      mockPrisma.commande.findMany.mockResolvedValue(mockData);

      await ProjectModel.findByUserAndStatus("user-123", StatutCommande.EN_COURS, 2, mockPrisma);

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          statut: StatutCommande.EN_COURS,
        },
        select: {
          id: true,
          titre: true,
          statut: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 2,
      });
    });
  });

  describe("findByUser", () => {
    const mockCommandes = [
      {
        id: "cmd-1",
        titre: "Projet 1",
        statut: StatutCommande.EN_COURS,
        updatedAt: new Date("2024-01-02"),
      },
      {
        id: "cmd-2",
        titre: "Projet 2",
        statut: StatutCommande.TERMINE,
        updatedAt: new Date("2024-01-01"),
      },
    ];

    it("should return all user projects without status filter", async () => {
      mockPrisma.commande.findMany.mockResolvedValue(mockCommandes);

      const result = await ProjectModel.findByUser("user-123", 10, mockPrisma);

      expect(result).toHaveLength(2);
      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
        },
        select: {
          id: true,
          titre: true,
          statut: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
      });
    });

    it("should throw error for empty userId", async () => {
      await expect(
        ProjectModel.findByUser("", 10, mockPrisma)
      ).rejects.toThrow("userId est requis");
    });

    it("should throw error for invalid limit", async () => {
      await expect(
        ProjectModel.findByUser("user-123", 0, mockPrisma)
      ).rejects.toThrow("limit doit être entre 1 et 20");

      await expect(
        ProjectModel.findByUser("user-123", 21, mockPrisma)
      ).rejects.toThrow("limit doit être entre 1 et 20");
    });

    it("should use default limit 10", async () => {
      mockPrisma.commande.findMany.mockResolvedValue([]);

      await ProjectModel.findByUser("user-123", undefined, mockPrisma);

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
        },
        select: {
          id: true,
          titre: true,
          statut: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
      });
    });
  });
});