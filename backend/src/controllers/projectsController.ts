import { Request, Response } from "express";
import { z } from "zod";
import { ProjectService } from "../services/projectService";

/**
 * Contrôleur pour la gestion des projets utilisateur
 */

// Schéma de validation pour les paramètres de requête
const projectsQuerySchema = z.object({
  page: z.string().optional().transform((val) => {
    if (!val) return 1;
    const parsed = parseInt(val);
    if (isNaN(parsed) || parsed < 1) {
      throw new Error("page doit être ≥ 1");
    }
    return parsed;
  }),
  limit: z.string().optional().transform((val) => {
    if (!val) return 10;
    const parsed = parseInt(val);
    if (isNaN(parsed) || parsed < 1 || parsed > 50) {
      throw new Error("limit doit être entre 1 et 50");
    }
    return parsed;
  }),
  status: z.enum(['all', 'active', 'pending', 'completed']).optional().default('all'),
  search: z.string().max(100, "search doit faire ≤ 100 caractères").optional(),
});

/**
 * GET /projects - Récupère les projets de l'utilisateur authentifié avec pagination
 * Query params:
 * - page: number (optionnel, default: 1, ≥1)
 * - limit: number (optionnel, default: 10, 1-50)
 * - status: string (optionnel, default: "all", values: all|active|pending|completed)
 * - search: string (optionnel, ≤100 caractères)
 */
export const getProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Vérification de l'authentification (middleware auth requis)
    if (!req.user?.id) {
      res.status(401).json({
        error: "Authentification requise",
        message: "Utilisateur non authentifié",
      });
      return;
    }

    // Validation des paramètres de requête avec Zod
    const validatedQuery = projectsQuerySchema.parse(req.query);

    console.log(
      `🔍 [PROJECTS] ${req.user.email} récupère ses projets - Page: ${validatedQuery.page}, Limit: ${validatedQuery.limit}, Status: ${validatedQuery.status}, Search: ${validatedQuery.search || 'none'}`
    );

    // Récupération des projets via le service
    const result = await ProjectService.getProjects(
      req.user.id,
      validatedQuery.page,
      validatedQuery.limit,
      {
        status: validatedQuery.status,
        search: validatedQuery.search,
      }
    );

    console.log(
      `✅ [PROJECTS] ${result.data.length}/${result.meta.total} projets récupérés pour ${req.user.email} (page ${result.meta.page})`
    );

    // Ajouter le header X-Total-Count pour la pagination
    res.set('X-Total-Count', result.meta.total.toString());

    // Réponse avec la structure paginée
    res.status(200).json(result);

  } catch (error) {
    console.error(
      `❌ [PROJECTS] Erreur lors de la récupération des projets pour ${req.user?.email}:`,
      error
    );

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Paramètres invalides",
        message: error.errors.map(e => e.message).join(", "),
        details: error.errors,
      });
      return;
    }

    // Gestion des erreurs spécifiques du service
    if (error instanceof Error) {
      if (error.message.includes("≥ 1") || error.message.includes("entre 1 et 50") || error.message.includes("≤ 100")) {
        res.status(400).json({
          error: "Paramètres invalides",
          message: error.message,
        });
        return;
      }
    }

    // Erreur générique du serveur
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer les projets",
    });
  }
};

/**
 * GET /projects/counts - Récupère les compteurs par statut
 */
export const getProjectCounts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Vérification de l'authentification
    if (!req.user?.id) {
      res.status(401).json({
        error: "Authentification requise",
        message: "Utilisateur non authentifié",
      });
      return;
    }

    console.log(`🔢 [PROJECTS] ${req.user.email} récupère les compteurs de projets`);

    // Récupération des compteurs via le service
    const counts = await ProjectService.getStatusCounts(req.user.id);

    console.log(`✅ [PROJECTS] Compteurs récupérés pour ${req.user.email}:`, counts);

    res.status(200).json(counts);

  } catch (error) {
    console.error(
      `❌ [PROJECTS] Erreur lors de la récupération des compteurs pour ${req.user?.email}:`,
      error
    );

    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer les compteurs",
    });
  }
};