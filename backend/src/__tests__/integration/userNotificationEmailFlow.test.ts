import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createNotification } from "../../controllers/notificationsController";
import { emailQueue } from "../../queues/emailQueue";
import { NotificationType, NotificationPriority } from "@prisma/client";

// Mock Prisma - simplified approach
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    notification: {
      create: vi.fn().mockImplementation((data) => Promise.resolve({
        id: `notif-${Date.now()}`,
        ...data.data,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }))
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        email: "user@test.com",
        prenom: "John",
        nom: "Doe",
        preferences: { emailNotifications: true }
      })
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
  }
}));

// Mock email queue
vi.mock("../../queues/emailQueue", () => ({
  emailQueue: {
    add: vi.fn()
  }
}));

// Import listener to ensure it's registered
import "../../listeners/userNotificationEmailListener";

describe("User Notification Email Flow Integration", () => {
  const mockEmailQueue = emailQueue as any;

  beforeEach(() => {
    mockEmailQueue.add.mockClear();
    
    process.env.APP_URL = "http://localhost:3001";
    process.env.FRONTEND_URL = "http://localhost:3001";
  });

  afterEach(() => {
    delete process.env.APP_URL;
    delete process.env.FRONTEND_URL;
  });

  test("should create user notification and queue email automatically", async () => {
    // Call the function that should create notifications
    await createNotification(
      "user-123",
      "Nouveau message reçu",
      "Vous avez reçu un nouveau message de notre équipe",
      NotificationType.MESSAGE,
      NotificationPriority.NORMALE,
      "/dashboard/messages",
      { from: "Admin", snippet: "Bonjour, votre correction est prête..." }
    );

    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify email was queued
    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendUserNotifEmail",
      expect.objectContaining({
        to: "user@test.com",
        template: "message-user.hbs",
        variables: expect.objectContaining({
          userName: "John",
          userFullName: "John Doe",
          title: "Nouveau message reçu",
          message: "Vous avez reçu un nouveau message de notre équipe",
          type: NotificationType.MESSAGE,
          priority: NotificationPriority.NORMALE,
          actionUrl: "/dashboard/messages",
          dashboardUrl: "http://localhost:3001/dashboard",
          supportUrl: "http://localhost:3001/support",
          subject: "[Staka Livres] Nouveau message reçu",
          from: "Admin",
          snippet: "Bonjour, votre correction est prête...",
        }),
      })
    );
  });

  test("should handle payment notifications with proper template", async () => {
    await createNotification(
      "user-456",
      "Paiement confirmé",
      "Votre paiement de 150€ a été traité avec succès",
      NotificationType.PAYMENT,
      NotificationPriority.HAUTE,
      "/dashboard/invoices",
      { amount: "150.00", transactionId: "tx_abc123", commandeTitle: "Correction de roman" }
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendUserNotifEmail",
      expect.objectContaining({
        to: "user@test.com",
        template: "payment-user.hbs",
        variables: expect.objectContaining({
          title: "Paiement confirmé",
          type: NotificationType.PAYMENT,
          priority: NotificationPriority.HAUTE,
          amount: "150.00",
          transactionId: "tx_abc123",
          commandeTitle: "Correction de roman",
          subject: "[Staka Livres] Paiement confirmé",
        }),
      })
    );
  });

  test("should handle order status notifications", async () => {
    await createNotification(
      "user-789",
      "Commande terminée",
      "Votre correction est maintenant disponible",
      NotificationType.ORDER,
      NotificationPriority.HAUTE,
      "/dashboard/projects/123",
      { status: "TERMINE", commandeTitle: "Mon premier roman", estimatedDelivery: "Disponible maintenant" }
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendUserNotifEmail",
      expect.objectContaining({
        to: "user@test.com",
        template: "order-user.hbs",
        variables: expect.objectContaining({
          title: "Commande terminée",
          type: NotificationType.ORDER,
          status: "TERMINE",
          commandeTitle: "Mon premier roman",
          estimatedDelivery: "Disponible maintenant",
        }),
      })
    );
  });

  test("should continue creating notifications even if email queueing fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    mockEmailQueue.add.mockRejectedValue(new Error("Email queue failure"));

    // This should not throw an error
    await expect(createNotification(
      "user-error",
      "Test notification",
      "Test message",
      NotificationType.INFO
    )).resolves.toBeUndefined();

    await new Promise(resolve => setTimeout(resolve, 100));

    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "❌ Failed to queue user notification email:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});