import { MessageStatut, MessageType, PrismaClient, Role } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Types pour les requêtes
interface CreateMessageRequest {
  receiverId?: string;
  commandeId?: string;
  supportRequestId?: string;
  subject?: string;
  content: string;
  type?: MessageType;
  parentId?: string;
}

interface UpdateMessageRequest {
  isRead?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  statut?: MessageStatut;
}

interface MessageFilters {
  page?: string;
  limit?: string;
  commandeId?: string;
  supportRequestId?: string;
  threadId?: string;
  type?: MessageType;
  statut?: MessageStatut;
  isRead?: string;
  isArchived?: string;
  isPinned?: string;
  search?: string;
}

// Rate limiting simple en mémoire
const userMessageCount: {
  [userId: string]: { count: number; lastReset: number };
} = {};
const MAX_MESSAGES_PER_HOUR = 50;

// Fonction anti-spam
const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  if (!userMessageCount[userId]) {
    userMessageCount[userId] = { count: 1, lastReset: now };
    return true;
  }

  // Reset compteur si plus d'une heure
  if (now - userMessageCount[userId].lastReset > oneHour) {
    userMessageCount[userId] = { count: 1, lastReset: now };
    return true;
  }

  // Vérifier limite
  if (userMessageCount[userId].count >= MAX_MESSAGES_PER_HOUR) {
    return false;
  }

  userMessageCount[userId].count++;
  return true;
};

// Vérifier si l'utilisateur a accès au message
const hasMessageAccess = async (
  messageId: string,
  userId: string,
  userRole: string
): Promise<boolean> => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      commande: true,
      supportRequest: true,
    },
  });

  if (!message) return false;

  // Admin a accès à tout
  if (userRole === Role.ADMIN) return true;

  // Expéditeur ou destinataire
  if (message.senderId === userId || message.receiverId === userId) return true;

  // Accès via commande (propriétaire du projet)
  if (message.commandeId && message.commande?.userId === userId) return true;

  // Accès via support (créateur du ticket)
  if (message.supportRequestId && message.supportRequest?.userId === userId)
    return true;

  return false;
};

// Mapper les types frontend vers les types Prisma
const mapFrontendTypeToPrisma = (frontendType: string): MessageType => {
  switch (frontendType) {
    case "TEXT":
    case "FILE":
    case "IMAGE":
      return MessageType.USER_MESSAGE;
    case "SYSTEM":
      return MessageType.SYSTEM_MESSAGE;
    case "ADMIN_NOTE":
      return MessageType.ADMIN_MESSAGE;
    default:
      return MessageType.USER_MESSAGE;
  }
};

// Créer un nouveau message
export const createMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Utilisateur non authentifié" });
      return;
    }

    const {
      receiverId,
      commandeId,
      supportRequestId,
      subject,
      content,
      type: frontendType,
      parentId,
    }: CreateMessageRequest = req.body;

    // Mapper le type frontend vers le type Prisma
    const type = frontendType
      ? mapFrontendTypeToPrisma(frontendType)
      : MessageType.USER_MESSAGE;

    // Validation des champs requis
    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: "Le contenu du message est requis" });
      return;
    }

    if (content.length > 10000) {
      res.status(400).json({
        error: "Le contenu du message est trop long (max 10000 caractères)",
      });
      return;
    }

    // Anti-spam
    if (!checkRateLimit(userId)) {
      res.status(429).json({
        error:
          "Limite de messages atteinte. Veuillez attendre avant d'envoyer un nouveau message.",
      });
      return;
    }

    // Validation contexte (au moins un des contextes doit être défini ou receiverId)
    if (!receiverId && !commandeId && !supportRequestId) {
      res.status(400).json({
        error:
          "Au moins un destinataire, projet ou ticket support doit être spécifié",
      });
      return;
    }

    // Vérifications d'accès
    if (commandeId) {
      const commande = await prisma.commande.findUnique({
        where: { id: commandeId },
      });

      if (!commande) {
        res.status(404).json({ error: "Projet non trouvé" });
        return;
      }

      // Seul le propriétaire ou admin peut envoyer des messages sur un projet
      if (commande.userId !== userId && req.user?.role !== Role.ADMIN) {
        res.status(403).json({ error: "Accès non autorisé à ce projet" });
        return;
      }
    }

    if (supportRequestId) {
      const supportRequest = await prisma.supportRequest.findUnique({
        where: { id: supportRequestId },
      });

      if (!supportRequest) {
        res.status(404).json({ error: "Ticket support non trouvé" });
        return;
      }

      // Seul le créateur, assigné ou admin peut envoyer des messages sur un ticket
      if (
        supportRequest.userId !== userId &&
        supportRequest.assignedToId !== userId &&
        req.user?.role !== Role.ADMIN
      ) {
        res
          .status(403)
          .json({ error: "Accès non autorisé à ce ticket support" });
        return;
      }
    }

    // Vérification du message parent
    let threadId = null;
    if (parentId) {
      const parentMessage = await prisma.message.findUnique({
        where: { id: parentId },
        select: { id: true, threadId: true, senderId: true, receiverId: true },
      });

      if (!parentMessage) {
        res.status(404).json({ error: "Message parent non trouvé" });
        return;
      }

      // Vérifier l'accès au message parent
      if (!(await hasMessageAccess(parentId, userId, req.user?.role || ""))) {
        res.status(403).json({ error: "Accès non autorisé au message parent" });
        return;
      }

      threadId = parentMessage.threadId || parentMessage.id;
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        commandeId,
        supportRequestId,
        subject,
        content: content.trim(),
        type,
        parentId,
        threadId,
        statut: MessageStatut.ENVOYE,
      },
      include: {
        sender: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        commande: {
          select: {
            id: true,
            titre: true,
            statut: true,
          },
        },
        supportRequest: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: {
                prenom: true,
                nom: true,
              },
            },
          },
        },
        attachments: {
          include: {
            file: {
              select: {
                id: true,
                filename: true,
                size: true,
                mimeType: true,
                url: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Message créé avec succès",
      data: message,
    });
  } catch (error) {
    console.error("Erreur lors de la création du message:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Obtenir les messages avec filtres et pagination
export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: "Utilisateur non authentifié" });
      return;
    }

    const {
      page = "1",
      limit = "20",
      commandeId,
      supportRequestId,
      threadId,
      type,
      statut,
      isRead,
      isArchived,
      isPinned,
      search,
    }: MessageFilters = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 par page
    const skip = (pageNum - 1) * limitNum;

    // Construction des filtres
    const where: any = {};

    // Filtres de sécurité : seuls les messages accessibles à l'utilisateur
    if (userRole !== Role.ADMIN) {
      where.OR = [
        { senderId: userId },
        { receiverId: userId },
        { commande: { userId: userId } },
        { supportRequest: { userId: userId } },
        { supportRequest: { assignedToId: userId } },
      ];
    }

    // Filtres spécifiques
    if (commandeId) where.commandeId = commandeId;
    if (supportRequestId) where.supportRequestId = supportRequestId;
    if (threadId) where.threadId = threadId;
    if (type) where.type = type;
    if (statut) where.statut = statut;
    if (isRead !== undefined) where.isRead = isRead === "true";
    if (isArchived !== undefined) where.isArchived = isArchived === "true";
    if (isPinned !== undefined) where.isPinned = isPinned === "true";

    // Recherche textuelle
    if (search) {
      const searchFilter = {
        OR: [
          { content: { contains: search, mode: "insensitive" as const } },
          { subject: { contains: search, mode: "insensitive" as const } },
        ],
      };

      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchFilter];
        delete where.OR;
      } else {
        where.OR = searchFilter.OR;
      }
    }

    // Requête principale
    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
          commande: {
            select: {
              id: true,
              titre: true,
              statut: true,
            },
          },
          supportRequest: {
            select: {
              id: true,
              title: true,
              status: true,
              category: true,
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              sender: {
                select: {
                  prenom: true,
                  nom: true,
                },
              },
            },
          },
          attachments: {
            include: {
              file: {
                select: {
                  id: true,
                  filename: true,
                  size: true,
                  mimeType: true,
                  url: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limitNum,
      }),
      prisma.message.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Obtenir un message spécifique avec ses réponses
export const getMessageById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: "Utilisateur non authentifié" });
      return;
    }

    // Vérifier l'accès au message
    if (!(await hasMessageAccess(id, userId, userRole || ""))) {
      res.status(403).json({ error: "Accès non autorisé à ce message" });
      return;
    }

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        commande: {
          select: {
            id: true,
            titre: true,
            statut: true,
            description: true,
          },
        },
        supportRequest: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            description: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: {
                prenom: true,
                nom: true,
              },
            },
          },
        },
        replies: {
          include: {
            sender: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                avatar: true,
              },
            },
            attachments: {
              include: {
                file: {
                  select: {
                    id: true,
                    filename: true,
                    size: true,
                    mimeType: true,
                    url: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: {
          include: {
            file: {
              select: {
                id: true,
                filename: true,
                size: true,
                mimeType: true,
                url: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      res.status(404).json({ error: "Message non trouvé" });
      return;
    }

    // Marquer comme lu si l'utilisateur est le destinataire
    if (message.receiverId === userId && !message.isRead) {
      await prisma.message.update({
        where: { id },
        data: { isRead: true },
      });
      message.isRead = true;
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Erreur lors de la récupération du message:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Mettre à jour un message (statut uniquement)
export const updateMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: "Utilisateur non authentifié" });
      return;
    }

    const { isRead, isArchived, isPinned, statut }: UpdateMessageRequest =
      req.body;

    // Vérifier l'accès au message
    if (!(await hasMessageAccess(id, userId, userRole || ""))) {
      res.status(403).json({ error: "Accès non autorisé à ce message" });
      return;
    }

    const message = await prisma.message.findUnique({
      where: { id },
      select: { senderId: true, receiverId: true },
    });

    if (!message) {
      res.status(404).json({ error: "Message non trouvé" });
      return;
    }

    // Seul le destinataire peut marquer comme lu
    if (
      isRead !== undefined &&
      message.receiverId !== userId &&
      userRole !== Role.ADMIN
    ) {
      res.status(403).json({
        error: "Seul le destinataire peut marquer un message comme lu",
      });
      return;
    }

    // Seul l'expéditeur ou admin peut modifier statut/épinglage
    if (
      (statut || isPinned !== undefined) &&
      message.senderId !== userId &&
      userRole !== Role.ADMIN
    ) {
      res
        .status(403)
        .json({ error: "Permission insuffisante pour cette modification" });
      return;
    }

    // Construction des données à mettre à jour
    const updateData: any = {};
    if (isRead !== undefined) updateData.isRead = isRead;
    if (isArchived !== undefined) updateData.isArchived = isArchived;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (statut) updateData.statut = statut;

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: updateData,
      include: {
        sender: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Message mis à jour avec succès",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du message:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Supprimer un message (soft delete ou hard delete selon RGPD)
export const deleteMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { hard } = req.query; // ?hard=true pour suppression définitive
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: "Utilisateur non authentifié" });
      return;
    }

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        replies: true,
        attachments: {
          include: { file: true },
        },
      },
    });

    if (!message) {
      res.status(404).json({ error: "Message non trouvé" });
      return;
    }

    // Seul l'expéditeur ou admin peut supprimer
    if (message.senderId !== userId && userRole !== Role.ADMIN) {
      res.status(403).json({
        error:
          "Seul l'expéditeur ou un administrateur peut supprimer ce message",
      });
      return;
    }

    const isHardDelete = hard === "true" && userRole === Role.ADMIN;

    if (isHardDelete) {
      // Suppression définitive (RGPD/Admin uniquement)

      // Supprimer les pièces jointes
      for (const attachment of message.attachments) {
        await prisma.messageAttachment.delete({
          where: { id: attachment.id },
        });

        // Note: En production, supprimer aussi le fichier du stockage (S3, etc.)
        // await deleteFileFromStorage(attachment.file.url);
      }

      // Supprimer les réponses (cascade)
      await prisma.message.deleteMany({
        where: { parentId: id },
      });

      // Supprimer le message principal
      await prisma.message.delete({
        where: { id },
      });

      res.status(200).json({ message: "Message supprimé définitivement" });
    } else {
      // Soft delete : anonymiser le contenu
      await prisma.message.update({
        where: { id },
        data: {
          content: "[Message supprimé]",
          subject: null,
          isArchived: true,
          statut: MessageStatut.ARCHIVE,
        },
      });

      res.status(200).json({ message: "Message archivé avec succès" });
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du message:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Ajouter une pièce jointe à un message
export const addAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // Message ID
    const { fileId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Utilisateur non authentifié" });
      return;
    }

    if (!fileId) {
      res.status(400).json({ error: "ID du fichier requis" });
      return;
    }

    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await prisma.message.findUnique({
      where: { id },
      select: { senderId: true },
    });

    if (!message) {
      res.status(404).json({ error: "Message non trouvé" });
      return;
    }

    if (message.senderId !== userId && req.user?.role !== Role.ADMIN) {
      res
        .status(403)
        .json({ error: "Seul l'expéditeur peut ajouter des pièces jointes" });
      return;
    }

    // Vérifier que le fichier existe et appartient à l'utilisateur
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { id: true, uploadedById: true, filename: true, size: true },
    });

    if (!file) {
      res.status(404).json({ error: "Fichier non trouvé" });
      return;
    }

    if (file.uploadedById !== userId && req.user?.role !== Role.ADMIN) {
      res.status(403).json({ error: "Accès non autorisé à ce fichier" });
      return;
    }

    // Vérifier que la pièce jointe n'existe pas déjà
    const existingAttachment = await prisma.messageAttachment.findUnique({
      where: {
        messageId_fileId: {
          messageId: id,
          fileId: fileId,
        },
      },
    });

    if (existingAttachment) {
      res
        .status(409)
        .json({ error: "Ce fichier est déjà attaché à ce message" });
      return;
    }

    // Limiter le nombre de pièces jointes par message
    const attachmentCount = await prisma.messageAttachment.count({
      where: { messageId: id },
    });

    if (attachmentCount >= 10) {
      res
        .status(400)
        .json({ error: "Limite de 10 pièces jointes par message atteinte" });
      return;
    }

    // Créer la pièce jointe
    const attachment = await prisma.messageAttachment.create({
      data: {
        messageId: id,
        fileId: fileId,
      },
      include: {
        file: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            url: true,
            createdAt: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Pièce jointe ajoutée avec succès",
      attachment,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la pièce jointe:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Obtenir les statistiques des messages pour l'utilisateur
export const getMessageStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Utilisateur non authentifié" });
      return;
    }

    const [
      totalSent,
      totalReceived,
      unreadCount,
      pinnedCount,
      projectMessages,
      supportMessages,
    ] = await Promise.all([
      prisma.message.count({ where: { senderId: userId } }),
      prisma.message.count({ where: { receiverId: userId } }),
      prisma.message.count({
        where: {
          receiverId: userId,
          isRead: false,
          isArchived: false,
        },
      }),
      prisma.message.count({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          isPinned: true,
          isArchived: false,
        },
      }),
      prisma.message.count({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          commandeId: { not: null },
        },
      }),
      prisma.message.count({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          supportRequestId: { not: null },
        },
      }),
    ]);

    res.status(200).json({
      totalSent,
      totalReceived,
      unreadCount,
      pinnedCount,
      projectMessages,
      supportMessages,
      total: totalSent + totalReceived,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
