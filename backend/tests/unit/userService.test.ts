import { PrismaClient, Role } from "@prisma/client";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { UserService } from "../../src/services/userService";
import { MailerService } from "../../src/utils/mailer";

// Mock Prisma Client
vi.mock("@prisma/client", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    project: {
      findMany: vi.fn(),
    },
    commande: {
      findMany: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
  };

  return {
    PrismaClient: vi.fn(() => mockPrisma),
    Role,
  };
});

// Mock MailerService
vi.mock("../../src/utils/mailer", () => ({
  MailerService: {
    sendEmail: vi.fn(),
  },
}));

const mockPrisma = new PrismaClient() as any;

describe("UserService", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("deleteUserAccount", () => {
    test("devrait supprimer un compte utilisateur avec succès", async () => {
      // Mock utilisateur existant
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        isActive: true,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: "user-123",
        email: "deleted_1234567890@anonymized.local",
        isActive: false,
      });

      await UserService.deleteUserAccount("user-123");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" }
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: expect.objectContaining({
          isActive: false,
          firstName: "Utilisateur",
          lastName: "Supprimé",
          email: expect.stringMatching(/^deleted_\d+@anonymized\.local$/),
        })
      });
    });

    test("devrait lever une erreur si l'utilisateur n'existe pas", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(UserService.deleteUserAccount("user-inexistant")).rejects.toThrow(
        "Utilisateur user-inexistant introuvable"
      );

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    test("devrait gérer les erreurs de base de données", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Erreur DB"));

      await expect(UserService.deleteUserAccount("user-123")).rejects.toThrow(
        "Échec de la suppression du compte"
      );
    });
  });

  describe("exportUserData", () => {
    test("devrait exporter les données utilisateur et envoyer par email", async () => {
      // Mock données utilisateur
      const userData = {
        id: "user-123",
        email: "test@example.com",
        createdAt: new Date("2023-01-01"),
      };

      const projets = [
        {
          id: "project-1",
          title: "Mon Livre",
          description: "Description du livre",
          status: "EN_COURS",
          createdAt: new Date("2023-06-01"),
          updatedAt: new Date("2023-06-15"),
        }
      ];

      const commandes = [
        {
          invoices: [
            {
              id: "invoice-1",
              commandeId: "cmd-1",
              invoiceUrl: "https://example.com/invoice-1.pdf",
              createdAt: new Date("2023-06-10"),
              amount: 250,
            }
          ]
        }
      ];

      const messages = [
        {
          id: "msg-1",
          content: "Bonjour, voici mon message",
          createdAt: new Date("2023-06-05"),
          isFromAdmin: false,
        }
      ];

      mockPrisma.user.findUnique.mockResolvedValue(userData);
      mockPrisma.project.findMany.mockResolvedValue(projets);
      mockPrisma.commande.findMany.mockResolvedValue(commandes);
      mockPrisma.message.findMany.mockResolvedValue(messages);

      const mockSendEmail = vi.mocked(MailerService.sendEmail);
      mockSendEmail.mockResolvedValue();

      await UserService.exportUserData("user-123", "test@example.com");

      // Vérifier que les données ont été récupérées
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        select: {
          id: true,
          email: true,
          createdAt: true,
        }
      });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      // Vérifier l'envoi de l'email
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: "test@example.com",
        subject: "Export de vos données personnelles (RGPD)",
        text: expect.stringContaining("Export de vos données personnelles"),
        html: expect.stringContaining("Export de vos données personnelles"),
        attachments: [{
          content: expect.any(String),
          filename: expect.stringMatching(/^export-donnees-user-123-\d{4}-\d{2}-\d{2}\.json$/),
          type: 'application/json',
          disposition: 'attachment'
        }]
      });
    });

    test("devrait lever une erreur si l'utilisateur n'existe pas", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(UserService.exportUserData("user-inexistant", "test@example.com"))
        .rejects.toThrow("Utilisateur user-inexistant introuvable");

      expect(MailerService.sendEmail).not.toHaveBeenCalled();
    });

    test("devrait gérer les erreurs d'envoi d'email", async () => {
      // Mock données utilisateur valides
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        createdAt: new Date(),
      });
      
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.commande.findMany.mockResolvedValue([]);
      mockPrisma.message.findMany.mockResolvedValue([]);

      // Mock erreur d'envoi d'email
      const mockSendEmail = vi.mocked(MailerService.sendEmail);
      mockSendEmail.mockRejectedValue(new Error("Erreur envoi email"));

      await expect(UserService.exportUserData("user-123", "test@example.com"))
        .rejects.toThrow("Échec de l'export des données");
    });

    test("devrait inclure toutes les données dans l'export JSON", async () => {
      // Mock données complètes
      const userData = {
        id: "user-123",
        email: "test@example.com",
        createdAt: new Date("2023-01-01"),
      };

      const projets = [
        { id: "p1", title: "Projet 1", description: "Desc 1", status: "EN_COURS", createdAt: new Date(), updatedAt: new Date() },
        { id: "p2", title: "Projet 2", description: "Desc 2", status: "TERMINE", createdAt: new Date(), updatedAt: new Date() }
      ];

      const commandes = [
        { invoices: [{ id: "i1", commandeId: "c1", invoiceUrl: "url1", createdAt: new Date(), amount: 100 }] },
        { invoices: [{ id: "i2", commandeId: "c2", invoiceUrl: "url2", createdAt: new Date(), amount: 200 }] }
      ];

      const messages = [
        { id: "m1", content: "Message 1", createdAt: new Date(), isFromAdmin: false },
        { id: "m2", content: "Message 2", createdAt: new Date(), isFromAdmin: true }
      ];

      mockPrisma.user.findUnique.mockResolvedValue(userData);
      mockPrisma.project.findMany.mockResolvedValue(projets);
      mockPrisma.commande.findMany.mockResolvedValue(commandes);
      mockPrisma.message.findMany.mockResolvedValue(messages);

      const mockSendEmail = vi.mocked(MailerService.sendEmail);
      mockSendEmail.mockImplementation(async (options) => {
        // Vérifier le contenu de l'attachement
        const attachment = options.attachments?.[0];
        expect(attachment).toBeDefined();
        
        if (attachment) {
          const jsonContent = Buffer.from(attachment.content, 'base64').toString('utf8');
          const exportData = JSON.parse(jsonContent);
          
          expect(exportData).toEqual({
            exportDate: expect.any(String),
            user: {
              id: "user-123",
              email: "test@example.com",
              createdAt: "2023-01-01T00:00:00.000Z",
              projets,
              factures: [
                { id: "i1", commandeId: "c1", invoiceUrl: "url1", createdAt: expect.any(String), amount: 100 },
                { id: "i2", commandeId: "c2", invoiceUrl: "url2", createdAt: expect.any(String), amount: 200 }
              ],
              messages,
            },
            dataTypes: ['profile', 'projects', 'invoices', 'messages'],
            totalProjects: 2,
            totalInvoices: 2,
            totalMessages: 2
          });
        }
      });

      await UserService.exportUserData("user-123", "test@example.com");

      expect(mockSendEmail).toHaveBeenCalled();
    });
  });
});