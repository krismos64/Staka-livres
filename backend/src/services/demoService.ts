import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Enums pour les statuts (à adapter selon votre schéma Prisma)
enum StatutCommande {
  EN_ATTENTE = "EN_ATTENTE",
  EN_COURS = "EN_COURS",
  TERMINE = "TERMINE",
  ANNULEE = "ANNULEE"
}

enum StatutFacture {
  EN_ATTENTE = "EN_ATTENTE",
  PAYEE = "PAYEE",
  ANNULEE = "ANNULEE"
}

/**
 * Service de gestion des données de démonstration
 * Centralise la logique de génération et nettoyage des données fictives
 * 
 * Développé par Christophe Mostefaoui - 27 Juillet 2025
 * Production déployée sur livrestaka.fr
 */

export interface DemoDataCounts {
  users: number;
  commandes: number;
  factures: number;
  messages: number;
  notifications: number;
}

export interface DemoUser {
  prenom: string;
  nom: string;
  email: string;
}

export interface DemoBook {
  titre: string;
  description: string;
}

export interface DemoMessage {
  subject: string;
  content: string;
}

/**
 * Configuration des données de démonstration
 */
export const DEMO_CONFIG = {
  // Utilisateurs de test avec emails spécifiques
  USERS: [
    { prenom: "Marie", nom: "Dubois", email: "marie.dubois@demo.staka.fr" },
    { prenom: "Pierre", nom: "Martin", email: "pierre.martin@demo.staka.fr" },
    { prenom: "Sophie", nom: "Laurent", email: "sophie.laurent@demo.staka.fr" },
    { prenom: "Jean", nom: "Dupont", email: "jean.dupont@demo.staka.fr" },
    { prenom: "Anne", nom: "Moreau", email: "anne.moreau@demo.staka.fr" },
    { prenom: "François", nom: "Leclerc", email: "francois.leclerc@demo.staka.fr" },
    { prenom: "Camille", nom: "Rousseau", email: "camille.rousseau@demo.staka.fr" },
    { prenom: "Thomas", nom: "Blanchard", email: "thomas.blanchard@demo.staka.fr" },
  ] as DemoUser[],

  // Livres fictifs réalistes
  BOOKS: [
    {
      titre: "Les Mystères de la Forêt Enchantée",
      description: "Roman fantasy captivant mêlant aventure et magie"
    },
    {
      titre: "Voyage au Cœur de l'Imaginaire",
      description: "Récit autobiographique touchant sur l'entrepreneuriat"
    },
    {
      titre: "Mémoires d'un Entrepreneur",
      description: "Guide complet pour débuter en jardinage écologique"
    },
    {
      titre: "Guide Pratique du Jardinage Bio",
      description: "Techniques avancées de négociation en entreprise"
    },
    {
      titre: "L'Art de la Négociation",
      description: "Analyse historique de la période moderne française"
    },
    {
      titre: "Histoire de France Moderne",
      description: "Collection de recettes traditionnelles familiales"
    },
    {
      titre: "Recettes de Grand-Mère",
      description: "Réflexions philosophiques sur notre époque"
    },
    {
      titre: "Philosophie et Modernité",
      description: "Témoignages du quotidien avec humour et sensibilité"
    },
    {
      titre: "Chroniques d'une Vie Ordinaire",
      description: "Méthodes pratiques d'amélioration personnelle"
    },
    {
      titre: "Manuel de Développement Personnel",
      description: "Techniques photographiques pour débutants et experts"
    },
  ] as DemoBook[],

  // Messages types de service client
  MESSAGES: [
    {
      subject: "Question sur ma commande",
      content: "Bonjour, j'aimerais avoir des informations sur l'avancement de ma commande. Pourriez-vous me tenir informé ? Merci."
    },
    {
      subject: "Demande de devis personnalisé",
      content: "Pouvez-vous me faire un devis pour la correction d'un manuscrit de 250 pages ? J'ai besoin d'un délai rapide."
    },
    {
      subject: "Problème avec le téléchargement",
      content: "J'ai des difficultés à télécharger le fichier corrigé. Pouvez-vous m'aider ?"
    },
    {
      subject: "Modification de ma commande",
      content: "Je souhaiterais modifier ma commande pour ajouter une correction premium. Est-ce possible ?"
    },
    {
      subject: "Demande d'informations",
      content: "Quels sont vos tarifs pour la correction d'un livre de poésie ? Merci d'avance."
    },
    {
      subject: "Réclamation service client",
      content: "Je ne suis pas satisfait de la qualité de correction. Que proposez-vous ?"
    },
    {
      subject: "Compliments sur le service",
      content: "Excellent travail sur mon manuscrit ! Je recommanderai vos services."
    },
    {
      subject: "Question technique",
      content: "Comment puis-je suivre l'avancement de ma correction en temps réel ?"
    },
    {
      subject: "Demande de remboursement",
      content: "Suite à un problème technique, je souhaite annuler ma commande."
    },
    {
      subject: "Proposition de partenariat",
      content: "Je représente une maison d'édition. Pourriez-vous me contacter ?"
    },
  ] as DemoMessage[],

  // Prix réalistes en centimes
  PRICES: [39900, 49900, 59900, 79900, 99900, 119900, 149900],

  // Types de notifications
  NOTIFICATION_TYPES: [
    { title: "Nouvelle commande", message: "Une nouvelle commande a été créée", type: "ORDER" },
    { title: "Paiement reçu", message: "Un paiement de 79,99€ a été effectué", type: "PAYMENT" },
    { title: "Message client", message: "Nouveau message de {user}", type: "MESSAGE" },
    { title: "Facture générée", message: "Facture {numero} créée", type: "SYSTEM" },
    { title: "Commande terminée", message: "Correction terminée pour '{titre}'", type: "SUCCESS" },
  ],
} as const;

/**
 * Utilitaires de génération aléatoire
 */
export class DemoUtils {
  /**
   * Sélectionne un élément aléatoire dans un tableau
   */
  static getRandomElement<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Génère une date aléatoire dans une plage
   */
  static generateRandomDate(daysAgo: number, daysFuture: number = 0): Date {
    const now = new Date();
    const start = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + daysFuture * 24 * 60 * 60 * 1000);
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime);
  }

  /**
   * Génère un prix aléatoire
   */
  static generateRandomPrice(): number {
    return this.getRandomElement(DEMO_CONFIG.PRICES);
  }

  /**
   * Génère un numéro de facture de démo
   */
  static generateInvoiceNumber(index: number): string {
    const year = new Date().getFullYear();
    return `DEMO-${year}-${String(index + 1).padStart(3, '0')}`;
  }

  /**
   * Génère un ID de conversation de démo
   */
  static generateConversationId(index: number): string {
    return `demo-conv-${index + 1}`;
  }

  /**
   * Génère un ID de paiement Stripe factice
   */
  static generateStripePaymentId(): string {
    return `pi_demo_${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * Service principal de gestion des données de démonstration
 */
export class DemoService {
  /**
   * Vérifie si des données de démonstration existent
   */
  static async hasDemoData(): Promise<boolean> {
    const demoUsersCount = await prisma.user.count({
      where: { email: { endsWith: "@demo.staka.fr" } }
    });
    return demoUsersCount > 0;
  }

  /**
   * Compte toutes les données de démonstration
   */
  static async countDemoData(): Promise<DemoDataCounts> {
    const [users, commandes, factures, messages, notifications] = await Promise.all([
      prisma.user.count({
        where: { email: { endsWith: "@demo.staka.fr" } }
      }),
      prisma.commande.count({
        where: {
          user: {
            email: { endsWith: "@demo.staka.fr" }
          }
        }
      }),
      prisma.invoice.count({
        where: { number: { startsWith: "DEMO-" } }
      }),
      prisma.message.count({
        where: { conversationId: { startsWith: "demo-conv-" } }
      }),
      prisma.notification.count({
        where: {
          OR: [
            { title: { contains: "démo" } },
            { type: "SYSTEM" }
          ]
        }
      })
    ]);

    return { users, commandes, factures, messages, notifications };
  }

  /**
   * Supprime toutes les données de démonstration
   */
  static async cleanupDemoData(): Promise<DemoDataCounts> {
    const counts = await this.countDemoData();

    // Supprimer dans l'ordre des dépendances
    await Promise.all([
      // Notifications
      prisma.notification.deleteMany({
        where: {
          OR: [
            { title: { contains: "démo" } },
            { message: { contains: "démo" } },
            { type: "SYSTEM" }
          ]
        }
      }),
      // Messages
      prisma.message.deleteMany({
        where: { conversationId: { startsWith: "demo-conv-" } }
      }),
    ]);

    // Factures (dépendent des commandes)
    await prisma.invoice.deleteMany({
      where: { number: { startsWith: "DEMO-" } }
    });

    // Commandes (dépendent des utilisateurs)
    await prisma.commande.deleteMany({
      where: {
        user: {
          email: { endsWith: "@demo.staka.fr" }
        }
      }
    });

    // Utilisateurs (en dernier)
    await prisma.user.deleteMany({
      where: { email: { endsWith: "@demo.staka.fr" } }
    });

    return counts;
  }

  /**
   * Génère des utilisateurs de démonstration
   */
  static async generateUsers(count: number = 8): Promise<any[]> {
    const users = [];
    const usersToCreate = DEMO_CONFIG.USERS.slice(0, Math.min(count, DEMO_CONFIG.USERS.length));

    for (const userData of usersToCreate) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        const isActive = Math.random() > 0.2; // 80% actifs
        const user = await prisma.user.create({
          data: {
            prenom: userData.prenom,
            nom: userData.nom,
            email: userData.email,
            password: "$2b$10$demopasswordhash.fictif.pour.demo.uniquement",
            role: Role.USER,
            isActive,
            createdAt: DemoUtils.generateRandomDate(60),
            updatedAt: DemoUtils.generateRandomDate(5),
          }
        });
        users.push(user);
      } else {
        users.push(existingUser);
      }
    }

    return users;
  }

  /**
   * Génère des commandes de démonstration
   */
  static async generateCommandes(users: any[], count: number = 15): Promise<any[]> {
    const commandes = [];

    for (let i = 0; i < count; i++) {
      const user = DemoUtils.getRandomElement(users);
      const statut = DemoUtils.getRandomElement(Object.values(StatutCommande));
      const book = DemoUtils.getRandomElement(DEMO_CONFIG.BOOKS);

      const commande = await prisma.commande.create({
        data: {
          userId: user.id,
          titre: book.titre,
          description: book.description,
          statut,
          noteClient: Math.random() > 0.7 ? "Merci de faire attention aux dialogues particulièrement." : undefined,
          noteCorrecteur: statut === StatutCommande.TERMINE
            ? "Correction terminée. Quelques suggestions d'amélioration incluses."
            : undefined,
          createdAt: DemoUtils.generateRandomDate(45),
          updatedAt: DemoUtils.generateRandomDate(Math.random() > 0.5 ? 20 : 3),
        }
      });

      commandes.push(commande);
    }

    return commandes;
  }

  /**
   * Génère des factures de démonstration
   */
  static async generateFactures(commandes: any[], count: number = 12): Promise<any[]> {
    const factures = [];
    const commandesToUse = commandes.slice(0, Math.min(count, commandes.length));

    for (let i = 0; i < commandesToUse.length; i++) {
      const commande = commandesToUse[i];
      const statut = DemoUtils.getRandomElement(Object.values(StatutFacture));
      const montant = DemoUtils.generateRandomPrice();
      const numero = DemoUtils.generateInvoiceNumber(i);

      const facture = await prisma.invoice.create({
        data: {
          number: numero,
          amount: montant,
          pdfUrl: `/uploads/invoices/demo-${numero}.pdf`,
          commande: {
            connect: { id: commande.id }
          },
          createdAt: DemoUtils.generateRandomDate(40),
        }
      });

      factures.push(facture);
    }

    return factures;
  }

  /**
   * Génère des messages de démonstration
   */
  static async generateMessages(users: any[], count: number = 20): Promise<any[]> {
    // Récupérer le premier admin
    const admin = await prisma.user.findFirst({
      where: { role: Role.ADMIN }
    });

    if (!admin) {
      throw new Error("Aucun administrateur trouvé pour assigner les messages de démonstration");
    }

    const messages = [];

    for (let i = 0; i < count; i++) {
      const user = DemoUtils.getRandomElement(users);
      const messageData = DemoUtils.getRandomElement(DEMO_CONFIG.MESSAGES);
      const conversationId = DemoUtils.generateConversationId(i);

      const message = await prisma.message.create({
        data: {
          senderId: user.id,
          receiverId: admin.id,
          conversationId,
          subject: messageData.subject,
          content: messageData.content,
          type: "USER_MESSAGE",
          statut: "ENVOYE",
          createdAt: DemoUtils.generateRandomDate(30),
          updatedAt: DemoUtils.generateRandomDate(5),
        }
      });

      messages.push(message);
    }

    return messages;
  }

  /**
   * Génère des notifications de démonstration
   */
  static async generateNotifications(adminId: string, count: number = 10): Promise<any[]> {
    const notifications = [];

    for (let i = 0; i < count; i++) {
      const notifTemplate = DemoUtils.getRandomElement(DEMO_CONFIG.NOTIFICATION_TYPES);

      const notification = await prisma.notification.create({
        data: {
          userId: adminId,
          title: notifTemplate.title,
          message: notifTemplate.message.replace("{user}", "Utilisateur Demo").replace("{numero}", `DEMO-2025-${i + 1}`).replace("{titre}", "Manuscrit Demo"),
          type: notifTemplate.type as any,
          isRead: Math.random() > 0.6, // 40% non lues
          createdAt: DemoUtils.generateRandomDate(7),
        }
      });

      notifications.push(notification);
    }

    return notifications;
  }
}

export default DemoService;