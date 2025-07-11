import { PrismaClient, StatutCommande } from "@prisma/client";

// Instance par défaut de Prisma
const defaultPrisma = new PrismaClient();

export interface Project {
  id: string;
  title: string;
  status: StatutCommande;
  updatedAt: Date;
}

/**
 * Model pour la gestion des projets (basé sur les commandes)
 */
export class ProjectModel {
  /**
   * Récupère les projets d'un utilisateur filtré par statut avec limit
   * @param userId - ID de l'utilisateur
   * @param status - Statut des projets (default: 'EN_COURS' = active)
   * @param limit - Nombre maximum de projets à retourner (1-20)
   * @param prisma - Instance Prisma optionnelle
   */
  static async findByUserAndStatus(
    userId: string,
    status: StatutCommande = StatutCommande.EN_COURS,
    limit: number = 3,
    prisma: PrismaClient = defaultPrisma
  ): Promise<Project[]> {
    // Validation des paramètres
    if (!userId) {
      throw new Error("userId est requis");
    }

    if (limit < 1 || limit > 20) {
      throw new Error("limit doit être entre 1 et 20");
    }

    // Validation du statut
    const validStatuts = Object.values(StatutCommande);
    if (!validStatuts.includes(status)) {
      throw new Error(
        `Statut invalide. Valeurs autorisées: ${validStatuts.join(", ")}`
      );
    }

    // Requête sécurisée avec Prisma (protection anti-SQL injection)
    const commandes = await prisma.commande.findMany({
      where: {
        userId,
        statut: status,
      },
      select: {
        id: true,
        titre: true,
        statut: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
    });

    // Mappage vers l'interface Project
    return commandes.map((commande) => ({
      id: commande.id,
      title: commande.titre,
      status: commande.statut,
      updatedAt: commande.updatedAt,
    }));
  }

  /**
   * Récupère tous les projets d'un utilisateur (sans filtre de statut)
   * @param userId - ID de l'utilisateur
   * @param limit - Nombre maximum de projets à retourner
   * @param prisma - Instance Prisma optionnelle
   */
  static async findByUser(
    userId: string,
    limit: number = 10,
    prisma: PrismaClient = defaultPrisma
  ): Promise<Project[]> {
    if (!userId) {
      throw new Error("userId est requis");
    }

    if (limit < 1 || limit > 20) {
      throw new Error("limit doit être entre 1 et 20");
    }

    const commandes = await prisma.commande.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        titre: true,
        statut: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
    });

    return commandes.map((commande) => ({
      id: commande.id,
      title: commande.titre,
      status: commande.statut,
      updatedAt: commande.updatedAt,
    }));
  }
}