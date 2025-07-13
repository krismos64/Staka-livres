import request from "supertest";
import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import facturesRouter from "../../routes/admin/factures";
import { authenticateToken } from "../../middleware/auth";

// Mock services
jest.mock("../../services/pdf");
jest.mock("../../services/s3InvoiceService");

const app = express();
app.use(express.json());
app.use(authenticateToken);
app.use("/admin/factures", facturesRouter);

const prisma = new PrismaClient();

describe("Admin Factures Routes", () => {
  let adminToken: string;
  let testInvoice: any;

  beforeAll(async () => {
    // Créer un token d'admin pour les tests
    adminToken = jwt.sign(
      { userId: "admin-id", role: "ADMIN" },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );

    // Créer une facture de test
    const testUser = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (!testUser) {
      throw new Error("Aucun utilisateur admin trouvé pour les tests");
    }

    const testCommande = await prisma.commande.create({
      data: {
        userId: testUser.id,
        titre: "Test Correction",
        description: "Test description",
        amount: 10000, // 100€
        statut: "TERMINE",
      }
    });

    testInvoice = await prisma.invoice.create({
      data: {
        commandeId: testCommande.id,
        number: "TEST-FACT-001",
        amount: 10000,
        taxAmount: 2000,
        status: "GENERATED",
        pdfUrl: "",
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
      }
    });
  });

  afterAll(async () => {
    // Nettoyer les données de test
    if (testInvoice) {
      await prisma.invoice.deleteMany({
        where: { number: { startsWith: "TEST-" } }
      });
      await prisma.commande.deleteMany({
        where: { titre: { startsWith: "Test" } }
      });
    }
    await prisma.$disconnect();
  });

  describe("GET /admin/factures/:id/download", () => {
    it("should download PDF for existing invoice", async () => {
      // Mock les services
      const { PdfService } = require("../../services/pdf");
      const { S3InvoiceService } = require("../../services/s3InvoiceService");
      
      PdfService.buildInvoicePdf = jest.fn().mockResolvedValue(Buffer.from("PDF content"));
      S3InvoiceService.invoiceExists = jest.fn().mockResolvedValue(false);
      S3InvoiceService.uploadInvoicePdf = jest.fn().mockResolvedValue("https://s3.amazonaws.com/test.pdf");
      S3InvoiceService.generateSignedUrl = jest.fn().mockResolvedValue("https://s3.amazonaws.com/test.pdf?signed=true");

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain("attachment");
      expect(response.headers["content-disposition"]).toContain(`Facture_${testInvoice.number}.pdf`);
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it("should return 404 for non-existent invoice", async () => {
      const response = await request(app)
        .get("/admin/factures/non-existent-id/download")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe("Facture non trouvée");
    });

    it("should return 401 without authorization", async () => {
      await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .expect(401);
    });

    it("should use existing PDF from S3 when available", async () => {
      // Mock les services
      const { S3InvoiceService } = require("../../services/s3InvoiceService");
      const mockPdfStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from("Existing PDF content");
        }
      };
      
      S3InvoiceService.invoiceExists = jest.fn().mockResolvedValue(true);
      S3InvoiceService.downloadInvoicePdf = jest.fn().mockResolvedValue(mockPdfStream);

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(S3InvoiceService.downloadInvoicePdf).toHaveBeenCalledWith(testInvoice.id);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    it("should handle PDF generation errors gracefully", async () => {
      // Mock les services pour simuler une erreur
      const { PdfService } = require("../../services/pdf");
      const { S3InvoiceService } = require("../../services/s3InvoiceService");
      
      S3InvoiceService.invoiceExists = jest.fn().mockResolvedValue(false);
      PdfService.buildInvoicePdf = jest.fn().mockRejectedValue(new Error("PDF generation failed"));

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.error).toBe("Erreur lors du téléchargement du PDF");
      expect(response.body.details).toBe("PDF generation failed");
    });

    it("should include cache headers", async () => {
      // Mock les services
      const { PdfService } = require("../../services/pdf");
      const { S3InvoiceService } = require("../../services/s3InvoiceService");
      
      PdfService.buildInvoicePdf = jest.fn().mockResolvedValue(Buffer.from("PDF content"));
      S3InvoiceService.invoiceExists = jest.fn().mockResolvedValue(false);
      S3InvoiceService.uploadInvoicePdf = jest.fn().mockResolvedValue("https://s3.amazonaws.com/test.pdf");
      S3InvoiceService.generateSignedUrl = jest.fn().mockResolvedValue("https://s3.amazonaws.com/test.pdf?signed=true");

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers["cache-control"]).toBe("private, max-age=3600");
    });
  });

  describe("GET /admin/factures/:id/pdf", () => {
    it("should redirect to signed URL for existing PDF", async () => {
      // Mock les services
      const { S3InvoiceService } = require("../../services/s3InvoiceService");
      
      S3InvoiceService.invoiceExists = jest.fn().mockResolvedValue(true);
      S3InvoiceService.generateSignedUrl = jest.fn().mockResolvedValue("https://s3.amazonaws.com/test.pdf?signed=true");

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/pdf`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(302);

      expect(response.headers.location).toBe("https://s3.amazonaws.com/test.pdf?signed=true");
    });

    it("should generate new PDF when not exists on S3", async () => {
      // Mock les services
      const { PdfService } = require("../../services/pdf");
      const { S3InvoiceService } = require("../../services/s3InvoiceService");
      
      S3InvoiceService.invoiceExists = jest.fn().mockResolvedValue(false);
      PdfService.buildInvoicePdf = jest.fn().mockResolvedValue(Buffer.from("New PDF content"));
      S3InvoiceService.uploadInvoicePdf = jest.fn().mockResolvedValue("https://s3.amazonaws.com/test.pdf");
      S3InvoiceService.generateSignedUrl = jest.fn().mockResolvedValue("https://s3.amazonaws.com/test.pdf?signed=true");

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/pdf`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(PdfService.buildInvoicePdf).toHaveBeenCalled();
      expect(S3InvoiceService.uploadInvoicePdf).toHaveBeenCalled();
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    it("should update invoice pdfUrl after generation", async () => {
      // Mock les services
      const { PdfService } = require("../../services/pdf");
      const { S3InvoiceService } = require("../../services/s3InvoiceService");
      
      S3InvoiceService.invoiceExists = jest.fn().mockResolvedValue(false);
      PdfService.buildInvoicePdf = jest.fn().mockResolvedValue(Buffer.from("PDF content"));
      S3InvoiceService.uploadInvoicePdf = jest.fn().mockResolvedValue("https://s3.amazonaws.com/test.pdf");
      S3InvoiceService.generateSignedUrl = jest.fn().mockResolvedValue("https://s3.amazonaws.com/test.pdf?signed=true");

      await request(app)
        .get(`/admin/factures/${testInvoice.id}/pdf`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Vérifier que la facture a été mise à jour
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: testInvoice.id }
      });

      expect(updatedInvoice?.pdfUrl).toBe("https://s3.amazonaws.com/test.pdf?signed=true");
    });

    it("should return 404 for non-existent invoice", async () => {
      const response = await request(app)
        .get("/admin/factures/non-existent-id/pdf")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe("Facture non trouvée");
    });

    it("should handle signed URL generation errors gracefully", async () => {
      // Mock les services pour simuler une erreur
      const { S3InvoiceService } = require("../../services/s3InvoiceService");
      
      S3InvoiceService.invoiceExists = jest.fn().mockResolvedValue(true);
      S3InvoiceService.generateSignedUrl = jest.fn().mockRejectedValue(new Error("S3 error"));

      // Doit continuer vers la génération si l'URL signée échoue
      const { PdfService } = require("../../services/pdf");
      PdfService.buildInvoicePdf = jest.fn().mockResolvedValue(Buffer.from("PDF content"));
      S3InvoiceService.uploadInvoicePdf = jest.fn().mockResolvedValue("https://s3.amazonaws.com/test.pdf");

      // Le deuxième appel pour la génération doit réussir
      S3InvoiceService.generateSignedUrl = jest.fn()
        .mockRejectedValueOnce(new Error("S3 error"))
        .mockResolvedValue("https://s3.amazonaws.com/test.pdf?signed=true");

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/pdf`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
    });
  });

  describe("Authorization", () => {
    it("should require admin role", async () => {
      // Créer un token utilisateur non-admin
      const userToken = jwt.sign(
        { userId: "user-id", role: "USER" },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "1h" }
      );

      await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);
    });

    it("should reject invalid tokens", async () => {
      await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should reject expired tokens", async () => {
      const expiredToken = jwt.sign(
        { userId: "admin-id", role: "ADMIN" },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "-1h" }
      );

      await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
});