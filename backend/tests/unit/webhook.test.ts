import bodyParser from "body-parser";
import express from "express";
import request from "supertest";

// Mock Prisma
const mockPrismaCommande = {
  findFirst: jest.fn(),
  update: jest.fn(),
};

const mockPrisma = {
  commande: mockPrismaCommande,
};

// Mock du service Stripe
const mockStripeService = {
  constructEvent: jest.fn(),
};

// Mock des modules avant import
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock("../../src/services/stripeService", () => ({
  stripeService: mockStripeService,
}));

// Import après les mocks
import webhookRoutes from "../../src/routes/payments/webhook";

// Configuration du test avec une app Express
const app = express();
app.use(
  "/payments/webhook",
  bodyParser.raw({ type: "application/json" }),
  webhookRoutes
);

describe("Webhook Stripe Unit Tests", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe("POST /payments/webhook", () => {
    it("devrait traiter avec succès un événement checkout.session.completed", async () => {
      // Mock de l'événement Stripe
      const mockEvent = {
        id: "evt_test_webhook_123",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_webhook_session_123",
            payment_status: "paid",
            amount_total: 46800,
            currency: "eur",
          },
        },
      };

      const mockCommande = {
        id: "commande-test-123",
        userId: "user-test-123",
        titre: "Test Commande",
        paymentStatus: "unpaid",
        statut: "EN_ATTENTE",
        user: {
          id: "user-test-123",
          prenom: "Test",
          nom: "User",
          email: "test@example.com",
        },
      };

      const mockUpdatedCommande = {
        ...mockCommande,
        paymentStatus: "paid",
        statut: "EN_COURS",
      };

      // Configuration des mocks
      mockStripeService.constructEvent.mockReturnValue(mockEvent);
      mockPrismaCommande.findFirst.mockResolvedValue(mockCommande);
      mockPrismaCommande.update.mockResolvedValue(mockUpdatedCommande);

      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(200);

      expect(response.body).toEqual({
        received: true,
        eventType: "checkout.session.completed",
      });

      // Vérifier les appels aux mocks
      expect(mockStripeService.constructEvent).toHaveBeenCalledWith(
        expect.any(Buffer),
        "test_signature"
      );

      expect(mockPrismaCommande.findFirst).toHaveBeenCalledWith({
        where: {
          stripeSessionId: "cs_test_webhook_session_123",
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

      expect(mockPrismaCommande.update).toHaveBeenCalledWith({
        where: { id: "commande-test-123" },
        data: {
          paymentStatus: "paid",
          statut: "EN_COURS",
          updatedAt: expect.any(Date),
        },
      });
    });

    it("devrait traiter un événement payment_intent.payment_failed", async () => {
      const mockEvent = {
        id: "evt_test_failed_123",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_test_failed_123",
            last_payment_error: {
              message: "Votre carte a été refusée.",
            },
            metadata: {
              commandeId: "commande-test-123",
            },
          },
        },
      };

      const mockUpdatedCommande = {
        id: "commande-test-123",
        paymentStatus: "failed",
      };

      mockStripeService.constructEvent.mockReturnValue(mockEvent);
      mockPrismaCommande.update.mockResolvedValue(mockUpdatedCommande);

      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(200);

      expect(response.body).toEqual({
        received: true,
        eventType: "payment_intent.payment_failed",
      });

      expect(mockPrismaCommande.update).toHaveBeenCalledWith({
        where: { id: "commande-test-123" },
        data: {
          paymentStatus: "failed",
          updatedAt: expect.any(Date),
        },
      });
    });

    it("devrait retourner 404 si la commande n'est pas trouvée", async () => {
      const mockEvent = {
        id: "evt_test_not_found_123",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_session_inexistante",
            payment_status: "paid",
            amount_total: 46800,
            currency: "eur",
          },
        },
      };

      mockStripeService.constructEvent.mockReturnValue(mockEvent);
      mockPrismaCommande.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(404);

      expect(response.body).toMatchObject({
        error: "Commande non trouvée",
        received: false,
      });
    });

    it("devrait retourner 400 si la signature est manquante", async () => {
      const response = await request(app)
        .post("/payments/webhook")
        .send(Buffer.from('{"test": "data"}'))
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Signature Stripe manquante",
        received: false,
      });
    });

    it("devrait retourner 400 si la signature est invalide", async () => {
      mockStripeService.constructEvent.mockImplementation(() => {
        throw new Error("Signature invalide");
      });

      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "invalid_signature")
        .send(Buffer.from('{"test": "data"}'))
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Signature webhook invalide",
        received: false,
      });
    });

    it("devrait logger les événements non gérés", async () => {
      const mockEvent = {
        id: "evt_test_unhandled_123",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_test_123",
          },
        },
      };

      mockStripeService.constructEvent.mockReturnValue(mockEvent);

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(200);

      expect(response.body).toEqual({
        received: true,
        eventType: "customer.subscription.created",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "🔔 [Stripe Webhook] Événement non géré: customer.subscription.created"
        )
      );

      consoleSpy.mockRestore();
    });

    it("devrait gérer les erreurs de base de données", async () => {
      const mockEvent = {
        id: "evt_test_db_error_123",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_webhook_session_123",
            payment_status: "paid",
            amount_total: 46800,
            currency: "eur",
          },
        },
      };

      mockStripeService.constructEvent.mockReturnValue(mockEvent);
      mockPrismaCommande.findFirst.mockRejectedValue(
        new Error("Database connection error")
      );

      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(500);

      expect(response.body).toMatchObject({
        error: "Erreur interne lors du traitement du webhook",
        received: false,
      });
    });
  });
});
