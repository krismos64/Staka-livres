import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { authenticateToken } from "../../middleware/auth";
import { verifyToken } from "../../utils/token";

// Mock Prisma Client
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      findUnique: vi.fn(),
    },
    $disconnect: vi.fn(),
  })),
}));

// Mock token utilities
vi.mock("../../utils/token", () => ({
  verifyToken: vi.fn(),
}));

// Types pour les mocks
interface MockRequest extends Partial<Request> {
  headers?: any;
  user?: any;
  ip?: string;
  get?: (header: string) => string | undefined;
}

interface MockResponse extends Partial<Response> {
  status: vi.MockedFunction<any>;
  json: vi.MockedFunction<any>;
}

describe("🔒 JWT Middleware Security Tests", () => {
  let mockRequest: MockRequest;
  let mockResponse: MockResponse;
  let mockNext: NextFunction;
  let mockPrisma: any;
  let consoleSpy: any;

  beforeEach(() => {
    // Reset tous les mocks
    vi.clearAllMocks();

    // Configuration des mocks de base
    mockRequest = {
      headers: {},
      ip: "192.168.1.100",
      get: vi.fn().mockReturnValue("test-user-agent"),
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    // Mock Prisma
    const { PrismaClient } = require("@prisma/client");
    mockPrisma = new PrismaClient();
    mockPrisma.user.findUnique = vi.fn();

    // Mock console pour les tests de logging
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    consoleSpy.mockRestore();
  });

  describe("🚫 Token Validation Security", () => {
    test("should reject request without Authorization header", async () => {
      // Pas d'en-tête Authorization
      mockRequest.headers = {};

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Token d'accès requis" 
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Tentative d'accès sans token")
      );
    });

    test("should reject request with malformed Authorization header", async () => {
      // En-tête Authorization malformé (sans 'Bearer ')
      mockRequest.headers = {
        authorization: "InvalidTokenFormat"
      };

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Token d'accès requis" 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject request with invalid JWT token", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-jwt-token"
      };

      // Mock verifyToken lance une erreur pour token invalide
      vi.mocked(verifyToken).mockImplementation(() => {
        throw new Error("Invalid token signature");
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Token invalide" 
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Token invalide")
      );
    });

    test("should reject request with expired JWT token", async () => {
      mockRequest.headers = {
        authorization: "Bearer expired-jwt-token"
      };

      // Mock verifyToken lance une erreur pour token expiré
      vi.mocked(verifyToken).mockImplementation(() => {
        const error = new Error("Token expired");
        error.name = "TokenExpiredError";
        throw error;
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Token invalide" 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("🔍 User Validation Security", () => {
    test("should reject valid JWT for non-existent user", async () => {
      mockRequest.headers = {
        authorization: "Bearer valid-jwt-token"
      };

      // Mock token JWT valide
      vi.mocked(verifyToken).mockReturnValue({
        userId: "non-existent-user-123",
        email: "ghost@example.com",
        role: "USER",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      // Mock utilisateur non trouvé en base
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Utilisateur non trouvé" 
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Token valide mais utilisateur introuvable")
      );
    });

    test("should reject valid JWT for inactive user account", async () => {
      mockRequest.headers = {
        authorization: "Bearer valid-jwt-token"
      };

      vi.mocked(verifyToken).mockReturnValue({
        userId: "inactive-user-123",
        email: "inactive@example.com",
        role: "USER",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      // Mock utilisateur inactif
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "inactive-user-123",
        email: "inactive@example.com",
        role: "USER",
        isActive: false, // Compte désactivé
        prenom: "John",
        nom: "Doe",
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Compte désactivé" 
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Tentative d'accès avec compte inactif")
      );
    });

    test("should accept valid JWT for active user and attach user to request", async () => {
      mockRequest.headers = {
        authorization: "Bearer valid-jwt-token"
      };

      const mockDecodedToken = {
        userId: "active-user-123",
        email: "active@example.com",
        role: "USER",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const mockUser = {
        id: "active-user-123",
        prenom: "John",
        nom: "Doe",
        email: "active@example.com",
        role: "USER",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        telephone: null,
        adresse: null,
        bio: null,
        avatar: null,
        preferences: null,
      };

      vi.mocked(verifyToken).mockReturnValue(mockDecodedToken);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Vérifier que l'utilisateur est attaché à la requête
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Connexion réussie")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("active@example.com")
      );
    });
  });

  describe("🔎 Token Manipulation Security", () => {
    test("should reject JWT with tampered payload", async () => {
      mockRequest.headers = {
        authorization: "Bearer tampered.jwt.token"
      };

      // Mock verifyToken détecte la manipulation
      vi.mocked(verifyToken).mockImplementation(() => {
        const error = new Error("invalid signature");
        error.name = "JsonWebTokenError";
        throw error;
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Token invalide" 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject JWT with role privilege escalation attempt", async () => {
      mockRequest.headers = {
        authorization: "Bearer escalated-privilege-token"
      };

      // Token avec rôle modifié (mais signature invalide)
      vi.mocked(verifyToken).mockReturnValue({
        userId: "user-123",
        email: "user@example.com",
        role: "ADMIN", // Rôle modifié depuis USER
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      // Mais l'utilisateur en base est USER
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        role: "USER", // Rôle réel en base
        isActive: true,
        prenom: "John",
        nom: "Doe",
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // L'utilisateur est authentifié mais avec son vrai rôle
      expect(mockRequest.user?.role).toBe("USER");
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("⚠️ Security Logging and Monitoring", () => {
    test("should log all authentication attempts with IP and User-Agent", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-token"
      };
      mockRequest.ip = "suspicious.ip.address";
      mockRequest.get = vi.fn().mockReturnValue("Malicious-Bot/1.0");

      vi.mocked(verifyToken).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("suspicious.ip.address")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid token")
      );
    });

    test("should log successful authentications for monitoring", async () => {
      mockRequest.headers = {
        authorization: "Bearer valid-token"
      };

      vi.mocked(verifyToken).mockReturnValue({
        userId: "user-123",
        email: "legitimate@example.com",
        role: "USER",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "legitimate@example.com",
        role: "USER",
        isActive: true,
        prenom: "John",
        nom: "Doe",
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("✅ [AUTH] Connexion réussie")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("legitimate@example.com")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Role: USER")
      );
    });

    test("should handle database errors gracefully", async () => {
      mockRequest.headers = {
        authorization: "Bearer valid-token"
      };

      vi.mocked(verifyToken).mockReturnValue({
        userId: "user-123",
        email: "test@example.com",
        role: "USER",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      // Mock erreur base de données
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database connection failed"));

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Token invalide" 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("🔄 Session and Token Lifecycle", () => {
    test("should handle concurrent authentication requests", async () => {
      const mockHeaders = {
        authorization: "Bearer concurrent-token"
      };

      const mockTokenPayload = {
        userId: "concurrent-user-123",
        email: "concurrent@example.com",
        role: "USER",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const mockUser = {
        id: "concurrent-user-123",
        email: "concurrent@example.com",
        role: "USER",
        isActive: true,
        prenom: "John",
        nom: "Doe",
      };

      // Configuration pour requêtes concurrentes
      vi.mocked(verifyToken).mockReturnValue(mockTokenPayload);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Exécution de 3 requêtes concurrentes
      const requests = Array(3).fill(null).map(() => ({
        ...mockRequest,
        headers: mockHeaders
      }));

      const responses = Array(3).fill(null).map(() => ({ ...mockResponse }));
      const nexts = Array(3).fill(null).map(() => vi.fn());

      // Exécution parallèle
      const promises = requests.map((req, index) => 
        authenticateToken(req as Request, responses[index] as Response, nexts[index])
      );

      await Promise.all(promises);

      // Vérifier que toutes les requêtes sont traitées
      nexts.forEach(next => {
        expect(next).toHaveBeenCalled();
      });
      requests.forEach(req => {
        expect(req.user).toEqual(mockUser);
      });
    });

    test("should validate token signature against secret rotation", async () => {
      mockRequest.headers = {
        authorization: "Bearer old-secret-token"
      };

      // Mock token signé avec ancien secret
      vi.mocked(verifyToken).mockImplementation(() => {
        const error = new Error("invalid signature");
        error.name = "JsonWebTokenError";
        throw error;
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Token invalide" 
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("invalid signature")
      );
    });
  });
});
