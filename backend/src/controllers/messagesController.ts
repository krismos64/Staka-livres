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
 * Crée une nouvelle conversation ou continue dans le thread existant.
 * Les clients ne peuvent avoir qu'un seul thread avec les admins.
 */
export const createConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.user!.id;
    const senderRole = req.user!.role;
    const { subject, content } = req.body;

    if (!content) {
      res.status(400).json({ error: "Le contenu est requis." });
      return;
    }

    // Pour les clients : vérifier s'il existe déjà des messages avec les admins
    if (senderRole !== Role.ADMIN) {
      const existingMessages = await prisma.message.findFirst({
        where: {
          OR: [{ senderId }, { receiverId: senderId }],
        },
      });

      if (existingMessages) {
        res.status(400).json({
          error: "EXISTING_CONVERSATION",
          message: "Vous avez déjà une conversation ouverte avec l'équipe support. Continuez dans le fil existant.",
          threadId: "admin-support",
        });
        return;
      }
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

    // Générer un conversationId basé sur le thread
    const conversationId = `thread_${[senderId, admin.id].sort().join("_")}`;

    const message = await prisma.message.create({
      data: {
        conversationId,
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
      threadId: senderRole === Role.ADMIN ? admin.id : "admin-support",
      data: message,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la conversation:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Récupère la liste des conversations regroupées par utilisateur.
 * Admin : une conversation par utilisateur (regroupe toutes ses conversations)
 * Client : une conversation par admin
 */
export const getConversations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    if (userRole === Role.ADMIN) {
      // ADMIN : Regrouper toutes les conversations par userId (client ou visiteur)
      const allMessages = await prisma.message.findMany({
        where: {
          OR: [{ receiverId: userId }, { senderId: userId }],
          deletedByAdmin: { not: true }, // Exclure les messages supprimés par l'admin
        },
        include: {
          sender: { select: { id: true, prenom: true, nom: true, avatar: true } },
          receiver: { select: { id: true, prenom: true, nom: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      // Regrouper par utilisateur (senderId si différent de admin, sinon receiverId)
      const userConversations = new Map<string, any>();

      allMessages.forEach((message) => {
        let otherUserId: string;
        let otherUser: any;
        let isVisitor = false;

        if (message.visitorEmail) {
          // Message de visiteur
          otherUserId = message.visitorEmail;
          otherUser = {
            id: message.visitorEmail,
            name: message.visitorName || "Visiteur",
            email: message.visitorEmail,
            isVisitor: true,
          };
          isVisitor = true;
        } else if (message.senderId === userId) {
          // Admin a envoyé, l'autre utilisateur est le receiver
          otherUserId = message.receiverId!;
          otherUser = message.receiver;
        } else {
          // Admin a reçu, l'autre utilisateur est le sender
          otherUserId = message.senderId!;
          otherUser = message.sender;
        }

        if (!userConversations.has(otherUserId)) {
          userConversations.set(otherUserId, {
            threadId: otherUserId, // Identifiant unique du thread utilisateur
            withUser: isVisitor
              ? otherUser
              : {
                  id: otherUser.id,
                  name: `${otherUser.prenom} ${otherUser.nom}`,
                  avatar: otherUser.avatar,
                  isVisitor: false,
                },
            lastMessage: {
              id: message.id,
              content: message.content,
              createdAt: message.createdAt,
              senderId: message.senderId,
            },
            unreadCount: 0,
            totalMessages: 0,
            isVisitor,
          });
        }

        const conversation = userConversations.get(otherUserId);
        conversation.totalMessages++;

        // Compter les non lus (messages reçus par l'admin)
        if (message.receiverId === userId && !message.isRead) {
          conversation.unreadCount++;
        }

        // Mettre à jour le dernier message si plus récent
        if (
          new Date(message.createdAt) >
          new Date(conversation.lastMessage.createdAt)
        ) {
          conversation.lastMessage = {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            senderId: message.senderId,
          };
        }
      });

      const conversations = Array.from(userConversations.values())
        .sort(
          (a, b) =>
            new Date(b.lastMessage.createdAt).getTime() -
            new Date(a.lastMessage.createdAt).getTime()
        )
        .slice(skip, skip + limitNum);

      res.status(200).json(conversations);
    } else {
      // CLIENT : Une seule conversation avec les admins (regroupée)
      const allMessages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          // Les clients voient toujours leurs messages, même si l'admin les a "supprimés"
        },
        include: {
          sender: { select: { id: true, prenom: true, nom: true, avatar: true } },
          receiver: { select: { id: true, prenom: true, nom: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (allMessages.length === 0) {
        res.status(200).json([]);
        return;
      }

      // Regrouper tous les messages avec les admins en une seule conversation
      let unreadCount = 0;
      let totalMessages = allMessages.length;
      const lastMessage = allMessages[0];

      // Compter les messages non lus reçus par le client
      allMessages.forEach((message) => {
        if (message.receiverId === userId && !message.isRead) {
          unreadCount++;
        }
      });

      const adminThread = {
        threadId: "admin-support", // Identifiant fixe pour le thread admin
        withUser: {
          id: "admin-support",
          name: "Équipe Support",
          avatar: null,
          isAdmin: true,
        },
        lastMessage: {
          id: lastMessage.id,
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.senderId,
        },
        unreadCount,
        totalMessages,
        isAdminThread: true,
      };

      res.status(200).json([adminThread]);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des conversations:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Récupère tous les messages d'un thread utilisateur (nouvelle logique).
 * threadId peut être:
 * - Pour admin: userId du client ou email du visiteur
 * - Pour client: "admin-support" (thread unique avec les admins)
 */
export const getMessagesByThread = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { threadId } = req.params;

    let messages: any[] = [];

    if (userRole === Role.ADMIN) {
      // ADMIN : Récupérer tous les messages avec un utilisateur spécifique
      if (threadId.includes("@")) {
        // Thread avec un visiteur (email)
        messages = await prisma.message.findMany({
          where: {
            visitorEmail: threadId,
            OR: [{ receiverId: userId }, { senderId: userId }],
            deletedByAdmin: { not: true }, // Exclure les messages supprimés par l'admin
          },
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, prenom: true, nom: true, avatar: true } },
            attachments: { include: { file: true } },
          },
        });
      } else {
        // Thread avec un utilisateur enregistré
        messages = await prisma.message.findMany({
          where: {
            OR: [
              { senderId: threadId, receiverId: userId },
              { senderId: userId, receiverId: threadId },
            ],
            visitorEmail: null, // Exclure les messages de visiteurs
            deletedByAdmin: { not: true }, // Exclure les messages supprimés par l'admin
          },
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, prenom: true, nom: true, avatar: true } },
            attachments: { include: { file: true } },
          },
        });
      }

      // Marquer comme lus les messages reçus par l'admin
      await prisma.message.updateMany({
        where: {
          receiverId: userId,
          isRead: false,
          ...(threadId.includes("@")
            ? { visitorEmail: threadId }
            : {
                senderId: threadId,
                visitorEmail: null,
              }),
        },
        data: { isRead: true },
      });
    } else {
      // CLIENT : Récupérer tous les messages avec les admins
      if (threadId !== "admin-support") {
        res.status(400).json({ error: "Thread ID invalide pour un client." });
        return;
      }

      messages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, prenom: true, nom: true, avatar: true } },
          attachments: { include: { file: true } },
        },
      });

      // Marquer comme lus les messages reçus par le client
      await prisma.message.updateMany({
        where: {
          receiverId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Récupère tous les messages d'une conversation spécifique (ancienne logique conservée).
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
 * Envoie une réponse dans un thread utilisateur.
 * threadId peut être un userId ou un email de visiteur.
 */
export const replyToThread = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.user!.id;
    const senderRole = req.user!.role;
    const { threadId } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: "Le contenu est requis." });
      return;
    }

    // Vérifier si c'est un admin qui essaie de répondre à un visiteur
    if (senderRole === Role.ADMIN && threadId.includes("@")) {
      res.status(400).json({
        error: "VISITOR_EMAIL_RESPONSE",
        message: "Les réponses aux visiteurs doivent se faire par email.",
        visitorEmail: threadId,
        visitorName: await getVisitorNameByEmail(threadId),
      });
      return;
    }

    let receiverId: string | null = null;
    let conversationId: string;

    if (senderRole === Role.ADMIN) {
      // Admin répond à un utilisateur enregistré
      receiverId = threadId;
      conversationId = `thread_${[senderId, threadId].sort().join("_")}`;
    } else {
      // Client répond aux admins (threadId = "admin-support")
      if (threadId !== "admin-support") {
        res.status(400).json({ error: "Thread ID invalide pour un client." });
        return;
      }

      // Trouver un admin pour recevoir le message
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

      receiverId = admin.id;
      conversationId = `thread_${[senderId, admin.id].sort().join("_")}`;
    }

    // Créer le nouveau message
    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content,
        type: MessageType.USER_MESSAGE,
        statut: MessageStatut.ENVOYE,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la réponse:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Helper pour récupérer le nom d'un visiteur par son email
 */
async function getVisitorNameByEmail(email: string): Promise<string> {
  const visitorMessage = await prisma.message.findFirst({
    where: { visitorEmail: email },
    orderBy: { createdAt: "desc" },
  });
  return visitorMessage?.visitorName || "Visiteur";
}

/**
 * Envoie une réponse dans une conversation existante (ancienne logique conservée).
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
 * Marque tous les messages d'une conversation comme lus pour l'utilisateur actuel.
 */
export const markConversationAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    // Marquer tous les messages non lus de cette conversation comme lus
    const updateResult = await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({
      message: "Conversation marquée comme lue.",
      updatedCount: updateResult.count,
    });
  } catch (error) {
    console.error("Erreur lors du marquage comme lu:", error);
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

/**
 * Supprime une conversation pour un admin (masquage côté admin uniquement).
 * L'utilisateur peut toujours voir ses messages et continuer à écrire.
 */
export const deleteAdminConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const adminRole = req.user!.role;
    const { threadId } = req.params;

    if (adminRole !== Role.ADMIN) {
      res.status(403).json({ error: "Accès non autorisé. Seuls les admins peuvent supprimer des conversations." });
      return;
    }

    if (!threadId) {
      res.status(400).json({ error: "ID du thread requis." });
      return;
    }

    let deleteCount = 0;

    if (threadId.includes("@")) {
      // Supprimer les messages avec un visiteur
      const result = await prisma.message.updateMany({
        where: {
          visitorEmail: threadId,
          OR: [{ receiverId: adminId }, { senderId: adminId }],
        },
        data: {
          deletedByAdmin: true,
        },
      });
      deleteCount = result.count;
    } else {
      // Supprimer les messages avec un utilisateur enregistré
      const result = await prisma.message.updateMany({
        where: {
          OR: [
            { senderId: threadId, receiverId: adminId },
            { senderId: adminId, receiverId: threadId },
          ],
          visitorEmail: null,
        },
        data: {
          deletedByAdmin: true,
        },
      });
      deleteCount = result.count;
    }

    if (deleteCount === 0) {
      res.status(404).json({ error: "Aucune conversation trouvée à supprimer." });
      return;
    }

    res.status(200).json({
      message: "Conversation supprimée avec succès de votre vue admin.",
      deletedCount: deleteCount,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la conversation:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};
