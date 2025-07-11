import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Données mockées pour les tests (en attendant la connexion DB)
const mockUsers = [
  {
    id: "f58c46b9-9adb-421d-901e-b2da68e27156",
    prenom: "Admin",
    nom: "Staka",
    email: "admin@staka-editions.com",
    role: "ADMIN",
    isActive: true,
    createdAt: new Date("2025-06-24T12:47:04.242Z"),
    updatedAt: new Date("2025-06-24T12:47:04.242Z"),
  },
  {
    id: "24b25286-c4ce-4027-89e3-ebd1ae397c7c",
    prenom: "Test",
    nom: "User",
    email: "test@example.com",
    role: "USER",
    isActive: true,
    createdAt: new Date("2025-06-24T12:59:17.975Z"),
    updatedAt: new Date("2025-06-24T12:59:17.975Z"),
  },
  {
    id: "042b479c-734c-4e8a-afa1-3a0b9773ee90",
    prenom: "Jean",
    nom: "Dupont",
    email: "user@example.com",
    role: "USER",
    isActive: true,
    createdAt: new Date("2025-06-24T12:47:04.266Z"),
    updatedAt: new Date("2025-06-24T12:47:04.266Z"),
  },
];

// Récupérer tous les utilisateurs (sans mots de passe)
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log(
      `🔍 [ADMIN] ${req.user?.email} récupère la liste des utilisateurs`
    );

    // Essayer d'abord Prisma, sinon utiliser les données mockées
    let users;
    try {
      users = await prisma.user.findMany({
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      console.log(
        `✅ [ADMIN] ${users.length} utilisateurs récupérés depuis la DB`
      );
    } catch (dbError) {
      console.log(
        `⚠️ [ADMIN] DB non accessible, utilisation des données mockées`
      );
      users = [...mockUsers].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    }

    res.status(200).json({
      message: "Liste des utilisateurs récupérée",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(
      "❌ [ADMIN] Erreur lors de la récupération des utilisateurs:",
      error
    );
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer la liste des utilisateurs",
    });
  }
};

// Récupérer un utilisateur spécifique par ID
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: "ID utilisateur requis",
        message: "Veuillez fournir un ID utilisateur valide",
      });
      return;
    }

    console.log(`🔍 [ADMIN] ${req.user?.email} récupère l'utilisateur ${id}`);

    // Essayer d'abord Prisma, sinon utiliser les données mockées
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (dbError) {
      console.log(
        `⚠️ [ADMIN] DB non accessible, recherche dans les données mockées`
      );
      user = mockUsers.find((u) => u.id === id);
    }

    if (!user) {
      res.status(404).json({
        error: "Utilisateur introuvable",
        message: `Aucun utilisateur trouvé avec l'ID ${id}`,
      });
      return;
    }

    console.log(`✅ [ADMIN] Utilisateur ${user.email} récupéré`);

    res.status(200).json({
      message: "Utilisateur récupéré",
      user,
    });
  } catch (error) {
    console.error(
      "❌ [ADMIN] Erreur lors de la récupération de l'utilisateur:",
      error
    );
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer l'utilisateur",
    });
  }
};

// Statistiques des utilisateurs pour le dashboard admin
export const getUserStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log(
      `📊 [ADMIN] ${req.user?.email} récupère les statistiques utilisateurs`
    );

    // Essayer d'abord Prisma, sinon utiliser les données mockées
    let stats;
    try {
      const [totalUsers, activeUsers, adminUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: "ADMIN" } }),
      ]);

      // Utilisateurs créés dans les 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      stats = {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
        recentUsers,
      };
    } catch (dbError) {
      console.log(
        `⚠️ [ADMIN] DB non accessible, calcul sur les données mockées`
      );
      const totalUsers = mockUsers.length;
      const activeUsers = mockUsers.filter((u) => u.isActive).length;
      const adminUsers = mockUsers.filter((u) => u.role === "ADMIN").length;

      // Utilisateurs créés dans les 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsers = mockUsers.filter(
        (u) => u.createdAt >= thirtyDaysAgo
      ).length;

      stats = {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
        recentUsers,
      };
    }

    console.log(
      `✅ [ADMIN] Statistiques calculées: ${stats.totalUsers} utilisateurs total`
    );

    res.status(200).json({
      message: "Statistiques des utilisateurs",
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [ADMIN] Erreur lors du calcul des statistiques:", error);
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de calculer les statistiques",
    });
  }
};
