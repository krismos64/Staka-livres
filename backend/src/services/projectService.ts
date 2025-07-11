import { ProjectModel, PaginatedResult, Project, ProjectFilters } from "../models/projectModel";

/**
 * Service pour la gestion des projets utilisateur
 */
export class ProjectService {
  /**
   * Récupère les projets avec pagination et filtres
   * @param userId - ID de l'utilisateur authentifié
   * @param page - Page courante (default: 1)
   * @param limit - Éléments par page (default: 10)
   * @param filters - Filtres de recherche
   */
  static async getProjects(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters: ProjectFilters = {}
  ): Promise<PaginatedResult<Project>> {
    // Validation des paramètres d'entrée
    if (!userId) {
      throw new Error("ID utilisateur requis");
    }

    // Validation des paramètres de pagination
    if (page < 1) {
      throw new Error("La page doit être ≥ 1");
    }

    if (limit < 1 || limit > 50) {
      throw new Error("Le limit doit être entre 1 et 50");
    }

    // Validation du statut
    const validStatuses = ['all', 'active', 'pending', 'completed'];
    if (filters.status && !validStatuses.includes(filters.status)) {
      throw new Error(`Statut invalide. Valeurs autorisées: ${validStatuses.join(", ")}`);
    }

    // Validation de la recherche
    if (filters.search && filters.search.length > 100) {
      throw new Error("La recherche doit faire ≤ 100 caractères");
    }

    try {
      // Récupération des projets via le model
      return await ProjectModel.findPaginated(userId, page, limit, filters);
    } catch (error) {
      // Log de l'erreur (en production, utiliser un logger approprié)
      console.error(`Erreur lors de la récupération des projets pour l'utilisateur ${userId}:`, error);
      
      // Relancer l'erreur pour gestion par le contrôleur
      throw error;
    }
  }

  /**
   * Récupère les compteurs par statut pour un utilisateur
   * @param userId - ID de l'utilisateur authentifié
   */
  static async getStatusCounts(userId: string): Promise<Record<string, number>> {
    if (!userId) {
      throw new Error("ID utilisateur requis");
    }

    try {
      return await ProjectModel.getStatusCounts(userId);
    } catch (error) {
      console.error(`Erreur lors de la récupération des compteurs pour l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
}