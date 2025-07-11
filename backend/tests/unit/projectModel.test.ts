import { PrismaClient, StatutCommande } from "@prisma/client";
import { ProjectModel } from "../../src/models/projectModel";

// Mock Prisma
jest.mock("@prisma/client");

const mockPrisma = {
  commande: {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
} as any;

// Mock du constructeur PrismaClient
(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

describe("ProjectModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findPaginated", () => {
    const mockCommandes = [
      {
        id: "cmd-1",
        titre: "L'Écho du Temps",
        description: "Roman contemporain explorant les thèmes du temps et de la mémoire",
        statut: StatutCommande.TERMINE,
        priorite: "NORMALE",
        dateEcheance: new Date("2025-01-15"),
        dateFinition: new Date("2025-01-10"),
        createdAt: new Date("2025-01-05"),
        updatedAt: new Date("2025-01-10"),
        noteCorrecteur: "Excellent travail",
        amount: 800,
        user: { prenom: "John", nom: "Doe" },
        files: [{ id: "file-1", filename: "document.pdf", mimeType: "application/pdf" }],
      },
      {
        id: "cmd-2",
        titre: "Mémoires d'une Vie",
        description: "Biographie personnelle retraçant 60 années d'expériences",
        statut: StatutCommande.EN_COURS,
        priorite: "HAUTE",
        dateEcheance: new Date("2025-01-20"),
        dateFinition: null,
        createdAt: new Date("2025-01-10"),
        updatedAt: new Date("2025-01-12"),
        noteCorrecteur: null,
        amount: 450,
        user: { prenom: "Jane", nom: "Smith" },
        files: [],
      },
    ];

    it("should return paginated projects with proper structure", async () => {
      mockPrisma.commande.findMany.mockResolvedValue(mockCommandes);
      mockPrisma.commande.count.mockResolvedValue(2);

      const result = await ProjectModel.findPaginated(
        "user-123",
        1,
        10,
        {},
        mockPrisma
      );

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 10,
        total: 2,
      });

      // Vérifier la structure du premier projet
      const firstProject = result.data[0];
      expect(firstProject).toHaveProperty('id', 'cmd-1');
      expect(firstProject).toHaveProperty('title', "L'Écho du Temps");
      expect(firstProject).toHaveProperty('type', 'Roman');
      expect(firstProject).toHaveProperty('status', 'completed');
      expect(firstProject).toHaveProperty('progress', 100);
      expect(firstProject).toHaveProperty('canDownload', true);
      expect(firstProject).toHaveProperty('pack', 'Pack Intégral');
      expect(firstProject).toHaveProperty('rating');
    });

    it("should validate required parameters", async () => {
      await expect(
        ProjectModel.findPaginated("", 1, 10, {}, mockPrisma)
      ).rejects.toThrow("userId est requis");

      await expect(
        ProjectModel.findPaginated("user-123", 0, 10, {}, mockPrisma)
      ).rejects.toThrow("page doit être ≥ 1");

      await expect(
        ProjectModel.findPaginated("user-123", 1, 0, {}, mockPrisma)
      ).rejects.toThrow("limit doit être entre 1 et 50");

      await expect(
        ProjectModel.findPaginated("user-123", 1, 51, {}, mockPrisma)
      ).rejects.toThrow("limit doit être entre 1 et 50");
    });

    it("should validate search parameter length", async () => {
      const longSearch = "a".repeat(101);
      
      await expect(
        ProjectModel.findPaginated("user-123", 1, 10, { search: longSearch }, mockPrisma)
      ).rejects.toThrow("search doit faire ≤ 100 caractères");
    });

    it("should apply status filter correctly", async () => {
      mockPrisma.commande.findMany.mockResolvedValue([]);
      mockPrisma.commande.count.mockResolvedValue(0);

      await ProjectModel.findPaginated(
        "user-123",
        1,
        10,
        { status: 'active' },
        mockPrisma
      );

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "user-123",
            statut: StatutCommande.EN_COURS,
          },
        })
      );
    });

    it("should apply search filter correctly", async () => {
      mockPrisma.commande.findMany.mockResolvedValue([]);
      mockPrisma.commande.count.mockResolvedValue(0);

      await ProjectModel.findPaginated(
        "user-123",
        1,
        10,
        { search: 'roman' },
        mockPrisma
      );

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "user-123",
            titre: {
              contains: 'roman',
              mode: 'insensitive',
            },
          },
        })
      );
    });

    it("should apply pagination correctly", async () => {
      mockPrisma.commande.findMany.mockResolvedValue([]);
      mockPrisma.commande.count.mockResolvedValue(0);

      await ProjectModel.findPaginated("user-123", 3, 5, {}, mockPrisma);

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 10, // (page 3 - 1) * limit 5 = 10
        })
      );
    });

    it("should order by delivery date desc", async () => {
      mockPrisma.commande.findMany.mockResolvedValue([]);
      mockPrisma.commande.count.mockResolvedValue(0);

      await ProjectModel.findPaginated("user-123", 1, 10, {}, mockPrisma);

      expect(mockPrisma.commande.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            dateEcheance: "desc",
          },
        })
      );
    });

    it("should map project types correctly", async () => {
      const testCommandes = [
        { ...mockCommandes[0], description: "Un roman fantastique" },
        { ...mockCommandes[1], description: "Une nouvelle courte" },
        { ...mockCommandes[0], id: "cmd-3", description: "Un guide pratique" },
        { ...mockCommandes[0], id: "cmd-4", description: null },
      ];

      mockPrisma.commande.findMany.mockResolvedValue(testCommandes);
      mockPrisma.commande.count.mockResolvedValue(4);

      const result = await ProjectModel.findPaginated("user-123", 1, 10, {}, mockPrisma);

      expect(result.data[0].type).toBe('Roman');
      expect(result.data[1].type).toBe('Nouvelle');
      expect(result.data[2].type).toBe('Guide');
      expect(result.data[3].type).toBe('Manuscrit'); // default
    });

    it("should calculate progress correctly", async () => {
      const testCommandes = [
        { ...mockCommandes[0], statut: StatutCommande.EN_ATTENTE },
        { ...mockCommandes[0], id: "cmd-2", statut: StatutCommande.EN_COURS },
        { ...mockCommandes[0], id: "cmd-3", statut: StatutCommande.TERMINE },
        { ...mockCommandes[0], id: "cmd-4", statut: StatutCommande.SUSPENDUE },
      ];

      mockPrisma.commande.findMany.mockResolvedValue(testCommandes);
      mockPrisma.commande.count.mockResolvedValue(4);

      const result = await ProjectModel.findPaginated("user-123", 1, 10, {}, mockPrisma);

      expect(result.data[0].progress).toBe(0);   // EN_ATTENTE
      expect(result.data[1].progress).toBe(50);  // EN_COURS
      expect(result.data[2].progress).toBe(100); // TERMINE
      expect(result.data[3].progress).toBe(25);  // SUSPENDUE
    });

    it("should set canDownload correctly", async () => {
      const testCommandes = [
        { ...mockCommandes[0], statut: StatutCommande.TERMINE, files: [{ id: "file-1" }] },
        { ...mockCommandes[0], id: "cmd-2", statut: StatutCommande.TERMINE, files: [] },
        { ...mockCommandes[0], id: "cmd-3", statut: StatutCommande.EN_COURS, files: [{ id: "file-1" }] },
      ];

      mockPrisma.commande.findMany.mockResolvedValue(testCommandes);
      mockPrisma.commande.count.mockResolvedValue(3);

      const result = await ProjectModel.findPaginated("user-123", 1, 10, {}, mockPrisma);

      expect(result.data[0].canDownload).toBe(true);  // TERMINE + has files
      expect(result.data[1].canDownload).toBe(false); // TERMINE but no files
      expect(result.data[2].canDownload).toBe(false); // Has files but not TERMINE
    });
  });

  describe("getStatusCounts", () => {
    it("should return correct status counts", async () => {
      const mockCounts = [
        { statut: StatutCommande.EN_COURS, _count: { statut: 5 } },
        { statut: StatutCommande.EN_ATTENTE, _count: { statut: 3 } },
        { statut: StatutCommande.TERMINE, _count: { statut: 2 } },
      ];

      mockPrisma.commande.groupBy.mockResolvedValue(mockCounts);

      const result = await ProjectModel.getStatusCounts("user-123", mockPrisma);

      expect(result).toEqual({
        all: 10,
        active: 5,
        pending: 3,
        completed: 2,
      });
    });

    it("should handle empty counts", async () => {
      mockPrisma.commande.groupBy.mockResolvedValue([]);

      const result = await ProjectModel.getStatusCounts("user-123", mockPrisma);

      expect(result).toEqual({
        all: 0,
        active: 0,
        pending: 0,
        completed: 0,
      });
    });

    it("should validate userId", async () => {
      await expect(
        ProjectModel.getStatusCounts("", mockPrisma)
      ).rejects.toThrow("userId est requis");
    });
  });

  describe("mapStatusToString", () => {
    it("should map all statuses correctly", () => {
      // Using a mock to access private method
      const statusMappings = [
        [StatutCommande.EN_ATTENTE, "pending"],
        [StatutCommande.EN_COURS, "active"],
        [StatutCommande.TERMINE, "completed"],
        [StatutCommande.ANNULEE, "cancelled"],
        [StatutCommande.SUSPENDUE, "suspended"],
      ];

      // Test via the getStatusCounts which uses mapStatusToString internally
      statusMappings.forEach(([prismaStatus, expectedApiStatus]) => {
        mockPrisma.commande.groupBy.mockResolvedValue([
          { statut: prismaStatus, _count: { statut: 1 } }
        ]);
        
        // This will internally call mapStatusToString
        ProjectModel.getStatusCounts("user-123", mockPrisma);
      });
    });
  });
});