import { PrismaClient, StatutCommande } from "@prisma/client";
import {
  AdminCommandeService,
  CommandeFilters,
} from "../../src/services/adminCommandeService";

// Mock Prisma
jest.mock("@prisma/client");

const mockPrisma = {
  commande: {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as any;

// Mock du constructeur PrismaClient
(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

describe("AdminCommandeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCommandes", () => {
    const mockCommandes = [
      {
        id: "cmd-1",
        titre: "Test Commande 1",
        statut: StatutCommande.EN_ATTENTE,
        createdAt: new Date("2024-01-01"),
        user: {
          id: "user-1",
          prenom: "John",
          nom: "Doe",
          email: "john@example.com",
        },
      },
      {
        id: "cmd-2",
        titre: "Test Commande 2",
        statut: StatutCommande.EN_COURS,
        createdAt: new Date("2024-01-02"),
        user: {
          id: "user-2",
          prenom: "Jane",
          nom: "Smith",
          email: "jane@example.com",
        },
      },
    ];

    const mockGroupByStats = [
      { statut: StatutCommande.EN_ATTENTE, _count: { statut: 1 } },
      { statut: StatutCommande.EN_COURS, _count: { statut: 1 } },
    ];

    beforeEach(() => {
      mockPrisma.commande.findMany.mockResolvedValue(mockCommandes);
      mockPrisma.commande.count.mockResolvedValue(2);
      mockPrisma.commande.groupBy.mockResolvedValue(mockGroupByStats);
    });

    it("devrait retourner toutes les commandes quand aucun filtre n'est appliqué", async () => {
      const result = await AdminCommandeService.getCommandes(
        1,
        10,
        {},
        mockPrisma
      );

      // Vérifier que Prisma est appelé avec une clause WHERE vide
      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}, // WHERE clause doit être vide
        })
      );

      expect(mockPrisma.commande.count).toHaveBeenCalledWith({
        where: {}, // WHERE clause doit être vide
      });

      expect(mockPrisma.commande.groupBy).toHaveBeenCalledWith({
        by: ["statut"],
        where: {}, // WHERE clause doit être vide
        _count: {
          statut: true,
        },
      });

      // Vérifier que les données sont bien retournées
      expect(result.data).toHaveLength(2);
      expect(result.stats.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("devrait retourner la bonne structure de données", async () => {
      const result = await AdminCommandeService.getCommandes(
        1,
        10,
        {},
        mockPrisma
      );

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("stats");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("totalPages");
      expect(result.stats).toHaveProperty("total");
      expect(result.stats).toHaveProperty("byStatut");
    });

    it("devrait calculer correctement les statistiques par statut", async () => {
      const result = await AdminCommandeService.getCommandes(
        1,
        10,
        {},
        mockPrisma
      );

      expect(result.stats.total).toBe(2);
      expect(result.stats.byStatut[StatutCommande.EN_ATTENTE]).toBe(1);
      expect(result.stats.byStatut[StatutCommande.EN_COURS]).toBe(1);
      expect(result.stats.byStatut[StatutCommande.TERMINE]).toBe(0);
      expect(result.stats.byStatut[StatutCommande.ANNULEE]).toBe(0);
      expect(result.stats.byStatut[StatutCommande.SUSPENDUE]).toBe(0);
    });

    it("devrait calculer correctement la pagination", async () => {
      const result = await AdminCommandeService.getCommandes(
        1,
        1,
        {},
        mockPrisma
      );

      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);

      // Vérifier que skip et take sont correctement passés
      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 1,
        })
      );
    });

    it("devrait appliquer le filtre de recherche", async () => {
      const filters: CommandeFilters = { search: "john" };
      await AdminCommandeService.getCommandes(1, 10, filters, mockPrisma);

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { id: { contains: "john" } },
              { user: { email: { contains: "john" } } },
            ],
          },
        })
      );
    });

    it("devrait appliquer le filtre par statut", async () => {
      const filters: CommandeFilters = { statut: StatutCommande.EN_COURS };
      await AdminCommandeService.getCommandes(1, 10, filters, mockPrisma);

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { statut: StatutCommande.EN_COURS },
        })
      );
    });

    it("devrait appliquer le filtre par clientId", async () => {
      const filters: CommandeFilters = { clientId: "user-123" };
      await AdminCommandeService.getCommandes(1, 10, filters, mockPrisma);

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-123" },
        })
      );
    });

    it("devrait appliquer les filtres de date", async () => {
      const dateFrom = new Date("2024-01-01");
      const dateTo = new Date("2024-01-31");
      const filters: CommandeFilters = { dateFrom, dateTo };

      await AdminCommandeService.getCommandes(1, 10, filters, mockPrisma);

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        })
      );
    });

    it("devrait combiner plusieurs filtres", async () => {
      const filters: CommandeFilters = {
        search: "test",
        statut: StatutCommande.EN_COURS,
        clientId: "user-123",
      };

      await AdminCommandeService.getCommandes(1, 10, filters, mockPrisma);

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { id: { contains: "test" } },
              { user: { email: { contains: "test" } } },
            ],
            statut: StatutCommande.EN_COURS,
            userId: "user-123",
          },
        })
      );
    });
  });

  describe("updateCommandeStatut", () => {
    const mockCommande = {
      id: "cmd-1",
      titre: "Test Commande",
      statut: StatutCommande.EN_ATTENTE,
      user: {
        id: "user-1",
        prenom: "John",
        nom: "Doe",
        email: "john@example.com",
      },
    };

    it("devrait mettre à jour le statut avec succès", async () => {
      mockPrisma.commande.findUnique.mockResolvedValue(mockCommande);
      mockPrisma.commande.update.mockResolvedValue({
        ...mockCommande,
        statut: StatutCommande.EN_COURS,
      });

      const result = await AdminCommandeService.updateCommandeStatut(
        "cmd-1",
        StatutCommande.EN_COURS,
        mockPrisma
      );

      expect(mockPrisma.commande.findUnique).toHaveBeenCalledWith({
        where: { id: "cmd-1" },
      });

      expect(mockPrisma.commande.update).toHaveBeenCalledWith({
        where: { id: "cmd-1" },
        data: {
          statut: StatutCommande.EN_COURS,
          updatedAt: expect.any(Date),
        },
        include: {
          user: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
            },
          },
        },
      });

      expect(result.statut).toBe(StatutCommande.EN_COURS);
    });

    it("devrait lever une erreur si la commande n'existe pas", async () => {
      mockPrisma.commande.findUnique.mockResolvedValue(null);

      await expect(
        AdminCommandeService.updateCommandeStatut(
          "cmd-999",
          StatutCommande.EN_COURS,
          mockPrisma
        )
      ).rejects.toThrow("Commande non trouvée");

      expect(mockPrisma.commande.update).not.toHaveBeenCalled();
    });

    it("devrait lever une erreur si le statut est invalide", async () => {
      await expect(
        AdminCommandeService.updateCommandeStatut(
          "cmd-1",
          "STATUT_INVALIDE" as any,
          mockPrisma
        )
      ).rejects.toThrow("Statut invalide");

      expect(mockPrisma.commande.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.commande.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteCommande", () => {
    const mockCommande = {
      id: "cmd-1",
      titre: "Test Commande",
      statut: StatutCommande.EN_ATTENTE,
    };

    it("devrait supprimer la commande avec succès", async () => {
      mockPrisma.commande.findUnique.mockResolvedValue(mockCommande);
      mockPrisma.commande.delete.mockResolvedValue(mockCommande);

      await AdminCommandeService.deleteCommande("cmd-1", mockPrisma);

      expect(mockPrisma.commande.findUnique).toHaveBeenCalledWith({
        where: { id: "cmd-1" },
      });

      expect(mockPrisma.commande.delete).toHaveBeenCalledWith({
        where: { id: "cmd-1" },
      });
    });

    it("devrait lever une erreur si la commande n'existe pas", async () => {
      mockPrisma.commande.findUnique.mockResolvedValue(null);

      await expect(
        AdminCommandeService.deleteCommande("cmd-999", mockPrisma)
      ).rejects.toThrow("Commande non trouvée");

      expect(mockPrisma.commande.delete).not.toHaveBeenCalled();
    });
  });
});
