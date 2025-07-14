import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { eventBus } from "../../events/eventBus";
import { emailQueue } from "../../queues/emailQueue";
import { NotificationType, NotificationPriority } from "@prisma/client";

// Mock the email queue
vi.mock("../../queues/emailQueue", () => ({
  emailQueue: {
    add: vi.fn()
  }
}));

// Import the listener (side-effect import)
import "../../listeners/adminNotificationEmailListener";

describe("adminNotificationEmailListener", () => {
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

  test("should queue email for MESSAGE notification type", async () => {
    const notification = {
      id: "notif-123",
      title: "Nouveau message client",
      message: "Un client vous a envoyé un message",
      type: NotificationType.MESSAGE,
      priority: NotificationPriority.NORMALE,
      createdAt: new Date(),
      actionUrl: "/admin/messages",
      data: '{"from": "John Doe", "snippet": "Bonjour, j\'ai une question..."}',
    };

    // Emit the event
    eventBus.emit("admin.notification.created", notification);

    // Allow event to be processed
    await new Promise(resolve => setImmediate(resolve));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendAdminNotifEmail", {
      to: "admin@test.com",
      template: "admin-message.hbs",
      variables: {
        title: "Nouveau message client",
        message: "Un client vous a envoyé un message",
        type: NotificationType.MESSAGE,
        priority: NotificationPriority.NORMALE,
        createdAt: notification.createdAt,
        actionUrl: "/admin/messages",
        dashboardUrl: "http://localhost:3001/admin",
        subject: "[Admin] Nouveau message client",
        from: "John Doe",
        snippet: "Bonjour, j'ai une question...",
      },
    });
  });

  test("should queue email for PAYMENT notification type", async () => {
    const notification = {
      id: "notif-456",
      title: "Nouveau paiement reçu",
      message: "Un paiement de 150€ a été effectué",
      type: NotificationType.PAYMENT,
      priority: NotificationPriority.HAUTE,
      createdAt: new Date(),
      actionUrl: "/admin/invoices",
      data: '{"customerName": "Jane Smith", "amount": "150.00"}',
    };

    eventBus.emit("admin.notification.created", notification);
    await new Promise(resolve => setImmediate(resolve));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendAdminNotifEmail", {
      to: "admin@test.com",
      template: "admin-payment.hbs",
      variables: {
        title: "Nouveau paiement reçu",
        message: "Un paiement de 150€ a été effectué",
        type: NotificationType.PAYMENT,
        priority: NotificationPriority.HAUTE,
        createdAt: notification.createdAt,
        actionUrl: "/admin/invoices",
        dashboardUrl: "http://localhost:3001/admin",
        subject: "[Admin] Nouveau paiement reçu",
        customerName: "Jane Smith",
        amount: "150.00",
      },
    });
  });

  test("should use fallback email when ADMIN_EMAIL not set", async () => {
    delete process.env.ADMIN_EMAIL;

    const notification = {
      id: "notif-789",
      title: "Test notification",
      message: "Test message",
      type: NotificationType.INFO,
      priority: NotificationPriority.NORMALE,
      createdAt: new Date(),
      actionUrl: null,
      data: null,
    };

    eventBus.emit("admin.notification.created", notification);
    await new Promise(resolve => setImmediate(resolve));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendAdminNotifEmail", {
      to: "admin@staka-livres.fr",
      template: "admin-info.hbs",
      variables: expect.objectContaining({
        title: "Test notification",
        subject: "[Admin] Test notification",
      }),
    });
  });

  test("should handle notification with string data", async () => {
    const notification = {
      id: "notif-string",
      title: "Test with data",
      message: "Test message",
      type: NotificationType.ORDER,
      priority: NotificationPriority.NORMALE,
      createdAt: new Date(),
      actionUrl: null,
      data: '{"orderId": "12345", "status": "completed"}',
    };

    eventBus.emit("admin.notification.created", notification);
    await new Promise(resolve => setImmediate(resolve));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendAdminNotifEmail", {
      to: "admin@test.com",
      template: "admin-order.hbs",
      variables: expect.objectContaining({
        orderId: "12345",
        status: "completed",
      }),
    });
  });

  test("should handle notification with invalid JSON data", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const notification = {
      id: "notif-invalid",
      title: "Test invalid JSON",
      message: "Test message",
      type: NotificationType.ERROR,
      priority: NotificationPriority.HAUTE,
      createdAt: new Date(),
      actionUrl: null,
      data: "{invalid json",
    };

    eventBus.emit("admin.notification.created", notification);
    await new Promise(resolve => setImmediate(resolve));

    expect(mockEmailQueue.add).toHaveBeenCalledWith("sendAdminNotifEmail", {
      to: "admin@test.com",
      template: "admin-error.hbs",
      variables: expect.objectContaining({
        title: "Test invalid JSON",
        // Should still work with empty data object
      }),
    });

    consoleSpy.mockRestore();
  });

  test("should not queue email for unknown notification type", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const notification = {
      id: "notif-unknown",
      title: "Unknown type",
      message: "Test message",
      type: "UNKNOWN_TYPE" as any,
      priority: NotificationPriority.NORMALE,
      createdAt: new Date(),
      actionUrl: null,
      data: null,
    };

    eventBus.emit("admin.notification.created", notification);
    await new Promise(resolve => setImmediate(resolve));

    expect(mockEmailQueue.add).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "No email template configured for notification type: UNKNOWN_TYPE"
    );

    consoleSpy.mockRestore();
  });

  test("should handle errors gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEmailQueue.add.mockRejectedValueOnce(new Error("Queue failure"));

    const notification = {
      id: "notif-error",
      title: "Test error handling",
      message: "Test message",
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.HAUTE,
      createdAt: new Date(),
      actionUrl: null,
      data: null,
    };

    eventBus.emit("admin.notification.created", notification);
    await new Promise(resolve => setImmediate(resolve));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "❌ Failed to queue admin notification email:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});