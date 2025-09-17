import { eventBus } from "../events/eventBus";
import { emailQueue } from "../queues/emailQueue";
import { NotificationType } from "@prisma/client";

const templateMap: Record<NotificationType, string> = {
  INFO: "admin-info.hbs",
  SUCCESS: "admin-success.hbs", 
  WARNING: "admin-project-payment-pending.hbs", // Template spécialisé pour les projets en attente de paiement
  ERROR: "admin-error.hbs",
  PAYMENT: "admin-payment.hbs",
  ORDER: "admin-order.hbs",
  MESSAGE: "admin-message.hbs",
  SYSTEM: "admin-system-alert.hbs",
  CONSULTATION: "admin-consultation.hbs",
};

// Keep track of processed notifications to avoid duplicates
const processedNotifications = new Set<string>();

eventBus.on("admin.notification.created", async (notification) => {
  try {
    // Ignorer les échantillons gratuits - ils sont traités par le listener spécialisé
    if (notification.title && notification.title.includes("échantillon gratuit")) {
      console.log(`⏭️  Skipping free sample notification (handled by specialized listener): ${notification.title}`);
      return;
    }

    const template = templateMap[notification.type as NotificationType];
    if (!template) {
      console.log(`No email template configured for notification type: ${notification.type}`);
      return;
    }

    // Create a unique key based on notification content and timestamp
    const notificationKey = `${notification.title}-${notification.message}-${new Date(notification.createdAt).getTime()}`;
    
    // Skip if we've already processed this notification in the last minute
    if (processedNotifications.has(notificationKey)) {
      console.log(`⏭️  Skipping duplicate admin notification: ${notification.title}`);
      return;
    }
    
    // Add to processed set and clean up after 2 minutes
    processedNotifications.add(notificationKey);
    setTimeout(() => {
      processedNotifications.delete(notificationKey);
    }, 2 * 60 * 1000);

    const adminEmail = process.env.ADMIN_EMAIL || "contact@staka.fr";
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

    // Format amount for payment-related notifications
    const formattedData = { ...data };
    if (data?.amount && typeof data.amount === 'number') {
      formattedData.amount = (data.amount / 100).toFixed(2);
    }

    // Extraire les attachments si présents
    const attachments = data?.fileAttachment ? [data.fileAttachment] : undefined;
    
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
        frontendUrl,
        supportEmail: process.env.SUPPORT_EMAIL || "contact@staka.fr",
        subject: `[Admin] ${notification.title}`,
        ...formattedData, // Spread formatted notification data
      },
      attachments,
    });

    console.log(`✅ Admin email queued for notification: ${notification.title}`);
  } catch (error) {
    console.error("❌ Failed to queue admin notification email:", error);
  }
});

// Listener spécifique pour les échantillons gratuits avec données complètes
eventBus.on("admin.free-sample.created", async (data) => {
  try {
    console.log("🔥 [FreeSample] Listener reçu données:", {
      prospectName: data.prospectName,
      prospectPhone: data.prospectPhone,
      genre: data.genre,
      description: data.description,
      fileName: data.fileName,
      hasFileAttachment: !!data.fileAttachment
    });

    const adminEmail = process.env.ADMIN_EMAIL || "contact@staka.fr";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

    // La notification sera créée par le système standard dans publicController.ts

    // Extraire les attachments si présents
    const attachments = data?.fileAttachment ? [data.fileAttachment] : undefined;

    await emailQueue.add("sendAdminNotifEmail", {
      to: adminEmail,
      template: "admin-message.hbs",
      variables: {
        title: `Nouvelle demande d'échantillon gratuit - ${data.prospectName}`,
        message: `${data.prospectName} souhaite recevoir 10 pages corrigées gratuitement`,
        type: "MESSAGE",
        priority: "HAUTE",
        createdAt: new Date().toISOString(),
        actionUrl: `${frontendUrl}/admin/messagerie?conversation=${data.conversationId}`,
        dashboardUrl: `${frontendUrl}/admin`,
        frontendUrl,
        supportEmail: process.env.SUPPORT_EMAIL || "contact@staka.fr",
        subject: `[Admin] Nouvelle demande d'échantillon gratuit - ${data.prospectName}`,
        ...data, // Toutes les données complètes pour le template
      },
      attachments,
    });

    console.log(`✅ Email échantillon gratuit envoyé pour: ${data.prospectName}`);
  } catch (error) {
    console.error("❌ Failed to send free sample admin email:", error);
  }
});

console.log("🔧 [FreeSample] Listener d'échantillons gratuits réinitialisé dans le fichier principal");
console.log(`🔧 [FreeSample] Nombre de listeners enregistrés pour 'admin.free-sample.created': ${eventBus.listenerCount('admin.free-sample.created')}`);

