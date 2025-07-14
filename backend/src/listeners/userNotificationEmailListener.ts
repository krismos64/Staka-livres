import { eventBus } from "../events/eventBus";
import { emailQueue } from "../queues/emailQueue";
import { NotificationType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Types de notifications qui déclenchent un e-mail utilisateur
const SEND_EMAIL_TYPES: NotificationType[] = [
  NotificationType.MESSAGE,
  NotificationType.PAYMENT,
  NotificationType.ORDER,
  NotificationType.SUCCESS,
  NotificationType.INFO,
  NotificationType.WARNING,
  NotificationType.ERROR,
  NotificationType.SYSTEM,
  NotificationType.CONSULTATION
];

// Mapping des types vers les templates e-mail
const templateMap: Record<NotificationType, string> = {
  [NotificationType.INFO]: "info-user.hbs",
  [NotificationType.SUCCESS]: "success-user.hbs", 
  [NotificationType.WARNING]: "warning-user.hbs",
  [NotificationType.ERROR]: "error-user.hbs",
  [NotificationType.PAYMENT]: "payment-user.hbs",
  [NotificationType.ORDER]: "order-user.hbs",
  [NotificationType.MESSAGE]: "message-user.hbs",
  [NotificationType.SYSTEM]: "system-user.hbs",
  [NotificationType.CONSULTATION]: "consultation-user.hbs",
};

eventBus.on("user.notification.created", async (notification) => {
  try {
    // Vérifier si ce type de notification doit déclencher un e-mail
    if (!SEND_EMAIL_TYPES.includes(notification.type as NotificationType)) {
      console.log(`No email configured for user notification type: ${notification.type}`);
      return;
    }

    // Récupérer les informations utilisateur
    const user = await prisma.user.findUnique({ 
      where: { id: notification.userId },
      select: { 
        email: true, 
        prenom: true,
        nom: true,
        preferences: true 
      }
    });

    if (!user?.email) {
      console.log(`No email found for user: ${notification.userId}`);
      return;
    }

    // Vérifier les préférences utilisateur (opt-out)
    const preferences = user.preferences as any;
    if (preferences?.emailNotifications === false) {
      console.log(`User ${notification.userId} has opted out of email notifications`);
      return;
    }

    const template = templateMap[notification.type as NotificationType];
    if (!template) {
      console.log(`No email template configured for notification type: ${notification.type}`);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
    const appUrl = process.env.APP_URL || frontendUrl;
    
    // Parse notification data if it's a JSON string
    let data = notification.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.warn("Failed to parse notification data as JSON:", e);
        data = {};
      }
    }

    await emailQueue.add("sendUserNotifEmail", {
      to: user.email,
      template,
      variables: {
        userName: user.prenom,
        userFullName: `${user.prenom} ${user.nom}`,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt,
        actionUrl: notification.actionUrl,
        dashboardUrl: `${appUrl}/dashboard`,
        supportUrl: `${appUrl}/support`,
        subject: `[Staka Livres] ${notification.title}`,
        ...data, // Spread notification data
      },
    });

    console.log(`✅ User email queued for notification: ${notification.title} (${user.email})`);
  } catch (error) {
    console.error("❌ Failed to queue user notification email:", error);
  }
});