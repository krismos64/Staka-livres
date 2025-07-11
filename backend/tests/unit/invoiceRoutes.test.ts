import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

// Mock des services
const mockPrismaInvoice = {
  findMany: jest.fn(),
  count: jest.fn(),
  findUnique: jest.fn(),
};

const mockPrisma = {
  invoice: mockPrismaInvoice,
};

const mockS3Client = {
  send: jest.fn(),
};

// Mock des modules
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => mockS3Client),
  GetObjectCommand: jest.fn(),
}));

// Mock du middleware d'authentification
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "test-secret");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalide" });
  }
};

// Mock du module d'authentification
jest.mock("../../src/middleware/auth", () => ({
  authenticateToken: mockAuthMiddleware,
}));

// Import après les mocks
import invoiceRoutes from "../../src/routes/invoice";

// Configuration de l'app de test avec auth middleware
const app = express();
app.use(express.json());
app.use("/invoices", invoiceRoutes);

// Token JWT valide pour les tests
const validToken = jwt.sign(
  { id: "user-test-123", email: "test@example.com" },
  process.env.JWT_SECRET || "test-secret",
  { expiresIn: "1h" }
);

describe("Invoice Routes Tests", () => {
  const mockUser = {
    id: "user-test-123",
    email: "test@example.com",
  };

  const mockInvoices = [
    {
      id: "invoice-1",
      amount: 59900,
      createdAt: new Date("2024-01-15"),
      pdfUrl: "https://s3.amazonaws.com/bucket/invoice1.pdf",
      commande: {
        id: "cmd-1",
        titre: "Correction Mémoire",
        statut: "TERMINE",
        createdAt: new Date("2024-01-14"),
      },
    },
    {
      id: "invoice-2",
      amount: 34900,
      createdAt: new Date("2024-01-10"),
      pdfUrl: "https://s3.amazonaws.com/bucket/invoice2.pdf",
      commande: {
        id: "cmd-2",
        titre: "Relecture Thèse",
        statut: "TERMINE",
        createdAt: new Date("2024-01-09"),
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Configuration par défaut des mocks
    mockPrismaInvoice.findMany.mockResolvedValue(mockInvoices);
    mockPrismaInvoice.count.mockResolvedValue(2);
    mockS3Client.send.mockResolvedValue({
      Body: {
        pipe: jest.fn((res) => {
          res.end("PDF content");
        }),
      },
    });
  });

  describe("GET /invoices", () => {
    it("devrait retourner les factures de l'utilisateur avec pagination", async () => {
      const response = await request(app)
        .get("/invoices")
        .set("Authorization", `Bearer ${validToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("invoices");
      expect(response.body).toHaveProperty("pagination");

      const { invoices, pagination } = response.body;

      expect(invoices).toHaveLength(2);
      expect(invoices[0]).toEqual({
        id: "invoice-1",
        amount: 59900,
        amountFormatted: "599.00 €",
        createdAt: expect.any(String),
        pdfUrl: "https://s3.amazonaws.com/bucket/invoice1.pdf",
        commande: {
          id: "cmd-1",
          titre: "Correction Mémoire",
          statut: "TERMINE",
          createdAt: expect.any(String),
        },
      });

      expect(pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      // Vérifier que Prisma a été appelé avec les bons paramètres
      expect(mockPrismaInvoice.findMany).toHaveBeenCalledWith({
        where: {
          commande: {
            userId: "user-test-123",
          },
        },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          pdfUrl: true,
          commande: {
            select: {
              id: true,
              titre: true,
              statut: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: 0,
        take: 10,
      });
    });

    it("devrait gérer la pagination correctement", async () => {
      const response = await request(app)
        .get("/invoices")
        .set("Authorization", `Bearer ${validToken}`)
        .query({ page: 2, limit: 1 });

      expect(response.status).toBe(200);

      expect(mockPrismaInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          take: 1,
        })
      );
    });

    it("devrait limiter la pagination à 50 par page maximum", async () => {
      await request(app)
        .get("/invoices")
        .set("Authorization", `Bearer ${validToken}`)
        .query({ page: 1, limit: 100 });

      expect(mockPrismaInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // Limité à 50
        })
      );
    });

    it("devrait retourner 401 sans token d'authentification", async () => {
      const response = await request(app).get("/invoices");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("devrait gérer les erreurs de base de données", async () => {
      mockPrismaInvoice.findMany.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/invoices")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Erreur lors de la récupération des factures",
      });
    });
  });

  describe("GET /invoices/:id", () => {
    const mockDetailedInvoice = {
      id: "invoice-1",
      amount: 59900,
      createdAt: new Date("2024-01-15"),
      pdfUrl: "https://s3.amazonaws.com/bucket/invoice1.pdf",
      commande: {
        id: "cmd-1",
        userId: "user-test-123",
        titre: "Correction Mémoire",
        description: "Correction complète d'un mémoire de master",
        statut: "TERMINE",
        createdAt: new Date("2024-01-14"),
        updatedAt: new Date("2024-01-15"),
        user: {
          prenom: "Jean",
          nom: "Dupont",
          email: "jean.dupont@test.com",
        },
      },
    };

    it("devrait retourner les détails d'une facture", async () => {
      mockPrismaInvoice.findUnique.mockResolvedValue(mockDetailedInvoice);

      const response = await request(app)
        .get("/invoices/invoice-1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: "invoice-1",
        amount: 59900,
        amountFormatted: "599.00 €",
        createdAt: expect.any(String),
        pdfUrl: "https://s3.amazonaws.com/bucket/invoice1.pdf",
        commande: {
          id: "cmd-1",
          titre: "Correction Mémoire",
          description: "Correction complète d'un mémoire de master",
          statut: "TERMINE",
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          user: {
            prenom: "Jean",
            nom: "Dupont",
            email: "jean.dupont@test.com",
          },
        },
      });
    });

    it("devrait retourner 404 si la facture n'existe pas", async () => {
      mockPrismaInvoice.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/invoices/inexistant")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Facture non trouvée",
      });
    });

    it("devrait retourner 403 si la facture n'appartient pas à l'utilisateur", async () => {
      const otherUserInvoice = {
        ...mockDetailedInvoice,
        commande: {
          ...mockDetailedInvoice.commande,
          userId: "other-user-456",
        },
      };

      mockPrismaInvoice.findUnique.mockResolvedValue(otherUserInvoice);

      const response = await request(app)
        .get("/invoices/invoice-1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "Accès non autorisé à cette facture",
      });
    });
  });

  describe("GET /invoices/:id/download", () => {
    const mockInvoiceForDownload = {
      id: "invoice-1",
      pdfUrl: "https://test-bucket.s3.amazonaws.com/invoices/test.pdf",
      commande: {
        userId: "user-test-123",
        titre: "Test Commande",
      },
    };

    beforeEach(() => {
      // Configuration S3 pour les tests
      process.env.AWS_ACCESS_KEY_ID = "test-key";
      process.env.S3_BUCKET_NAME = "test-bucket";
    });

    it("devrait permettre le téléchargement d'une facture valide", async () => {
      mockPrismaInvoice.findUnique.mockResolvedValue(mockInvoiceForDownload);

      const response = await request(app)
        .get("/invoices/invoice-1/download")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(mockPrismaInvoice.findUnique).toHaveBeenCalledWith({
        where: { id: "invoice-1" },
        include: {
          commande: {
            select: {
              userId: true,
              titre: true,
            },
          },
        },
      });
    });

    it("devrait rediriger si S3 n'est pas configuré", async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      mockPrismaInvoice.findUnique.mockResolvedValue(mockInvoiceForDownload);

      const response = await request(app)
        .get("/invoices/invoice-1/download")
        .set("Authorization", `Bearer ${validToken}`)
        .redirects(0); // Ne pas suivre les redirections

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(mockInvoiceForDownload.pdfUrl);
    });

    it("devrait retourner 404 si la facture n'existe pas", async () => {
      mockPrismaInvoice.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/invoices/inexistant/download")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Facture non trouvée",
      });
    });

    it("devrait retourner 403 pour une facture d'un autre utilisateur", async () => {
      const otherUserInvoice = {
        ...mockInvoiceForDownload,
        commande: {
          userId: "other-user-456",
          titre: "Test Commande",
        },
      };

      mockPrismaInvoice.findUnique.mockResolvedValue(otherUserInvoice);

      const response = await request(app)
        .get("/invoices/invoice-1/download")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "Accès non autorisé à cette facture",
      });
    });

    it("devrait faire un fallback vers redirection si S3 échoue", async () => {
      mockPrismaInvoice.findUnique.mockResolvedValue(mockInvoiceForDownload);
      mockS3Client.send.mockRejectedValue(new Error("S3 error"));

      const response = await request(app)
        .get("/invoices/invoice-1/download")
        .set("Authorization", `Bearer ${validToken}`)
        .redirects(0);

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(mockInvoiceForDownload.pdfUrl);
    });
  });

  describe("Gestion des erreurs d'authentification", () => {
    it("devrait retourner 401 avec un token invalide", async () => {
      const response = await request(app)
        .get("/invoices")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });

    it("devrait retourner 401 sans header Authorization", async () => {
      const response = await request(app).get("/invoices");

      expect(response.status).toBe(401);
    });
  });
});
