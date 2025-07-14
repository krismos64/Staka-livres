import { PrismaClient, Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import request from "supertest";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import app from "../../src/app";
import { MailerService } from "../../src/utils/mailer";

const prisma = new PrismaClient();

// Mock MailerService pour éviter l'envoi d'emails réels
vi.mock("../../src/utils/mailer", () => ({
  MailerService: {
    sendEmail: vi.fn(),
  },
}));

// Helper pour créer un token utilisateur
const createUserToken = (userId: string = "user-test-id", email: string = "user@test.com") => {
  return jwt.sign(
    {
      userId,
      email,
      role: Role.USER,
    },
    process.env.JWT_SECRET || "test_secret",
    { expiresIn: "1h" }
  );
};

// Helper pour créer un utilisateur de test avec données complètes
const createTestUserWithData = async (userId: string = "test-user-rgpd") => {
  // Créer utilisateur
  const testUser = await prisma.user.upsert({
    where: { email: "rgpd@test.com" },
    update: {
      id: userId,
      isActive: true, // Réactiver si déjà supprimé
    },
    create: {
      id: userId,
      prenom: "Test",
      nom: "RGPD",
      email: "rgpd@test.com",
      password: "hashedpassword",
      role: Role.USER,
      isActive: true,
    },
  });

  // Créer quelques projets
  await prisma.project.createMany({
    data: [
      {
        id: "project-rgpd-1",
        userId,
        title: "Mon Premier Livre",
        description: "Roman autobiographique",
        status: "EN_COURS",
      },
      {
        id: "project-rgpd-2",
        userId,
        title: "Recueil de Poésies",
        description: "Collection de poèmes",
        status: "TERMINE",
      }
    ],
    skipDuplicates: true,
  });

  // Créer une commande avec facture
  const commande = await prisma.commande.upsert({
    where: { id: "cmd-rgpd-1" },
    update: {},
    create: {
      id: "cmd-rgpd-1",
      userId,
      titre: "Commande Test RGPD",
      description: "Commande pour tests RGPD",
      statut: "TERMINE",
      amount: 300,
    },
  });

  await prisma.invoice.upsert({
    where: { id: "invoice-rgpd-1" },
    update: {},
    create: {
      id: "invoice-rgpd-1",
      commandeId: commande.id,
      invoiceUrl: "https://example.com/invoice-rgpd-1.pdf",
      amount: 300,
    },
  });

  // Créer quelques messages
  await prisma.message.createMany({
    data: [
      {
        id: "msg-rgpd-1",
        userId,
        content: "Message utilisateur",
        isFromAdmin: false,
      },
      {
        id: "msg-rgpd-2",
        userId,
        content: "Réponse admin",
        isFromAdmin: true,
      }
    ],
    skipDuplicates: true,
  });

  return testUser;
};

// Cleanup helper
const cleanupTestData = async (userId: string) => {
  try {
    await prisma.message.deleteMany({ where: { userId } });
    await prisma.invoice.deleteMany({ where: { id: { startsWith: "invoice-rgpd" } } });
    await prisma.commande.deleteMany({ where: { userId } });
    await prisma.project.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  } catch (error) {
    console.warn("Cleanup error:", error);
  }
};

describe("User RGPD Endpoints", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData("test-user-rgpd");
    await cleanupTestData("test-user-export");
    await cleanupTestData("test-user-delete");
  });

  describe("GET /users/me/export", () => {
    test("devrait exporter les données utilisateur avec succès", async () => {
      const userId = "test-user-export";
      await createTestUserWithData(userId);
      const token = createUserToken(userId, "rgpd@test.com");

      const mockSendEmail = vi.mocked(MailerService.sendEmail);
      mockSendEmail.mockResolvedValue();

      const response = await request(app)
        .get("/users/me/export")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        message: "Vos données ont été exportées et envoyées par email",
        email: "rgpd@test.com",
        timestamp: expect.any(String),
      });

      // Vérifier que l'email a été envoyé
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: "rgpd@test.com",
        subject: "Export de vos données personnelles (RGPD)",
        text: expect.stringContaining("Export de vos données personnelles"),
        html: expect.stringContaining("Export de vos données personnelles"),
        attachments: [{
          content: expect.any(String),
          filename: expect.stringMatching(/^export-donnees-.+-\d{4}-\d{2}-\d{2}\.json$/),
          type: 'application/json',
          disposition: 'attachment'
        }]
      });

      // Vérifier le contenu de l'export
      const call = mockSendEmail.mock.calls[0][0];
      const attachment = call.attachments?.[0];
      if (attachment) {
        const jsonContent = Buffer.from(attachment.content, 'base64').toString('utf8');
        const exportData = JSON.parse(jsonContent);
        
        expect(exportData.user.email).toBe("rgpd@test.com");
        expect(exportData.user.projets).toHaveLength(2);
        expect(exportData.user.factures).toHaveLength(1);
        expect(exportData.user.messages).toHaveLength(2);
        expect(exportData.dataTypes).toEqual(['profile', 'projects', 'invoices', 'messages']);
      }
    });

    test("devrait rejeter sans token d'authentification", async () => {
      const response = await request(app)
        .get("/users/me/export")
        .expect(401);

      expect(response.body.error).toBe("Token manquant");
      expect(MailerService.sendEmail).not.toHaveBeenCalled();
    });

    test("devrait rejeter avec un token invalide", async () => {
      const response = await request(app)
        .get("/users/me/export")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.error).toBe("Token invalide");
      expect(MailerService.sendEmail).not.toHaveBeenCalled();
    });

    test("devrait gérer les erreurs d'export", async () => {
      const userId = "test-user-export";
      await createTestUserWithData(userId);
      const token = createUserToken(userId, "rgpd@test.com");

      // Mock erreur d'envoi d'email
      const mockSendEmail = vi.mocked(MailerService.sendEmail);
      mockSendEmail.mockRejectedValue(new Error("Erreur SendGrid"));

      const response = await request(app)
        .get("/users/me/export")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);

      expect(response.body.error).toBe("Erreur lors de l'export des données");
      expect(response.body.message).toContain("Échec de l'export des données");
    });
  });

  describe("DELETE /users/me", () => {
    test("devrait supprimer le compte utilisateur avec succès", async () => {
      const userId = "test-user-delete";
      await createTestUserWithData(userId);
      const token = createUserToken(userId, "rgpd@test.com");

      const response = await request(app)
        .delete("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      expect(response.body).toEqual({});

      // Vérifier que l'utilisateur a été soft delete
      const deletedUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      expect(deletedUser).toBeTruthy();
      expect(deletedUser?.isActive).toBe(false);
      expect(deletedUser?.email).toMatch(/^deleted_\d+@anonymized\.local$/);
      expect(deletedUser?.firstName).toBe("Utilisateur");
      expect(deletedUser?.lastName).toBe("Supprimé");
    });

    test("devrait rejeter sans token d'authentification", async () => {
      const response = await request(app)
        .delete("/users/me")
        .expect(401);

      expect(response.body.error).toBe("Token manquant");
    });

    test("devrait rejeter avec un token invalide", async () => {
      const response = await request(app)
        .delete("/users/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.error).toBe("Token invalide");
    });

    test("devrait gérer la suppression d'un utilisateur inexistant", async () => {
      const token = createUserToken("user-inexistant", "inexistant@test.com");

      const response = await request(app)
        .delete("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);

      expect(response.body.error).toBe("Erreur lors de la suppression du compte");
      expect(response.body.message).toContain("Utilisateur user-inexistant introuvable");
    });
  });
});