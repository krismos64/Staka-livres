import {
  Conversation,
  ConversationStats,
  ConversationTag,
  CreateMessageRequest,
  Message,
  PaginatedResponse,
  PrioriteConversation,
  Role,
  StatutCommande,
  StatutConversation,
  TypeMessage,
  UpdateConversationRequest,
} from "../types/shared";

// Helper pour générer une date aléatoire
const generateRandomDate = (daysAgo: number, daysFuture: number = 0) => {
  const now = new Date();
  const start = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const end =
    daysFuture > 0
      ? new Date(now.getTime() + daysFuture * 24 * 60 * 60 * 1000)
      : now;

  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Tags de conversations prédéfinis
const conversationTags: ConversationTag[] = [
  {
    id: "tag-1",
    nom: "Urgent",
    couleur: "#ef4444",
    description: "Nécessite une réponse rapide",
  },
  {
    id: "tag-2",
    nom: "Technique",
    couleur: "#3b82f6",
    description: "Question technique",
  },
  {
    id: "tag-3",
    nom: "Facturation",
    couleur: "#10b981",
    description: "Problème de facturation",
  },
  {
    id: "tag-4",
    nom: "Qualité",
    couleur: "#f59e0b",
    description: "Question sur la qualité",
  },
  {
    id: "tag-5",
    nom: "Délai",
    couleur: "#8b5cf6",
    description: "Problème de délai",
  },
  {
    id: "tag-6",
    nom: "Résolu",
    couleur: "#6b7280",
    description: "Problème résolu",
  },
];

// Utilisateurs fictifs simplifiés
const mockUsers = [
  {
    id: "user-1",
    prenom: "Marie",
    nom: "Dubois",
    email: "marie.dubois@email.com",
    role: Role.USER,
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b332c40e?w=64&h=64&fit=crop&crop=face",
  },
  {
    id: "user-2",
    prenom: "Pierre",
    nom: "Leclerc",
    email: "pierre.leclerc@email.com",
    role: Role.USER,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
  },
  {
    id: "user-3",
    prenom: "Sophie",
    nom: "Bernard",
    email: "sophie.bernard@email.com",
    role: Role.USER,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
  },
  {
    id: "user-5",
    prenom: "Alexandre",
    nom: "Martin",
    email: "alexandre.martin@staka.com",
    role: Role.USER,
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
  },
];

// Commandes fictives simplifiées
const mockCommandes = [
  {
    id: "cmd-1",
    titre: "Correction Mémoire de Master",
    statut: StatutCommande.EN_COURS,
  },
  {
    id: "cmd-2",
    titre: "Relecture Article Scientifique",
    statut: StatutCommande.EN_ATTENTE,
  },
  {
    id: "cmd-3",
    titre: "Correction Thèse de Doctorat",
    statut: StatutCommande.TERMINE,
  },
];

// Messages prédéfinis
const sampleMessages: Message[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    contenu:
      "Bonjour, j'aimerais avoir des précisions sur la correction de mon mémoire.",
    type: TypeMessage.TEXT,
    auteur: {
      id: "user-1",
      prenom: "Marie",
      nom: "Dubois",
      role: Role.USER,
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b332c40e?w=64&h=64&fit=crop&crop=face",
    },
    createdAt: generateRandomDate(2).toISOString(),
    updatedAt: generateRandomDate(2).toISOString(),
    isRead: true,
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    contenu:
      "Bonjour Marie, je serais ravi de vous aider. Pouvez-vous m'envoyer votre document ?",
    type: TypeMessage.TEXT,
    auteur: {
      id: "user-5",
      prenom: "Alexandre",
      nom: "Martin",
      role: Role.USER,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
    },
    createdAt: generateRandomDate(2).toISOString(),
    updatedAt: generateRandomDate(2).toISOString(),
    isRead: true,
  },
];

// Conversations fictives
const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    titre: "Correction mémoire - Bibliographie",
    statut: StatutConversation.ACTIVE,
    priorite: PrioriteConversation.HAUTE,
    commande: {
      id: "cmd-1",
      titre: "Correction Mémoire de Master",
      statut: StatutCommande.EN_COURS,
    },
    participants: {
      client: {
        id: "user-1",
        prenom: "Marie",
        nom: "Dubois",
        email: "marie.dubois@email.com",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b332c40e?w=64&h=64&fit=crop&crop=face",
      },
      correcteur: {
        id: "user-5",
        prenom: "Alexandre",
        nom: "Martin",
        email: "alexandre.martin@staka.com",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      },
    },
    tags: [conversationTags[0], conversationTags[3]], // Urgent + Qualité
    messages: sampleMessages.filter((m) => m.conversationId === "conv-1"),
    messageCount: 4,
    unreadCount: 1,
    lastMessage: sampleMessages[1],
    createdAt: generateRandomDate(2).toISOString(),
    updatedAt: generateRandomDate(1).toISOString(),
    metadata: {
      isRgpdCompliant: true,
      hasUrgentMessages: true,
      estimatedResponseTime: 120, // 2 heures
    },
  },
  {
    id: "conv-2",
    titre: "Question sur les délais",
    statut: StatutConversation.EN_ATTENTE,
    priorite: PrioriteConversation.NORMALE,
    commande: {
      id: "cmd-2",
      titre: "Relecture Article Scientifique",
      statut: StatutCommande.EN_ATTENTE,
    },
    participants: {
      client: {
        id: "user-2",
        prenom: "Pierre",
        nom: "Leclerc",
        email: "pierre.leclerc@email.com",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
      },
    },
    tags: [conversationTags[4]], // Délai
    messages: [],
    messageCount: 3,
    unreadCount: 2,
    createdAt: generateRandomDate(1).toISOString(),
    updatedAt: generateRandomDate(1).toISOString(),
    metadata: {
      isRgpdCompliant: true,
      hasUrgentMessages: false,
      estimatedResponseTime: 240, // 4 heures
    },
  },
];

export class MockMessageService {
  // Simulation de délai réseau
  private static async simulateDelay(ms: number = 300): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * ms + 200)
    );
  }

  // Pagination helper
  static paginate<T>(
    data: T[],
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);
    const total = data.length;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Générer des conversations fictives
  private static generateConversations(count: number): Conversation[] {
    const conversations: Conversation[] = [...mockConversations];

    for (let i = 3; i <= count; i++) {
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const correcteur =
        Math.random() > 0.3
          ? mockUsers.find((u) => u.role === Role.USER && u.id !== user.id)
          : undefined;
      const commande =
        Math.random() > 0.2
          ? mockCommandes[Math.floor(Math.random() * mockCommandes.length)]
          : undefined;

      const statuts = Object.values(StatutConversation);
      const priorites = Object.values(PrioriteConversation);
      const statut = statuts[Math.floor(Math.random() * statuts.length)];

      const selectedTags = conversationTags
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 1);

      conversations.push({
        id: `conv-${i}`,
        titre: [
          "Question sur la méthodologie",
          "Problème de formatage",
          "Demande de révision",
          "Clarification nécessaire",
          "Feedback sur le travail",
          "Question technique",
          "Délai de livraison",
          "Modification du cahier des charges",
        ][Math.floor(Math.random() * 8)],
        statut,
        priorite: priorites[Math.floor(Math.random() * priorites.length)],
        commande: commande
          ? {
              id: commande.id,
              titre: commande.titre,
              statut: commande.statut,
            }
          : undefined,
        participants: {
          client: {
            id: user.id,
            prenom: user.prenom,
            nom: user.nom,
            email: user.email,
            avatar: `https://images.unsplash.com/photo-${
              1500000000000 + i
            }?w=64&h=64&fit=crop&crop=face`,
          },
          correcteur: correcteur
            ? {
                id: correcteur.id,
                prenom: correcteur.prenom,
                nom: correcteur.nom,
                email: correcteur.email,
                avatar: `https://images.unsplash.com/photo-${
                  1500000000000 + i + 1000
                }?w=64&h=64&fit=crop&crop=face`,
              }
            : undefined,
        },
        tags: selectedTags,
        messages: [],
        messageCount: Math.floor(Math.random() * 15) + 1,
        unreadCount:
          statut === StatutConversation.ACTIVE ||
          statut === StatutConversation.EN_ATTENTE
            ? Math.floor(Math.random() * 5)
            : 0,
        createdAt: generateRandomDate(
          Math.floor(Math.random() * 30)
        ).toISOString(),
        updatedAt: generateRandomDate(
          Math.floor(Math.random() * 7)
        ).toISOString(),
        closedAt:
          statut === StatutConversation.FERMEE ||
          statut === StatutConversation.RESOLUE
            ? generateRandomDate(Math.floor(Math.random() * 3)).toISOString()
            : undefined,
        metadata: {
          isRgpdCompliant: Math.random() > 0.1,
          hasUrgentMessages: Math.random() > 0.7,
          estimatedResponseTime: Math.floor(Math.random() * 480) + 30, // 30min à 8h
        },
      });
    }

    return conversations;
  }

  static async getConversations(
    page = 1,
    limit = 10,
    search?: string,
    statut?: StatutConversation,
    priorite?: PrioriteConversation,
    userId?: string
  ): Promise<PaginatedResponse<Conversation>> {
    await MockMessageService.simulateDelay();

    let conversations = MockMessageService.generateConversations(30);

    // Filtrage
    if (search) {
      const searchLower = search.toLowerCase();
      conversations = conversations.filter(
        (conv: Conversation) =>
          conv.titre.toLowerCase().includes(searchLower) ||
          conv.participants.client.prenom.toLowerCase().includes(searchLower) ||
          conv.participants.client.nom.toLowerCase().includes(searchLower) ||
          conv.participants.client.email.toLowerCase().includes(searchLower) ||
          conv.participants.correcteur?.prenom
            .toLowerCase()
            .includes(searchLower) ||
          conv.participants.correcteur?.nom
            .toLowerCase()
            .includes(searchLower) ||
          conv.commande?.titre.toLowerCase().includes(searchLower)
      );
    }

    if (statut) {
      conversations = conversations.filter(
        (conv: Conversation) => conv.statut === statut
      );
    }

    if (priorite) {
      conversations = conversations.filter(
        (conv: Conversation) => conv.priorite === priorite
      );
    }

    if (userId) {
      conversations = conversations.filter(
        (conv: Conversation) =>
          conv.participants.client.id === userId ||
          conv.participants.correcteur?.id === userId
      );
    }

    // Tri par date de mise à jour (plus récent en premier)
    conversations.sort(
      (a: Conversation, b: Conversation) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return MockMessageService.paginate(conversations, page, limit);
  }

  static async getConversationById(id: string): Promise<Conversation> {
    await MockMessageService.simulateDelay();

    const conversations = MockMessageService.generateConversations(30);
    const conversation = conversations.find((c) => c.id === id);

    if (!conversation) {
      throw new Error("Conversation non trouvée");
    }

    // Générer des messages pour cette conversation
    const messageCount = Math.floor(Math.random() * 20) + 3;
    const messages: Message[] = [];

    for (let i = 0; i < messageCount; i++) {
      const isFromClient = Math.random() > 0.4;
      const auteur = isFromClient
        ? conversation.participants.client
        : conversation.participants.correcteur ||
          conversation.participants.client;

      messages.push({
        id: `msg-${id}-${i}`,
        conversationId: id,
        contenu: [
          "Merci pour votre travail, c'est exactement ce que j'attendais.",
          "J'ai une question concernant la méthodologie utilisée.",
          "Pouvez-vous m'expliquer cette correction ?",
          "Le délai peut-il être respecté ?",
          "J'ai envoyé les documents demandés.",
          "Tout me semble parfait, merci beaucoup !",
          "Y a-t-il des points à améliorer ?",
          "La qualité est excellente, je recommande.",
        ][Math.floor(Math.random() * 8)],
        type: Math.random() > 0.8 ? TypeMessage.FILE : TypeMessage.TEXT,
        files:
          Math.random() > 0.8
            ? [
                {
                  id: `file-${id}-${i}`,
                  name: `document_${i}.pdf`,
                  url: `/files/document_${i}.pdf`,
                  size: Math.floor(Math.random() * 5000000) + 100000,
                  type: "application/pdf",
                  uploadedAt: generateRandomDate(
                    Math.floor(Math.random() * 10)
                  ).toISOString(),
                },
              ]
            : undefined,
        auteur: {
          id: auteur.id,
          prenom: auteur.prenom,
          nom: auteur.nom,
          role:
            auteur.id === conversation.participants.client.id
              ? Role.USER
              : Role.USER,
          avatar: auteur.avatar,
        },
        createdAt: generateRandomDate(
          Math.floor(Math.random() * 10)
        ).toISOString(),
        updatedAt: generateRandomDate(
          Math.floor(Math.random() * 10)
        ).toISOString(),
        isRead: Math.random() > 0.2,
      });
    }

    messages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      ...conversation,
      messages,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1],
    };
  }

  static async getConversationStats(): Promise<ConversationStats> {
    await MockMessageService.simulateDelay();

    const conversations = MockMessageService.generateConversations(30);

    return {
      total: conversations.length,
      actives: conversations.filter(
        (c) => c.statut === StatutConversation.ACTIVE
      ).length,
      enAttente: conversations.filter(
        (c) => c.statut === StatutConversation.EN_ATTENTE
      ).length,
      resolues: conversations.filter(
        (c) => c.statut === StatutConversation.RESOLUE
      ).length,
      fermees: conversations.filter(
        (c) => c.statut === StatutConversation.FERMEE
      ).length,
      archivees: conversations.filter(
        (c) => c.statut === StatutConversation.ARCHIVEE
      ).length,
      tempsReponseMoyen: 145, // minutes
      tauxResolution: 87.5, // pourcentage
    };
  }

  static async createMessage(
    conversationId: string,
    messageData: CreateMessageRequest
  ): Promise<Message> {
    await MockMessageService.simulateDelay();

    return {
      id: `msg-${conversationId}-${Date.now()}`,
      conversationId,
      contenu: messageData.contenu,
      type: messageData.type,
      files: messageData.files
        ? messageData.files.map((file, index) => ({
            id: `file-${Date.now()}-${index}`,
            name: file.name,
            url: `/files/${file.name}`,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
          }))
        : undefined,
      auteur: {
        id: "admin-1",
        prenom: "Admin",
        nom: "Support",
        role: Role.ADMIN,
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRead: false,
      metadata: messageData.isAdminNote
        ? {
            isAdminNote: true,
            actionType: "admin_intervention",
          }
        : undefined,
    };
  }

  static async updateConversation(
    id: string,
    updateData: UpdateConversationRequest
  ): Promise<Conversation> {
    await MockMessageService.simulateDelay();

    const conversation = await MockMessageService.getConversationById(id);

    return {
      ...conversation,
      titre: updateData.titre || conversation.titre,
      statut: updateData.statut || conversation.statut,
      priorite: updateData.priorite || conversation.priorite,
      tags: updateData.tags
        ? conversationTags.filter((tag) => updateData.tags!.includes(tag.id))
        : conversation.tags,
      updatedAt: new Date().toISOString(),
      closedAt:
        updateData.statut === StatutConversation.FERMEE ||
        updateData.statut === StatutConversation.RESOLUE
          ? new Date().toISOString()
          : conversation.closedAt,
      closedBy:
        updateData.statut === StatutConversation.FERMEE ||
        updateData.statut === StatutConversation.RESOLUE
          ? {
              id: "admin-1",
              prenom: "Admin",
              nom: "Support",
              role: Role.ADMIN,
            }
          : conversation.closedBy,
    };
  }

  static async deleteConversation(id: string): Promise<void> {
    await MockMessageService.simulateDelay();
    // Simulation de suppression RGPD
    console.log(`🗑️ [Mock] Suppression RGPD de la conversation ${id}`);
  }

  static async exportConversations(
    format: "csv" | "json" = "csv"
  ): Promise<Blob> {
    await MockMessageService.simulateDelay(2000);

    const conversations = MockMessageService.generateConversations(30);

    if (format === "csv") {
      const headers =
        "ID,Titre,Statut,Priorité,Client,Correcteur,Messages,Créé le,Mis à jour le\n";
      const rows = conversations
        .map((conv) =>
          [
            conv.id,
            `"${conv.titre}"`,
            conv.statut,
            conv.priorite,
            `"${conv.participants.client.prenom} ${conv.participants.client.nom}"`,
            conv.participants.correcteur
              ? `"${conv.participants.correcteur.prenom} ${conv.participants.correcteur.nom}"`
              : "",
            conv.messageCount,
            conv.createdAt,
            conv.updatedAt,
          ].join(",")
        )
        .join("\n");

      return new Blob([headers + rows], { type: "text/csv" });
    } else {
      return new Blob([JSON.stringify(conversations, null, 2)], {
        type: "application/json",
      });
    }
  }

  static async getConversationTags(): Promise<ConversationTag[]> {
    await MockMessageService.simulateDelay();
    return conversationTags;
  }

  static async getUnreadConversationsCount(): Promise<number> {
    await MockMessageService.simulateDelay();
    const conversations = MockMessageService.generateConversations(30);
    return conversations.filter((conv) => conv.unreadCount > 0).length;
  }
}
