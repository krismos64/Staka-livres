import { eventBus } from "../events/eventBus";
import { emailQueue } from "../queues/emailQueue";
import { NotificationType } from "@prisma/client";

const templateMap: Record<NotificationType, string> = {
  INFO: "admin-info.hbs",
  SUCCESS: "admin-success.hbs", 
  WARNING: "admin-warning.hbs",
  ERROR: "admin-error.hbs",
  PAYMENT: "admin-payment.hbs",
  ORDER: "admin-order.hbs",
  MESSAGE: "admin-message.hbs",
  SYSTEM: "admin-system-alert.hbs",
  CONSULTATION: "admin-consultation.hbs",
};

eventBus.on("admin.notification.created", async (notification) => {
  try {
    const template = templateMap[notification.type as NotificationType];
    if (!template) {
      console.log(`No email template configured for notification type: ${notification.type}`);
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@staka-livres.fr";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
    
    // Parse data if it's a JSON string
    let data = notification.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.warn("Failed to parse notification data as JSON:", e);
        data = {};
      }
    }

    await emailQueue.add("sendAdminNotifEmail", {
      to: adminEmail,
      template,
      variables: {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt,
        actionUrl: notification.actionUrl,
        dashboardUrl: `${frontendUrl}/admin`,
        subject: `[Admin] ${notification.title}`,
        ...data, // Spread notification data
      },
    });

    console.log(`✅ Admin email queued for notification: ${notification.title}`);
  } catch (error) {
    console.error("❌ Failed to queue admin notification email:", error);
  }
});