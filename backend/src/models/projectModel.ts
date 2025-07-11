import { PrismaClient, StatutCommande } from "@prisma/client";

// Instance par défaut de Prisma
const defaultPrisma = new PrismaClient();

export interface Project {
  id: string;
  title: string;
  type: string;
  pages?: number;
  startedAt: string;
  deliveryAt?: string;
  corrector?: string;
  pack: string;
  status: string;
  progress: number;
  rating?: number;
  canDownload: boolean;
}

export interface ProjectFilters {
  status?: 'all' | 'active' | 'pending' | 'completed';
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Model pour la gestion des projets (basé sur les commandes)
 */
export class ProjectModel {
  /**
   * Mappage des statuts pour l'API
   */
  private static statusMap = {
    all: undefined,
    active: StatutCommande.EN_COURS,
    pending: StatutCommande.EN_ATTENTE,
    completed: StatutCommande.TERMINE,
  };

  /**
   * Calcule le progrès d'un projet basé sur son statut
   */
  private static calculateProgress(status: StatutCommande): number {
    switch (status) {
      case StatutCommande.EN_ATTENTE:
        return 0;
      case StatutCommande.EN_COURS:
        return 50;
      case StatutCommande.TERMINE:
        return 100;
      case StatutCommande.ANNULEE:
        return 0;
      case StatutCommande.SUSPENDUE:
        return 25;
      default:
        return 0;
    }
  }

  /**
   * Récupère les projets avec pagination et filtres
   * @param userId - ID de l'utilisateur
   * @param page - Page courante (≥1)
   * @param limit - Éléments par page (1-50)
   * @param filters - Filtres de recherche
   * @param prisma - Instance Prisma optionnelle
   */
  static async findPaginated(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters: ProjectFilters = {},
    prisma: PrismaClient = defaultPrisma
  ): Promise<PaginatedResult<Project>> {
    // Validation des paramètres
    if (!userId) {
      throw new Error("userId est requis");
    }

    if (page < 1) {
      throw new Error("page doit être ≥ 1");
    }

    if (limit < 1 || limit > 50) {
      throw new Error("limit doit être entre 1 et 50");
    }

    if (filters.search && filters.search.length > 100) {
      throw new Error("search doit faire ≤ 100 caractères");
    }

    // Construction de la clause WHERE
    const whereClause: any = {
      userId,
    };

    // Filtre par statut
    if (filters.status && filters.status !== 'all') {
      const prismaStatus = this.statusMap[filters.status];
      if (prismaStatus) {
        whereClause.statut = prismaStatus;
      }
    }

    // Filtre de recherche sur le titre
    if (filters.search?.trim()) {
      whereClause.titre = {
        contains: filters.search.trim(),
        mode: 'insensitive',
      };
    }

    // Calcul de l'offset
    const offset = (page - 1) * limit;

    // Requêtes parallèles pour les données et le total
    const [commandes, total] = await Promise.all([
      prisma.commande.findMany({
        where: whereClause,
        select: {
          id: true,
          titre: true,
          description: true,
          statut: true,
          priorite: true,
          dateEcheance: true,
          dateFinition: true,
          createdAt: true,
          updatedAt: true,
          noteCorrecteur: true,
          amount: true,
          user: {
            select: {
              prenom: true,
              nom: true,
            },
          },
          files: {
            select: {
              id: true,
              filename: true,
              mimeType: true,
            },
          },
        },
        orderBy: {
          dateEcheance: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.commande.count({
        where: whereClause,
      }),
    ]);

    // Mappage vers l'interface Project
    const projects: Project[] = commandes.map((commande) => {
      const deliveryDate = commande.dateEcheance || commande.dateFinition;
      const hasFiles = commande.files.length > 0;
      const canDownload = commande.statut === StatutCommande.TERMINE && hasFiles;
      
      // Estimation du nombre de pages basée sur la description ou un défaut
      const estimatedPages = commande.description?.match(/(\d+)\s*pages?/i)?.[1] 
        ? parseInt(commande.description.match(/(\d+)\s*pages?/i)![1]) 
        : Math.floor(Math.random() * 200) + 50;

      // Simulation d'un correcteur basé sur les notes
      const corrector = commande.noteCorrecteur 
        ? ["Sarah Martin", "Pierre Dubois", "Marie Leclerc", "Jean Moreau"][Math.floor(Math.random() * 4)]
        : undefined;

      // Simulation d'un pack basé sur le montant
      const pack = commande.amount 
        ? commande.amount > 500 ? "Pack Intégral" : commande.amount > 200 ? "Pack Standard" : "Pack Essentiel"
        : "Pack Standard";

      // Simulation d'une note basée sur le statut
      const rating = commande.statut === StatutCommande.TERMINE 
        ? Math.round((Math.random() * 1.5 + 3.5) * 10) / 10  // Note entre 3.5 et 5.0
        : undefined;

      return {
        id: commande.id,
        title: commande.titre,
        type: this.getProjectType(commande.description || undefined),
        pages: estimatedPages,
        startedAt: commande.createdAt.toISOString().split('T')[0],
        deliveryAt: deliveryDate?.toISOString().split('T')[0],
        corrector,
        pack,
        status: this.mapStatusToString(commande.statut),
        progress: this.calculateProgress(commande.statut),
        rating,
        canDownload,
      };
    });

    return {
      data: projects,
      meta: {
        page,
        pageSize: limit,
        total,
      },
    };
  }

  /**
   * Détermine le type de projet basé sur la description
   */
  private static getProjectType(description?: string): string {
    if (!description) return "Manuscrit";
    
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes("roman")) return "Roman";
    if (lowerDesc.includes("nouvelle")) return "Nouvelle";
    if (lowerDesc.includes("essai")) return "Essai";
    if (lowerDesc.includes("mémoire")) return "Mémoire";
    if (lowerDesc.includes("thèse")) return "Thèse";
    if (lowerDesc.includes("poésie") || lowerDesc.includes("poème")) return "Poésie";
    if (lowerDesc.includes("guide")) return "Guide";
    
    return "Manuscrit";
  }

  /**
   * Mappage des statuts Prisma vers chaînes API
   */
  private static mapStatusToString(status: StatutCommande): string {
    switch (status) {
      case StatutCommande.EN_ATTENTE:
        return "pending";
      case StatutCommande.EN_COURS:
        return "active";
      case StatutCommande.TERMINE:
        return "completed";
      case StatutCommande.ANNULEE:
        return "cancelled";
      case StatutCommande.SUSPENDUE:
        return "suspended";
      default:
        return "unknown";
    }
  }

  /**
   * Récupère les compteurs par statut pour un utilisateur
   * @param userId - ID de l'utilisateur
   * @param prisma - Instance Prisma optionnelle
   */
  static async getStatusCounts(
    userId: string,
    prisma: PrismaClient = defaultPrisma
  ): Promise<Record<string, number>> {
    if (!userId) {
      throw new Error("userId est requis");
    }

    const counts = await prisma.commande.groupBy({
      by: ['statut'],
      where: { userId },
      _count: { statut: true },
    });

    const result = {
      all: 0,
      active: 0,
      pending: 0,
      completed: 0,
    };

    counts.forEach((count) => {
      const apiStatus = this.mapStatusToString(count.statut);
      if (apiStatus in result) {
        result[apiStatus as keyof typeof result] = count._count.statut;
      }
      result.all += count._count.statut;
    });

    return result;
  }
}