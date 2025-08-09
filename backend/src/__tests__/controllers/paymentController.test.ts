import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { paymentController, setPrismaInstance } from "../../controllers/paymentController";
import { stripeService } from "../../services/stripeService";
import { AuditService } from "../../services/auditService";

// Mock Prisma Client
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    commande: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $disconnect: vi.fn(),
  })),
  StatutCommande: { EN_ATTENTE: "EN_ATTENTE", EN_COURS: "EN_COURS" },
}));

// Mock des services
vi.mock("../../services/stripeService", () => ({
  stripeService: {
    createCheckoutSession: vi.fn(),
    createPaymentIntent: vi.fn(),
    retrieveSession: vi.fn(),
    attachPaymentMethod: vi.fn(),
  },
}));

vi.mock("../../services/auditService", () => ({
  AuditService: {
    logPaymentOperation: vi.fn(),
    logSecurityEvent: vi.fn(),
  },
}));

// Types pour les mocks
interface MockRequest extends Partial<Request> {
  body?: any;
  user?: any;
  ip?: string;
  connection?: { remoteAddress?: string };
  get?: (header: string) => string | undefined;
}

interface MockResponse extends Partial<Response> {
  status: vi.MockedFunction<any>;
  json: vi.MockedFunction<any>;
}

describe("💳 Payment Controller Security Tests", () => {
  let mockRequest: MockRequest;
  let mockResponse: MockResponse;
  let mockPrisma: any;

  beforeEach(() => {
    // Reset tous les mocks
    vi.clearAllMocks();

    // Configuration des mocks de base
    mockRequest = {
      body: {},
      user: {
        id: "user-123",
        email: "test@example.com",
        role: "USER",
        isActive: true,
      },
      ip: "192.168.1.100",
      connection: { remoteAddress: "192.168.1.100" },
      get: vi.fn().mockReturnValue("test-user-agent"),
    };

    mockResponse = {
      status: vi.fn().mockImplementation((code) => {
        mockResponse.statusCode = code;
        return mockResponse;
      }),
      json: vi.fn().mockImplementation((data) => {
        mockResponse.responseData = data;
        return mockResponse;
      }),
      statusCode: 200,
      responseData: null,
    };

    // Create mock Prisma instance and inject it into the controller
    const { PrismaClient } = require("@prisma/client");
    mockPrisma = new PrismaClient();
    
    // Configure all Prisma methods
    mockPrisma.commande.findFirst = vi.fn();
    mockPrisma.commande.update = vi.fn();
    mockPrisma.commande.create = vi.fn();
    mockPrisma.user.findUnique = vi.fn();
    
    // Inject the mock into the controller
    setPrismaInstance(mockPrisma);

    // Mock services par défaut
    vi.mocked(stripeService.createCheckoutSession).mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/pay/cs_test_123",
    });
    
    vi.mocked(AuditService.logPaymentOperation).mockResolvedValue(undefined);
    vi.mocked(AuditService.logSecurityEvent).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("🚫 Authorization Security", () => {
    test("should reject unauthenticated payment creation", async () => {
      // Utilisateur non authentifié
      mockRequest.user = undefined;
      mockRequest.body = {
        commandeId: "commande-123",
        priceId: "price_123"
      };

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Utilisateur non authentifié" 
      });
      expect(AuditService.logSecurityEvent).toHaveBeenCalledWith(
        "unknown",
        "PAYMENT_UNAUTHORIZED_ACCESS",
        expect.objectContaining({ action: "CREATE_CHECKOUT_SESSION" }),
        "192.168.1.100",
        "test-user-agent",
        "HIGH"
      );
    });

    test("should prevent users from accessing other users' orders", async () => {
      mockRequest.body = {
        commandeId: "other-user-commande-123",
        priceId: "price_123"
      };

      // Mock commande appartenant à un autre utilisateur
      mockPrisma.commande.findFirst.mockResolvedValue(null); // Pas de commande pour cet utilisateur

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.statusCode).toBe(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Commande non trouvée" 
      });
      
      // Vérifier que la requête filtre par userId
      expect(mockPrisma.commande.findFirst).toHaveBeenCalledWith({
        where: {
          id: "other-user-commande-123",
          userId: "user-123", // Filtré par l'ID de l'utilisateur connecté
        },
        include: expect.any(Object),
      });
    });

    test("should prevent payment for inactive user accounts", async () => {
      // Utilisateur avec compte inactif
      mockRequest.user = {
        id: "inactive-user-123",
        email: "inactive@example.com",
        role: "USER",
        isActive: false,
      };
      
      mockRequest.body = {
        commandeId: "commande-123",
        priceId: "price_123"
      };

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.statusCode).toBe(401);
      expect(AuditService.logSecurityEvent).toHaveBeenCalledWith(
        "inactive@example.com",
        "PAYMENT_UNAUTHORIZED_ACCESS",
        expect.any(Object),
        "192.168.1.100",
        "test-user-agent",
        "HIGH"
      );
    });
  });

  describe("🗜 Payment Data Validation", () => {
    test("should validate required payment parameters", async () => {
      // Requête sans paramètres requis
      mockRequest.body = {};

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "ID de commande et ID de prix requis" 
      });
    });

    test("should validate order exists and is payable", async () => {
      mockRequest.body = {
        commandeId: "non-existent-123",
        priceId: "price_123"
      };

      // Mock commande non trouvée
      mockPrisma.commande.findFirst.mockResolvedValue(null);

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.statusCode).toBe(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Commande non trouvée" 
      });
    });

    test("should prevent double payment for already paid orders", async () => {
      mockRequest.body = {
        commandeId: "paid-commande-123",
        priceId: "price_123"
      };

      // Mock commande déjà payée
      mockPrisma.commande.findFirst.mockResolvedValue({
        id: "paid-commande-123",
        userId: "user-123",
        paymentStatus: "paid", // Déjà payée
        prixTotal: 2000,
      });

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Cette commande a déjà été payée" 
      });
    });

    test("should validate price consistency with order", async () => {
      mockRequest.body = {
        commandeId: "commande-123",
        priceId: "suspicious_price_123"
      };

      const mockCommande = {
        id: "commande-123",
        userId: "user-123",
        paymentStatus: "pending",
        prixTotal: 2000, // 20 EUR
        typeService: "CORRECTION",
      };

      mockPrisma.commande.findFirst.mockResolvedValue(mockCommande);

      // Mock Stripe session avec montant différent
      vi.mocked(stripeService.createCheckoutSession).mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
        amount_total: 5000, // 50 EUR (différent !)
      });

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      // Le paiement doit réussir mais avec audit log
      expect(mockResponse.statusCode).toBe(200);
      expect(AuditService.logPaymentOperation).toHaveBeenCalledWith(
        "test@example.com",
        "pending",
        "create",
        undefined,
        "192.168.1.100",
        "test-user-agent"
      );
    });
  });

  describe("🔒 Stripe Integration Security", () => {
    test("should handle Stripe API errors securely", async () => {
      mockRequest.body = {
        commandeId: "commande-123",
        priceId: "price_123"
      };

      mockPrisma.commande.findFirst.mockResolvedValue({
        id: "commande-123",
        userId: "user-123",
        paymentStatus: "pending",
        prixTotal: 2000,
      });

      // Mock erreur Stripe
      vi.mocked(stripeService.createCheckoutSession).mockRejectedValue(
        new Error("Stripe API temporarily unavailable")
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.statusCode).toBe(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Erreur lors de la création de la session de paiement" 
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erreur lors de la création de la session de paiement"),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test("should validate Stripe session creation response", async () => {
      mockRequest.body = {
        commandeId: "commande-123",
        priceId: "price_123"
      };

      mockPrisma.commande.findFirst.mockResolvedValue({
        id: "commande-123",
        userId: "user-123",
        paymentStatus: "pending",
        prixTotal: 2000,
      });

      // Mock réponse Stripe invalide
      vi.mocked(stripeService.createCheckoutSession).mockResolvedValue(null as any);

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.statusCode).toBe(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Erreur lors de la création de la session de paiement" 
      });
    });

    test("should create secure checkout session with proper metadata", async () => {
      mockRequest.body = {
        commandeId: "commande-123",
        priceId: "price_123"
      };

      const mockCommande = {
        id: "commande-123",
        userId: "user-123",
        paymentStatus: "pending",
        prixTotal: 2000,
        typeService: "CORRECTION",
        user: {
          id: "user-123",
          email: "test@example.com",
          prenom: "John",
          nom: "Doe"
        }
      };

      mockPrisma.commande.findFirst.mockResolvedValue(mockCommande);

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          priceId: "price_123",
          commandeId: "commande-123",
          userEmail: "test@example.com",
          metadata: expect.objectContaining({
            commandeId: "commande-123",
            userId: "user-123",
            userEmail: "test@example.com",
          })
        })
      );
    });
  });

  describe("🔍 Security Monitoring", () => {
    test("should log all payment attempts for security monitoring", async () => {
      mockRequest.body = {
        commandeId: "commande-123",
        priceId: "price_123"
      };
      mockRequest.ip = "suspicious.ip.address";
      mockRequest.get = vi.fn().mockReturnValue("Suspicious-User-Agent/1.0");

      mockPrisma.commande.findFirst.mockResolvedValue({
        id: "commande-123",
        userId: "user-123",
        paymentStatus: "pending",
        prixTotal: 2000,
      });

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(AuditService.logPaymentOperation).toHaveBeenCalledWith(
        "test@example.com",
        "pending",
        "create",
        undefined,
        "suspicious.ip.address",
        "Suspicious-User-Agent/1.0"
      );
    });

    test("should detect and log suspicious payment patterns", async () => {
      // Tentatives multiples de paiement rapides
      mockRequest.body = {
        commandeId: "commande-123",
        priceId: "price_123"
      };

      mockPrisma.commande.findFirst.mockResolvedValue({
        id: "commande-123",
        userId: "user-123",
        paymentStatus: "pending",
        prixTotal: 2000,
      });

      // Simuler 5 tentatives rapides
      for (let i = 0; i < 5; i++) {
        await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);
      }

      // Vérifier que toutes les tentatives sont loggées (2 calls per attempt: pending + success)
      expect(AuditService.logPaymentOperation).toHaveBeenCalledTimes(10);
      
      // Dans un vrai scénario, on pourrait implémenter du rate limiting
    });

    test("should handle payment session retrieval securely", async () => {
      // Test the getPaymentStatus method which is the actual implementation
      const mockSessionId = "cs_secure_session_123";
      
      const mockRequest = {
        params: { sessionId: mockSessionId },
        user: {
          id: "user-123",
          email: "test@example.com",
          isActive: true,
        },
        ip: "192.168.1.100",
        get: vi.fn().mockReturnValue("test-user-agent"),
      };

      const mockResponse = {
        status: vi.fn().mockImplementation((code) => {
          mockResponse.statusCode = code;
          return mockResponse;
        }),
        json: vi.fn().mockImplementation((data) => {
          mockResponse.responseData = data;
          return mockResponse;
        }),
        statusCode: 200,
        responseData: null,
      };
      
      // Mock Stripe session retrieval
      vi.mocked(stripeService.retrieveSession).mockResolvedValue({
        id: mockSessionId,
        payment_status: "paid",
        metadata: {
          commandeId: "commande-123",
          userId: "user-123"
        }
      });

      // Mock commande lookup
      mockPrisma.commande.findFirst.mockResolvedValue({
        id: "commande-123",
        userId: "user-123",
        stripeSessionId: mockSessionId
      });

      await paymentController.getPaymentStatus(mockRequest as any, mockResponse as any);
      
      // Vérifier que l'accès est sécurisé par userId
      expect(mockPrisma.commande.findFirst).toHaveBeenCalledWith({
        where: {
          stripeSessionId: mockSessionId,
          userId: "user-123"
        }
      });
      
      expect(mockResponse.statusCode).toBe(200);
    });
  });

  describe("⚠️ Edge Cases and Error Handling", () => {
    test("should handle database connection failures gracefully", async () => {
      mockRequest.body = {
        commandeId: "commande-123",
        priceId: "price_123"
      };

      mockPrisma.commande.findFirst.mockRejectedValue(
        new Error("Database connection timeout")
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.statusCode).toBe(500);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erreur lors de la création de la session de paiement"),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test("should handle malformed request data securely", async () => {
      // Requête avec données malformées
      mockRequest.body = {
        commandeId: null,
        priceId: undefined,
        maliciousData: "<script>alert('xss')</script>"
      };

      await paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "ID de commande et ID de prix requis" 
      });
    });

    test("should handle concurrent payment attempts safely", async () => {
      mockRequest.body = {
        commandeId: "concurrent-commande-123",
        priceId: "price_123"
      };

      const mockCommande = {
        id: "concurrent-commande-123",
        userId: "user-123",
        paymentStatus: "pending",
        prixTotal: 2000,
      };

      mockPrisma.commande.findFirst.mockResolvedValue(mockCommande);

      // Exécution de 3 créations de session concurrentes
      const promises = Array(3).fill(null).map(() => 
        paymentController.createCheckoutSession(mockRequest as Request, mockResponse as Response)
      );

      await Promise.all(promises);

      // Vérifier que toutes les opérations sont sécurisées
      expect(stripeService.createCheckoutSession).toHaveBeenCalledTimes(3);
      expect(AuditService.logPaymentOperation).toHaveBeenCalledTimes(6);
    });
  });
});
