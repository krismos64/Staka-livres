import express from "express";
import request from "supertest";

// Mock Prisma
const mockPrismaCommande = {
  aggregate: jest.fn(),
};

const mockPrisma = {
  commande: mockPrismaCommande,
};

// Mock du middleware d'authentification
const mockAuth = (req: any, res: any, next: any) => {
  req.user = { id: "user-test-id" };
  next();
};

// Mock des modules avant import
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock("../../src/middleware/auth", () => ({
  authenticateToken: mockAuth,
}));

// Import après les mocks
import statsRoutes from "../../src/routes/stats";

// Configuration du test avec une app Express
const app = express();
app.use(express.json());
app.use("/stats", statsRoutes);

describe("Stats Controller Unit Tests", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe("GET /stats/annual", () => {
    it("devrait retourner les statistiques annuelles pour 2025", async () => {
      const mockAggregateResult = {
        _sum: {
          amount: 234800, // 2348€ en centimes
        },
        _count: {
          id: 5, // 5 commandes
        },
      };

      mockPrismaCommande.aggregate.mockResolvedValue(mockAggregateResult);

      const response = await request(app)
        .get("/stats/annual?year=2025");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        totalSpent: 234800,
        pagesCorrected: 1174, // 234800 / 200 = 1174 pages estimées
        orders: 5,
      });

      // Vérifier les paramètres de la requête Prisma
      const aggregateCall = mockPrismaCommande.aggregate.mock.calls[0][0];
      expect(aggregateCall.where.userId).toBe("user-test-id");
      expect(aggregateCall.where.paymentStatus).toBe("paid");
      expect(aggregateCall.where.updatedAt.gte).toEqual(new Date(2025, 0, 1));
      expect(aggregateCall.where.updatedAt.lt).toEqual(new Date(2026, 0, 1));
      expect(aggregateCall._sum.amount).toBe(true);
      expect(aggregateCall._count.id).toBe(true);
    });

    it("devrait retourner zéro pour un utilisateur sans commandes", async () => {
      const mockAggregateResult = {
        _sum: {
          amount: null, // Aucun montant
        },
        _count: {
          id: 0, // Aucune commande
        },
      };

      mockPrismaCommande.aggregate.mockResolvedValue(mockAggregateResult);

      const response = await request(app)
        .get("/stats/annual?year=2024");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        totalSpent: 0,
        pagesCorrected: 0,
        orders: 0,
      });
    });

    it("devrait valider les années valides", async () => {
      const validYears = ["2020", "2024", "2025"];
      
      for (const year of validYears) {
        mockPrismaCommande.aggregate.mockResolvedValue({
          _sum: { amount: 0 },
          _count: { id: 0 },
        });

        const response = await request(app)
          .get(`/stats/annual?year=${year}`);

        expect(response.status).toBe(200);
      }
    });

    it("devrait retourner 400 pour une année invalide", async () => {
      const invalidYears = ["abc", "20", "12345", ""];
      
      for (const year of invalidYears) {
        const response = await request(app)
          .get(`/stats/annual?year=${year}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
      }
    });

    it("devrait retourner 400 si le paramètre year est manquant", async () => {
      const response = await request(app)
        .get("/stats/annual");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("devrait gérer les erreurs de base de données", async () => {
      mockPrismaCommande.aggregate.mockRejectedValue(new Error("Erreur DB"));

      const response = await request(app)
        .get("/stats/annual?year=2025");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });

    it("devrait calculer correctement les pages corrigées basées sur le montant", async () => {
      const testCases = [
        { amount: 20000, expectedPages: 100 }, // 200€ = 100 pages
        { amount: 46800, expectedPages: 234 }, // 468€ = 234 pages
        { amount: 100, expectedPages: 1 },     // 1€ = 1 page (arrondi)
        { amount: 50, expectedPages: 0 },      // 0.5€ = 0 page (arrondi)
      ];

      for (const testCase of testCases) {
        mockPrismaCommande.aggregate.mockResolvedValue({
          _sum: { amount: testCase.amount },
          _count: { id: 1 },
        });

        const response = await request(app)
          .get("/stats/annual?year=2025");

        expect(response.status).toBe(200);
        expect(response.body.pagesCorrected).toBe(testCase.expectedPages);
      }
    });

    it("devrait filtrer correctement par année", async () => {
      mockPrismaCommande.aggregate.mockResolvedValue({
        _sum: { amount: 10000 },
        _count: { id: 1 },
      });

      await request(app).get("/stats/annual?year=2023");

      const aggregateCall = mockPrismaCommande.aggregate.mock.calls[0][0];
      expect(aggregateCall.where.updatedAt.gte).toEqual(new Date(2023, 0, 1));
      expect(aggregateCall.where.updatedAt.lt).toEqual(new Date(2024, 0, 1));
    });

    it("devrait filtrer uniquement les commandes payées", async () => {
      mockPrismaCommande.aggregate.mockResolvedValue({
        _sum: { amount: 10000 },
        _count: { id: 1 },
      });

      await request(app).get("/stats/annual?year=2025");

      const aggregateCall = mockPrismaCommande.aggregate.mock.calls[0][0];
      expect(aggregateCall.where.paymentStatus).toBe("paid");
    });
  });
});