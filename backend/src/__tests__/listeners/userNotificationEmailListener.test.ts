import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { eventBus } from "../../events/eventBus";
import { emailQueue } from "../../queues/emailQueue";
import { NotificationType, NotificationPriority } from "@prisma/client";

// Mock Prisma - simplified approach with default resolved values
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
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

describe("userNotificationEmailListener", () => {
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

  test("should queue email for MESSAGE notification type", async () => {
    const notification = {
      id: "notif-123",
      userId: "user-123",
      title: "Nouveau message reçu",
      message: "Vous avez reçu un nouveau message",
      type: NotificationType.MESSAGE,
      priority: NotificationPriority.NORMALE,
      createdAt: new Date(),
      actionUrl: "/dashboard/messages",
      data: '{"from": "Admin", "snippet": "Bonjour..."}'
    };

    // Emit the event
    eventBus.emit("user.notification.created", notification);

    // Allow event to be processed
    await new Promise(resolve => setImmediate(resolve));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendUserNotifEmail", {
      to: "user@test.com",
      template: "message-user.hbs",
      variables: {
        userName: "John",
        userFullName: "John Doe",
        title: "Nouveau message reçu",
        message: "Vous avez reçu un nouveau message",
        type: NotificationType.MESSAGE,
        priority: NotificationPriority.NORMALE,
        createdAt: notification.createdAt,
        actionUrl: "/dashboard/messages",
        dashboardUrl: "http://localhost:3001/dashboard",
        supportUrl: "http://localhost:3001/support",
        subject: "[Staka Livres] Nouveau message reçu",
        from: "Admin",
        snippet: "Bonjour...",
      },
    });
  });

  test("should queue email for PAYMENT notification type", async () => {
    const notification = {
      id: "notif-456",
      userId: "user-456",
      title: "Paiement confirmé",
      message: "Votre paiement a été traité avec succès",
      type: NotificationType.PAYMENT,
      priority: NotificationPriority.HAUTE,
      createdAt: new Date(),
      actionUrl: "/dashboard/invoices",
      data: '{"amount": "150.00", "transactionId": "tx_123"}'
    };

    eventBus.emit("user.notification.created", notification);
    await new Promise(resolve => setImmediate(resolve));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendUserNotifEmail", 
      expect.objectContaining({
        to: "user@test.com",
        template: "payment-user.hbs",
        variables: expect.objectContaining({
          userName: "John",
          userFullName: "John Doe",
          title: "Paiement confirmé",
          message: "Votre paiement a été traité avec succès",
          type: NotificationType.PAYMENT,
          priority: NotificationPriority.HAUTE,
          subject: "[Staka Livres] Paiement confirmé",
          amount: "150.00",
          transactionId: "tx_123",
        }),
      })
    );
  });

  test("should handle notification with invalid JSON data", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    
    const notification = {
      id: "notif-invalid",
      userId: "user-invalid",
      title: "Test invalid JSON",
      message: "Test message",
      type: NotificationType.ERROR,
      priority: NotificationPriority.HAUTE,
      createdAt: new Date(),
      actionUrl: null,
      data: "{invalid json"
    };

    eventBus.emit("user.notification.created", notification);
    await new Promise(resolve => setImmediate(resolve));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendUserNotifEmail",
      expect.objectContaining({
        to: "user@test.com",
        template: "error-user.hbs",
        variables: expect.objectContaining({
          title: "Test invalid JSON",
          // Should still work with empty data object
        }),
      })
    );

    consoleSpy.mockRestore();
  });

  test("should handle errors gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEmailQueue.add.mockRejectedValueOnce(new Error("Queue failure"));

    const notification = {
      id: "notif-error",
      userId: "user-error",
      title: "Test error handling",
      message: "Test message",
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.HAUTE,
      createdAt: new Date(),
      actionUrl: null,
      data: null
    };

    eventBus.emit("user.notification.created", notification);
    await new Promise(resolve => setImmediate(resolve));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "❌ Failed to queue user notification email:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});