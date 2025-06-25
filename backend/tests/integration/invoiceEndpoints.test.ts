/**
 * Tests d'intégration pour les endpoints de factures
 *
 * Ces tests utilisent une vraie base de données en mémoire
 * et testent l'API complète avec authentification JWT
 */

import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../src/server";

const prisma = new PrismaClient();

describe("Invoice Endpoints Integration Tests", () => {
  let userToken: string;
  let adminToken: string;
  let testUserId: string;
  let testCommandeId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    // Nettoyer la base de test
    await prisma.invoice.deleteMany();
    await prisma.commande.deleteMany();
    await prisma.user.deleteMany();

    // Créer un utilisateur de test
    const testUser = await prisma.user.create({
      data: {
        prenom: "Jean",
        nom: "Test",
        email: "jean.test@example.com",
        password: "$2b$10$hashedpassword", // Mock password
        role: "USER",
        isActive: true,
      },
    });
    testUserId = testUser.id;

    // Créer un admin de test
    const adminUser = await prisma.user.create({
      data: {
        prenom: "Admin",
        nom: "Test",
        email: "admin.test@example.com",
        password: "$2b$10$hashedpassword",
        role: "ADMIN",
        isActive: true,
      },
    });

    // Créer une commande de test
    const testCommande = await prisma.commande.create({
      data: {
        userId: testUserId,
        titre: "Test Correction Mémoire",
        description: "Correction d'un mémoire de master en informatique",
        statut: "TERMINE",
        paymentStatus: "paid",
        amount: 59900,
      },
    });
    testCommandeId = testCommande.id;

    // Créer une facture de test
    const testInvoice = await prisma.invoice.create({
      data: {
        commandeId: testCommandeId,
        amount: 59900,
        pdfUrl:
          "https://test-bucket.s3.amazonaws.com/invoices/test-invoice.pdf",
      },
    });
    testInvoiceId = testInvoice.id;

    // Générer les tokens JWT
    userToken = jwt.sign(
      { id: testUserId, email: testUser.email, role: "USER" },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );

    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: "ADMIN" },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    // Nettoyer après les tests
    await prisma.invoice.deleteMany();
    await prisma.commande.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /invoices", () => {
    it("devrait retourner les factures de l'utilisateur connecté", async () => {
      const response = await request(app)
        .get("/invoices")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("invoices");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.invoices).toHaveLength(1);

      const invoice = response.body.invoices[0];
      expect(invoice).toMatchObject({
        id: testInvoiceId,
        amount: 59900,
        amountFormatted: "599.00 €",
        commande: {
          id: testCommandeId,
          titre: "Test Correction Mémoire",
          statut: "TERMINE",
        },
      });
    });

    it("devrait gérer la pagination correctement", async () => {
      const response = await request(app)
        .get("/invoices")
        .query({ page: 1, limit: 5 })
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it("devrait retourner 401 sans authentification", async () => {
      await request(app).get("/invoices").expect(401);
    });

    it("devrait retourner une liste vide pour un utilisateur sans factures", async () => {
      // Créer un nouvel utilisateur sans commandes
      const newUser = await prisma.user.create({
        data: {
          prenom: "Nouveau",
          nom: "User",
          email: "nouveau@example.com",
          password: "$2b$10$hashedpassword",
          role: "USER",
          isActive: true,
        },
      });

      const newUserToken = jwt.sign(
        { id: newUser.id, email: newUser.email, role: "USER" },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .get("/invoices")
        .set("Authorization", `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body.invoices).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);

      // Nettoyer
      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });

  describe("GET /invoices/:id", () => {
    it("devrait retourner les détails d'une facture", async () => {
      const response = await request(app)
        .get(`/invoices/${testInvoiceId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testInvoiceId,
        amount: 59900,
        amountFormatted: "599.00 €",
        commande: {
          id: testCommandeId,
          titre: "Test Correction Mémoire",
          description: "Correction d'un mémoire de master en informatique",
          statut: "TERMINE",
          user: {
            prenom: "Jean",
            nom: "Test",
            email: "jean.test@example.com",
          },
        },
      });
    });

    it("devrait retourner 404 pour une facture inexistante", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      await request(app)
        .get(`/invoices/${fakeId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(404);
    });

    it("devrait retourner 403 pour une facture d'un autre utilisateur", async () => {
      // Créer un autre utilisateur et sa facture
      const otherUser = await prisma.user.create({
        data: {
          prenom: "Autre",
          nom: "User",
          email: "autre@example.com",
          password: "$2b$10$hashedpassword",
          role: "USER",
          isActive: true,
        },
      });

      const otherCommande = await prisma.commande.create({
        data: {
          userId: otherUser.id,
          titre: "Commande d'un autre utilisateur",
          statut: "TERMINE",
          amount: 29900,
        },
      });

      const otherInvoice = await prisma.invoice.create({
        data: {
          commandeId: otherCommande.id,
          amount: 29900,
          pdfUrl:
            "https://test-bucket.s3.amazonaws.com/invoices/other-invoice.pdf",
        },
      });

      // Tenter d'accéder à la facture de l'autre utilisateur
      await request(app)
        .get(`/invoices/${otherInvoice.id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);

      // Nettoyer
      await prisma.invoice.delete({ where: { id: otherInvoice.id } });
      await prisma.commande.delete({ where: { id: otherCommande.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe("GET /invoices/:id/download", () => {
    beforeEach(() => {
      // Mock des variables d'environnement pour S3
      process.env.AWS_ACCESS_KEY_ID = "test-access-key";
      process.env.S3_BUCKET_NAME = "test-bucket";
    });

    afterEach(() => {
      // Nettoyer les variables d'environnement
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.S3_BUCKET_NAME;
    });

    it("devrait rediriger vers l'URL du PDF quand S3 n'est pas configuré", async () => {
      // Supprimer la configuration S3
      delete process.env.AWS_ACCESS_KEY_ID;

      const response = await request(app)
        .get(`/invoices/${testInvoiceId}/download`)
        .set("Authorization", `Bearer ${userToken}`)
        .redirects(0) // Ne pas suivre les redirections
        .expect(302);

      expect(response.headers.location).toBe(
        "https://test-bucket.s3.amazonaws.com/invoices/test-invoice.pdf"
      );
    });

    it("devrait retourner 404 pour une facture inexistante", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      await request(app)
        .get(`/invoices/${fakeId}/download`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(404);
    });

    it("devrait retourner 403 pour une facture d'un autre utilisateur", async () => {
      // Créer un autre utilisateur et sa facture
      const otherUser = await prisma.user.create({
        data: {
          prenom: "Autre",
          nom: "User",
          email: "autre2@example.com",
          password: "$2b$10$hashedpassword",
          role: "USER",
          isActive: true,
        },
      });

      const otherCommande = await prisma.commande.create({
        data: {
          userId: otherUser.id,
          titre: "Commande d'un autre utilisateur 2",
          statut: "TERMINE",
          amount: 19900,
        },
      });

      const otherInvoice = await prisma.invoice.create({
        data: {
          commandeId: otherCommande.id,
          amount: 19900,
          pdfUrl:
            "https://test-bucket.s3.amazonaws.com/invoices/other-invoice2.pdf",
        },
      });

      // Tenter de télécharger la facture de l'autre utilisateur
      await request(app)
        .get(`/invoices/${otherInvoice.id}/download`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);

      // Nettoyer
      await prisma.invoice.delete({ where: { id: otherInvoice.id } });
      await prisma.commande.delete({ where: { id: otherCommande.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it("devrait retourner 401 sans authentification", async () => {
      await request(app).get(`/invoices/${testInvoiceId}/download`).expect(401);
    });
  });

  describe("Sécurité et performances", () => {
    it("devrait gérer plusieurs requêtes simultanées", async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .get("/invoices")
            .set("Authorization", `Bearer ${userToken}`)
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.invoices).toHaveLength(1);
      });
    });

    it("devrait respecter les limites de pagination", async () => {
      // Tester la limite maximum de 50
      const response = await request(app)
        .get("/invoices")
        .query({ page: 1, limit: 100 }) // Demander 100, limité à 50
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.pagination.limit).toBe(50);
    });

    it("devrait gérer les paramètres de pagination invalides", async () => {
      const response = await request(app)
        .get("/invoices")
        .query({ page: -1, limit: 0 }) // Valeurs invalides
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      // Devrait utiliser les valeurs par défaut
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1); // min 1
    });
  });
});
