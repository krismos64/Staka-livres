import bodyParser from "body-parser";
import express from "express";
import request from "supertest";

// Mock des services
const mockPrismaCommande = {
  findFirst: jest.fn(),
  update: jest.fn(),
};

const mockPrismaInvoice = {
  create: jest.fn(),
};

const mockPrisma = {
  commande: mockPrismaCommande,
  invoice: mockPrismaInvoice,
};

const mockStripeService = {
  constructEvent: jest.fn(),
};

const mockInvoiceService = {
  processInvoiceForCommande: jest.fn(),
};

// Mock des modules
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock("../../src/services/stripeService", () => ({
  stripeService: mockStripeService,
}));

jest.mock("../../src/services/invoiceService", () => ({
  InvoiceService: mockInvoiceService,
}));

// Import après les mocks
import webhookRoutes from "../../src/routes/payments/webhook";

// Configuration de l'app de test
const app = express();
app.use(
  "/payments/webhook",
  bodyParser.raw({ type: "application/json" }),
  webhookRoutes
);

describe("Webhook avec Facturation - Tests d'Intégration", () => {
  const mockCommande = {
    id: "cmd-invoice-test-123",
    userId: "user-test-123",
    titre: "Commande avec Facture",
    description: "Test de génération de facture",
    stripeSessionId: "cs_test_invoice_session_123",
    paymentStatus: "pending",
    statut: "EN_ATTENTE",
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: "user-test-123",
      prenom: "Marie",
      nom: "Martin",
      email: "marie.martin@test.com",
    },
  };

  const stripeCheckoutEvent = {
    id: "evt_invoice_test_123",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_invoice_session_123",
        payment_status: "paid",
        amount_total: 59900, // 599€
        currency: "eur",
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Configuration par défaut des mocks
    mockStripeService.constructEvent.mockReturnValue(stripeCheckoutEvent);
    mockPrismaCommande.findFirst.mockResolvedValue(mockCommande);
    mockPrismaCommande.update.mockResolvedValue({
      ...mockCommande,
      paymentStatus: "paid",
      statut: "EN_COURS",
      user: mockCommande.user,
    });
    mockInvoiceService.processInvoiceForCommande.mockResolvedValue(undefined);
  });

  describe("POST /payments/webhook - checkout.session.completed avec facture", () => {
    it("devrait traiter le paiement et générer une facture", async () => {
      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(stripeCheckoutEvent)));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        received: true,
        eventType: "checkout.session.completed",
      });

      // Vérifier que la commande a été trouvée
      expect(mockPrismaCommande.findFirst).toHaveBeenCalledWith({
        where: { stripeSessionId: "cs_test_invoice_session_123" },
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

      // Vérifier que la commande a été mise à jour
      expect(mockPrismaCommande.update).toHaveBeenCalledWith({
        where: { id: "cmd-invoice-test-123" },
        data: {
          paymentStatus: "paid",
          statut: "EN_COURS",
          updatedAt: expect.any(Date),
        },
        include: {
          user: true,
        },
      });

      // Vérifier que le service de facturation a été appelé
      expect(mockInvoiceService.processInvoiceForCommande).toHaveBeenCalledWith(
        {
          ...mockCommande,
          paymentStatus: "paid",
          statut: "EN_COURS",
          user: mockCommande.user,
          amount: 59900, // Montant ajouté depuis Stripe
        }
      );
    });

    it("devrait continuer même si la génération de facture échoue", async () => {
      mockInvoiceService.processInvoiceForCommande.mockRejectedValue(
        new Error("Invoice generation failed")
      );

      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(stripeCheckoutEvent)));

      // Le webhook doit toujours retourner 200 à Stripe
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        received: true,
        eventType: "checkout.session.completed",
      });

      // Vérifier que la commande a quand même été mise à jour
      expect(mockPrismaCommande.update).toHaveBeenCalled();

      // Vérifier que le service de facturation a été tenté
      expect(mockInvoiceService.processInvoiceForCommande).toHaveBeenCalled();
    });

    it("devrait gérer les commandes sans utilisateur", async () => {
      const commandeSansUser = { ...mockCommande };
      delete (commandeSansUser as any).user;

      mockPrismaCommande.findFirst.mockResolvedValue(commandeSansUser);
      mockPrismaCommande.update.mockResolvedValue({
        ...commandeSansUser,
        paymentStatus: "paid",
        statut: "EN_COURS",
        user: mockCommande.user, // Include ajoute l'utilisateur
      });

      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(stripeCheckoutEvent)));

      expect(response.status).toBe(200);
      expect(mockInvoiceService.processInvoiceForCommande).toHaveBeenCalled();
    });

    it("devrait log les erreurs de facture sans faire échouer le webhook", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockInvoiceService.processInvoiceForCommande.mockRejectedValue(
        new Error("S3 upload failed")
      );

      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(stripeCheckoutEvent)));

      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erreur lors de la génération de facture"),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Gestion des erreurs de base de données", () => {
    it("devrait gérer les erreurs de mise à jour de commande", async () => {
      mockPrismaCommande.update.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(stripeCheckoutEvent)));

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Erreur serveur",
        received: false,
      });

      // Vérifier que le service de facturation n'a pas été appelé
      expect(
        mockInvoiceService.processInvoiceForCommande
      ).not.toHaveBeenCalled();
    });
  });

  describe("Autres événements Stripe", () => {
    it("ne devrait pas générer de facture pour payment_intent.payment_failed", async () => {
      const failedEvent = {
        id: "evt_failed_123",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_failed_123",
            metadata: { commandeId: "cmd-invoice-test-123" },
            last_payment_error: { message: "Card declined" },
          },
        },
      };

      mockStripeService.constructEvent.mockReturnValue(failedEvent);

      const response = await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(failedEvent)));

      expect(response.status).toBe(200);
      expect(
        mockInvoiceService.processInvoiceForCommande
      ).not.toHaveBeenCalled();
    });
  });

  describe("Test de performance", () => {
    it("devrait traiter rapidement un webhook avec facture", async () => {
      const startTime = Date.now();

      await request(app)
        .post("/payments/webhook")
        .set("stripe-signature", "test_signature")
        .send(Buffer.from(JSON.stringify(stripeCheckoutEvent)));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Le webhook devrait être traité en moins de 1 seconde (même avec mocks)
      expect(duration).toBeLessThan(1000);
    });
  });
});
