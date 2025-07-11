import { InvoiceService } from "../../src/services/invoiceService";

// Mock des dépendances externes
const mockPrismaInvoice = {
  create: jest.fn(),
};

const mockPrisma = {
  invoice: mockPrismaInvoice,
};

// Mock PDFKit
const mockPDFDoc = {
  fontSize: jest.fn().mockReturnThis(),
  font: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  moveTo: jest.fn().mockReturnThis(),
  lineTo: jest.fn().mockReturnThis(),
  stroke: jest.fn().mockReturnThis(),
  on: jest.fn(),
  end: jest.fn(),
};

// Mock S3Client
const mockS3Send = jest.fn();
const mockS3Client = {
  send: mockS3Send,
};

// Mock MailerService
const mockMailerService = {
  sendInvoiceEmail: jest.fn(),
};

// Mock des modules avant import
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock("pdfkit", () => jest.fn(() => mockPDFDoc));

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => mockS3Client),
  PutObjectCommand: jest.fn(),
}));

jest.mock("../../src/utils/mailer", () => ({
  MailerService: mockMailerService,
}));

// Données de test
const mockCommande = {
  id: "cmd-test-123",
  titre: "Test Commande PDF",
  description: "Description de test",
  amount: 46800, // 468€
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-15"),
  user: {
    id: "user-test-123",
    prenom: "Jean",
    nom: "Dupont",
    email: "jean.dupont@test.com",
  },
};

describe("InvoiceService Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Configuration par défaut des mocks
    mockPDFDoc.on.mockImplementation((event: string, callback: Function) => {
      if (event === "end") {
        // Simuler la fin de génération PDF
        setTimeout(() => callback(), 10);
      } else if (event === "data") {
        // Simuler les chunks de données
        setTimeout(() => callback(Buffer.from("test-pdf-chunk")), 5);
      }
      return mockPDFDoc;
    });

    mockS3Send.mockResolvedValue({});
    mockMailerService.sendInvoiceEmail.mockResolvedValue(undefined);
    mockPrismaInvoice.create.mockResolvedValue({
      id: "invoice-test-123",
      commandeId: "cmd-test-123",
      amount: 46800,
      pdfUrl: "https://test-bucket.s3.amazonaws.com/invoices/test.pdf",
      createdAt: new Date(),
    });
  });

  describe("generateInvoicePDF", () => {
    it("devrait générer un PDF avec les bonnes informations", async () => {
      const pdfBuffer = await InvoiceService.generateInvoicePDF(
        mockCommande as any
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Vérifier que les méthodes PDF ont été appelées
      expect(mockPDFDoc.fontSize).toHaveBeenCalledWith(20);
      expect(mockPDFDoc.font).toHaveBeenCalledWith("Helvetica-Bold");
      expect(mockPDFDoc.text).toHaveBeenCalledWith("FACTURE", 50, 50);
      expect(mockPDFDoc.text).toHaveBeenCalledWith(
        expect.stringContaining("INV-"),
        50,
        80
      );

      // Vérifier les informations client
      expect(mockPDFDoc.text).toHaveBeenCalledWith("Jean Dupont", 50, 180);
      expect(mockPDFDoc.text).toHaveBeenCalledWith(
        "jean.dupont@test.com",
        50,
        195
      );

      // Vérifier le titre de la commande
      expect(mockPDFDoc.text).toHaveBeenCalledWith(
        "Test Commande PDF",
        50,
        expect.any(Number)
      );

      // Vérifier le montant
      expect(mockPDFDoc.text).toHaveBeenCalledWith(
        "468.00 €",
        450,
        expect.any(Number)
      );

      expect(mockPDFDoc.end).toHaveBeenCalled();
    });

    it("devrait gérer les erreurs de génération PDF", async () => {
      mockPDFDoc.on.mockImplementation((event: string, callback: Function) => {
        if (event === "error") {
          setTimeout(() => callback(new Error("PDF generation failed")), 10);
        }
        return mockPDFDoc;
      });

      await expect(
        InvoiceService.generateInvoicePDF(mockCommande as any)
      ).rejects.toThrow("PDF generation failed");
    });
  });

  describe("uploadInvoicePdf", () => {
    const testBuffer = Buffer.from("test-pdf-data");

    it("devrait uploader un PDF sur S3 et retourner l'URL", async () => {
      process.env.AWS_ACCESS_KEY_ID = "test-key";
      process.env.S3_BUCKET_NAME = "test-bucket";
      process.env.AWS_REGION = "eu-west-3";

      const url = await InvoiceService.uploadInvoicePdf(
        testBuffer,
        "cmd-test-123"
      );

      expect(mockS3Send).toHaveBeenCalledTimes(1);
      expect(url).toContain("test-bucket.s3.eu-west-3.amazonaws.com");
      expect(url).toContain("invoices/INV-");
      expect(url).toContain(".pdf");
    });

    it("devrait retourner une URL mock si S3 n'est pas configuré", async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.S3_BUCKET_NAME;

      const url = await InvoiceService.uploadInvoicePdf(
        testBuffer,
        "cmd-test-123"
      );

      expect(mockS3Send).not.toHaveBeenCalled();
      expect(url).toContain("mock-s3.amazonaws.com");
      expect(url).toContain("INV-");
    });

    it("devrait gérer les erreurs d'upload S3", async () => {
      process.env.AWS_ACCESS_KEY_ID = "test-key";
      process.env.S3_BUCKET_NAME = "test-bucket";

      mockS3Send.mockRejectedValue(new Error("S3 upload failed"));

      await expect(
        InvoiceService.uploadInvoicePdf(testBuffer, "cmd-test-123")
      ).rejects.toThrow("Échec de l'upload S3: Error: S3 upload failed");
    });
  });

  describe("processInvoiceForCommande", () => {
    beforeEach(() => {
      process.env.AWS_ACCESS_KEY_ID = "test-key";
      process.env.S3_BUCKET_NAME = "test-bucket";
    });

    it("devrait traiter complètement une facture", async () => {
      await InvoiceService.processInvoiceForCommande(mockCommande as any);

      // Vérifier que toutes les étapes ont été appelées
      expect(mockPDFDoc.end).toHaveBeenCalled(); // Génération PDF
      expect(mockS3Send).toHaveBeenCalled(); // Upload S3
      expect(mockPrismaInvoice.create).toHaveBeenCalledWith({
        data: {
          commandeId: "cmd-test-123",
          amount: 46800,
          pdfUrl: expect.stringContaining("test-bucket.s3"),
        },
      });
      expect(mockMailerService.sendInvoiceEmail).toHaveBeenCalledWith(
        "jean.dupont@test.com",
        expect.stringContaining("test-bucket.s3"),
        "Test Commande PDF"
      );
    });

    it("devrait gérer les erreurs lors du processus", async () => {
      mockPrismaInvoice.create.mockRejectedValue(new Error("Database error"));

      await expect(
        InvoiceService.processInvoiceForCommande(mockCommande as any)
      ).rejects.toThrow("Database error");
    });

    it("devrait gérer les erreurs d'envoi d'email", async () => {
      mockMailerService.sendInvoiceEmail.mockRejectedValue(
        new Error("Email failed")
      );

      await expect(
        InvoiceService.processInvoiceForCommande(mockCommande as any)
      ).rejects.toThrow("Email failed");
    });
  });

  describe("Intégration avec le webhook", () => {
    it("devrait traiter une commande depuis un webhook Stripe", async () => {
      const webhookCommande = {
        ...mockCommande,
        user: mockCommande.user,
        paymentStatus: "paid",
        statut: "EN_COURS",
      };

      await InvoiceService.processInvoiceForCommande(webhookCommande as any);

      // Vérifier la création de la facture
      expect(mockPrismaInvoice.create).toHaveBeenCalledWith({
        data: {
          commandeId: "cmd-test-123",
          amount: 46800,
          pdfUrl: expect.any(String),
        },
      });

      // Vérifier l'envoi de l'email
      expect(mockMailerService.sendInvoiceEmail).toHaveBeenCalledWith(
        "jean.dupont@test.com",
        expect.any(String),
        "Test Commande PDF"
      );
    });
  });
});
