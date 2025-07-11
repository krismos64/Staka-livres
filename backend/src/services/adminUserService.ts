import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export interface CreateUserData {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  role: Role;
  isActive?: boolean;
  adresse?: string;
  telephone?: string;
}

export interface UpdateUserData {
  prenom?: string;
  nom?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
  adresse?: string;
  telephone?: string;
}

export interface UserFilters {
  search?: string;
  role?: Role;
  isActive?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface PaginatedUsers {
  users: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AdminUserService {
  // Récupération des utilisateurs avec pagination et filtres
  static async getUsers(
    filters: UserFilters = {},
    pagination: PaginationOptions = {
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortDirection: "desc",
    }
  ): Promise<PaginatedUsers> {
    const { search, role, isActive } = filters;
    const {
      page,
      limit,
      sortBy = "createdAt",
      sortDirection = "desc",
    } = pagination;

    // Construction des conditions de recherche
    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        { prenom: { contains: search } },
        { nom: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      whereConditions.role = role;
    }

    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    // Validation simple pour les clés de tri
    const allowedSortKeys = [
      "id",
      "prenom",
      "nom",
      "email",
      "role",
      "isActive",
      "createdAt",
      "updatedAt",
    ];
    const sortKey = allowedSortKeys.includes(sortBy) ? sortBy : "createdAt";

    console.log("🔍 [ADMIN_USER_SERVICE] Tri demandé:", {
      sortBy,
      sortDirection,
      sortKey,
    });

    // Calcul de l'offset
    const skip = (page - 1) * limit;

    // Récupération des utilisateurs et du total
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          adresse: true,
          telephone: true,
          avatar: true,
        },
        orderBy: {
          [sortKey]: sortDirection,
        },
        skip,
        take: limit,
      }),
      prisma.user.count({
        where: whereConditions,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Récupération d'un utilisateur par ID
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
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
        adresse: true,
        telephone: true,
        avatar: true,
        _count: {
          select: {
            commandes: true,
            sentMessages: true,
            receivedMessages: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`Utilisateur avec l'ID ${id} introuvable`);
    }

    return user;
  }

  // Création d'un utilisateur
  static async createUser(userData: CreateUserData) {
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error(
        `Un utilisateur avec l'email ${userData.email} existe déjà`
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        isActive: userData.isActive ?? true,
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        adresse: true,
        telephone: true,
        avatar: true,
      },
    });

    return user;
  }

  // Mise à jour d'un utilisateur
  static async updateUser(id: string, updateData: UpdateUserData) {
    // Vérifications avant mise à jour
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error(`Utilisateur avec l'ID ${id} introuvable`);
    }

    // Vérifier l'unicité de l'email si modifié
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (emailExists) {
        throw new Error(
          `Un utilisateur avec l'email ${updateData.email} existe déjà`
        );
      }
    }

    // Empêcher la désactivation du dernier admin
    if (updateData.isActive === false && existingUser.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });

      if (adminCount <= 1) {
        throw new Error("Impossible de désactiver le dernier administrateur");
      }
    }

    // Empêcher la suppression du rôle admin du dernier admin
    if (updateData.role === Role.USER && existingUser.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });

      if (adminCount <= 1) {
        throw new Error(
          "Impossible de retirer le rôle admin du dernier administrateur"
        );
      }
    }

    // Mise à jour
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        adresse: true,
        telephone: true,
        avatar: true,
      },
    });

    return updatedUser;
  }

  // Suppression RGPD complète d'un utilisateur
  static async deleteUser(id: string) {
    // Vérifications avant suppression
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            commandes: true,
            sentMessages: true,
            receivedMessages: true,
            notifications: true,
            files: true,
          },
        },
      },
    });

    if (!existingUser) {
      throw new Error(`Utilisateur avec l'ID ${id} introuvable`);
    }

    // Empêcher la suppression du dernier admin
    if (existingUser.role === Role.ADMIN && existingUser.isActive) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });

      if (adminCount <= 1) {
        throw new Error(
          "Impossible de supprimer le dernier administrateur actif"
        );
      }
    }

    // Suppression RGPD complète dans une transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer les fichiers associés
      await tx.file.deleteMany({
        where: { uploadedById: id },
      });

      // Supprimer les notifications
      await tx.notification.deleteMany({
        where: { userId: id },
      });

      // Supprimer les messages envoyés et reçus
      await tx.message.deleteMany({
        where: {
          OR: [{ senderId: id }, { receiverId: id }],
        },
      });

      // Supprimer les commandes et leurs relations
      await tx.commande.deleteMany({
        where: { userId: id },
      });

      // Supprimer les moyens de paiement
      await tx.paymentMethod.deleteMany({
        where: { userId: id },
      });

      // Supprimer les tickets de support
      await tx.supportRequest.deleteMany({
        where: { userId: id },
      });

      // Finalement, supprimer l'utilisateur
      await tx.user.delete({
        where: { id },
      });
    });

    return { message: "Utilisateur supprimé définitivement (RGPD)" };
  }

  // Statistiques des utilisateurs
  static async getUserStats() {
    const [totalUsers, activeUsers, adminUsers, recentUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: Role.ADMIN } }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
            },
          },
        }),
      ]);

    return {
      total: totalUsers,
      actifs: activeUsers,
      inactifs: totalUsers - activeUsers,
      admin: adminUsers,
      users: totalUsers - adminUsers,
      recents: recentUsers,
    };
  }

  // Activation/désactivation rapide
  static async toggleUserStatus(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error(`Utilisateur avec l'ID ${id} introuvable`);
    }

    // Vérifications pour les admins
    if (user.role === Role.ADMIN && user.isActive) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });

      if (adminCount <= 1) {
        throw new Error("Impossible de désactiver le dernier administrateur");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
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

    return updatedUser;
  }

  // Soft delete (alternative à la suppression RGPD)
  static async softDeleteUser(id: string) {
    const user = await this.updateUser(id, { isActive: false });
    return { message: "Utilisateur désactivé", user };
  }
}
