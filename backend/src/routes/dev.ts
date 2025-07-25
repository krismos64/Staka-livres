import { Router } from "express";
import { PrismaClient, Role, NotificationType, NotificationPriority, StatutCommande, Priorite } from "@prisma/client";
import bcrypt from "bcryptjs";

const router = Router();
const prisma = new PrismaClient();

/**
 * Route pour créer des données de test pour l'administration
 * POST /dev/seed-admin-test-data
 */
router.post("/seed-admin-test-data", async (req, res) => {
  try {
    const { users, orders, generateStatistics } = req.body;

    // Créer les utilisateurs de test
    const createdUsers = [];
    if (users && Array.isArray(users)) {
      for (const userData of users) {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (!existingUser) {
          const hashedPassword = await bcrypt.hash("password123", 10);
          const user = await prisma.user.create({
            data: {
              prenom: userData.prenom,
              nom: userData.nom,
              email: userData.email,
              password: hashedPassword,
              role: userData.role as Role,
              isActive: userData.status === "active"
            }
          });
          createdUsers.push(user);
        } else {
          createdUsers.push(existingUser);
        }
      }
    }

    // Créer les commandes de test
    const createdOrders = [];
    if (orders && Array.isArray(orders)) {
      for (const orderData of orders) {
        // Trouver l'utilisateur client
        const client = createdUsers.find(u => u.email === orderData.client);
        
        if (client) {
          const order = await prisma.commande.create({
            data: {
              titre: orderData.title,
              description: `Description pour ${orderData.title}`,
              amount: orderData.amount,
              statut: orderData.status as StatutCommande,
              priorite: orderData.priority as Priorite,
              userId: client.id,
              dateEcheance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
            }
          });
          createdOrders.push(order);
        }
      }
    }

    // Générer des statistiques de base si demandé
    if (generateStatistics) {
      // Créer quelques notifications de test avec un utilisateur admin
      const adminUser = await prisma.user.findFirst({
        where: { role: Role.ADMIN }
      });

      if (adminUser) {
        await prisma.notification.createMany({
          data: [
            {
              userId: adminUser.id,
              title: "Nouvelle commande reçue",
              message: "Une nouvelle commande a été créée dans le système",
              type: NotificationType.ORDER,
              priority: NotificationPriority.NORMALE,
              actionUrl: "/admin/commandes"
            },
            {
              userId: adminUser.id,
              title: "Paiement traité",
              message: "Un paiement a été traité avec succès",
              type: NotificationType.PAYMENT,
              priority: NotificationPriority.HAUTE,
              actionUrl: "/admin/factures"
            }
          ]
        });
      }
    }

    res.json({
      success: true,
      message: "Données de test admin créées avec succès",
      data: {
        usersCreated: createdUsers.length,
        ordersCreated: createdOrders.length,
        statisticsGenerated: generateStatistics
      }
    });

  } catch (error) {
    console.error("Erreur lors de la création des données de test admin:", error);
    res.status(500).json({
      error: "Erreur lors de la création des données de test",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

/**
 * Route pour simuler de nouvelles activités
 * POST /dev/simulate-new-activity
 */
router.post("/simulate-new-activity", async (req, res) => {
  try {
    const { newUsers = 0, newOrders = 0, newRevenue = 0 } = req.body;

    const simulatedData = {
      usersAdded: 0,
      ordersAdded: 0,
      revenueAdded: newRevenue,
      timestamp: new Date()
    };

    // Simuler de nouveaux utilisateurs
    if (newUsers > 0) {
      for (let i = 0; i < newUsers; i++) {
        const randomNum = Math.floor(Math.random() * 10000);
        const hashedPassword = await bcrypt.hash("password123", 10);
        
        await prisma.user.create({
          data: {
            prenom: `User${randomNum}`,
            nom: `Test${randomNum}`,
            email: `user${randomNum}@test.com`,
            password: hashedPassword,
            role: Role.USER
          }
        });
        simulatedData.usersAdded++;
      }
    }

    // Simuler de nouvelles commandes
    if (newOrders > 0) {
      // Récupérer des utilisateurs existants
      const users = await prisma.user.findMany({
        where: { role: Role.USER },
        take: 10
      });

      if (users.length > 0) {
        for (let i = 0; i < newOrders; i++) {
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const randomAmount = Math.floor(Math.random() * 500) + 100;
          
          await prisma.commande.create({
            data: {
              titre: `Commande simulée ${Date.now()}-${i}`,
              description: "Commande générée pour simulation d'activité",
              amount: randomAmount,
              statut: StatutCommande.EN_ATTENTE,
              priorite: Priorite.NORMALE,
              userId: randomUser.id,
              dateEcheance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          });
          simulatedData.ordersAdded++;
        }
      }
    }

    res.json({
      success: true,
      message: "Nouvelle activité simulée avec succès",
      data: simulatedData
    });

  } catch (error) {
    console.error("Erreur lors de la simulation d'activité:", error);
    res.status(500).json({
      error: "Erreur lors de la simulation d'activité",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

/**
 * Route pour nettoyer les données de test admin
 * DELETE /dev/cleanup-admin-test-data
 */
router.delete("/cleanup-admin-test-data", async (_req, res) => {
  try {
    // Supprimer les données de test (basées sur des patterns de test)
    
    // Supprimer les commandes de test
    const deletedOrders = await prisma.commande.deleteMany({
      where: {
        OR: [
          { titre: { contains: "Test" } },
          { titre: { contains: "Correction Roman Fantasy" } },
          { titre: { contains: "Relecture Mémoire" } },
          { titre: { contains: "Correction Nouvelle" } },
          { titre: { contains: "simulée" } },
          { description: { contains: "simulation d'activité" } }
        ]
      }
    });

    // Supprimer les utilisateurs de test
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: "@test.com" } },
          { prenom: { startsWith: "User" } },
          { nom: { startsWith: "Test" } }
        ]
      }
    });

    // Supprimer les notifications de test
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        OR: [
          { message: { contains: "test" } },
          { message: { contains: "simulation" } }
        ]
      }
    });

    res.json({
      success: true,
      message: "Données de test admin nettoyées avec succès",
      data: {
        ordersDeleted: deletedOrders.count,
        usersDeleted: deletedUsers.count,
        notificationsDeleted: deletedNotifications.count
      }
    });

  } catch (error) {
    console.error("Erreur lors du nettoyage des données de test:", error);
    res.status(500).json({
      error: "Erreur lors du nettoyage des données de test",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

/**
 * Route pour réinitialiser la base de données de test
 * POST /dev/reset-database
 */
router.post("/reset-database", async (_req, res) => {
  try {
    // ATTENTION: Cette route est dangereuse et ne devrait être utilisée qu'en développement
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        error: "Cette route n'est pas disponible en production"
      });
    }

    // Supprimer toutes les données dans l'ordre pour respecter les contraintes FK
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.message.deleteMany();
    await prisma.commande.deleteMany();
    await prisma.user.deleteMany();

    // Créer un utilisateur admin par défaut
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await prisma.user.create({
      data: {
        prenom: "Admin",
        nom: "System",
        email: "admin@staka-livres.fr",
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: "Base de données réinitialisée avec succès",
      data: {
        adminCreated: adminUser.email
      }
    });

  } catch (error) {
    console.error("Erreur lors de la réinitialisation de la base:", error);
    res.status(500).json({
      error: "Erreur lors de la réinitialisation de la base de données",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

export default router;