import { vi } from "vitest";

/**
 * Configuration unifiée des mocks Prisma pour tous les tests de sécurité
 * Résout les problèmes de configuration et assure la cohérence
 */

// Instance mock globale partagée
export const mockPrismaInstance = {
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
  auditLog: {
    create: vi.fn(),
  },
  $disconnect: vi.fn(),
};

/**
 * Configure le mock Prisma pour les tests
 * À utiliser dans vi.mock() au niveau module
 */
export const configurePrismaMock = () => ({
  PrismaClient: vi.fn(() => mockPrismaInstance),
  Role: { USER: "USER", ADMIN: "ADMIN", CORRECTOR: "CORRECTOR" },
  PaymentStatus: { PENDING: "pending", PAID: "paid", FAILED: "failed" },
});

/**
 * Réinitialise tous les mocks Prisma pour un test propre
 * À utiliser dans beforeEach()
 */
export const resetPrismaMocks = () => {
  vi.clearAllMocks();
  
  // Reset spécifique des méthodes Prisma
  Object.values(mockPrismaInstance.user).forEach(mock => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
  
  Object.values(mockPrismaInstance.commande).forEach(mock => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
  
  if (mockPrismaInstance.auditLog.create.mockReset) {
    mockPrismaInstance.auditLog.create.mockReset();
  }
};

/**
 * Configuration standard d'un utilisateur mock pour les tests
 */
export const createMockUser = (overrides = {}) => ({
  id: "test-user-123",
  email: "test@example.com",
  prenom: "Test",
  nom: "User",
  role: "USER",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Configuration standard d'une commande mock pour les tests
 */
export const createMockCommande = (overrides = {}) => ({
  id: "test-commande-123",
  userId: "test-user-123",
  paymentStatus: "pending",
  prixTotal: 2000,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});