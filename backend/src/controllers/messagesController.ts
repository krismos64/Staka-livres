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
 * Crée une nouvelle conversation initiée par un utilisateur authentifié vers un admin.
 */
export const createConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.user!.id;
    const { subject, content } = req.body;

    if (!content) {
      res.status(400).json({ error: "Le contenu est requis." });
      return;
    }

    const admin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
      orderBy: { createdAt: "asc" },
    });

    if (!admin) {
      res.status(500).json({
        error: "Aucun administrateur disponible pour recevoir le message.",
      });
      return;
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: admin.id,
        subject: subject || `Nouveau message de ${req.user!.prenom}`,
        content,
        type: MessageType.USER_MESSAGE,
        statut: MessageStatut.ENVOYE,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    res.status(201).json({
      message: "Conversation démarrée avec succès.",
      conversationId: message.conversationId,
      data: message,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la conversation:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Récupère la liste des conversations pour l'utilisateur authentifié (client ou admin).
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
        ? {} // L'admin voit toutes les conversations
        : {
            OR: [{ senderId: userId }, { receiverId: userId }],
          };

    // 1. Agréger par conversationId pour trouver les conversations uniques
    const conversationsGrouped = await prisma.message.groupBy({
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

    const conversationIds = conversationsGrouped.map((c) => c.conversationId);

    if (conversationIds.length === 0) {
      res.status(200).json([]);
      return;
    }

    // 2. Récupérer les détails de chaque conversation
    const detailedConversations = await Promise.all(
      conversationIds.map(async (id) => {
        // Dernier message pour l'aperçu
        const lastMessage = await prisma.message.findFirst({
          where: { conversationId: id },
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: { id: true, prenom: true, nom: true, avatar: true },
            },
            receiver: {
              select: { id: true, prenom: true, nom: true, avatar: true },
            },
          },
        });

        if (!lastMessage) return null;

        // Compter les messages non lus dans la conversation
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: id,
            receiverId: userId,
            isRead: false,
          },
        });

        // Déterminer avec qui l'utilisateur converse
        const participant =
          lastMessage.senderId === userId
            ? lastMessage.receiver
            : lastMessage.sender;

        return {
          conversationId: id,
          lastMessage: {
            id: lastMessage.id,
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
          },
          unreadCount,
          withUser: participant
            ? {
                id: participant.id,
                name: `${participant.prenom} ${participant.nom}`,
                avatar: participant.avatar,
              }
            : {
                id: lastMessage.visitorEmail,
                name: lastMessage.visitorName || "Visiteur",
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
 */
export const getMessagesByConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { conversationId } = req.params;

    // 1. Vérifier si l'utilisateur a accès à cette conversation
    const conversationParticipant = await prisma.message.findFirst({
      where: {
        conversationId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    // Un admin peut voir toutes les conversations
    if (!conversationParticipant && userRole !== Role.ADMIN) {
      res
        .status(403)
        .json({ error: "Accès non autorisé à cette conversation." });
      return;
    }

    // 2. Récupérer les messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, prenom: true, nom: true, avatar: true } },
        attachments: { include: { file: true } },
      },
    });

    if (messages.length === 0) {
      res.status(404).json({ error: "Conversation non trouvée ou vide." });
      return;
    }

    // 3. Marquer les messages comme lus pour l'utilisateur actuel
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

    // 1. Trouver le premier message pour identifier les participants
    const firstMessage = await prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    if (!firstMessage) {
      res.status(404).json({ error: "Conversation non trouvée." });
      return;
    }

    // 2. Déterminer le destinataire de la réponse
    let receiverId: string | null = null;
    if (firstMessage.senderId === senderId) {
      receiverId = firstMessage.receiverId;
    } else {
      receiverId = firstMessage.senderId;
    }

    // Cas d'une conversation avec un visiteur (pas de receiverId fixe)
    if (firstMessage.visitorEmail && !receiverId) {
      const admin = await prisma.user.findFirst({
        where: { role: Role.ADMIN },
      });
      if (req.user?.role === Role.ADMIN) {
        // L'admin répond à un visiteur, pas de receiverId
      } else if (admin) {
        receiverId = admin.id;
      }
    }

    if (!receiverId && !firstMessage.visitorEmail) {
      res
        .status(400)
        .json({ error: "Impossible de déterminer le destinataire." });
      return;
    }

    // 3. Créer le nouveau message
    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId: receiverId, // peut être null si visiteur
        content,
        type: MessageType.USER_MESSAGE,
        statut: MessageStatut.ENVOYE,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    // TODO: Gérer la notification par email pour les visiteurs

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la réponse:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Récupère le nombre de conversations non lues pour un admin.
 */
export const getUnreadConversationsCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    if (req.user!.role !== Role.ADMIN) {
      res.status(403).json({ error: "Accès non autorisé." });
      return;
    }

    const uniqueUnreadConversations = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    res.status(200).json({ count: uniqueUnreadConversations.length });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du compteur de messages non lus:",
      error
    );
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};
