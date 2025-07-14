import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import express from "express";
import authRoutes from "../../routes/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Mock PrismaClient
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordReset: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  })),
}));

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock MailerService
vi.mock("../../utils/mailer", () => ({
  MailerService: {
    sendEmail: vi.fn(),
  },
}));

// Mock AuditService
vi.mock("../../services/auditService", () => ({
  AuditService: {
    logPasswordResetEvent: vi.fn(),
  },
}));

// Mock crypto
vi.mock("crypto", () => ({
  randomBytes: vi.fn().mockReturnValue(Buffer.from("random-bytes")),
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      digest: vi.fn().mockReturnValue("hashed-token"),
    }),
  }),
}));

// Mock uuid
vi.mock("uuid", () => ({
  v4: vi.fn().mockReturnValue("12345678-1234-1234-1234-123456789012"),
}));

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  passwordReset: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
};

const mockMailerService = {
  sendEmail: vi.fn(),
};

const mockAuditService = {
  logPasswordResetEvent: vi.fn(),
};

const mockBcrypt = {
  hash: vi.fn(),
  compare: vi.fn(),
};

// Create express app for testing
const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("Password Reset Endpoints Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset console mocks
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set up default mocks
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password");
    mockMailerService.sendEmail.mockResolvedValue(true);
    mockAuditService.logPasswordResetEvent.mockResolvedValue(undefined);
    
    // Mock environment variables
    process.env.FRONTEND_URL = "http://localhost:3001";
  });

  describe("POST /api/auth/request-password-reset", () => {
    const validEmail = "test@example.com";
    const mockUser = {
      id: "user-123",
      email: validEmail,
      prenom: "Test",
      nom: "User",
      isActive: true,
    };

    it("should successfully request password reset for valid user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordReset.create.mockResolvedValue({
        id: "reset-123",
        userId: mockUser.id,
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      });

      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: validEmail });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Un lien de réinitialisation vous a été envoyé par email");
      
      // Verify user lookup
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validEmail.toLowerCase() }
      });
      
      // Verify token creation
      expect(mockPrisma.passwordReset.create).toHaveBeenCalled();
      
      // Verify email sent
      expect(mockMailerService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: validEmail,
          subject: "Réinitialisation de votre mot de passe",
        })
      );
      
      // Verify audit log
      expect(mockAuditService.logPasswordResetEvent).toHaveBeenCalledWith(
        validEmail,
        'request',
        mockUser.id,
        expect.any(String),
        expect.any(String)
      );
    });

    it("should return success message even for non-existent user (security)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "nonexistent@example.com" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Si cet email existe, un lien de réinitialisation vous a été envoyé");
      
      // Verify audit log for failed attempt
      expect(mockAuditService.logPasswordResetEvent).toHaveBeenCalledWith(
        "nonexistent@example.com",
        'failed',
        undefined,
        expect.any(String),
        expect.any(String),
        { reason: 'user_not_found' }
      );
    });

    it("should return success message for inactive user (security)", async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: validEmail });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Si cet email existe, un lien de réinitialisation vous a été envoyé");
      
      // Verify audit log
      expect(mockAuditService.logPasswordResetEvent).toHaveBeenCalledWith(
        validEmail,
        'failed',
        inactiveUser.id,
        expect.any(String),
        expect.any(String),
        { reason: 'account_inactive' }
      );
    });

    it("should validate email format", async () => {
      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "invalid-email" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Format d'email invalide");
    });

    it("should require email field", async () => {
      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Email requis");
    });

    it("should handle token creation failure", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordReset.create.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: validEmail });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Erreur lors de la création du token");
    });

    it("should handle email sending failure", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordReset.create.mockResolvedValue({
        id: "reset-123",
        userId: mockUser.id,
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      });
      mockMailerService.sendEmail.mockRejectedValue(new Error("Email error"));

      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: validEmail });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Erreur interne du serveur");
    });
  });

  describe("POST /api/auth/reset-password", () => {
    const validToken = "valid-token";
    const newPassword = "NewPassword123!";
    const mockUserId = "user-123";
    const mockUser = {
      id: mockUserId,
      email: "test@example.com",
      prenom: "Test",
      nom: "User",
      isActive: true,
    };

    it("should successfully reset password with valid token", async () => {
      const mockPasswordReset = {
        id: "reset-123",
        userId: mockUserId,
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);
      mockPrisma.passwordReset.delete.mockResolvedValue(mockPasswordReset);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, password: "hashed-password" });
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: validToken, newPassword });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Mot de passe réinitialisé avec succès");
      
      // Verify password is updated
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { password: "hashed-password" }
      });
      
      // Verify token is deleted
      expect(mockPrisma.passwordReset.delete).toHaveBeenCalledWith({
        where: { id: mockPasswordReset.id }
      });
      
      // Verify all user tokens are invalidated
      expect(mockPrisma.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId }
      });
      
      // Verify audit log
      expect(mockAuditService.logPasswordResetEvent).toHaveBeenCalledWith(
        mockUser.email,
        'success',
        mockUserId,
        expect.any(String),
        expect.any(String)
      );
    });

    it("should fail with invalid token", async () => {
      mockPrisma.passwordReset.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: "invalid-token", newPassword });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Token invalide ou expiré");
    });

    it("should fail with expired token", async () => {
      const expiredPasswordReset = {
        id: "reset-123",
        userId: mockUserId,
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        createdAt: new Date(),
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(expiredPasswordReset);
      mockPrisma.passwordReset.delete.mockResolvedValue(expiredPasswordReset);

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: validToken, newPassword });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Token invalide ou expiré");
      
      // Verify expired token is deleted
      expect(mockPrisma.passwordReset.delete).toHaveBeenCalledWith({
        where: { id: expiredPasswordReset.id }
      });
    });

    it("should validate password complexity", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: validToken, newPassword: "weak" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Mot de passe trop faible");
    });

    it("should require token field", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ newPassword });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Token et nouveau mot de passe requis");
    });

    it("should require newPassword field", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: validToken });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Token et nouveau mot de passe requis");
    });

    it("should validate token format", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: "invalid-format!", newPassword });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Format de token invalide");
    });

    it("should fail when user not found", async () => {
      const mockPasswordReset = {
        id: "reset-123",
        userId: "non-existent-user",
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);
      mockPrisma.passwordReset.delete.mockResolvedValue(mockPasswordReset);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: validToken, newPassword });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Utilisateur introuvable");
    });

    it("should fail when user is inactive", async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const mockPasswordReset = {
        id: "reset-123",
        userId: mockUserId,
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);
      mockPrisma.passwordReset.delete.mockResolvedValue(mockPasswordReset);
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: validToken, newPassword });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Compte désactivé");
    });

    it("should handle database errors", async () => {
      mockPrisma.passwordReset.findUnique.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: validToken, newPassword });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Erreur interne du serveur");
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to password reset requests", async () => {
      // Mock a user to make requests successful
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        prenom: "Test",
        nom: "User",
        isActive: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordReset.create.mockResolvedValue({
        id: "reset-123",
        userId: mockUser.id,
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      });

      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post("/api/auth/request-password-reset")
          .send({ email: "test@example.com" });
        expect(response.status).toBe(200);
      }

      // 6th request should be rate limited
      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(429);
      expect(response.body.error).toBe("Trop de demandes de réinitialisation. Veuillez réessayer dans 1 heure.");
      expect(response.body.retryAfter).toBeDefined();
    });
  });
});