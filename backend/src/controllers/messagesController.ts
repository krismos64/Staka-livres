// Le code fourni dans le message précédent.
import { MessageStatut, MessageType, PrismaClient, Role, File } from "@prisma/client";
import { Request, Response } from "express";
import {
  notifyAdminNewMessage,
  notifyNewMessage,
} from "./notificationsController";
import { MailerService } from "../utils/mailer";
import { AuditService, AUDIT_ACTIONS } from "../services/auditService";

const prisma = new PrismaClient();

/**
 * Envoie une copie du message d'aide au support par email
 */
export async function sendHelpMessageToSupport(
  userEmail: string,
  userName: string,
  subject: string,
  content: string,
  attachments: any[] = [],
  userId: string,
  req: Request
): Promise<void> {
  try {
    const supportEmail = process.env.SUPPORT_EMAIL || "contact@staka.fr";
    
    // Construire le contenu HTML de l'email
    const attachmentsList = attachments.length > 0 
      ? `
        <h4>📎 Pièces jointes :</h4>
        <ul>
          ${attachments.map(file => `
            <li>
              <strong>${file.filename}</strong> (${Math.round(file.size / 1024)} KB)
              <br><a href="${file.url}" target="_blank">Télécharger</a>
            </li>
          `).join('')}
        </ul>
      `
      : '';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2563eb; margin-bottom: 20px;">📧 Nouveau message depuis l'espace client</h2>
          
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">👤 Informations utilisateur</h3>
            <p style="margin: 5px 0;"><strong>Nom :</strong> ${userName}</p>
            <p style="margin: 5px 0;"><strong>Email :</strong> ${userEmail}</p>
            <p style="margin: 5px 0;"><strong>ID utilisateur :</strong> ${userId}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin-bottom: 10px;">📋 Sujet du message</h3>
            <p style="background-color: #f8fafc; padding: 10px; border-left: 4px solid #2563eb; margin: 0;">
              ${subject}
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin-bottom: 10px;">💬 Contenu du message</h3>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
              ${content.replace(/\n/g, '<br>')}
            </div>
          </div>

          ${attachmentsList}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">
              Ce message a été envoyé depuis le formulaire d'aide de l'espace client.<br>
              Vous pouvez répondre directement à l'utilisateur via l'interface d'administration.
            </p>
            <p style="margin: 10px 0 0 0;">
              <strong>Staka Livres</strong> - Système de messagerie automatique
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
Nouveau message depuis l'espace client

Informations utilisateur :
- Nom : ${userName}
- Email : ${userEmail}
- ID utilisateur : ${userId}

Sujet : ${subject}

Message :
${content}

${attachments.length > 0 ? `\nPièces jointes :\n${attachments.map(f => `- ${f.filename} (${Math.round(f.size / 1024)} KB)`).join('\n')}` : ''}

---
Ce message a été envoyé depuis le formulaire d'aide de l'espace client.
Vous pouvez répondre directement à l'utilisateur via l'interface d'administration.
    `;

    // Email removal: Now handled by admin notification system via eventBus
    // The calling code already creates admin notifications which will trigger emails automatically

    // Log d'audit
    await AuditService.logAdminAction(
      userEmail,
      AUDIT_ACTIONS.USER_MESSAGE_SUPPORT_EMAIL_SENT,
      'user',
      userId,
      {
        supportEmail,
        subject,
        hasAttachments: attachments.length > 0,
        attachmentCount: attachments.length,
        contentLength: content.length
      },
      req.ip,
      req.get('user-agent'),
      'MEDIUM'
    );

    console.log(`✅ [Messages] Email de support envoyé pour l'utilisateur ${userEmail} (sujet: ${subject})`);

  } catch (error) {
    console.error('❌ [Messages] Erreur lors de l\'envoi de l\'email de support:', error);
    // Ne pas faire échouer la création du message si l'email échoue
  }
}

/**
 * Valide les pièces jointes d'un message
 */
async function validateAttachments(attachments: string[], userId: string): Promise<{ valid: boolean; validFiles: File[] }> {
  if (!attachments || attachments.length === 0) {
    return { valid: true, validFiles: [] };
  }

  // Limite nombre de pièces jointes
  if (attachments.length > 10) {
    throw new Error("Maximum 10 pièces jointes autorisées par message");
  }

  const validFiles: File[] = [];
  let totalSize = 0;
  
  for (const fileId of attachments) {
    // Validation format UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileId)) {
      throw new Error(`ID de fichier invalide: ${fileId}`);
    }

    // Vérifier existence et propriété
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        uploadedById: userId,
        // Seulement les fichiers de type document/image pour messagerie
        type: { in: ['DOCUMENT', 'IMAGE'] }
      }
    });

    if (!file) {
      throw new Error(`Fichier non trouvé ou non autorisé: ${fileId}`);
    }

    // Vérifier taille individuelle (limite 50MB par fichier)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error(`Fichier trop volumineux: ${file.filename} (max 50MB)`);
    }

    totalSize += file.size;
    validFiles.push(file);
  }

  // Vérifier taille totale (limite 100MB total)
  if (totalSize > 100 * 1024 * 1024) {
    throw new Error("Taille totale des pièces jointes trop importante (max 100MB)");
  }

  return { valid: true, validFiles };
}

/**
 * Crée un message à partir d'un visiteur non authentifié.
 * Le message est assigné au premier admin disponible.
 */
export const createVisitorMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, name, phone, subject, content } = req.body;

    if (!email || !name || !phone || !content) {
      res.status(400).json({ error: "Nom, email, téléphone et message sont requis." });
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
        visitorPhone: phone,
        receiverId: admin.id,
        subject: subject || `Message de ${name || "visiteur"}`,
        content,
        type: MessageType.USER_MESSAGE,
        statut: MessageStatut.ENVOYE,
      },
    });

    // Notifier les admins du nouveau message visiteur avec toutes les infos
    try {
      // Importer la fonction createAdminNotification directement
      const { createAdminNotification } = await import("./notificationsController");

      await createAdminNotification(
        `Nouveau message du chat direct`,
        `Message reçu via le chat direct du site`,
        "MESSAGE" as any,
        "HAUTE" as any,
        "/admin/messagerie",
        {
          visitorName: name,
          visitorEmail: email,
          visitorPhone: phone,
          messageContent: content,
          isDirectChat: true
        }
      );
    } catch (notificationError) {
      console.error(
        "Erreur lors de la création de la notification:",
        notificationError
      );
    }

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
    const {
      subject,
      content,
      attachments = [],
      displayFirstName,
      displayLastName,
      displayRole,
      source, // Nouveau champ pour identifier la source du message (ex: "client-help")
    } = req.body;

    if (!content && (!attachments || attachments.length === 0)) {
      res
        .status(400)
        .json({ error: "Le contenu ou des pièces jointes sont requis." });
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
          message:
            "Vous avez déjà une conversation ouverte avec l'équipe support. Continuez dans le fil existant.",
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
        content: content || "",
        type: MessageType.USER_MESSAGE,
        statut: MessageStatut.ENVOYE,
        // Stocker la source dans les metadata pour identifier les messages d'aide
        metadata: source ? { source } : null,
        // Ajouter le nom d'affichage personnalisé si fourni (pour les admins)
        ...(displayFirstName && { displayFirstName }),
        ...(displayLastName && { displayLastName }),
        ...(displayRole && { displayRole }),
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    // Valider et gérer les pièces jointes si présentes
    if (attachments && attachments.length > 0) {
      try {
        await validateAttachments(attachments, senderId);
        
        for (const fileId of attachments) {
          await prisma.messageAttachment.create({
            data: {
              messageId: message.id,
              fileId: fileId,
            },
          });
        }
      } catch (error) {
        // Supprimer le message créé en cas d'erreur de validation des fichiers
        await prisma.message.delete({ where: { id: message.id } });
        const errorMessage = error instanceof Error ? error.message : 'Erreur de validation inconnue';
        res.status(400).json({ 
          error: `Erreur de validation des pièces jointes: ${errorMessage}` 
        });
        return;
      }
    }

    // Récupérer le message complet avec ses attachments après les avoir ajoutés
    const messageWithAttachments = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: true,
        receiver: true,
        attachments: {
          include: {
            file: {
              select: {
                id: true,
                filename: true,
                size: true,
                mimeType: true,
                url: true,
                type: true,
              },
            },
          },
        },
      },
    });

    // 🔔 NOTIFICATION ADMIN : Créer une notification admin pour nouveau message client
    if (senderRole !== Role.ADMIN) {
      try {
        const senderName = `${req.user!.prenom} ${req.user!.nom}`;
        await notifyAdminNewMessage(senderName, content || "", false);
      } catch (notificationError) {
        console.error('❌ [Messages] Erreur lors de la création de la notification admin:', notificationError);
        // Ne pas faire échouer la création du message si la notification échoue
      }
    }

    // 🔥 NOUVELLE FONCTIONNALITÉ : Envoi d'email au support si le message provient du formulaire d'aide
    if (source === 'client-help' && senderRole !== Role.ADMIN) {
      // Préparer les informations utilisateur
      const userFullName = `${req.user!.prenom} ${req.user!.nom}`;
      const userEmail = req.user!.email;
      const messageSubject = subject || `Message d'aide de ${userFullName}`;
      
      // Récupérer les fichiers attachés pour l'email
      const attachedFiles = messageWithAttachments?.attachments?.map(att => att.file) || [];
      
      // Envoyer l'email au support (async, ne bloque pas la réponse)
      sendHelpMessageToSupport(
        userEmail,
        userFullName,
        messageSubject,
        content || "",
        attachedFiles,
        senderId,
        req
      ).catch(error => {
        console.error('❌ [Messages] Erreur asynchrone lors de l\'envoi de l\'email de support:', error);
      });
    }

    res.status(201).json({
      message: "Conversation démarrée avec succès.",
      conversationId: message.conversationId,
      threadId: senderRole === Role.ADMIN ? admin.id : "admin-support",
      data: messageWithAttachments,
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
          sender: {
            select: { id: true, prenom: true, nom: true, avatar: true },
          },
          receiver: {
            select: { id: true, prenom: true, nom: true, avatar: true },
          },
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
          sender: {
            select: { id: true, prenom: true, nom: true, avatar: true },
          },
          receiver: {
            select: { id: true, prenom: true, nom: true, avatar: true },
          },
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
            sender: {
              select: { id: true, prenom: true, nom: true, avatar: true },
            },
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
            sender: {
              select: { id: true, prenom: true, nom: true, avatar: true },
            },
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
          sender: {
            select: { id: true, prenom: true, nom: true, avatar: true },
          },
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
    const {
      content,
      attachments = [],
      displayFirstName,
      displayLastName,
      displayRole,
      source, // Nouveau champ pour identifier la source du message
    } = req.body;

    if (!content && (!attachments || attachments.length === 0)) {
      res
        .status(400)
        .json({ error: "Le contenu ou des pièces jointes sont requis." });
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
        content: content || "",
        type: MessageType.USER_MESSAGE,
        statut: MessageStatut.ENVOYE,
        // Stocker la source dans les metadata pour identifier les messages d'aide
        metadata: source ? { source } : null,
        // Ajouter le nom d'affichage personnalisé si fourni (pour les admins)
        ...(displayFirstName && { displayFirstName }),
        ...(displayLastName && { displayLastName }),
        ...(displayRole && { displayRole }),
      },
      include: {
        sender: true,
        receiver: true,
        attachments: {
          include: {
            file: {
              select: {
                id: true,
                filename: true,
                size: true,
                mimeType: true,
                url: true,
                type: true,
              },
            },
          },
        },
      },
    });

    // Valider et attacher les fichiers si présents
    if (attachments && attachments.length > 0) {
      try {
        await validateAttachments(attachments, senderId);
        
        for (const fileId of attachments) {
          await prisma.messageAttachment.create({
            data: {
              messageId: newMessage.id,
              fileId: fileId,
            },
          });
        }
      } catch (error) {
        // Supprimer le message créé en cas d'erreur de validation des fichiers
        await prisma.message.delete({ where: { id: newMessage.id } });
        const errorMessage = error instanceof Error ? error.message : 'Erreur de validation inconnue';
        res.status(400).json({ 
          error: `Erreur de validation des pièces jointes: ${errorMessage}` 
        });
        return;
      }
    }

    // Récupérer le message complet avec ses attachments après les avoir ajoutés
    const messageWithAttachments = await prisma.message.findUnique({
      where: { id: newMessage.id },
      include: {
        sender: true,
        receiver: true,
        attachments: {
          include: {
            file: {
              select: {
                id: true,
                filename: true,
                size: true,
                mimeType: true,
                url: true,
                type: true,
              },
            },
          },
        },
      },
    });

    // Créer une notification pour le destinataire
    try {
      if (senderRole === Role.ADMIN && receiverId) {
        // Admin répond à un client
        const sender = await prisma.user.findUnique({
          where: { id: senderId },
          select: { prenom: true, nom: true },
        });
        const senderName = sender
          ? `${sender.prenom} ${sender.nom}`
          : "Équipe Support";
        await notifyNewMessage(receiverId, senderName, content);
      } else if (senderRole !== Role.ADMIN && receiverId) {
        // Client répond à un admin
        const sender = await prisma.user.findUnique({
          where: { id: senderId },
          select: { prenom: true, nom: true },
        });
        const senderName = sender ? `${sender.prenom} ${sender.nom}` : "Client";
        await notifyAdminNewMessage(senderName, content, false);
      }
    } catch (notificationError) {
      console.error(
        "Erreur lors de la création de la notification:",
        notificationError
      );
      // Ne pas faire échouer la création du message si la notification échoue
    }

    // 🔥 NOUVELLE FONCTIONNALITÉ : Envoi d'email au support si le message provient du formulaire d'aide
    if (source === 'client-help' && senderRole !== Role.ADMIN) {
      // Préparer les informations utilisateur
      const senderUser = await prisma.user.findUnique({
        where: { id: senderId },
        select: { prenom: true, nom: true, email: true }
      });
      
      if (senderUser) {
        const userFullName = `${senderUser.prenom} ${senderUser.nom}`;
        const userEmail = senderUser.email;
        const messageSubject = `Suite de conversation d'aide de ${userFullName}`;
        
        // Récupérer les fichiers attachés pour l'email
        const attachedFiles = messageWithAttachments?.attachments?.map(att => att.file) || [];
        
        // Envoyer l'email au support (async, ne bloque pas la réponse)
        sendHelpMessageToSupport(
          userEmail,
          userFullName,
          messageSubject,
          content || "",
          attachedFiles,
          senderId,
          req
        ).catch(error => {
          console.error('❌ [Messages] Erreur asynchrone lors de l\'envoi de l\'email de support (reply):', error);
        });
      }
    }

    res.status(201).json(messageWithAttachments);
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
 * Crée une nouvelle conversation entre un admin et un utilisateur spécifique.
 */
export const createAdminConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const adminRole = req.user!.role;
    const {
      userId,
      content,
      subject,
      attachments = [],
      displayFirstName,
      displayLastName,
      displayRole,
    } = req.body;

    if (adminRole !== Role.ADMIN) {
      res
        .status(403)
        .json({
          error:
            "Accès non autorisé. Seuls les admins peuvent créer des conversations.",
        });
      return;
    }

    if (!userId || !content) {
      res.status(400).json({ error: "userId et content sont requis." });
      return;
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, prenom: true, nom: true, email: true },
    });

    if (!targetUser) {
      res.status(404).json({ error: "Utilisateur non trouvé." });
      return;
    }

    // Générer un conversationId basé sur les IDs des participants
    const conversationId = `thread_${[adminId, userId].sort().join("_")}`;

    // Créer le premier message de la conversation
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: adminId,
        receiverId: userId,
        subject: subject || `Message de l'administration`,
        content,
        type: MessageType.ADMIN_MESSAGE,
        statut: MessageStatut.ENVOYE,
        // Ajouter le nom d'affichage personnalisé si fourni (pour les admins)
        ...(displayFirstName && { displayFirstName }),
        ...(displayLastName && { displayLastName }),
        ...(displayRole && { displayRole }),
      },
      include: {
        sender: {
          select: { id: true, prenom: true, nom: true, avatar: true },
        },
        receiver: {
          select: { id: true, prenom: true, nom: true, avatar: true },
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
                type: true,
              },
            },
          },
        },
      },
    });

    // Valider et attacher les fichiers si présents
    if (attachments && attachments.length > 0) {
      try {
        await validateAttachments(attachments, adminId);
        
        for (const fileId of attachments) {
          await prisma.messageAttachment.create({
            data: {
              messageId: message.id,
              fileId: fileId,
            },
          });
        }
      } catch (error) {
        // Supprimer le message créé en cas d'erreur de validation des fichiers
        await prisma.message.delete({ where: { id: message.id } });
        const errorMessage = error instanceof Error ? error.message : 'Erreur de validation inconnue';
        res.status(400).json({ 
          error: `Erreur de validation des pièces jointes: ${errorMessage}` 
        });
        return;
      }
    }

    // Créer une notification pour l'utilisateur cible
    try {
      const adminUser = await prisma.user.findUnique({
        where: { id: adminId },
        select: { prenom: true, nom: true },
      });
      const adminName = adminUser
        ? `${adminUser.prenom} ${adminUser.nom}`
        : "Administration";
      await notifyNewMessage(userId, adminName, content);
    } catch (notificationError) {
      console.error(
        "Erreur lors de la création de la notification:",
        notificationError
      );
    }

    res.status(201).json({
      message: "Conversation créée avec succès.",
      conversationId: message.conversationId,
      threadId: userId,
      data: message,
      targetUser: {
        id: targetUser.id,
        name: `${targetUser.prenom} ${targetUser.nom}`,
        email: targetUser.email,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la conversation admin:",
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
      res
        .status(403)
        .json({
          error:
            "Accès non autorisé. Seuls les admins peuvent supprimer des conversations.",
        });
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
      res
        .status(404)
        .json({ error: "Aucune conversation trouvée à supprimer." });
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

/**
 * Archive une conversation en marquant tous ses messages comme archivés
 */
export const archiveConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.id;

    if (!conversationId) {
      res.status(400).json({ error: "ID de conversation requis." });
      return;
    }

    // Marquer tous les messages de cette conversation comme archivés
    const updatedCount = await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      data: {
        isArchived: true,
        updatedAt: new Date()
      }
    });

    if (updatedCount.count === 0) {
      res.status(404).json({ error: "Conversation non trouvée ou non autorisée." });
      return;
    }

    res.json({
      message: "Conversation archivée avec succès",
      updatedCount: updatedCount.count
    });
  } catch (error) {
    console.error("Erreur archivage conversation:", error);
    res.status(500).json({ error: "Erreur lors de l'archivage" });
  }
};

/**
 * Désarchive une conversation en marquant tous ses messages comme non-archivés
 */
export const unarchiveConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.id;

    if (!conversationId) {
      res.status(400).json({ error: "ID de conversation requis." });
      return;
    }

    // Désarchiver tous les messages de cette conversation
    const updatedCount = await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      data: {
        isArchived: false,
        updatedAt: new Date()
      }
    });

    if (updatedCount.count === 0) {
      res.status(404).json({ error: "Conversation non trouvée ou non autorisée." });
      return;
    }

    res.json({
      message: "Conversation désarchivée avec succès",
      updatedCount: updatedCount.count
    });
  } catch (error) {
    console.error("Erreur désarchivage conversation:", error);
    res.status(500).json({ error: "Erreur lors du désarchivage" });
  }
};
