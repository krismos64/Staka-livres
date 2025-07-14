import { beforeEach, describe, expect, test, vi } from "vitest";
import { Request } from "express";
import { MailerService } from "../../utils/mailer";
import { AuditService, AUDIT_ACTIONS } from "../../services/auditService";

// Import the function we want to test directly
import { sendHelpMessageToSupport } from "../../controllers/messagesController";

// Mock MailerService
vi.mock("../../utils/mailer");
const mockMailerService = vi.mocked(MailerService);

// Mock AuditService
vi.mock("../../services/auditService");
const mockAuditService = vi.mocked(AuditService);

describe("Support Email Function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock des variables d'environnement
    process.env.SUPPORT_EMAIL = "support@test.com";
  });

  test("sendHelpMessageToSupport should send email with correct content", async () => {
    // Créer une fausse request
    const mockReq = {
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue("test-user-agent"),
    } as unknown as Request;

    // Données du test
    const userEmail = "test@example.com";
    const userName = "John Doe";
    const subject = "Problème technique";
    const content = "J'ai un problème avec mon compte";
    const attachments: any[] = [];
    const userId = "user-123";

    // Mock successful email sending
    mockMailerService.sendEmail.mockResolvedValue();
    mockAuditService.logAdminAction.mockResolvedValue();

    // Call the function
    await sendHelpMessageToSupport(
      userEmail,
      userName,
      subject,
      content,
      attachments,
      userId,
      mockReq
    );

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

    // Vérifier l'audit log
    expect(mockAuditService.logAdminAction).toHaveBeenCalledWith(
      userEmail,
      AUDIT_ACTIONS.USER_MESSAGE_SUPPORT_EMAIL_SENT,
      'user',
      userId,
      {
        supportEmail: "support@test.com",
        subject,
        hasAttachments: false,
        attachmentCount: 0,
        contentLength: content.length
      },
      "127.0.0.1",
      "test-user-agent",
      'MEDIUM'
    );
  });

  test("sendHelpMessageToSupport should handle email errors gracefully", async () => {
    const mockReq = {
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue("test-user-agent"),
    } as unknown as Request;

    // Mock email failure
    mockMailerService.sendEmail.mockRejectedValue(new Error("Email service unavailable"));
    mockAuditService.logAdminAction.mockResolvedValue();

    // Function should not throw error even if email fails
    await expect(
      sendHelpMessageToSupport(
        "test@example.com",
        "John Doe",
        "Test Subject",
        "Test Content",
        [],
        "user-123",
        mockReq
      )
    ).resolves.toBeUndefined();

    // Email should have been attempted
    expect(mockMailerService.sendEmail).toHaveBeenCalled();
  });
});