// Le code fourni dans le message précédent.
import { MessageStatut, MessageType, PrismaClient, Role } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

/**
 * Crée un message à partir d'un visiteur non authentifié.
 * Le message est assigné au premier admin disponible.
 */
export const createVisitorMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, name, subject, content } = req.body;

    if (!email || !content) {
      res.status(400).json({ error: "Email et contenu sont requis." });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: "Format d'email invalide." });
      return;
    }

    const admin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
      orderBy: { createdAt: "asc" },
    });

    if (!admin) {
      res.status(500).json({ error: "Aucun administrateur disponible." });
      return;
    }

    const message = await prisma.message.create({
      data: {
        visitorEmail: email,
        visitorName: name,
        receiverId: admin.id,
        subject: subject || `Message de ${name || "visiteur"}`,
        content,
        type: MessageType.USER_MESSAGE,
        statut: MessageStatut.ENVOYE,
      },
    });

    // TODO: Envoyer une notification par email à l'admin
    // mailer.send(admin.email, 'Nouveau message de visiteur', `...`);

    res.status(201).json({
      message: "Message envoyé avec succès. Nous vous répondrons par email.",
      conversationId: message.conversationId,
    });
  } catch (error) {
    console.error("Erreur lors de la création du message visiteur:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Récupère la liste des conversations pour l'utilisateur authentifié (client ou admin).
 * Pour un admin, cela peut inclure des conversations avec des visiteurs.
 */
export const getConversations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const whereClause =
      req.user!.role === Role.ADMIN
        ? {} // L'admin voit tout
        : { OR: [{ senderId: userId }, { receiverId: userId }] };

    const conversations = await prisma.message.groupBy({
      by: ["conversationId"],
      where: whereClause,
      _max: {
        createdAt: true,
      },
      orderBy: {
        _max: {
          createdAt: "desc",
        },
      },
      skip,
      take: limitNum,
    });

    const conversationIds = conversations.map((c) => c.conversationId);

    const detailedConversations = await Promise.all(
      conversationIds.map(async (id) => {
        const lastMessage = await prisma.message.findFirst({
          where: { conversationId: id },
          orderBy: { createdAt: "desc" },
          include: {
            sender: true,
            receiver: true,
          },
        });

        if (!lastMessage) return null;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: id,
            receiverId: userId,
            isRead: false,
          },
        });

        const participant =
          lastMessage.senderId === userId
            ? lastMessage.receiver
            : lastMessage.sender;

        return {
          conversationId: id,
          lastMessage,
          unreadCount,
          withUser: {
            id: participant?.id || lastMessage.visitorEmail,
            name: participant
              ? `${participant.prenom} ${participant.nom}`
              : lastMessage.visitorName || "Visiteur",
            avatar: participant?.avatar,
          },
        };
      })
    );

    res.status(200).json(detailedConversations.filter(Boolean));
  } catch (error) {
    console.error("Erreur lors de la récupération des conversations:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Récupère tous les messages d'une conversation spécifique.
 * Vérifie que l'utilisateur authentifié fait bien partie de la conversation.
 */
export const getMessagesByConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { conversationId } = req.params;

    const firstMessage = await prisma.message.findFirst({
      where: { conversationId },
    });

    if (!firstMessage) {
      res.status(404).json({ error: "Conversation non trouvée." });
      return;
    }

    // Vérification d'accès
    const isParticipant =
      firstMessage.senderId === userId || firstMessage.receiverId === userId;
    const isVisitorConversationForAdmin =
      userRole === Role.ADMIN && firstMessage.visitorEmail;

    if (!isParticipant && !isVisitorConversationForAdmin) {
      res
        .status(403)
        .json({ error: "Accès non autorisé à cette conversation." });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: true,
        attachments: true,
      },
    });

    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Envoie une réponse dans une conversation existante.
 * Gère le cas d'une réponse à un visiteur (envoi par email) ou à un utilisateur interne.
 */
export const replyToConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.user!.id;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: "Le contenu est requis." });
      return;
    }

    const firstMessage = await prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    if (!firstMessage) {
      res.status(404).json({ error: "Conversation non trouvée." });
      return;
    }

    // Cas 1: L'admin répond à un visiteur
    if (req.user!.role === Role.ADMIN && firstMessage.visitorEmail) {
      // TODO: Implémenter l'envoi d'email au visiteur
      // mailer.send(firstMessage.visitorEmail, `Réponse à votre message`, content);

      const messageForDb = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
          visitorEmail: firstMessage.visitorEmail,
          type: MessageType.SYSTEM_MESSAGE, // C'est une réponse, pas un message initial
          statut: MessageStatut.ENVOYE,
        },
      });
      res.status(201).json(messageForDb);
      return;
    }

    // Cas 2: Conversation entre utilisateurs connectés
    const receiverId =
      firstMessage.senderId === senderId
        ? firstMessage.receiverId
        : firstMessage.senderId;

    if (!receiverId) {
      res
        .status(400)
        .json({ error: "Impossible de déterminer le destinataire." });
      return;
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content,
        type: MessageType.USER_MESSAGE,
        statut: MessageStatut.ENVOYE,
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Compte le nombre total de conversations non lues pour l'utilisateur admin authentifié.
 * Une conversation est non lue si elle contient au moins un message non lu.
 */
export const getUnreadConversationsCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // On ne fait ce calcul que pour les admins pour l'instant
    if (req.user!.role !== Role.ADMIN) {
      res.status(200).json({ count: 0 });
      return;
    }

    const unreadConversations = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        receiverId: userId,
        isRead: false,
      },
      _count: {
        conversationId: true,
      },
    });

    res.status(200).json({ count: unreadConversations.length });
  } catch (error) {
    console.error("Erreur lors du comptage des conversations non lues:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};
