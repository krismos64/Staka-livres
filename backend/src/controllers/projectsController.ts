import { Request, Response } from "express";
import { ProjectService } from "../services/projectService";

/**
 * Contrôleur pour la gestion des projets utilisateur
 */

/**
 * GET /projects - Récupère les projets de l'utilisateur authentifié
 * Query params:
 * - status: string (optionnel, default: "active")
 * - limit: number (optionnel, default: 3, min: 1, max: 20)
 */
export const getUserProjects = async (
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

    // Extraction et validation des paramètres de requête
    const status = req.query.status as string;
    const limitParam = req.query.limit as string;
    
    // Validation du paramètre limit
    let limit = 3; // Valeur par défaut
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 20) {
        res.status(400).json({
          error: "Paramètre limit invalide",
          message: "Le paramètre limit doit être un nombre entre 1 et 20",
        });
        return;
      }
      limit = parsedLimit;
    }

    console.log(
      `🔍 [PROJECTS] ${req.user.email} récupère ses projets - Status: ${status || 'active'}, Limit: ${limit}`
    );

    // Récupération des projets via le service
    const result = await ProjectService.getUserProjects(
      req.user.id,
      status,
      limit
    );

    console.log(
      `✅ [PROJECTS] ${result.total} projets récupérés pour ${req.user.email}`
    );

    // Réponse avec les projets au format demandé
    res.status(200).json(result.projects);

  } catch (error) {
    console.error(
      `❌ [PROJECTS] Erreur lors de la récupération des projets pour ${req.user?.email}:`,
      error
    );

    // Gestion des erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes("invalide")) {
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