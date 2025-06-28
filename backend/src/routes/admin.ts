import { Role } from "@prisma/client";
import { Request, Response, Router } from "express";
import {
  getAllUsers,
  getUserById,
  getUserStats,
} from "../controllers/adminController";
import {
  getAllCommandes,
  getCommandeById,
  getCommandeStats,
  updateCommandeStatut,
} from "../controllers/commandeController";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

// Import Prisma pour accéder aux données
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const router = Router();

// Appliquer l'authentification JWT à toutes les routes admin
router.use(authenticateToken);

// Route de test réservée aux administrateurs
router.get("/test", requireRole(Role.ADMIN), (req: Request, res: Response) => {
  res.status(200).json({
    message: "Bienvenue admin",
    user: {
      id: req.user?.id,
      prenom: req.user?.prenom,
      nom: req.user?.nom,
      email: req.user?.email,
      role: req.user?.role,
    },
    timestamp: new Date().toISOString(),
  });
});

// 👥 GESTION DES UTILISATEURS

// Statistiques des utilisateurs (AVANT /user/:id pour éviter conflits)
router.get("/users/stats", requireRole(Role.ADMIN), getUserStats);

// Liste de tous les utilisateurs
router.get("/users", requireRole(Role.ADMIN), getAllUsers);

// Utilisateur spécifique par ID
router.get("/user/:id", requireRole(Role.ADMIN), getUserById);

// 📋 GESTION DES COMMANDES

// Statistiques des commandes (AVANT /commande/:id pour éviter conflits)
router.get("/commandes/stats", requireRole(Role.ADMIN), getCommandeStats);

// Liste de toutes les commandes (avec pagination et filtres)
router.get("/commandes", requireRole(Role.ADMIN), getAllCommandes);

// Commande spécifique par ID
router.get("/commande/:id", requireRole(Role.ADMIN), getCommandeById);

// Mettre à jour le statut d'une commande
router.patch("/commande/:id", requireRole(Role.ADMIN), updateCommandeStatut);

// 💬 GESTION DES MESSAGES (ADMIN)

// Helper pour transformer les messages en conversations admin
const groupMessagesIntoConversations = (messages: any[]) => {
  const conversationMap = new Map();

  messages.forEach((message) => {
    // Clé de conversation basée sur les participants ou contexte
    let conversationKey = "";
    let conversationTitle = "";
    let conversationType = "direct";

    if (message.supportRequestId) {
      // Conversation de support
      conversationKey = `support_${message.supportRequestId}`;
      conversationTitle = `Support - ${
        message.supportRequest?.title || "Demande"
      }`;
      conversationType = "support";
    } else if (message.commandeId) {
      // Conversation de projet
      conversationKey = `projet_${message.commandeId}`;
      conversationTitle = `Projet - ${message.commande?.titre || "Projet"}`;
      conversationType = "projet";
    } else {
      // Conversation directe
      const participants = [message.senderId, message.receiverId]
        .filter(Boolean)
        .sort();
      conversationKey = `direct_${participants.join("_")}`;
      const senderName = message.sender
        ? `${message.sender.prenom} ${message.sender.nom}`
        : "Utilisateur";
      conversationTitle = `Conversation avec ${senderName}`;
      conversationType = "direct";
    }

    if (!conversationMap.has(conversationKey)) {
      const senderName = message.sender
        ? `${message.sender.prenom} ${message.sender.nom}`
        : "Utilisateur";
      const receiverName = message.receiver
        ? `${message.receiver.prenom} ${message.receiver.nom}`
        : "Admin";

      conversationMap.set(conversationKey, {
        id: conversationKey,
        titre: conversationTitle,
        type: conversationType,
        participants: [senderName, receiverName]
          .filter((name) => name !== "Admin")
          .slice(0, 2),
        messages: [],
        messageCount: 0,
        unreadCount: 0,
        lastMessage: null,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        statut: "ACTIVE",
        priorite: conversationType === "support" ? "HAUTE" : "NORMALE",
      });
    }

    const conversation = conversationMap.get(conversationKey);
    conversation.messages.push(message);
    conversation.messageCount++;
    if (!message.isRead) conversation.unreadCount++;

    // Garder le message le plus récent
    if (
      !conversation.lastMessage ||
      new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)
    ) {
      const senderName = message.sender
        ? `${message.sender.prenom} ${message.sender.nom}`
        : "Utilisateur";
      conversation.lastMessage = {
        content: message.content,
        createdAt: message.createdAt,
        sender: senderName,
      };
      conversation.updatedAt = message.updatedAt;
    }
  });

  return Array.from(conversationMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

// Stats des conversations pour admin
router.get(
  "/conversations/stats",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      // Récupérer tous les messages avec leurs relations
      const messages = await prisma.message.findMany({
        include: {
          sender: true,
          receiver: true,
          commande: true,
          supportRequest: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transformer en conversations et calculer les stats
      const conversations = groupMessagesIntoConversations(messages);

      const stats = {
        total: conversations.length,
        actives: conversations.filter((c) => c.statut === "ACTIVE").length,
        enAttente: conversations.filter((c) => c.priorite === "HAUTE").length,
        resolues: conversations.filter((c) => c.statut === "RESOLUE").length,
        fermees: conversations.filter((c) => c.statut === "FERMEE").length,
        unreadMessages: conversations.reduce(
          (sum, c) => sum + c.unreadCount,
          0
        ),
        totalMessages: messages.length,
        averageResponseTime: 2.5, // TODO: calculer vraiment
      };

      res.json(stats);
    } catch (error) {
      console.error("Erreur stats conversations:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des stats" });
    }
  }
);

// Compteur non lus pour admin
router.get(
  "/conversations/unread-count",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      // Compter les messages non lus
      const unreadCount = await prisma.message.count({
        where: {
          isRead: false,
        },
      });

      res.json({ count: unreadCount });
    } catch (error) {
      console.error("Erreur comptage messages non lus:", error);
      res.status(500).json({ error: "Erreur lors du comptage" });
    }
  }
);

// Tags/catégories pour admin
router.get(
  "/conversations/tags",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      res.json({
        tags: ["Support", "Projet", "Facturation", "Général"],
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des tags" });
    }
  }
);

// Liste des conversations pour admin
router.get(
  "/conversations",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Récupérer tous les messages avec leurs relations
      const messages = await prisma.message.findMany({
        include: {
          sender: true,
          receiver: true,
          commande: true,
          supportRequest: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transformer en conversations
      const allConversations = groupMessagesIntoConversations(messages);

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const conversationsPage = allConversations.slice(startIndex, endIndex);

      const totalPages = Math.ceil(allConversations.length / limit);

      res.json({
        conversations: conversationsPage,
        pagination: {
          page,
          limit,
          total: allConversations.length,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Erreur récupération conversations:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des conversations" });
    }
  }
);

// Récupérer une conversation spécifique par ID
router.get(
  "/conversations/:id",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.id;

      // Récupérer tous les messages pour pouvoir reconstruire la conversation
      const messages = await prisma.message.findMany({
        include: {
          sender: true,
          receiver: true,
          commande: true,
          supportRequest: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transformer en conversations
      const conversations = groupMessagesIntoConversations(messages);

      // Trouver la conversation demandée
      const conversation = conversations.find((c) => c.id === conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation non trouvée" });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Erreur récupération conversation:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération de la conversation" });
    }
  }
);

// Envoyer un message dans une conversation
router.post(
  "/conversations/:conversationId/messages",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.conversationId;
      const { contenu, type = "TEXT", isAdminNote = false } = req.body;

      if (!contenu || contenu.trim() === "") {
        return res
          .status(400)
          .json({ error: "Le contenu du message est requis" });
      }

      // Parser l'ID de conversation pour identifier le destinataire
      let receiverId: string | null = null;
      let commandeId: string | null = null;
      let supportRequestId: string | null = null;

      if (conversationId.startsWith("direct_")) {
        // Conversation directe : direct_userId1_userId2
        const parts = conversationId.split("_");
        if (parts.length >= 3) {
          // Identifier l'utilisateur qui n'est pas l'admin
          const adminId = req.user?.id;
          for (let i = 1; i < parts.length; i++) {
            if (parts[i] !== adminId) {
              receiverId = parts[i];
              break;
            }
          }
        }
      } else if (conversationId.startsWith("projet_")) {
        // Conversation projet : projet_commandeId
        commandeId = conversationId.replace("projet_", "");

        // Récupérer le propriétaire du projet
        const commande = await prisma.commande.findUnique({
          where: { id: commandeId },
          select: { userId: true },
        });

        if (commande) {
          receiverId = commande.userId;
        }
      } else if (conversationId.startsWith("support_")) {
        // Conversation support : support_supportRequestId
        supportRequestId = conversationId.replace("support_", "");

        // Récupérer le créateur du ticket
        const supportRequest = await prisma.supportRequest.findUnique({
          where: { id: supportRequestId },
          select: { userId: true },
        });

        if (supportRequest) {
          receiverId = supportRequest.userId;
        }
      }

      if (!receiverId) {
        return res.status(400).json({
          error: "Impossible d'identifier le destinataire du message",
        });
      }

      // Créer le message avec le destinataire correct
      const newMessage = await prisma.message.create({
        data: {
          content: contenu,
          type: "USER_MESSAGE", // Tous les messages admin sont des messages utilisateur
          senderId: req.user?.id || "", // ID de l'admin qui envoie
          receiverId: receiverId, // ID du destinataire identifié
          commandeId: commandeId, // Si c'est lié à un projet
          supportRequestId: supportRequestId, // Si c'est lié à un support
          isRead: false,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          sender: true,
          receiver: true,
          commande: true,
          supportRequest: true,
        },
      });

      res.status(201).json({
        id: newMessage.id,
        content: newMessage.content,
        type,
        isAdminNote,
        createdAt: newMessage.createdAt,
        sender: {
          id: newMessage.sender?.id,
          prenom: newMessage.sender?.prenom,
          nom: newMessage.sender?.nom,
          role: newMessage.sender?.role,
        },
        receiver: {
          id: newMessage.receiver?.id,
          prenom: newMessage.receiver?.prenom,
          nom: newMessage.receiver?.nom,
        },
      });
    } catch (error) {
      console.error("Erreur envoi message admin:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi du message" });
    }
  }
);

// Mettre à jour une conversation
router.put(
  "/conversations/:id",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.id;
      const updateData = req.body;

      // Pour l'instant, retourner succès (à implémenter selon les besoins)
      res.json({
        id: conversationId,
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erreur mise à jour conversation:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour de la conversation" });
    }
  }
);

// Supprimer une conversation (RGPD)
router.delete(
  "/conversations/:id",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.id;

      // Pour l'instant, retourner succès (à implémenter selon les besoins)
      res.json({ message: "Conversation supprimée avec succès" });
    } catch (error) {
      console.error("Erreur suppression conversation:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression de la conversation" });
    }
  }
);

// Export des conversations
router.get(
  "/conversations/export",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const format = (req.query.format as string) || "csv";

      // Récupérer toutes les conversations
      const messages = await prisma.message.findMany({
        include: {
          sender: true,
          receiver: true,
          commande: true,
          supportRequest: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const conversations = groupMessagesIntoConversations(messages);

      if (format === "csv") {
        // Générer CSV
        const csvData = conversations.map((conv) => ({
          id: conv.id,
          titre: conv.titre,
          type: conv.type,
          participants: conv.participants.join(", "),
          messageCount: conv.messageCount,
          unreadCount: conv.unreadCount,
          statut: conv.statut,
          priorite: conv.priorite,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        }));

        const csvHeaders = Object.keys(csvData[0] || {}).join(",");
        const csvRows = csvData.map((row) => Object.values(row).join(","));
        const csvContent = [csvHeaders, ...csvRows].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=conversations.csv"
        );
        res.send(csvContent);
      } else {
        // Générer JSON
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=conversations.json"
        );
        res.json(conversations);
      }
    } catch (error) {
      console.error("Erreur export conversations:", error);
      res.status(500).json({ error: "Erreur lors de l'export" });
    }
  }
);

// 📊 DASHBOARD & STATISTIQUES

// Statistiques avancées
router.get(
  "/stats/advanced",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      // Récupérer les données pour les statistiques avancées
      const totalUsers = await prisma.user.count();
      const totalCommandes = await prisma.commande.count();
      const totalMessages = await prisma.message.count();
      const totalFactures = await prisma.invoice.count();

      // Calculer chiffre d'affaires (somme des factures payées)
      const chiffreAffaires = await prisma.invoice.aggregate({
        where: {
          status: "PAID",
        },
        _sum: {
          amount: true,
        },
      });

      // Calculer les nouvelles commandes du mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const nouvellesCommandes = await prisma.commande.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // Calculer les nouveaux clients du mois
      const nouveauxClients = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
          role: "USER",
        },
      });

      const statistiquesAvancees = {
        chiffreAffaires: Math.round(chiffreAffaires._sum.amount || 0),
        croissanceCA: 15.2, // TODO: calculer vraiment
        nouvellesCommandes,
        croissanceCommandes: 8.7, // TODO: calculer vraiment
        nouveauxClients,
        croissanceClients: 12.3, // TODO: calculer vraiment
        tauxSatisfaction: 94.8, // TODO: calculer vraiment
        nombreAvis: 127, // TODO: calculer vraiment
        topServices: [
          { nom: "Correction de manuscrit", commandes: 45, evolution: 12 },
          { nom: "Relecture", commandes: 38, evolution: -3 },
          { nom: "Mise en page", commandes: 22, evolution: 8 },
        ],
        evolutionMensuelle: [
          { mois: "Jan", ca: 15200, commandes: 34 },
          { mois: "Fév", ca: 18400, commandes: 41 },
          { mois: "Mar", ca: 22100, commandes: 48 },
          { mois: "Avr", ca: 19800, commandes: 43 },
          { mois: "Mai", ca: 24500, commandes: 52 },
          { mois: "Juin", ca: 27300, commandes: 58 },
        ],
        satisfactionEvolution: [
          { periode: "Q1", score: 92.1 },
          { periode: "Q2", score: 94.8 },
        ],
        performance: {
          tempsReponse: 2.4,
          tauxResolution: 96.2,
          ticketsOuverts: 12,
          ticketsFermes: 156,
        },
      };

      res.json(statistiquesAvancees);
    } catch (error) {
      console.error("Erreur statistiques avancées:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des statistiques" });
    }
  }
);

// Route pour obtenir des statistiques générales combinées
router.get("/stats", requireRole(Role.ADMIN), (req: Request, res: Response) => {
  res.status(200).json({
    message: "Statistiques de la plateforme",
    stats: {
      totalUsers: "🔢 Utilisez /admin/users/stats",
      totalCommandes: "📋 Utilisez /admin/commandes/stats",
      totalProjects: "🔢 À implémenter",
      revenue: "💰 À implémenter",
    },
    admin: {
      prenom: req.user?.prenom,
      nom: req.user?.nom,
      role: req.user?.role,
    },
    links: {
      users: "/admin/users/stats",
      commandes: "/admin/commandes/stats",
    },
  });
});

export default router;
