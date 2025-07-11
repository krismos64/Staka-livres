import { StatutCommande } from "@prisma/client";
import { ProjectModel, Project } from "../models/projectModel";

export interface ProjectsResponse {
  projects: Project[];
  total: number;
}

/**
 * Service pour la gestion des projets utilisateur
 */
export class ProjectService {
  /**
   * Récupère les projets actifs d'un utilisateur
   * @param userId - ID de l'utilisateur authentifié
   * @param status - Statut des projets (optionnel, default: EN_COURS)
   * @param limit - Nombre maximum de projets (1-20, default: 3)
   */
  static async getUserProjects(
    userId: string,
    status?: string,
    limit: number = 3
  ): Promise<ProjectsResponse> {
    // Validation des paramètres d'entrée
    if (!userId) {
      throw new Error("ID utilisateur requis");
    }

    // Validation et normalisation du limit
    const normalizedLimit = Math.min(Math.max(parseInt(String(limit)) || 3, 1), 20);

    // Détermination du statut (default: active = EN_COURS)
    let projectStatus: StatutCommande;
    
    if (!status || status === "active") {
      projectStatus = StatutCommande.EN_COURS;
    } else {
      // Validation du statut fourni
      const statusMap: Record<string, StatutCommande> = {
        "EN_ATTENTE": StatutCommande.EN_ATTENTE,
        "EN_COURS": StatutCommande.EN_COURS,
        "TERMINE": StatutCommande.TERMINE,
        "ANNULEE": StatutCommande.ANNULEE,
        "SUSPENDUE": StatutCommande.SUSPENDUE,
        "active": StatutCommande.EN_COURS,
      };

      if (!statusMap[status]) {
        throw new Error(
          `Statut invalide. Valeurs autorisées: ${Object.keys(statusMap).join(", ")}`
        );
      }

      projectStatus = statusMap[status];
    }

    try {
      // Récupération des projets via le model
      const projects = await ProjectModel.findByUserAndStatus(
        userId,
        projectStatus,
        normalizedLimit
      );

      return {
        projects,
        total: projects.length,
      };
    } catch (error) {
      // Log de l'erreur (en production, utiliser un logger approprié)
      console.error(`Erreur lors de la récupération des projets pour l'utilisateur ${userId}:`, error);
      
      // Relancer l'erreur pour gestion par le contrôleur
      throw error;
    }
  }

  /**
   * Récupère tous les projets d'un utilisateur (sans filtre de statut)
   * @param userId - ID de l'utilisateur authentifié
   * @param limit - Nombre maximum de projets (1-20, default: 10)
   */
  static async getAllUserProjects(
    userId: string,
    limit: number = 10
  ): Promise<ProjectsResponse> {
    if (!userId) {
      throw new Error("ID utilisateur requis");
    }

    const normalizedLimit = Math.min(Math.max(parseInt(String(limit)) || 10, 1), 20);

    try {
      const projects = await ProjectModel.findByUser(userId, normalizedLimit);

      return {
        projects,
        total: projects.length,
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération de tous les projets pour l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
}