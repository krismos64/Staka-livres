import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Readable } from "node:stream";

// Mock Prisma FIRST, before any imports that use it
vi.mock("@prisma/client", () => {
  const mockPrismaUser = {
    findUnique: vi.fn().mockResolvedValue({
      id: "admin-123",
      email: "admin@test.com", 
      role: "ADMIN",
      isActive: true
    })
  };

  const mockPrismaInvoice = {
    findUnique: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn()
  };

  const mockPrismaCommande = {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn()
  };

  return {
    PrismaClient: vi.fn(() => ({
      user: mockPrismaUser,
      invoice: mockPrismaInvoice,
      commande: mockPrismaCommande,
      $disconnect: vi.fn()
    })),
    Role: {
      ADMIN: "ADMIN",
      USER: "USER",
      CORRECTOR: "CORRECTOR"
    }
  };
});

// Mock services
vi.mock("../../services/pdf");
vi.mock("../../services/s3InvoiceService");

import { PrismaClient } from "@prisma/client";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { authenticateToken } from "../../middleware/auth";
import facturesRouter from "../../routes/admin/factures";
import { PdfService } from "../../services/pdf";
import { S3InvoiceService } from "../../services/s3InvoiceService";
import { getAdminToken } from "../../test-helpers/utils";

const mockPdfService = vi.mocked(PdfService);
const mockS3InvoiceService = vi.mocked(S3InvoiceService);

const app = express();
app.use(express.json());
app.use(authenticateToken);
app.use("/admin/factures", facturesRouter);

const prisma = new PrismaClient();

// Get access to the mocked Prisma methods
const mockPrismaUser = (prisma as any).user;
const mockPrismaInvoice = (prisma as any).invoice;
const mockPrismaCommande = (prisma as any).commande;

describe("Admin Factures Routes", () => {
  let token: string;
  let testInvoice: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeAll(async () => {
    // Créer un token d'admin pour les tests
    token = getAdminToken();

    // Mock testUser and testCommande for setup
    mockPrismaCommande.findFirst.mockResolvedValue({
      id: "test-commande-id",
      userId: "admin-123"
    });

    mockPrismaCommande.create.mockResolvedValue({
      id: "test-commande-id",
      userId: "admin-123",
      titre: "Test Correction",
      description: "Test description",
      amount: 10000,
      statut: "TERMINE"
    });

    // Mock invoice creation
    testInvoice = {
      id: "test-invoice-id",
      commandeId: "test-commande-id",
      number: "TEST-FACT-001",
      amount: 10000,
      taxAmount: 2000,
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      pdfUrl: null,
      commande: {
        id: "test-commande-id",
        titre: "Test Correction",
        description: "Test description",
        user: {
          id: "admin-123",
          prenom: "Admin",
          nom: "Test",
          email: "admin@test.com",
          adresse: "Test Address"
        }
      }
    };

    mockPrismaInvoice.create.mockResolvedValue(testInvoice);
  });

  afterAll(async () => {
    // Mock cleanup
    mockPrismaInvoice.deleteMany.mockResolvedValue({ count: 0 });
    mockPrismaCommande.deleteMany.mockResolvedValue({ count: 0 });
    await prisma.$disconnect();
  });

  describe("GET /admin/factures/:id/download", () => {
    it("should download PDF for existing invoice", async () => {
      // Mock les services
      mockPdfService.buildInvoicePdf = vi
        .fn()
        .mockResolvedValue(Buffer.from("PDF content"));
      mockS3InvoiceService.invoiceExists = vi.fn().mockResolvedValue(false);
      mockS3InvoiceService.uploadInvoicePdf = vi
        .fn()
        .mockResolvedValue("https://s3.amazonaws.com/test.pdf");
      mockS3InvoiceService.generateSignedUrl = vi
        .fn()
        .mockResolvedValue("https://s3.amazonaws.com/test.pdf?signed=true");

      // Mock invoice exists
      mockPrismaInvoice.findUnique.mockResolvedValue(testInvoice);

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain("attachment");
      expect(response.headers["content-disposition"]).toContain(
        `Facture_${testInvoice.number}.pdf`
      );
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it("should return 401 for non-existent invoice", async () => {
      // Mock invoice not found
      mockPrismaInvoice.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/admin/factures/550e8400-e29b-41d4-a716-446655440999/download")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe("Facture non trouvée");
    });

    it("should return 401 without authorization", async () => {
      await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .expect(401);
    });

    it("should use existing PDF from S3 when available", async () => {
      // Use imported mocked services
      mockS3InvoiceService.invoiceExists = vi.fn().mockResolvedValue(true);
      
      // Mock PDF stream
      const mockPdfStream = Readable.from(Buffer.from("PDF content"));
      mockS3InvoiceService.downloadInvoicePdf = vi
        .fn()
        .mockResolvedValue(mockPdfStream);

      // Mock invoice exists
      mockPrismaInvoice.findUnique.mockResolvedValue(testInvoice);

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(mockS3InvoiceService.downloadInvoicePdf).toHaveBeenCalled();
      expect(mockPdfService.buildInvoicePdf).not.toHaveBeenCalled();
    });

    it("should handle PDF generation errors gracefully", async () => {
      // Use imported mocked services
      mockPdfService.buildInvoicePdf = vi
        .fn()
        .mockRejectedValue(new Error("PDF generation failed"));
      mockS3InvoiceService.invoiceExists = vi.fn().mockResolvedValue(false);

      // Mock invoice exists
      mockPrismaInvoice.findUnique.mockResolvedValue(testInvoice);

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${token}`)
        .expect(500);

      expect(response.body.error).toContain("Erreur");
    });

    it("should include cache headers", async () => {
      // Use imported mocked services
      mockPdfService.buildInvoicePdf = vi
        .fn()
        .mockResolvedValue(Buffer.from("PDF content"));
      mockS3InvoiceService.invoiceExists = vi.fn().mockResolvedValue(false);
      mockS3InvoiceService.uploadInvoicePdf = vi
        .fn()
        .mockResolvedValue("https://s3.amazonaws.com/test.pdf");
      mockS3InvoiceService.generateSignedUrl = vi
        .fn()
        .mockResolvedValue("https://s3.amazonaws.com/test.pdf?signed=true");

      // Mock invoice exists
      mockPrismaInvoice.findUnique.mockResolvedValue(testInvoice);

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.headers["cache-control"]).toBeDefined();
    });
  });

  describe("GET /admin/factures/:id/pdf", () => {
    it("should redirect to signed URL for existing PDF", async () => {
      // Use imported mocked services
      mockS3InvoiceService.invoiceExists = vi.fn().mockResolvedValue(true);
      mockS3InvoiceService.generateSignedUrl = vi
        .fn()
        .mockResolvedValue("https://s3.amazonaws.com/test.pdf?signed=true");

      // Mock invoice exists and update
      mockPrismaInvoice.findUnique.mockResolvedValue({
        ...testInvoice,
        pdfUrl: "https://s3.amazonaws.com/old-url.pdf"
      });
      
      mockPrismaInvoice.update.mockResolvedValue({
        ...testInvoice,
        pdfUrl: "https://s3.amazonaws.com/test.pdf?signed=true"
      });

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/pdf`)
        .set("Authorization", `Bearer ${token}`)
        .set("Accept", "application/pdf")
        .expect(302);

      expect(response.headers["location"]).toBe(
        "https://s3.amazonaws.com/test.pdf?signed=true"
      );
    });

    it("should generate new PDF when not exists on S3", async () => {
      // Use imported mocked services
      mockPdfService.buildInvoicePdf = vi
        .fn()
        .mockResolvedValue(Buffer.from("PDF content"));
      mockS3InvoiceService.invoiceExists = vi.fn().mockResolvedValue(false);
      mockS3InvoiceService.uploadInvoicePdf = vi
        .fn()
        .mockResolvedValue("https://s3.amazonaws.com/test.pdf");
      mockS3InvoiceService.generateSignedUrl = vi
        .fn()
        .mockResolvedValue("https://s3.amazonaws.com/test.pdf?signed=true");

      // Mock invoice exists and update
      mockPrismaInvoice.findUnique.mockResolvedValue(testInvoice);
      mockPrismaInvoice.update.mockResolvedValue({
        ...testInvoice,
        pdfUrl: "https://s3.amazonaws.com/test.pdf?signed=true"
      });

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/pdf`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    it("should update invoice pdfUrl after generation", async () => {
      // Use imported mocked services
      mockPdfService.buildInvoicePdf = vi
        .fn()
        .mockResolvedValue(Buffer.from("PDF content"));
      mockS3InvoiceService.invoiceExists = vi.fn().mockResolvedValue(false);
      mockS3InvoiceService.uploadInvoicePdf = vi
        .fn()
        .mockResolvedValue("https://s3.amazonaws.com/test.pdf");
      mockS3InvoiceService.generateSignedUrl = vi
        .fn()
        .mockResolvedValue("https://s3.amazonaws.com/test.pdf?signed=true");

      // Mock invoice exists and update
      mockPrismaInvoice.findUnique.mockResolvedValue(testInvoice);
      mockPrismaInvoice.update.mockResolvedValue({
        ...testInvoice,
        pdfUrl: "https://s3.amazonaws.com/test.pdf?signed=true"
      });

      await request(app)
        .get(`/admin/factures/${testInvoice.id}/pdf`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Vérifier que la facture a été mise à jour
      expect(mockPrismaInvoice.update).toHaveBeenCalledWith({
        where: { id: testInvoice.id },
        data: { pdfUrl: "https://s3.amazonaws.com/test.pdf?signed=true" }
      });
    });

    it("should return 401 for non-existent invoice", async () => {
      // Mock invoice not found
      mockPrismaInvoice.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/admin/factures/550e8400-e29b-41d4-a716-446655440999/pdf")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe("Facture non trouvée");
    });

    it("should handle signed URL generation errors gracefully", async () => {
      // Use imported mocked services
      mockS3InvoiceService.invoiceExists = vi.fn().mockResolvedValue(true);
      mockS3InvoiceService.generateSignedUrl = vi
        .fn()
        .mockRejectedValue(new Error("S3 error"));

      // Mock invoice exists
      mockPrismaInvoice.findUnique.mockResolvedValue(testInvoice);

      const response = await request(app)
        .get(`/admin/factures/${testInvoice.id}/pdf`)
        .set("Authorization", `Bearer ${token}`)
        .expect(500);

      expect(response.body.error).toContain("Erreur");
    });
  });

  describe("Authorization", () => {
    it("should require admin role", async () => {
      // Mock user with different role
      mockPrismaUser.findUnique.mockResolvedValue({
        id: "user-id",
        email: "user@test.com",
        role: "USER",
        isActive: true
      });

      // Créer un token utilisateur non-admin
      const userToken = jwt.sign(
        { id: "user-id", role: "USER" },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "1h" }
      );

      await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);

      // Reset mock
      mockPrismaUser.findUnique.mockResolvedValue({
        id: "admin-123",
        email: "admin@test.com",
        role: "ADMIN",
        isActive: true
      });
    });

    it("should reject invalid tokens", async () => {
      const invalidToken = "invalid-token";

      await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${invalidToken}`)
        .expect(401);
    });

    it("should reject expired tokens", async () => {
      vi.useFakeTimers();
      
      const expiredToken = jwt.sign(
        { id: "admin-id", role: "ADMIN" },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "-1h" }
      );

      await request(app)
        .get(`/admin/factures/${testInvoice.id}/download`)
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      vi.useRealTimers();
    });
  });
});