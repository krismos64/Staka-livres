import express from "express";
import request from "supertest";

// Mock Prisma
const mockPrismaPaymentMethod = {
  findMany: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
};

const mockPrismaUser = {
  findUnique: jest.fn(),
};

const mockPrisma = {
  paymentMethod: mockPrismaPaymentMethod,
  user: mockPrismaUser,
  $transaction: jest.fn(),
};

// Mock du service Stripe
const mockStripeService = {
  setDefaultPaymentMethod: jest.fn(),
  detachPaymentMethod: jest.fn(),
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

jest.mock("../../src/services/stripeService", () => ({
  stripeService: mockStripeService,
}));

jest.mock("../../src/middleware/auth", () => ({
  authenticateToken: mockAuth,
}));

// Import après les mocks
import paymentMethodsRoutes from "../../src/routes/paymentMethods";

// Configuration du test avec une app Express
const app = express();
app.use(express.json());
app.use("/payment-methods", paymentMethodsRoutes);

describe("Payment Methods Controller Unit Tests", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe("GET /payment-methods", () => {
    it("devrait retourner la liste des moyens de paiement triée par date de création desc", async () => {
      // Mock des données de moyens de paiement
      const mockPaymentMethods = [
        {
          id: "pm-1",
          brand: "visa",
          last4: "4242",
          expMonth: 12,
          expYear: 2027,
          isDefault: true,
          createdAt: new Date("2024-01-15"),
        },
        {
          id: "pm-2",
          brand: "mastercard",
          last4: "1234",
          expMonth: 6,
          expYear: 2026,
          isDefault: false,
          createdAt: new Date("2024-01-10"),
        },
      ];

      mockPrismaPaymentMethod.findMany.mockResolvedValue(mockPaymentMethods);

      const response = await request(app).get("/payment-methods");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toEqual({
        id: "pm-1",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2027,
        isDefault: true,
      });

      expect(mockPrismaPaymentMethod.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-test-id",
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          brand: true,
          last4: true,
          expMonth: true,
          expYear: true,
          isDefault: true,
          createdAt: true,
        },
      });
    });

    it("devrait retourner un tableau vide si aucun moyen de paiement", async () => {
      mockPrismaPaymentMethod.findMany.mockResolvedValue([]);

      const response = await request(app).get("/payment-methods");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("devrait gérer les erreurs de base de données", async () => {
      mockPrismaPaymentMethod.findMany.mockRejectedValue(new Error("Erreur DB"));

      const response = await request(app).get("/payment-methods");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PUT /payment-methods/:id/default", () => {
    it("devrait définir un moyen de paiement par défaut avec succès", async () => {
      const paymentMethodId = "pm-test-id";
      const mockPaymentMethod = {
        id: paymentMethodId,
        stripePaymentMethodId: "pm_stripe_123",
        userId: "user-test-id",
        isActive: true,
      };
      const mockUser = {
        id: "user-test-id",
        email: "test@example.com",
      };

      mockPrismaPaymentMethod.findFirst.mockResolvedValue(mockPaymentMethod);
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockStripeService.setDefaultPaymentMethod.mockResolvedValue({ success: true });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const response = await request(app)
        .put(`/payment-methods/${paymentMethodId}/default`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Moyen de paiement par défaut mis à jour",
      });

      expect(mockStripeService.setDefaultPaymentMethod).toHaveBeenCalledWith(
        "pm_stripe_123",
        "test@example.com"
      );
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("devrait retourner 404 si le moyen de paiement n'existe pas", async () => {
      mockPrismaPaymentMethod.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .put("/payment-methods/inexistant/default");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });

    it("devrait retourner 400 pour un ID invalide", async () => {
      const response = await request(app)
        .put("/payment-methods/invalid-uuid/default");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /payment-methods/:id", () => {
    it("devrait supprimer un moyen de paiement avec succès", async () => {
      const paymentMethodId = "pm-test-id";
      const mockPaymentMethod = {
        id: paymentMethodId,
        stripePaymentMethodId: "pm_stripe_123",
        userId: "user-test-id",
        isActive: true,
      };

      mockPrismaPaymentMethod.findFirst.mockResolvedValue(mockPaymentMethod);
      mockStripeService.detachPaymentMethod.mockResolvedValue({ success: true });
      mockPrismaPaymentMethod.update.mockResolvedValue({});

      const response = await request(app)
        .delete(`/payment-methods/${paymentMethodId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Moyen de paiement supprimé",
      });

      expect(mockStripeService.detachPaymentMethod).toHaveBeenCalledWith("pm_stripe_123");
      expect(mockPrismaPaymentMethod.update).toHaveBeenCalledWith({
        where: {
          id: paymentMethodId,
        },
        data: {
          isActive: false,
          isDefault: false,
        },
      });
    });

    it("devrait retourner 404 si le moyen de paiement n'existe pas", async () => {
      mockPrismaPaymentMethod.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete("/payment-methods/inexistant");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });

    it("devrait retourner 400 pour un ID invalide", async () => {
      const response = await request(app)
        .delete("/payment-methods/invalid-uuid");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("devrait gérer les erreurs Stripe", async () => {
      const paymentMethodId = "pm-test-id";
      const mockPaymentMethod = {
        id: paymentMethodId,
        stripePaymentMethodId: "pm_stripe_123",
        userId: "user-test-id",
        isActive: true,
      };

      mockPrismaPaymentMethod.findFirst.mockResolvedValue(mockPaymentMethod);
      mockStripeService.detachPaymentMethod.mockRejectedValue(new Error("Stripe error"));

      const response = await request(app)
        .delete(`/payment-methods/${paymentMethodId}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });
  });
});