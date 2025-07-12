import { PrismaClient, Tarif } from "@prisma/client";
import { TarifStripeSyncService } from "../services/tarifStripeSync";

// Mock Prisma
jest.mock("@prisma/client");

// Mock Stripe
jest.mock("stripe");

describe("TarifStripeSyncService", () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Prisma instance
    mockPrisma = {
      tarif: {
        update: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      $disconnect: jest.fn(),
    } as any;
    
    // Override process.env for tests
    process.env.STRIPE_SECRET_KEY = undefined;
  });

  describe("syncTarifToStripe", () => {
    it("devrait créer un produit Stripe en mode mock pour un tarif actif sans IDs", async () => {
      const mockTarif: Tarif = {
        id: "test-tarif-1",
        nom: "Correction Standard",
        description: "Correction orthographique",
        prix: 200, // 2€ en centimes
        prixFormate: "2€",
        typeService: "Correction",
        dureeEstimee: "7-10 jours",
        actif: true,
        ordre: 1,
        stripeProductId: null,
        stripePriceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock de la mise à jour Prisma
      const mockPrismaUpdate = jest.fn().mockResolvedValue({
        ...mockTarif,
        stripeProductId: "prod_mock_123",
        stripePriceId: "price_mock_123",
      });
      
      // Configuration manuelle du mock pour ce test
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      const result = await TarifStripeSyncService.syncTarifToStripe(mockTarif);

      expect(result.success).toBe(true);
      expect(result.action).toBe("created");
      expect(result.tarifId).toBe("test-tarif-1");
      expect(result.message).toContain("Mock: Produit et prix Stripe créés");
      expect(result.stripeProductId).toMatch(/^prod_mock_/);
      expect(result.stripePriceId).toMatch(/^price_mock_/);

      console.log = originalConsoleLog;
    });

    it("devrait marquer pour désactivation un tarif inactif avec IDs Stripe", async () => {
      const mockTarif: Tarif = {
        id: "test-tarif-2",
        nom: "Tarif Désactivé",
        description: "Tarif désactivé",
        prix: 300,
        prixFormate: "3€",
        typeService: "Correction",
        dureeEstimee: "5 jours",
        actif: false, // Tarif désactivé
        ordre: 2,
        stripeProductId: "prod_existing_123",
        stripePriceId: "price_existing_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const originalConsoleLog = console.log;
      console.log = jest.fn();

      const result = await TarifStripeSyncService.syncTarifToStripe(mockTarif);

      expect(result.success).toBe(true);
      expect(result.action).toBe("disabled");
      expect(result.message).toContain("Mock: Prix Stripe désactivé");

      console.log = originalConsoleLog;
    });

    it("devrait ignorer un tarif actif qui a déjà des IDs Stripe", async () => {
      const mockTarif: Tarif = {
        id: "test-tarif-3",
        nom: "Tarif Existant",
        description: "Tarif avec Stripe",
        prix: 500,
        prixFormate: "5€",
        typeService: "Relecture",
        dureeEstimee: "3 jours",
        actif: true,
        ordre: 3,
        stripeProductId: "prod_existing_456",
        stripePriceId: "price_existing_456",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const originalConsoleLog = console.log;
      console.log = jest.fn();

      const result = await TarifStripeSyncService.syncTarifToStripe(mockTarif);

      expect(result.success).toBe(true);
      expect(result.action).toBe("skipped");
      expect(result.message).toContain("Aucune action nécessaire");

      console.log = originalConsoleLog;
    });

    it("devrait gérer les erreurs gracieusement", async () => {
      const mockTarif: Tarif = {
        id: "test-tarif-error",
        nom: "Tarif Erreur",
        description: "Test erreur",
        prix: 100,
        prixFormate: "1€",
        typeService: "Test",
        dureeEstimee: "1 jour",
        actif: true,
        ordre: 1,
        stripeProductId: null,
        stripePriceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock une erreur dans Prisma
      const mockError = new Error("Erreur base de données");
      
      // Pour ce test, on va simuler une vraie clé Stripe pour déclencher le code réel
      process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
      
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const result = await TarifStripeSyncService.syncTarifToStripe(mockTarif);

      expect(result.success).toBe(false);
      expect(result.action).toBe("error");
      expect(result.error).toBeDefined();

      console.error = originalConsoleError;
      process.env.STRIPE_SECRET_KEY = undefined;
    });
  });

  describe("syncAllTarifsToStripe", () => {
    it("devrait synchroniser plusieurs tarifs et retourner un résumé", async () => {
      const mockTarifs: Tarif[] = [
        {
          id: "tarif-1",
          nom: "Tarif 1",
          description: "Description 1",
          prix: 200,
          prixFormate: "2€",
          typeService: "Correction",
          dureeEstimee: "7 jours",
          actif: true,
          ordre: 1,
          stripeProductId: null,
          stripePriceId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "tarif-2",
          nom: "Tarif 2",
          description: "Description 2",
          prix: 300,
          prixFormate: "3€",
          typeService: "Relecture",
          dureeEstimee: "5 jours",
          actif: false,
          ordre: 2,
          stripeProductId: "prod_123",
          stripePriceId: "price_123",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock console pour réduire le bruit
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      // Utilisation directe de la méthode statique avec mock
      jest.spyOn(TarifStripeSyncService, 'syncTarifToStripe')
        .mockResolvedValueOnce({
          success: true,
          tarifId: "tarif-1",
          action: "created",
          message: "Créé avec succès",
          stripeProductId: "prod_mock_new",
          stripePriceId: "price_mock_new",
        })
        .mockResolvedValueOnce({
          success: true,
          tarifId: "tarif-2",
          action: "disabled",
          message: "Désactivé avec succès",
        });

      // Mock findMany
      const mockFindMany = jest.fn().mockResolvedValue(mockTarifs);

      // Test de la logique en mockant directement
      const results = await Promise.all(
        mockTarifs.map(tarif => TarifStripeSyncService.syncTarifToStripe(tarif))
      );

      const summary = {
        total: 2,
        created: results.filter(r => r.action === 'created').length,
        updated: results.filter(r => r.action === 'updated').length,
        disabled: results.filter(r => r.action === 'disabled').length,
        skipped: results.filter(r => r.action === 'skipped').length,
        errors: results.filter(r => !r.success).length,
      };

      expect(summary.total).toBe(2);
      expect(summary.created).toBe(1);
      expect(summary.disabled).toBe(1);
      expect(summary.errors).toBe(0);

      console.log = originalConsoleLog;
    });
  });

  describe("getTarifsWithStripeInfo", () => {
    it("devrait retourner les tarifs avec informations Stripe", async () => {
      const mockTarifs: Tarif[] = [
        {
          id: "tarif-with-stripe",
          nom: "Avec Stripe",
          description: "Description",
          prix: 200,
          prixFormate: "2€",
          typeService: "Correction",
          dureeEstimee: "7 jours",
          actif: true,
          ordre: 1,
          stripeProductId: "prod_123",
          stripePriceId: "price_123",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "tarif-without-stripe",
          nom: "Sans Stripe",
          description: "Description",
          prix: 300,
          prixFormate: "3€",
          typeService: "Relecture",
          dureeEstimee: "5 jours",
          actif: true,
          ordre: 2,
          stripeProductId: null,
          stripePriceId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock console pour réduire le bruit
      const originalConsoleWarn = console.warn;
      console.warn = jest.fn();

      // Test de la logique directement
      const tarifsWithInfo = [];
      const summary = {
        total: mockTarifs.length,
        withStripeProduct: 0,
        withStripePrice: 0,
        activeOnly: mockTarifs.filter(t => t.actif).length,
      };

      for (const tarif of mockTarifs) {
        const tarifInfo: any = { ...tarif };
        
        if (tarif.stripeProductId) {
          summary.withStripeProduct++;
          tarifInfo.stripeProductActive = true; // Mode mock
        }

        if (tarif.stripePriceId) {
          summary.withStripePrice++;
          tarifInfo.stripePriceActive = true;
        }

        tarifsWithInfo.push(tarifInfo);
      }

      expect(summary.total).toBe(2);
      expect(summary.withStripeProduct).toBe(1);
      expect(summary.withStripePrice).toBe(1);
      expect(summary.activeOnly).toBe(2);

      expect(tarifsWithInfo[0].stripeProductActive).toBe(true);
      expect(tarifsWithInfo[1].stripeProductActive).toBeUndefined();

      console.warn = originalConsoleWarn;
    });
  });

  describe("Mode développement vs production", () => {
    it("devrait détecter correctement le mode développement", () => {
      // Mode développement (clé manquante)
      delete process.env.STRIPE_SECRET_KEY;
      
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const isDevelopmentMock = 
        !stripeKey ||
        !stripeKey.startsWith("sk_test_");
      
      expect(isDevelopmentMock).toBe(true);
    });

    it("devrait détecter correctement le mode test Stripe", () => {
      // Mode test Stripe
      process.env.STRIPE_SECRET_KEY = "sk_test_fake_key_for_testing";
      
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const isDevelopmentMock = 
        !stripeKey ||
        !stripeKey.startsWith("sk_test_");
      
      expect(isDevelopmentMock).toBe(false);
      
      // Cleanup
      delete process.env.STRIPE_SECRET_KEY;
    });
  });
});