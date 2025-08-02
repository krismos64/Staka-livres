import { Request, Response } from "express";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { StatutCommande } from "@prisma/client";
import { AdminCommandeController } from "../../controllers/adminCommandeController";
import { AdminCommandeService, CommandeFilters } from "../../services/adminCommandeService";

// Mock modules
vi.mock("../../services/adminCommandeService");

const mockAdminCommandeService = vi.mocked(AdminCommandeService);

// Helper functions
const createMockReq = (user: any = {}, query: any = {}, params: any = {}, body: any = {}): Partial<Request> => ({
  user: {
    id: "admin-123",
    email: "admin@staka.com",
    role: "ADMIN",
    ...user
  },
  query,
  params,
  body
});

const createMockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// Mock data
const mockCommandesResponse = {
  data: [
    {
      id: "cmd-1",
      titre: "Roman Fantasy - Correction",
      description: "Roman de 300 pages",
      statut: StatutCommande.EN_COURS,
      amount: 30000,
      createdAt: new Date("2023-01-15T10:00:00Z"),
      updatedAt: new Date("2023-01-20T14:30:00Z"),
      user: {
        id: "user-1",
        prenom: "John",
        nom: "Doe",
        email: "john@example.com"
      }
    },
    {
      id: "cmd-2",
      titre: "Nouvelle SF - Relecture",
      description: "Nouvelle de 50 pages",
      statut: StatutCommande.TERMINE,
      amount: 15000,
      createdAt: new Date("2023-01-10T09:00:00Z"),
      updatedAt: new Date("2023-01-25T16:45:00Z"),
      user: {
        id: "user-2",
        prenom: "Jane",
        nom: "Smith",
        email: "jane@example.com"
      }
    }
  ],
  stats: {
    total: 25,
    byStatut: {
      EN_ATTENTE: 5,
      EN_ATTENTE_VERIFICATION: 2,
      EN_ATTENTE_CONSULTATION: 1,
      ESTIMATION_ENVOYEE: 3,
      PAYEE: 2,
      EN_COURS: 7,
      TERMINE: 4,
      ANNULEE: 1,
      SUSPENDUE: 0
    }
  },
  page: 1,
  totalPages: 3
};

const mockDetailedCommande = {
  id: "cmd-detail",
  titre: "Commande détaillée",
  description: "Description complète",
  statut: StatutCommande.EN_COURS,
  amount: 25000,
  noteClient: "Note du client",
  noteCorrecteur: "Note du correcteur",
  createdAt: new Date("2023-01-15T10:00:00Z"),
  updatedAt: new Date("2023-01-20T14:30:00Z"),
  user: {
    id: "user-detail",
    prenom: "Detail",
    nom: "User",
    email: "detail@example.com",
    role: "USER",
    isActive: true,
    telephone: "+33123456789",
    adresse: "123 Rue Example",
    avatar: null,
    createdAt: new Date("2022-12-01T10:00:00Z"),
    updatedAt: new Date("2023-01-01T10:00:00Z")
  },
  files: [
    {
      id: "file-1",
      filename: "document.pdf",
      url: "/uploads/projects/document.pdf",
      mimeType: "application/pdf",
      size: 1024000,
      createdAt: new Date("2023-01-15T11:00:00Z")
    }
  ],
  invoices: [
    {
      id: "invoice-1",
      number: "INV-2023-001",
      amount: 25000,
      status: "paid",
      createdAt: new Date("2023-01-16T10:00:00Z")
    }
  ],
  _count: {
    files: 1,
    invoices: 1
  }
};

describe("AdminCommandeController - Administration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("getCommandes", () => {
    test("devrait récupérer les commandes avec paramètres par défaut", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {} // Pas de paramètres de query
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.getCommandes.mockResolvedValue(mockCommandesResponse);

      await AdminCommandeController.getCommandes(req, res);

      // Vérifier l'appel au service avec les valeurs par défaut
      expect(mockAdminCommandeService.getCommandes).toHaveBeenCalledWith(
        1, // page par défaut
        10, // limit par défaut
        {} // pas de filtres
      );

      // Vérifier la réponse
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Liste des commandes récupérée avec succès",
        ...mockCommandesResponse,
        filters: {}
      });
    });

    test("devrait gérer la pagination personnalisée", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {
          page: "2",
          limit: "20"
        }
      ) as Request;

      const res = createMockRes() as Response;

      const customResponse = {
        ...mockCommandesResponse,
        page: 2,
        totalPages: 2
      };

      mockAdminCommandeService.getCommandes.mockResolvedValue(customResponse);

      await AdminCommandeController.getCommandes(req, res);

      expect(mockAdminCommandeService.getCommandes).toHaveBeenCalledWith(
        2, // page transformée en number
        20, // limit transformée en number
        {}
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Liste des commandes récupérée avec succès",
        ...customResponse,
        filters: {}
      });
    });

    test("devrait valider et limiter les paramètres de pagination", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {
          page: "0", // Invalide, sera transformé en 1
          limit: "200" // Trop élevé, sera limité à 100
        }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.getCommandes.mockResolvedValue(mockCommandesResponse);

      await AdminCommandeController.getCommandes(req, res);

      expect(mockAdminCommandeService.getCommandes).toHaveBeenCalledWith(
        1, // page corrigée à 1
        100, // limit corrigée à 100
        {}
      );
    });

    test("devrait gérer tous les filtres", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {
          search: "john@example.com",
          statut: StatutCommande.EN_COURS,
          clientId: "user-123",
          dateFrom: "2023-01-01",
          dateTo: "2023-12-31"
        }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.getCommandes.mockResolvedValue(mockCommandesResponse);

      await AdminCommandeController.getCommandes(req, res);

      const expectedFilters = {
        search: "john@example.com",
        statut: StatutCommande.EN_COURS,
        clientId: "user-123",
        dateFrom: new Date("2023-01-01"),
        dateTo: new Date("2023-12-31")
      };

      expect(mockAdminCommandeService.getCommandes).toHaveBeenCalledWith(
        1,
        10,
        expectedFilters
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Liste des commandes récupérée avec succès",
        ...mockCommandesResponse,
        filters: expectedFilters
      });
    });

    test("devrait ignorer les statuts invalides", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {
          statut: "STATUT_INVALIDE"
        }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.getCommandes.mockResolvedValue(mockCommandesResponse);

      await AdminCommandeController.getCommandes(req, res);

      expect(mockAdminCommandeService.getCommandes).toHaveBeenCalledWith(
        1,
        10,
        {} // statut invalide ignoré
      );
    });

    test("devrait ignorer les dates invalides", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {
          dateFrom: "date-invalide",
          dateTo: "autre-date-invalide"
        }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.getCommandes.mockResolvedValue(mockCommandesResponse);

      await AdminCommandeController.getCommandes(req, res);

      expect(mockAdminCommandeService.getCommandes).toHaveBeenCalledWith(
        1,
        10,
        {} // dates invalides ignorées
      );
    });

    test("devrait trimmer les chaînes de recherche", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {
          search: "  john@example.com  ",
          clientId: "  user-123  "
        }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.getCommandes.mockResolvedValue(mockCommandesResponse);

      await AdminCommandeController.getCommandes(req, res);

      expect(mockAdminCommandeService.getCommandes).toHaveBeenCalledWith(
        1,
        10,
        {
          search: "john@example.com", // trimmed
          clientId: "user-123" // trimmed
        }
      );
    });

    test("devrait gérer les erreurs du service", async () => {
      const req = createMockReq({ email: "admin@staka.com" }) as Request;
      const res = createMockRes() as Response;

      mockAdminCommandeService.getCommandes.mockRejectedValue(
        new Error("Database connection failed")
      );

      await AdminCommandeController.getCommandes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer la liste des commandes"
      });
    });
  });

  describe("updateCommandeStatut", () => {
    test("devrait mettre à jour le statut d'une commande", async () => {
      const commandeId = "cmd-123";
      const nouveauStatut = StatutCommande.TERMINE;

      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: commandeId },
        { statut: nouveauStatut }
      ) as Request;

      const res = createMockRes() as Response;

      const updatedCommande = {
        ...mockCommandesResponse.data[0],
        id: commandeId,
        statut: nouveauStatut,
        updatedAt: new Date()
      };

      mockAdminCommandeService.updateCommandeStatut.mockResolvedValue(updatedCommande);

      await AdminCommandeController.updateCommandeStatut(req, res);

      expect(mockAdminCommandeService.updateCommandeStatut).toHaveBeenCalledWith(
        commandeId,
        nouveauStatut
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Statut de la commande mis à jour avec succès",
        commande: updatedCommande
      });
    });

    test("devrait rejeter les requêtes sans ID", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        {}, // Pas d'ID
        { statut: StatutCommande.EN_COURS }
      ) as Request;

      const res = createMockRes() as Response;

      await AdminCommandeController.updateCommandeStatut(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "ID commande requis",
        message: "Veuillez fournir un ID de commande valide"
      });

      expect(mockAdminCommandeService.updateCommandeStatut).not.toHaveBeenCalled();
    });

    test("devrait rejeter les requêtes sans statut", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: "cmd-123" },
        {} // Pas de statut
      ) as Request;

      const res = createMockRes() as Response;

      await AdminCommandeController.updateCommandeStatut(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Statut requis",
        message: "Veuillez fournir un statut valide"
      });
    });

    test("devrait gérer les commandes non trouvées", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: "cmd-inexistant" },
        { statut: StatutCommande.EN_COURS }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.updateCommandeStatut.mockRejectedValue(
        new Error("Commande non trouvée")
      );

      await AdminCommandeController.updateCommandeStatut(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Commande non trouvée",
        message: "La commande spécifiée n'existe pas"
      });
    });

    test("devrait gérer les statuts invalides", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: "cmd-123" },
        { statut: "STATUT_INVALIDE" }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.updateCommandeStatut.mockRejectedValue(
        new Error("Statut invalide. Valeurs autorisées: ...")
      );

      await AdminCommandeController.updateCommandeStatut(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Statut invalide",
        message: "Statut invalide. Valeurs autorisées: ..."
      });
    });
  });

  describe("deleteCommande", () => {
    test("devrait supprimer une commande", async () => {
      const commandeId = "cmd-to-delete";

      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: commandeId }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.deleteCommande.mockResolvedValue(undefined);

      await AdminCommandeController.deleteCommande(req, res);

      expect(mockAdminCommandeService.deleteCommande).toHaveBeenCalledWith(commandeId);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Commande supprimée avec succès"
      });
    });

    test("devrait rejeter les requêtes sans ID", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        {} // Pas d'ID
      ) as Request;

      const res = createMockRes() as Response;

      await AdminCommandeController.deleteCommande(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "ID commande requis",
        message: "Veuillez fournir un ID de commande valide"
      });

      expect(mockAdminCommandeService.deleteCommande).not.toHaveBeenCalled();
    });

    test("devrait gérer les commandes non trouvées pour suppression", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: "cmd-inexistant" }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.deleteCommande.mockRejectedValue(
        new Error("Commande non trouvée")
      );

      await AdminCommandeController.deleteCommande(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Commande non trouvée",
        message: "La commande spécifiée n'existe pas"
      });
    });

    test("devrait gérer les erreurs générales de suppression", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: "cmd-123" }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.deleteCommande.mockRejectedValue(
        new Error("Database constraint violation")
      );

      await AdminCommandeController.deleteCommande(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erreur interne du serveur",
        message: "Impossible de supprimer la commande"
      });
    });
  });

  describe("getCommandeById", () => {
    test("devrait récupérer une commande détaillée par ID", async () => {
      const commandeId = "cmd-detail";

      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: commandeId }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.getCommandeById.mockResolvedValue(mockDetailedCommande);

      await AdminCommandeController.getCommandeById(req, res);

      expect(mockAdminCommandeService.getCommandeById).toHaveBeenCalledWith(commandeId);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Commande récupérée avec succès",
        data: mockDetailedCommande
      });
    });

    test("devrait rejeter les requêtes sans ID", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        {} // Pas d'ID
      ) as Request;

      const res = createMockRes() as Response;

      await AdminCommandeController.getCommandeById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "ID commande requis",
        message: "Veuillez fournir un ID de commande valide"
      });

      expect(mockAdminCommandeService.getCommandeById).not.toHaveBeenCalled();
    });

    test("devrait gérer les commandes non trouvées", async () => {
      const commandeId = "cmd-inexistant";

      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: commandeId }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.getCommandeById.mockRejectedValue(
        new Error("Commande non trouvée")
      );

      await AdminCommandeController.getCommandeById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Commande introuvable",
        message: `Aucune commande trouvée avec l'ID ${commandeId}`
      });
    });

    test("devrait gérer les erreurs générales", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: "cmd-123" }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.getCommandeById.mockRejectedValue(
        new Error("Database connection failed")
      );

      await AdminCommandeController.getCommandeById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer la commande"
      });
    });
  });

  describe("Tests d'intégration workflow admin", () => {
    test("devrait gérer un workflow complet d'administration", async () => {
      // 1. Récupérer la liste des commandes
      const listReq = createMockReq(
        { email: "admin@staka.com" },
        { statut: StatutCommande.EN_ATTENTE }
      ) as Request;

      const listRes = createMockRes() as Response;

      mockAdminCommandeService.getCommandes.mockResolvedValue(mockCommandesResponse);

      await AdminCommandeController.getCommandes(listReq, listRes);

      expect(listRes.status).toHaveBeenCalledWith(200);

      // 2. Récupérer une commande spécifique
      const detailReq = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: "cmd-detail" }
      ) as Request;

      const detailRes = createMockRes() as Response;

      mockAdminCommandeService.getCommandeById.mockResolvedValue(mockDetailedCommande);

      await AdminCommandeController.getCommandeById(detailReq, detailRes);

      expect(detailRes.status).toHaveBeenCalledWith(200);

      // 3. Mettre à jour le statut
      const updateReq = createMockReq(
        { email: "admin@staka.com" },
        {},
        { id: "cmd-detail" },
        { statut: StatutCommande.EN_COURS }
      ) as Request;

      const updateRes = createMockRes() as Response;

      const updatedCommande = {
        ...mockDetailedCommande,
        statut: StatutCommande.EN_COURS
      };

      mockAdminCommandeService.updateCommandeStatut.mockResolvedValue(updatedCommande);

      await AdminCommandeController.updateCommandeStatut(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(mockAdminCommandeService.updateCommandeStatut).toHaveBeenCalledWith(
        "cmd-detail",
        StatutCommande.EN_COURS
      );
    });

    test("devrait gérer les filtres complexes", async () => {
      const req = createMockReq(
        { email: "admin@staka.com" },
        {
          page: "2",
          limit: "25",
          search: "premium client",
          statut: StatutCommande.EN_COURS,
          clientId: "premium-user-456",
          dateFrom: "2023-01-01T00:00:00.000Z",
          dateTo: "2023-12-31T23:59:59.000Z"
        }
      ) as Request;

      const res = createMockRes() as Response;

      mockAdminCommandeService.getCommandes.mockResolvedValue(mockCommandesResponse);

      await AdminCommandeController.getCommandes(req, res);

      const expectedFilters = {
        search: "premium client",
        statut: StatutCommande.EN_COURS,
        clientId: "premium-user-456",
        dateFrom: new Date("2023-01-01T00:00:00.000Z"),
        dateTo: new Date("2023-12-31T23:59:59.000Z")
      };

      expect(mockAdminCommandeService.getCommandes).toHaveBeenCalledWith(
        2,
        25,
        expectedFilters
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Liste des commandes récupérée avec succès",
        ...mockCommandesResponse,
        filters: expectedFilters
      });
    });
  });
});