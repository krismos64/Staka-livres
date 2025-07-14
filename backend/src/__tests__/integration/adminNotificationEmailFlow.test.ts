import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createAdminNotification } from "../../controllers/notificationsController";
import { emailQueue } from "../../queues/emailQueue";
import { NotificationType, NotificationPriority } from "@prisma/client";

// Mock Prisma - simplified approach
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      findMany: vi.fn().mockResolvedValue([
        { id: "admin1" },
        { id: "admin2" }
      ])
    },
    notification: {
      create: vi.fn().mockImplementation((data) => Promise.resolve({
        id: `notif-${Date.now()}`,
        ...data.data,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }))
    }
  })),
  NotificationType: {
    INFO: "INFO",
    SUCCESS: "SUCCESS",
    WARNING: "WARNING",
    ERROR: "ERROR",
    PAYMENT: "PAYMENT",
    ORDER: "ORDER",
    MESSAGE: "MESSAGE",
    SYSTEM: "SYSTEM",
    CONSULTATION: "CONSULTATION"
  },
  NotificationPriority: {
    FAIBLE: "FAIBLE",
    NORMALE: "NORMALE",
    HAUTE: "HAUTE"
  },
  Role: {
    ADMIN: "ADMIN",
    USER: "USER"
  }
}));

// Mock email queue
vi.mock("../../queues/emailQueue", () => ({
  emailQueue: {
    add: vi.fn()
  }
}));

// Import listener to ensure it's registered
import "../../listeners/adminNotificationEmailListener";

describe("Admin Notification Email Flow Integration", () => {
  const mockEmailQueue = emailQueue as any;

  beforeEach(() => {
    mockEmailQueue.add.mockClear();
    
    process.env.ADMIN_EMAIL = "admin@test.com";
    process.env.FRONTEND_URL = "http://localhost:3001";
  });

  afterEach(() => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.FRONTEND_URL;
  });

  test("should create admin notifications and queue emails automatically", async () => {
    // Call the function that should create notifications
    await createAdminNotification(
      "Nouveau message client",
      "Un client vous a envoyé un message",
      NotificationType.MESSAGE,
      NotificationPriority.NORMALE,
      "/admin/messages",
      { from: "John Doe", snippet: "Bonjour..." }
    );

    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify emails were queued (should be 2 for the 2 admins)
    expect(mockEmailQueue.add).toHaveBeenCalledTimes(2);
    
    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendAdminNotifEmail", 
      expect.objectContaining({
        to: "admin@test.com",
        template: "admin-message.hbs",
        variables: expect.objectContaining({
          title: "Nouveau message client",
          message: "Un client vous a envoyé un message",
          type: NotificationType.MESSAGE,
          priority: NotificationPriority.NORMALE,
          actionUrl: "/admin/messages",
          dashboardUrl: "http://localhost:3001/admin",
          subject: "[Admin] Nouveau message client",
          from: "John Doe",
          snippet: "Bonjour...",
        }),
      })
    );
  });

  test("should handle payment notifications with proper template", async () => {
    await createAdminNotification(
      "Nouveau paiement reçu",
      "Paiement de 150€ effectué par Jane Smith",
      NotificationType.PAYMENT,
      NotificationPriority.HAUTE,
      "/admin/invoices",
      { customerName: "Jane Smith", amount: "150.00", commandeTitle: "Correction Roman" }
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendAdminNotifEmail",
      expect.objectContaining({
        to: "admin@test.com",
        template: "admin-payment.hbs",
        variables: expect.objectContaining({
          title: "Nouveau paiement reçu",
          type: NotificationType.PAYMENT,
          priority: NotificationPriority.HAUTE,
          customerName: "Jane Smith",
          amount: "150.00",
          commandeTitle: "Correction Roman",
          subject: "[Admin] Nouveau paiement reçu",
        }),
      })
    );
  });

  test("should handle system alerts with proper template", async () => {
    await createAdminNotification(
      "Erreur système détectée",
      "Une erreur critique s'est produite",
      NotificationType.SYSTEM,
      NotificationPriority.HAUTE,
      "/admin/system",
      { errorDetails: "Database connection failed", timestamp: "2024-01-01T12:00:00Z" }
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendAdminNotifEmail",
      expect.objectContaining({
        to: "admin@test.com",
        template: "admin-system-alert.hbs",
        variables: expect.objectContaining({
          title: "Erreur système détectée",
          type: NotificationType.SYSTEM,
          errorDetails: "Database connection failed",
          timestamp: "2024-01-01T12:00:00Z",
        }),
      })
    );
  });

  test("should continue creating notifications even if email queueing fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    mockEmailQueue.add.mockRejectedValue(new Error("Email queue failure"));

    // This should not throw an error
    await expect(createAdminNotification(
      "Test notification",
      "Test message",
      NotificationType.INFO
    )).resolves.toBeUndefined();

    await new Promise(resolve => setTimeout(resolve, 100));

    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "❌ Failed to queue admin notification email:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});