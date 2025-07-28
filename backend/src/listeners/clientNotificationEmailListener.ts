import { eventBus } from "../events/eventBus";
import { emailQueue } from "../queues/emailQueue";
import { NotificationType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const templateMap: Record<NotificationType, string> = {
  INFO: "client-info.hbs",
  SUCCESS: "client-project-confirmation.hbs", 
  WARNING: "client-warning.hbs",
  ERROR: "client-error.hbs",
  PAYMENT: "client-payment-confirmation.hbs",
  ORDER: "client-order-confirmation.hbs",
  MESSAGE: "client-message.hbs",
  SYSTEM: "client-system-alert.hbs",
  CONSULTATION: "client-consultation.hbs",
};

// Keep track of processed notifications to avoid duplicates
const processedNotifications = new Set<string>();

eventBus.on("client.notification.created", async (notification) => {
  try {
    const template = templateMap[notification.type as NotificationType];
    if (!template) {
      console.log(`No client email template configured for notification type: ${notification.type}`);
      return;
    }

    // Create a unique key based on notification content and timestamp
    const notificationKey = `${notification.userId}-${notification.title}-${new Date(notification.createdAt).getTime()}`;
    
    // Skip if we've already processed this notification in the last minute
    if (processedNotifications.has(notificationKey)) {
      console.log(`⏭️  Skipping duplicate client notification: ${notification.title}`);
      return;
    }
    
    // Add to processed set and clean up after 2 minutes
    processedNotifications.add(notificationKey);
    setTimeout(() => {
      processedNotifications.delete(notificationKey);
    }, 2 * 60 * 1000);

    // Get user email from database
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true, prenom: true, nom: true }
    });

    if (!user) {
      console.error(`⚠️ User not found for notification: ${notification.userId}`);
      return;
    }

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

    await emailQueue.add("sendClientNotifEmail", {
      to: user.email,
      template,
      variables: {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt,
        actionUrl: notification.actionUrl,
        customerName: `${user.prenom} ${user.nom}`.trim() || user.email,
        firstName: user.prenom,
        dashboardUrl: `${frontendUrl}/app`,
        loginUrl: `${frontendUrl}/login`,
        supportEmail: process.env.SUPPORT_EMAIL || "contact@staka.fr",
        subject: notification.title,
        ...data, // Spread notification data
      },
    });

    console.log(`✅ Client email queued for user ${user.email}: ${notification.title}`);
  } catch (error) {
    console.error("❌ Failed to queue client notification email:", error);
  }
});