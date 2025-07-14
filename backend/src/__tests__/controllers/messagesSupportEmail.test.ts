import { Request, Response } from "express";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Role } from "@prisma/client";
import { createConversation } from "../../controllers/messagesController";
import { MailerService } from "../../utils/mailer";
import { AuditService, AUDIT_ACTIONS } from "../../services/auditService";

// Mock MailerService
vi.mock("../../utils/mailer");
const mockMailerService = vi.mocked(MailerService);

// Mock AuditService
vi.mock("../../services/auditService");
const mockAuditService = vi.mocked(AuditService);

// Mock Prisma
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  })),
  Role: {
    USER: "USER",
    ADMIN: "ADMIN",
  },
  MessageType: {
    USER_MESSAGE: "USER_MESSAGE",
  },
  MessageStatut: {
    ENVOYE: "ENVOYE",
  },
}));

// Helper to create mock request and response
const createMockReq = (
  body: any = {},
  user: any = { 
    id: "user-123", 
    email: "test@example.com", 
    prenom: "John", 
    nom: "Doe", 
    role: Role.USER 
  }
): Partial<Request> => ({
  body,
  user,
  ip: "127.0.0.1",
  get: vi.fn().mockReturnValue("test-user-agent"),
});

const createMockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("Messages Support Email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock des variables d'environnement
    process.env.SUPPORT_EMAIL = "support@test.com";
  });

  test("devrait envoyer un email au support pour un message d'aide", async () => {
    const req = createMockReq({
      subject: "Problème technique",
      content: "J'ai un problème avec mon compte",
      source: "client-help",
      attachments: [],
    }) as Request;

    const res = createMockRes() as Response;

    // Mock Prisma via import dynamique pour éviter les problèmes de hoisting
    const { PrismaClient } = await import("@prisma/client");
    const mockPrisma = new PrismaClient() as any;
    
    // Configuration des mocks
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "admin-123",
      email: "admin@test.com",
      role: "ADMIN",
      prenom: "Admin",
      nom: "User",
      createdAt: new Date("2023-01-01"),
    });

    mockPrisma.message.findFirst.mockResolvedValue(null); // Pas de messages existants
    
    mockPrisma.message.create.mockResolvedValue({
      id: "msg-123",
      conversationId: "thread_admin-123_user-123",
      senderId: req.user!.id,
      receiverId: "admin-123",
      subject: "Problème technique",
      content: "J'ai un problème avec mon compte",
      sender: req.user,
      receiver: { 
        id: "admin-123",
        prenom: "Admin",
        nom: "User",
        role: "ADMIN"
      },
    });

    mockPrisma.message.findUnique.mockResolvedValue({
      id: "msg-123",
      conversationId: "thread_admin-123_user-123",
      senderId: req.user!.id,
      receiverId: "admin-123",
      subject: "Problème technique",
      content: "J'ai un problème avec mon compte",
      sender: req.user,
      receiver: { 
        id: "admin-123",
        prenom: "Admin",
        nom: "User",
        role: "ADMIN"
      },
      attachments: [],
    });

    mockMailerService.sendEmail.mockResolvedValue();
    mockAuditService.logAdminAction.mockResolvedValue();

    // Simuler que le module messagesController utilise notre mock
    vi.doMock("@prisma/client", () => ({
      PrismaClient: vi.fn(() => mockPrisma),
    }));

    await createConversation(req, res);

    // Debug: vérifier l'état de la réponse
    console.log("Response status calls:", (res.status as any).mock.calls);
    console.log("Response json calls:", (res.json as any).mock.calls);

    // Vérifier que la réponse est correcte
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Conversation démarrée avec succès.",
      })
    );

    // Attendre un peu pour que l'email asynchrone soit traité
    await new Promise(resolve => setTimeout(resolve, 100));

    // Vérifier que l'email a été envoyé
    expect(mockMailerService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "support@test.com",
        subject: "Nouveau message depuis l'espace client – Problème technique",
        html: expect.stringContaining("Nouveau message depuis l'espace client"),
        text: expect.stringContaining("Nouveau message depuis l'espace client"),
      })
    );

    // Vérifier le contenu de l'email
    const emailCall = mockMailerService.sendEmail.mock.calls[0][0];
    expect(emailCall.html).toContain("John Doe");
    expect(emailCall.html).toContain("test@example.com");
    expect(emailCall.html).toContain("Problème technique");
    expect(emailCall.html).toContain("J'ai un problème avec mon compte");
  });

  test("ne devrait pas envoyer d'email si source n'est pas 'client-help'", async () => {
    const req = createMockReq({
      subject: "Message normal",
      content: "Message sans source d'aide",
      source: "normal",
      attachments: [],
    }) as Request;

    const res = createMockRes() as Response;

    // Mock minimal pour que la fonction fonctionne
    const { PrismaClient } = await import("@prisma/client");
    const mockPrisma = new PrismaClient() as any;
    
    mockPrisma.user.findFirst.mockResolvedValue({ 
      id: "admin-123", 
      role: "ADMIN",
      prenom: "Admin",
      nom: "User",
      createdAt: new Date("2023-01-01"),
    });
    mockPrisma.message.findFirst.mockResolvedValue(null);
    mockPrisma.message.create.mockResolvedValue({ id: "msg-123", conversationId: "conv-123" });
    mockPrisma.message.findUnique.mockResolvedValue({ 
      id: "msg-123", 
      attachments: [] 
    });

    await createConversation(req, res);

    // L'email ne devrait pas être envoyé
    expect(mockMailerService.sendEmail).not.toHaveBeenCalled();
  });

  test("ne devrait pas envoyer d'email si l'utilisateur est admin", async () => {
    const adminUser = { 
      id: "admin-123", 
      email: "admin@test.com", 
      prenom: "Admin", 
      nom: "User", 
      role: Role.ADMIN 
    };

    const req = createMockReq({
      subject: "Message admin",
      content: "Message d'un admin",
      source: "client-help",
      attachments: [],
    }, adminUser) as Request;

    const res = createMockRes() as Response;

    // Mock minimal
    const { PrismaClient } = await import("@prisma/client");
    const mockPrisma = new PrismaClient() as any;
    
    mockPrisma.user.findFirst.mockResolvedValue({ 
      id: "admin-123", 
      role: "ADMIN",
      prenom: "Admin",
      nom: "User",
      createdAt: new Date("2023-01-01"),
    });
    mockPrisma.message.findFirst.mockResolvedValue(null);
    mockPrisma.message.create.mockResolvedValue({ id: "msg-123", conversationId: "conv-123" });
    mockPrisma.message.findUnique.mockResolvedValue({ 
      id: "msg-123", 
      attachments: [] 
    });

    await createConversation(req, res);

    // L'email ne devrait pas être envoyé car c'est un admin
    expect(mockMailerService.sendEmail).not.toHaveBeenCalled();
  });
});