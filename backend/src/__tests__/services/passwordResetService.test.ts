import { beforeEach, describe, expect, it, vi } from "vitest";
import { PasswordResetService } from "../../services/passwordResetService";

// Mock PrismaClient
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      findUnique: vi.fn(),
    },
    passwordReset: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  })),
}));

// Mock crypto module
vi.mock("crypto", () => ({
  randomBytes: vi.fn(),
  createHash: vi.fn(),
}));

// Mock uuid
vi.mock("uuid", () => ({
  v4: vi.fn(),
}));

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  passwordReset: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
};

// Mock crypto functions
const mockRandomBytes = vi.fn();
const mockCreateHash = vi.fn();
const mockUpdate = vi.fn();
const mockDigest = vi.fn();
const mockUuid = vi.fn();

import { randomBytes, createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";

vi.mocked(randomBytes).mockImplementation(mockRandomBytes);
vi.mocked(createHash).mockImplementation(mockCreateHash);
vi.mocked(uuidv4).mockImplementation(mockUuid);

describe("PasswordResetService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset console.log and console.error mocks
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup crypto mocks
    mockUpdate.mockReturnValue({ digest: mockDigest });
    mockDigest.mockReturnValue("hashed-token");
    mockCreateHash.mockReturnValue({ update: mockUpdate });
    
    // Setup uuid mock
    mockUuid.mockReturnValue("12345678-1234-1234-1234-123456789012");
    
    // Setup randomBytes mock
    mockRandomBytes.mockReturnValue(Buffer.from("random-bytes"));
    
    // Mock Date.now for consistent timestamps
    vi.spyOn(Date, 'now').mockReturnValue(1642607400000); // Fixed timestamp
  });

  describe("createToken", () => {
    const mockUserId = "user-123";
    const mockUser = {
      id: mockUserId,
      email: "test@example.com",
      prenom: "Test",
      nom: "User",
      isActive: true,
    };

    it("should create a password reset token successfully", async () => {
      // Mock user exists and is active
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordReset.create.mockResolvedValue({
        id: "reset-123",
        userId: mockUserId,
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      });

      const result = await PasswordResetService.createToken(mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Token de réinitialisation créé");
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe("string");

      // Verify user lookup
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId }
      });

      // Verify old tokens are deleted
      expect(mockPrisma.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId }
      });

      // Verify new token is created
      expect(mockPrisma.passwordReset.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          tokenHash: "hashed-token",
          expiresAt: expect.any(Date),
        }
      });
    });

    it("should fail when user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await PasswordResetService.createToken(mockUserId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Utilisateur introuvable");
      expect(result.token).toBeUndefined();
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      const result = await PasswordResetService.createToken(mockUserId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Erreur lors de la création du token");
      expect(result.token).toBeUndefined();
    });
  });

  describe("verifyToken", () => {
    const mockToken = "valid-token";
    const mockUserId = "user-123";
    
    it("should verify a valid token successfully", async () => {
      const mockPasswordReset = {
        id: "reset-123",
        userId: mockUserId,
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        createdAt: new Date(),
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);

      const result = await PasswordResetService.verifyToken(mockToken);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(mockUserId);
    });

    it("should fail when token does not exist", async () => {
      mockPrisma.passwordReset.findUnique.mockResolvedValue(null);

      const result = await PasswordResetService.verifyToken(mockToken);

      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
    });

    it("should fail when token is expired", async () => {
      const mockPasswordReset = {
        id: "reset-123",
        userId: mockUserId,
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        createdAt: new Date(),
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);
      mockPrisma.passwordReset.delete.mockResolvedValue(mockPasswordReset);

      const result = await PasswordResetService.verifyToken(mockToken);

      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
      
      // Verify expired token is deleted
      expect(mockPrisma.passwordReset.delete).toHaveBeenCalledWith({
        where: { id: mockPasswordReset.id }
      });
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.passwordReset.findUnique.mockRejectedValue(new Error("Database error"));

      const result = await PasswordResetService.verifyToken(mockToken);

      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
    });
  });

  describe("consumeToken", () => {
    const mockToken = "valid-token";
    const mockUserId = "user-123";
    
    it("should consume a valid token successfully", async () => {
      const mockPasswordReset = {
        id: "reset-123",
        userId: mockUserId,
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        createdAt: new Date(),
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);
      mockPrisma.passwordReset.delete.mockResolvedValue(mockPasswordReset);

      const result = await PasswordResetService.consumeToken(mockToken);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(mockUserId);
      
      // Verify token is deleted (consumed)
      expect(mockPrisma.passwordReset.delete).toHaveBeenCalledWith({
        where: { id: mockPasswordReset.id }
      });
    });

    it("should fail when token does not exist", async () => {
      mockPrisma.passwordReset.findUnique.mockResolvedValue(null);

      const result = await PasswordResetService.consumeToken(mockToken);

      expect(result.success).toBe(false);
      expect(result.userId).toBeUndefined();
    });

    it("should fail when token is expired", async () => {
      const mockPasswordReset = {
        id: "reset-123",
        userId: mockUserId,
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        createdAt: new Date(),
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);
      mockPrisma.passwordReset.delete.mockResolvedValue(mockPasswordReset);

      const result = await PasswordResetService.consumeToken(mockToken);

      expect(result.success).toBe(false);
      expect(result.userId).toBeUndefined();
      
      // Verify expired token is deleted
      expect(mockPrisma.passwordReset.delete).toHaveBeenCalledWith({
        where: { id: mockPasswordReset.id }
      });
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.passwordReset.findUnique.mockRejectedValue(new Error("Database error"));

      const result = await PasswordResetService.consumeToken(mockToken);

      expect(result.success).toBe(false);
      expect(result.userId).toBeUndefined();
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("should cleanup expired tokens successfully", async () => {
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 3 });

      await PasswordResetService.cleanupExpiredTokens();

      expect(mockPrisma.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          }
        }
      });
    });

    it("should handle cleanup errors gracefully", async () => {
      mockPrisma.passwordReset.deleteMany.mockRejectedValue(new Error("Database error"));

      await expect(PasswordResetService.cleanupExpiredTokens()).resolves.not.toThrow();
    });
  });

  describe("invalidateUserTokens", () => {
    const mockUserId = "user-123";
    
    it("should invalidate user tokens successfully", async () => {
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 2 });

      await PasswordResetService.invalidateUserTokens(mockUserId);

      expect(mockPrisma.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId }
      });
    });

    it("should handle invalidation errors gracefully", async () => {
      mockPrisma.passwordReset.deleteMany.mockRejectedValue(new Error("Database error"));

      await expect(PasswordResetService.invalidateUserTokens(mockUserId)).resolves.not.toThrow();
    });
  });

  describe("token generation and hashing", () => {
    it("should generate secure tokens", async () => {
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
        userId: "user-123",
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      });

      const result = await PasswordResetService.createToken("user-123");

      expect(result.success).toBe(true);
      expect(mockUuid).toHaveBeenCalled();
      expect(mockRandomBytes).toHaveBeenCalledWith(32);
      expect(mockCreateHash).toHaveBeenCalledWith("sha256");
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDigest).toHaveBeenCalledWith("hex");
    });

    it("should hash tokens consistently", async () => {
      const mockPasswordReset = {
        id: "reset-123",
        userId: "user-123",
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);

      await PasswordResetService.verifyToken("test-token");

      expect(mockCreateHash).toHaveBeenCalledWith("sha256");
      expect(mockUpdate).toHaveBeenCalledWith("test-token");
      expect(mockDigest).toHaveBeenCalledWith("hex");
    });
  });

  describe("token expiration", () => {
    it("should set correct expiration time (1 hour)", async () => {
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
        userId: "user-123",
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      });

      await PasswordResetService.createToken("user-123");

      // Verify the expiration time is set correctly (1 hour = 3600000ms)
      expect(mockPrisma.passwordReset.create).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          tokenHash: "hashed-token",
          expiresAt: expect.any(Date),
        }
      });

      // Get the actual expiration date from the mock call
      const createCall = mockPrisma.passwordReset.create.mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt;
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 3600000);
      
      // Allow for small timing differences (within 1 second)
      expect(Math.abs(expiresAt.getTime() - oneHourLater.getTime())).toBeLessThan(1000);
    });
  });
});