import { NotificationPriority, NotificationType, PrismaClient, Role } from "@prisma/client";
import { Request, Response } from "express";
import { eventBus } from "../events/eventBus";

const prisma = new PrismaClient();

/**
 * Récupère les notifications de l'utilisateur connecté
 */
export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId,
      isDeleted: false,
      ...(unreadOnly === 'true' && { isRead: false }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where }),
    ]);

    res.status(200).json({
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Récupère le nombre de notifications non lues
 */
export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
        isDeleted: false,
        OR: [
          { expiresAt: null }, // Notifications sans expiration
          { expiresAt: { gt: new Date() } } // Notifications non expirées
        ]
      },
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Erreur lors du comptage des notifications non lues:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Marque une notification comme lue
 */
export const markAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      res.status(404).json({ error: "Notification non trouvée." });
      return;
    }

    if (notification.userId !== userId) {
      res.status(403).json({ error: "Accès non autorisé." });
      return;
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.status(200).json({ message: "Notification marquée comme lue." });
  } catch (error) {
    console.error("Erreur lors du marquage comme lu:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Marque toutes les notifications comme lues
 */
export const markAllAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        isDeleted: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.status(200).json({
      message: "Toutes les notifications ont été marquées comme lues.",
      count: result.count,
    });
  } catch (error) {
    console.error("Erreur lors du marquage global comme lu:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Supprime une notification
 */
export const deleteNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      res.status(404).json({ error: "Notification non trouvée." });
      return;
    }

    if (notification.userId !== userId) {
      res.status(403).json({ error: "Accès non autorisé." });
      return;
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isDeleted: true },
    });

    res.status(200).json({ message: "Notification supprimée." });
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// ============================================================================
// FONCTIONS UTILITAIRES POUR CRÉER DES NOTIFICATIONS
// ============================================================================

/**
 * Crée une notification pour un utilisateur
 */
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType = NotificationType.INFO,
  priority: NotificationPriority = NotificationPriority.NORMALE,
  actionUrl?: string,
  data?: any,
  expiresAt?: Date,
  sendEmail: boolean = false
): Promise<void> => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        priority,
        actionUrl,
        data: data ? JSON.stringify(data) : null,
        expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
      },
    });

    // Emit event for user notifications
    eventBus.emit("user.notification.created", notification);
    
    // Optionally emit event for client email notifications
    if (sendEmail) {
      eventBus.emit("client.notification.created", notification);
    }
  } catch (error) {
    console.error("Erreur lors de la création de notification:", error);
  }
};

/**
 * Crée une notification pour tous les admins
 */
export const createAdminNotification = async (
  title: string,
  message: string,
  type: NotificationType = NotificationType.INFO,
  priority: NotificationPriority = NotificationPriority.NORMALE,
  actionUrl?: string,
  data?: any
): Promise<void> => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
      select: { id: true },
    });

    const notifications = admins.map((admin) => ({
      userId: admin.id,
      title,
      message,
      type,
      priority,
      actionUrl,
      data: data ? JSON.stringify(data).substring(0, 1000) : null, // Limiter la taille du JSON
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
    }));

    const createdNotifications = await Promise.all(
      notifications.map(notifData => 
        prisma.notification.create({ data: notifData })
      )
    );

    // Emit events for each admin notification to trigger emails
    createdNotifications.forEach(notification => {
      eventBus.emit("admin.notification.created", notification);
    });
  } catch (error) {
    console.error("Erreur lors de la création de notifications admin:", error);
  }
};

// ============================================================================
// FONCTIONS POUR DÉCLENCHER DES NOTIFICATIONS MÉTIER
// ============================================================================

/**
 * Notifie un client qu'il a reçu un nouveau message
 */
export const notifyNewMessage = async (
  userId: string,
  senderName: string,
  messagePreview: string
): Promise<void> => {
  await createNotification(
    userId,
    "Nouveau message reçu",
    `${senderName} vous a envoyé un message : "${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? "..." : ""}"`,
    NotificationType.MESSAGE,
    NotificationPriority.NORMALE,
    "/app/messages"
  );
};

/**
 * Notifie un client qu'un nouveau document a été ajouté
 */
export const notifyNewDocument = async (
  userId: string,
  fileName: string,
  commandeId: string
): Promise<void> => {
  await createNotification(
    userId,
    "Nouveau document disponible",
    `Un nouveau document "${fileName}" a été ajouté à votre projet.`,
    NotificationType.INFO,
    NotificationPriority.NORMALE,
    `/app/projects/${commandeId}`
  );
};

/**
 * Notifie un client du changement de statut de sa commande
 */
export const notifyStatusChange = async (
  userId: string,
  commandeTitle: string,
  newStatus: string,
  commandeId: string
): Promise<void> => {
  const statusMessages: Record<string, string> = {
    EN_COURS: "Votre projet est maintenant en cours de traitement.",
    TERMINE: "Votre projet a été terminé avec succès !",
    ANNULEE: "Votre projet a été annulé.",
    SUSPENDUE: "Votre projet a été suspendu temporairement.",
  };

  await createNotification(
    userId,
    "Statut de projet mis à jour",
    `${commandeTitle} : ${statusMessages[newStatus] || "Statut mis à jour"}`,
    newStatus === "TERMINE" ? NotificationType.SUCCESS : NotificationType.INFO,
    newStatus === "TERMINE" ? NotificationPriority.HAUTE : NotificationPriority.NORMALE,
    `/app/projects/${commandeId}`
  );
};

/**
 * Notifie un client d'un paiement effectué
 */
export const notifyPaymentSuccess = async (
  userId: string,
  amount: number,
  commandeTitle: string
): Promise<void> => {
  await createNotification(
    userId,
    "Paiement confirmé",
    `Votre paiement de ${(amount / 100).toFixed(2)}€ pour "${commandeTitle}" a été traité avec succès.`,
    NotificationType.PAYMENT,
    NotificationPriority.HAUTE,
    "/app/billing"
  );
};

/**
 * Notifie les admins d'un nouveau message reçu
 */
export const notifyAdminNewMessage = async (
  senderName: string,
  messagePreview: string,
  isVisitor: boolean = false
): Promise<void> => {
  await createAdminNotification(
    `Nouveau message ${isVisitor ? "visiteur" : "client"}`,
    `${senderName} vous a envoyé un message : "${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? "..." : ""}"`,
    NotificationType.MESSAGE,
    NotificationPriority.NORMALE,
    "/admin/messagerie"
  );
};

/**
 * Notifie les admins d'un nouveau paiement
 */
export const notifyAdminNewPayment = async (
  customerName: string,
  amount: number,
  commandeTitle: string
): Promise<void> => {
  await createAdminNotification(
    "Nouveau paiement reçu",
    `${customerName} a effectué un paiement de ${(amount / 100).toFixed(2)}€ pour "${commandeTitle}".`,
    NotificationType.PAYMENT,
    NotificationPriority.HAUTE,
    "/admin/factures"
  );
};

/**
 * Notifie les admins d'une nouvelle inscription
 */
export const notifyAdminNewRegistration = async (
  userName: string,
  userEmail: string
): Promise<void> => {
  await createAdminNotification(
    "Nouvelle inscription",
    `${userName} (${userEmail}) s'est inscrit sur la plateforme.`,
    NotificationType.INFO,
    NotificationPriority.NORMALE,
    "/admin/users"
  );
};

/**
 * Notifie les admins d'une nouvelle commande
 */
export const notifyAdminNewCommande = async (
  customerName: string,
  customerEmail: string,
  commandeTitle: string,
  commandeId: string
): Promise<void> => {
  await createAdminNotification(
    "Nouvelle commande reçue",
    `${customerName} (${customerEmail}) a créé une nouvelle commande : "${commandeTitle}".`,
    NotificationType.ORDER,
    NotificationPriority.HAUTE,
    `/admin/commandes?id=${commandeId}`,
    { customerName, customerEmail, commandeTitle, commandeId }
  );
};

/**
 * Notifie un client de la création de sa commande avec email automatique
 */
export const notifyClientCommandeCreated = async (
  userId: string,
  commandeTitle: string,
  commandeId: string,
  packType?: string
): Promise<void> => {
  const isPackIntegral = packType === "pack-integral-default";
  
  await createNotification(
    userId,
    "Projet créé avec succès",
    isPackIntegral 
      ? `Votre projet "${commandeTitle}" a été créé et est en attente de vérification. Notre équipe vous contactera sous 24h pour valider le nombre de pages.`
      : `Votre projet "${commandeTitle}" a été créé avec succès et est en cours de traitement.`,
    NotificationType.SUCCESS,
    NotificationPriority.HAUTE,
    `/app/projects/${commandeId}`,
    { commandeTitle, commandeId, packType, needsVerification: isPackIntegral },
    undefined, // expiresAt par défaut
    true // sendEmail = true pour déclencher l'envoi d'email
  );
};

/**
 * Notifie les admins qu'un projet nécessite un règlement avant transmission à l'équipe support
 */
export const notifyAdminProjectAwaitingPayment = async (
  customerName: string,
  customerEmail: string,
  commandeTitle: string,
  commandeId: string,
  amount: number
): Promise<void> => {
  await createAdminNotification(
    "Projet en attente de règlement",
    `Le projet "${commandeTitle}" de ${customerName} (${customerEmail}) doit être réglé (${(amount / 100).toFixed(2)}€) avant d'être transmis à l'équipe support.`,
    NotificationType.WARNING,
    NotificationPriority.HAUTE,
    `/admin/commandes?id=${commandeId}`,
    { customerName, customerEmail, commandeTitle, commandeId, amount }
  );
};