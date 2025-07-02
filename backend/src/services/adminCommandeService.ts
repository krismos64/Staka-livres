import { PrismaClient, StatutCommande } from "@prisma/client";

// Instance par défaut de Prisma
const defaultPrisma = new PrismaClient();

export interface CommandeFilters {
  search?: string;
  statut?: StatutCommande;
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CommandeStats {
  total: number;
  byStatut: Record<StatutCommande, number>;
}

export interface GetCommandesResponse {
  data: any[];
  stats: CommandeStats;
  page: number;
  totalPages: number;
}

/**
 * Service pour la gestion administrative des commandes
 */
export class AdminCommandeService {
  /**
   * Récupère les commandes avec filtres, pagination et statistiques
   */
  static async getCommandes(
    page: number = 1,
    limit: number = 10,
    filters: CommandeFilters = {},
    prisma: PrismaClient = defaultPrisma
  ): Promise<GetCommandesResponse> {
    console.log(`🔍 [DEBUG] getCommandes appelé avec:`, {
      page,
      limit,
      filters,
    });

    const skip = (page - 1) * limit;

    // Construction de la clause WHERE pour les filtres
    const whereClause: any = {};

    // Filtre de recherche sur reference ou email du client
    if (filters.search) {
      console.log(`🔍 [DEBUG] Ajout filtre search: ${filters.search}`);
      whereClause.OR = [
        {
          id: {
            contains: filters.search,
          },
        },
        {
          user: {
            email: {
              contains: filters.search,
            },
          },
        },
      ];
    }

    // Filtre par statut
    if (filters.statut) {
      console.log(`🔍 [DEBUG] Ajout filtre statut: ${filters.statut}`);
      whereClause.statut = filters.statut;
    }

    // Filtre par client ID
    if (filters.clientId) {
      console.log(`🔍 [DEBUG] Ajout filtre clientId: ${filters.clientId}`);
      whereClause.userId = filters.clientId;
    }

    // Filtre par plage de dates
    if (filters.dateFrom || filters.dateTo) {
      console.log(`🔍 [DEBUG] Ajout filtre dates:`, {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
      whereClause.createdAt = {};
      if (filters.dateFrom) {
        whereClause.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereClause.createdAt.lte = filters.dateTo;
      }
    }

    console.log(
      `🔍 [DEBUG] Clause WHERE finale:`,
      JSON.stringify(whereClause, null, 2)
    );
    console.log(
      `🔍 [DEBUG] Paramètres pagination: skip=${skip}, take=${limit}`
    );

    // Requêtes parallèles pour les données et les statistiques
    const [commandes, total, byStatutStats] = await Promise.all([
      // Récupération des commandes paginées
      prisma.commande.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),

      // Comptage total avec les mêmes filtres
      prisma.commande.count({
        where: whereClause,
      }),

      // Statistiques par statut avec les mêmes filtres
      prisma.commande.groupBy({
        by: ["statut"],
        where: whereClause,
        _count: {
          statut: true,
        },
      }),
    ]);

    console.log(`🔍 [DEBUG] Résultats Prisma:`, {
      commandesCount: commandes.length,
      total,
      byStatutStatsCount: byStatutStats.length,
    });

    // Construction de l'objet byStatut avec toutes les valeurs possibles
    const byStatut: Record<StatutCommande, number> = {
      EN_ATTENTE: 0,
      EN_COURS: 0,
      TERMINE: 0,
      ANNULEE: 0,
      SUSPENDUE: 0,
    };

    // Remplissage avec les vraies valeurs
    byStatutStats.forEach((stat) => {
      byStatut[stat.statut] = stat._count.statut;
    });

    const totalPages = Math.ceil(total / limit);

    const result = {
      data: commandes,
      stats: {
        total,
        byStatut,
      },
      page,
      totalPages,
    };

    console.log(`🔍 [DEBUG] Réponse finale:`, {
      dataLength: result.data.length,
      statsTotal: result.stats.total,
      page: result.page,
      totalPages: result.totalPages,
    });

    return result;
  }

  /**
   * Met à jour le statut d'une commande
   */
  static async updateCommandeStatut(
    id: string,
    statut: StatutCommande,
    prisma: PrismaClient = defaultPrisma
  ): Promise<any> {
    // Validation du statut
    const validStatuts = Object.values(StatutCommande);
    if (!validStatuts.includes(statut)) {
      throw new Error(
        `Statut invalide. Valeurs autorisées: ${validStatuts.join(", ")}`
      );
    }

    // Vérification de l'existence de la commande
    const existingCommande = await prisma.commande.findUnique({
      where: { id },
    });

    if (!existingCommande) {
      throw new Error("Commande non trouvée");
    }

    // Mise à jour du statut
    const updatedCommande = await prisma.commande.update({
      where: { id },
      data: {
        statut,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
          },
        },
      },
    });

    return updatedCommande;
  }

  /**
   * Supprime une commande
   */
  static async deleteCommande(
    id: string,
    prisma: PrismaClient = defaultPrisma
  ): Promise<void> {
    // Vérification de l'existence de la commande
    const existingCommande = await prisma.commande.findUnique({
      where: { id },
    });

    if (!existingCommande) {
      throw new Error("Commande non trouvée");
    }

    // Suppression de la commande (cascade automatique via Prisma)
    await prisma.commande.delete({
      where: { id },
    });
  }
}
