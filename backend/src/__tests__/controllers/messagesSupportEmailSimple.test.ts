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

  test("sendHelpMessageToSupport should log audit action (no email sent)", async () => {
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

    // Mock successful audit logging
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

    // Vérifier que l'email N'A PAS été envoyé (fonction mise à jour)
    expect(mockMailerService.sendEmail).not.toHaveBeenCalled();

    // Vérifier l'audit log (seule fonctionnalité restante)
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

});