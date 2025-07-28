import { PrismaClient, Role } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

/**
 * Contrôleur pour la gestion du mode démonstration
 * Génère et gère des vraies données fictives en base de données
 * 
 * Développé par Christophe Mostefaoui - 27 Juillet 2025
 * Production déployée sur livrestaka.fr
 */

// Enums pour les statuts
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

// Données de référence pour la génération
const DEMO_USERS_DATA = [
  { prenom: "Marie", nom: "Dubois", email: "marie.dubois@demo.staka.fr" },
  { prenom: "Pierre", nom: "Martin", email: "pierre.martin@demo.staka.fr" },
  { prenom: "Sophie", nom: "Laurent", email: "sophie.laurent@demo.staka.fr" },
  { prenom: "Jean", nom: "Dupont", email: "jean.dupont@demo.staka.fr" },
  { prenom: "Anne", nom: "Moreau", email: "anne.moreau@demo.staka.fr" },
  { prenom: "François", nom: "Leclerc", email: "francois.leclerc@demo.staka.fr" },
];

const DEMO_BOOK_TITLES = [
  "Les Mystères de la Forêt Enchantée",
  "Voyage au Cœur de l'Imaginaire", 
  "Mémoires d'un Entrepreneur",
  "Guide Pratique du Jardinage Bio",
  "L'Art de la Négociation",
  "Histoire de France Moderne",
  "Recettes de Grand-Mère",
  "Philosophie et Modernité",
];

const DEMO_DESCRIPTIONS = [
  "Roman fantasy captivant mêlant aventure et magie",
  "Récit autobiographique touchant sur l'entrepreneuriat",
  "Guide complet pour débuter en jardinage écologique", 
  "Techniques avancées de négociation en entreprise",
  "Analyse historique de la période moderne française",
  "Collection de recettes traditionnelles familiales",
  "Réflexions philosophiques sur notre époque",
  "Témoignages du quotidien avec humour et sensibilité",
];

// Utilitaires
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const generateRandomDate = (daysAgo: number): Date => {
  const now = new Date();
  const randomTime = now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000;
  return new Date(randomTime);
};

const generateRandomPrice = (): number => {
  const prices = [39900, 49900, 59900, 79900, 99900, 119900];
  return getRandomElement(prices);
};

/**
 * Supprime toutes les données de démonstration
 */
const cleanupDemoData = async () => {
  const counts = {
    users: 0,
    commandes: 0, 
    factures: 0,
    messages: 0,
    notifications: 0,
  };

  try {
    // Compter avant suppression
    counts.users = await prisma.user.count({
      where: { email: { endsWith: "@demo.staka.fr" } }
    });
    
    // Supprimer les données dans l'ordre des dépendances
    await prisma.message.deleteMany({
      where: { conversationId: { startsWith: "demo-conv-" } }
    });
    
    // Note: selon votre schéma, ajustez les suppressions
    await prisma.user.deleteMany({
      where: { email: { endsWith: "@demo.staka.fr" } }
    });
    
    console.log(`🧹 Nettoyage: ${counts.users} utilisateurs démo supprimés`);
    
  } catch (error) {
    console.error("Erreur lors du nettoyage:", error);
  }
  
  return counts;
};

/**
 * Génère des utilisateurs de démonstration
 */
const generateDemoUsers = async () => {
  const users = [];
  
  for (const userData of DEMO_USERS_DATA) {
    try {
      const user = await prisma.user.create({
        data: {
          prenom: userData.prenom,
          nom: userData.nom,
          email: userData.email,
          password: "$2b$10$demopasswordhash.pour.demo.uniquement",
          role: Role.USER,
          isActive: Math.random() > 0.2, // 80% actifs
          createdAt: generateRandomDate(60),
          updatedAt: generateRandomDate(5),
        }
      });
      users.push(user);
    } catch (error) {
      console.log(`⚠️ Utilisateur ${userData.email} existe déjà ou erreur:`, (error as Error).message);
    }
  }
  
  return users;
};

/**
 * Génère des commandes de démonstration
 */
const generateDemoCommandes = async (users: any[]) => {
  const commandes = [];
  
  for (let i = 0; i < 10; i++) {
    const user = getRandomElement(users);
    const statut = getRandomElement(Object.values(StatutCommande));
    const titre = getRandomElement(DEMO_BOOK_TITLES);
    const description = getRandomElement(DEMO_DESCRIPTIONS);
    
    try {
      const commande = await prisma.commande.create({
        data: {
          userId: user.id,
          titre,
          description,
          statut: statut as any,
          amount: generateRandomPrice(),
          priorite: "NORMALE" as any,
          createdAt: generateRandomDate(45),
          updatedAt: generateRandomDate(3),
        }
      });
      commandes.push(commande);
    } catch (error) {
      console.log(`⚠️ Erreur création commande ${i}:`, (error as Error).message);
    }
  }
  
  return commandes;
};

/**
 * Génère des messages de démonstration
 */
const generateDemoMessages = async (users: any[]) => {
  const admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN }
  });
  
  if (!admin) return [];
  
  const messages = [];
  const subjects = [
    "Question sur ma commande",
    "Demande de devis", 
    "Problème technique",
    "Compliments sur le service",
  ];
  
  for (let i = 0; i < 8; i++) {
    const user = getRandomElement(users);
    
    try {
      const message = await prisma.message.create({
        data: {
          senderId: user.id,
          receiverId: admin.id,
          conversationId: `demo-conv-${i + 1}`,
          subject: getRandomElement(subjects),
          content: `Message de démonstration ${i + 1} de ${user.prenom}`,
          type: "USER_MESSAGE",
          statut: "ENVOYE",
          createdAt: generateRandomDate(30),
        }
      });
      messages.push(message);
    } catch (error) {
      console.log(`⚠️ Erreur création message ${i}:`, (error as Error).message);
    }
  }
  
  return messages;
};

/**
 * POST /api/admin/demo/refresh
 * Rafraîchit les données de démonstration
 */
export const refreshDemoData = async (req: Request, res: Response) => {
  try {
    console.log("🎭 [DEMO] Début du rafraîchissement des données de démonstration");
    
    // Vérifier que l'utilisateur est admin
    if (!req.user || req.user.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé - Administrateurs uniquement"
      });
    }
    
    // 1. Nettoyer les anciennes données de démo
    console.log("🧹 Nettoyage des anciennes données...");
    const cleanupCounts = await cleanupDemoData();
    
    // 2. Générer de nouvelles données
    console.log("🎲 Génération de nouvelles données...");
    
    const users = await generateDemoUsers();
    console.log(`✅ ${users.length} utilisateurs de démo créés`);
    
    const commandes = await generateDemoCommandes(users);
    console.log(`✅ ${commandes.length} commandes de démo créées`);
    
    const messages = await generateDemoMessages(users);
    console.log(`✅ ${messages.length} messages de démo créés`);
    
    console.log("🎭 [DEMO] Rafraîchissement terminé avec succès");
    
    res.status(200).json({
      success: true,
      message: "Données de démonstration rafraîchies avec succès",
      data: {
        supprimees: cleanupCounts,
        creees: {
          users: users.length,
          commandes: commandes.length,
          factures: 0, // Pour l'instant
          messages: messages.length,
          notifications: 0, // Pour l'instant
        }
      }
    });
    
  } catch (error) {
    console.error("❌ [DEMO] Erreur lors du rafraîchissement:", error);
    
    res.status(500).json({
      success: false,
      error: "Erreur lors du rafraîchissement des données de démonstration",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    });
  }
};

/**
 * POST /api/admin/demo/reset
 * Remet les données de démonstration à l'état initial
 */
export const resetDemoData = async (req: Request, res: Response) => {
  try {
    console.log("🔄 [DEMO] Début de la réinitialisation des données de démonstration");
    
    // Vérifier que l'utilisateur est admin
    if (!req.user || req.user.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé - Administrateurs uniquement"
      });
    }
    
    // 1. Nettoyer toutes les données de démo
    console.log("🧹 Suppression de toutes les données de démonstration...");
    const cleanupCounts = await cleanupDemoData();
    
    // 2. Générer un jeu de données initial plus petit
    console.log("🎯 Génération du jeu de données initial...");
    
    const users = await generateDemoUsers();
    const commandes = await generateDemoCommandes(users.slice(0, 4)); // Moins de commandes
    const messages = await generateDemoMessages(users.slice(0, 3)); // Moins de messages
    
    console.log("🔄 [DEMO] Réinitialisation terminée avec succès");
    
    res.status(200).json({
      success: true,
      message: "Données de démonstration réinitialisées à l'état initial",
      data: {
        supprimees: cleanupCounts,
        initiales: {
          users: users.length,
          commandes: commandes.length,
          factures: 0,
          messages: messages.length,
          notifications: 0,
        }
      }
    });
    
  } catch (error) {
    console.error("❌ [DEMO] Erreur lors de la réinitialisation:", error);
    
    res.status(500).json({
      success: false,
      error: "Erreur lors de la réinitialisation des données de démonstration",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    });
  }
};

/**
 * GET /api/admin/demo/status
 * Retourne le statut des données de démonstration
 */
export const getDemoStatus = async (req: Request, res: Response) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user || req.user.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé - Administrateurs uniquement"
      });
    }
    
    // Compter les vraies données de démo en base
    const demoUsersCount = await prisma.user.count({
      where: { email: { endsWith: "@demo.staka.fr" } }
    });
    
    const demoMessagesCount = await prisma.message.count({
      where: { conversationId: { startsWith: "demo-conv-" } }
    });
    
    // Compter les commandes des utilisateurs démo
    const demoUsers = await prisma.user.findMany({
      where: { email: { endsWith: "@demo.staka.fr" } },
      select: { id: true }
    });
    
    const demoCommandesCount = demoUsers.length > 0 ? await prisma.commande.count({
      where: { userId: { in: demoUsers.map(u => u.id) } }
    }) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        demoDataExists: demoUsersCount > 0,
        counts: {
          users: demoUsersCount,
          commandes: demoCommandesCount,
          factures: 0, // À implémenter
          messages: demoMessagesCount,
          notifications: 0, // À implémenter
        },
        lastUpdate: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error("❌ [DEMO] Erreur lors de la vérification du statut:", error);
    
    res.status(500).json({
      success: false,
      error: "Erreur lors de la vérification du statut des données de démonstration"
    });
  }
};