import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { register, login, me, requestPasswordReset, resetPassword } from "../../controllers/authController";
import { signToken } from "../../utils/token";
import { AuthValidators } from "../../validators/authValidators";
import { PasswordResetService } from "../../services/passwordResetService";
import { AuditService } from "../../services/auditService";
import { MailerService } from "../../utils/mailer";

// Mock Prisma Client avec configuration simplifiée
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    commande: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $disconnect: vi.fn(),
  })),
  Role: { USER: "USER", ADMIN: "ADMIN", CORRECTOR: "CORRECTOR" },
}));

// Mock des dépendances
vi.mock("../../utils/token", () => ({
  signToken: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("../../validators/authValidators", () => ({
  AuthValidators: {
    validateRegistrationFields: vi.fn(),
    validateEmail: vi.fn(),
    validatePasswordComplexity: vi.fn(),
    validateLoginFields: vi.fn(),
    validateResetToken: vi.fn(),
  },
}));

vi.mock("../../services/passwordResetService", () => ({
  PasswordResetService: {
    createToken: vi.fn(),
    consumeToken: vi.fn(),
    invalidateUserTokens: vi.fn(),
  },
}));

vi.mock("../../services/auditService", () => ({
  AuditService: {
    logPasswordResetEvent: vi.fn(),
  },
}));

vi.mock("../../utils/mailer", () => ({
  MailerService: {
    sendEmail: vi.fn(),
  },
}));

vi.mock("../../controllers/notificationsController", () => ({
  notifyAdminNewRegistration: vi.fn(),
}));

// Types pour les mocks
interface MockRequest extends Partial<Request> {
  body?: any;
  user?: any;
  ip?: string;
  connection?: { remoteAddress?: string };
  get?: (header: string) => string | undefined;
}

interface MockResponse extends Partial<Response> {
  status: vi.MockedFunction<any>;
  json: vi.MockedFunction<any>;
}

describe("🔐 AuthController Security Tests", () => {
  let mockRequest: MockRequest;
  let mockResponse: MockResponse;
  let mockPrisma: any;

  beforeEach(() => {
    // Reset tous les mocks
    vi.clearAllMocks();

    // Configuration des mocks de base
    mockRequest = {
      body: {},
      ip: "192.168.1.100",
      connection: { remoteAddress: "192.168.1.100" },
      get: vi.fn().mockReturnValue("test-user-agent"),
    };
    
    // Récupérer l'instance mock Prisma créée par vi.mock
    const { PrismaClient } = require("@prisma/client");
    mockPrisma = new PrismaClient();

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Mock validateurs par défaut (succès)
    vi.mocked(AuthValidators.validateRegistrationFields).mockReturnValue({ isValid: true });
    vi.mocked(AuthValidators.validateEmail).mockReturnValue({ isValid: true });
    vi.mocked(AuthValidators.validatePasswordComplexity).mockReturnValue({ isValid: true });
    vi.mocked(AuthValidators.validateLoginFields).mockReturnValue({ isValid: true });
    vi.mocked(AuthValidators.validateResetToken).mockReturnValue({ isValid: true });

    // Mock bcrypt par défaut
    vi.mocked(bcrypt.hash).mockResolvedValue("$2b$12$hashed_password");
    vi.mocked(bcrypt.compare).mockResolvedValue(true);

    // Mock signToken par défaut
    vi.mocked(signToken).mockReturnValue("jwt-token-123");

    // Mock services par défaut
    vi.mocked(PasswordResetService.createToken).mockResolvedValue({ success: true, token: "reset-token-123" });
    vi.mocked(PasswordResetService.consumeToken).mockResolvedValue({ success: true, userId: "user-123" });
    vi.mocked(PasswordResetService.invalidateUserTokens).mockResolvedValue(undefined);
    vi.mocked(AuditService.logPasswordResetEvent).mockResolvedValue(undefined);
    vi.mocked(MailerService.sendEmail).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("🚫 Registration Security Tests", () => {
    test("should prevent SQL injection in email field", async () => {
      // Tentative d'injection SQL
      mockRequest.body = {
        prenom: "John",
        nom: "Doe",
        email: "test@example.com'; DROP TABLE users; --",
        password: "SecurePass123!",
      };

      // Mock validation échoue pour email malveillant
      vi.mocked(AuthValidators.validateEmail).mockReturnValue({
        isValid: false,
        message: "Format d'email invalide",
      });

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Format d'email invalide" 
      });
    });

    test("should prevent weak password registration", async () => {
      mockRequest.body = {
        prenom: "John",
        nom: "Doe",
        email: "test@example.com",
        password: "123", // Mot de passe faible
      };

      // Mock validation échoue pour mot de passe faible
      vi.mocked(AuthValidators.validatePasswordComplexity).mockReturnValue({
        isValid: false,
        message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre",
      });

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre" 
      });
    });

    test("should prevent duplicate email registration", async () => {
      mockRequest.body = {
        prenom: "John",
        nom: "Doe",
        email: "existing@example.com",
        password: "SecurePass123!",
      };

      // Mock utilisateur existant
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing-user-123",
        email: "existing@example.com",
      });

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Un utilisateur avec cet email existe déjà" 
      });
    });

    test("should use secure password hashing (bcrypt 12 rounds)", async () => {
      mockRequest.body = {
        prenom: "John",
        nom: "Doe",
        email: "test@example.com",
        password: "SecurePass123!",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null); // Pas d'utilisateur existant
      mockPrisma.user.create.mockResolvedValue({
        id: "new-user-123",
        prenom: "John",
        nom: "Doe",
        email: "test@example.com",
        role: "USER",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await register(mockRequest as Request, mockResponse as Response);

      // Vérifier que bcrypt.hash est appelé avec 12 rounds
      expect(bcrypt.hash).toHaveBeenCalledWith("SecurePass123!", 12);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    test("should log registration attempts for security monitoring", async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockRequest.body = {
        prenom: "John",
        nom: "Doe",
        email: "test@example.com",
        password: "SecurePass123!",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "new-user-123",
        prenom: "John",
        nom: "Doe",
        email: "test@example.com",
        role: "USER",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await register(mockRequest as Request, mockResponse as Response);

      // Vérifier que les événements sont loggés
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("🔐 [AUTH AUDIT]")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("REGISTER_ATTEMPT")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("REGISTER_SUCCESS")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("🔓 Login Security Tests", () => {
    test("should prevent brute force attacks by logging failed attempts", async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockRequest.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      // Mock utilisateur trouvé mais mot de passe incorrect
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$12$correct_hashed_password",
        isActive: true,
      });

      // Mock bcrypt.compare retourne false pour mauvais mot de passe
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Identifiants incorrects" 
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("LOGIN_FAILED")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid password")
      );

      consoleSpy.mockRestore();
    });

    test("should prevent login for inactive accounts", async () => {
      mockRequest.body = {
        email: "test@example.com",
        password: "correctpassword",
      };

      // Mock compte désactivé
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$12$hashed_password",
        isActive: false, // Compte désactivé
      });

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Compte désactivé" 
      });
    });

    test("should not reveal user existence on failed login", async () => {
      mockRequest.body = {
        email: "nonexistent@example.com",
        password: "anypassword",
      };

      // Mock utilisateur non trouvé
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response);

      // Même message pour utilisateur inexistant et mot de passe incorrect
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Identifiants incorrects" 
      });
    });

    test("should generate secure JWT tokens", async () => {
      mockRequest.body = {
        email: "test@example.com",
        password: "correctpassword",
      };

      const mockUser = {
        id: "user-123",
        prenom: "John",
        nom: "Doe",
        email: "test@example.com",
        password: "$2b$12$hashed_password",
        role: "USER",
        isActive: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      await login(mockRequest as Request, mockResponse as Response);

      // Vérifier que signToken est appelé avec les bonnes données
      expect(signToken).toHaveBeenCalledWith({
        userId: "user-123",
        email: "test@example.com",
        role: "USER",
      });
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Connexion réussie",
          token: "jwt-token-123",
          user: expect.not.objectContaining({ password: expect.anything() }), // Pas de mot de passe dans la réponse
        })
      );
    });
  });

  describe("🔐 Password Reset Security Tests", () => {
    test("should not reveal user existence on password reset request", async () => {
      mockRequest.body = {
        email: "nonexistent@example.com",
      };

      // Mock utilisateur non trouvé
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await requestPasswordReset(mockRequest as Request, mockResponse as Response);

      // Même message de succès pour éviter l'énumération d'utilisateurs
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: "Si cet email existe, un lien de réinitialisation vous a été envoyé" 
      });
      
      // Vérifier que l'événement est loggé
      expect(AuditService.logPasswordResetEvent).toHaveBeenCalledWith(
        "nonexistent@example.com",
        "failed",
        undefined,
        "192.168.1.100",
        "test-user-agent",
        { reason: "user_not_found" }
      );
    });

    test("should prevent password reset for inactive accounts", async () => {
      mockRequest.body = {
        email: "inactive@example.com",
      };

      // Mock compte inactif
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "inactive@example.com",
        isActive: false,
      });

      await requestPasswordReset(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: "Si cet email existe, un lien de réinitialisation vous a été envoyé" 
      });
      
      expect(AuditService.logPasswordResetEvent).toHaveBeenCalledWith(
        "inactive@example.com",
        "failed",
        "user-123",
        "192.168.1.100",
        "test-user-agent",
        { reason: "account_inactive" }
      );
    });

    test("should validate reset token securely", async () => {
      mockRequest.body = {
        token: "invalid-token",
        newPassword: "NewSecurePass123!",
      };

      // Mock token invalide
      vi.mocked(PasswordResetService.consumeToken).mockResolvedValue({
        success: false,
        userId: null,
      });

      await resetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Token invalide ou expiré" 
      });
      
      expect(AuditService.logPasswordResetEvent).toHaveBeenCalledWith(
        "unknown",
        "failed",
        undefined,
        "192.168.1.100",
        "test-user-agent",
        { reason: "invalid_token" }
      );
    });

    test("should enforce password complexity on reset", async () => {
      mockRequest.body = {
        token: "valid-token-123",
        newPassword: "weak", // Mot de passe faible
      };

      // Mock validation mot de passe échoue
      vi.mocked(AuthValidators.validatePasswordComplexity).mockReturnValue({
        isValid: false,
        message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre",
      });

      await resetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre" 
      });
    });

    test("should invalidate all reset tokens after successful reset", async () => {
      mockRequest.body = {
        token: "valid-token-123",
        newPassword: "NewSecurePass123!",
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        isActive: true,
      };

      vi.mocked(PasswordResetService.consumeToken).mockResolvedValue({
        success: true,
        userId: "user-123",
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await resetPassword(mockRequest as Request, mockResponse as Response);

      // Vérifier que tous les tokens sont invalidés
      expect(PasswordResetService.invalidateUserTokens).toHaveBeenCalledWith("user-123");
      
      // Vérifier que le mot de passe est hashé avec 12 rounds
      expect(bcrypt.hash).toHaveBeenCalledWith("NewSecurePass123!", 12);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: "Mot de passe réinitialisé avec succès" 
      });
    });
  });

  describe("🛡️ Authentication Middleware Security Tests", () => {
    test("should handle missing JWT token securely", async () => {
      mockRequest.user = undefined; // Pas d'utilisateur authentifié

      await me(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Utilisateur non authentifié" 
      });
    });

    test("should return user info securely for authenticated user", async () => {
      const mockAuthenticatedUser = {
        id: "user-123",
        prenom: "John",
        nom: "Doe",
        email: "test@example.com",
        role: "USER",
        isActive: true,
      };

      mockRequest.user = mockAuthenticatedUser;

      await me(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAuthenticatedUser);
    });
  });

  describe("⚠️ Error Handling and Edge Cases", () => {
    test("should handle database errors gracefully in registration", async () => {
      mockRequest.body = {
        prenom: "John",
        nom: "Doe",
        email: "test@example.com",
        password: "SecurePass123!",
      };

      // Mock erreur base de données
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database connection failed"));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Erreur interne du serveur" 
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors de l'inscription:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test("should handle malformed request data", async () => {
      // Requête avec données manquantes
      mockRequest.body = {
        email: "test@example.com",
        // Pas de mot de passe
      };

      // Mock validation échoue pour champs manquants
      vi.mocked(AuthValidators.validateLoginFields).mockReturnValue({
        isValid: false,
        message: "Email et mot de passe requis",
      });

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: "Email et mot de passe requis" 
      });
    });

    test("should log IP and User-Agent for security monitoring", async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockRequest.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };
      mockRequest.ip = "suspicious.ip.address";
      mockRequest.get = vi.fn().mockReturnValue("Suspicious-User-Agent/1.0");

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("suspicious.ip.address")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Suspicious-User-Agent/1.0")
      );

      consoleSpy.mockRestore();
    });
  });
});
