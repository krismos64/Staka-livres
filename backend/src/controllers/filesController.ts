import { Request, Response } from "express";
import { z } from "zod";
import { FilesService } from "../services/filesService";
import "../middleware/auth"; // Import pour les types globaux Express

/**
 * Contrôleur pour la gestion des fichiers de projets
 */

// Schéma de validation pour l'upload de fichier
const uploadFileSchema = z.object({
  name: z.string().min(1, "Le nom du fichier est requis").max(255, "Le nom du fichier ne peut pas dépasser 255 caractères"),
  size: z.number().int().min(1, "La taille doit être positive").max(20 * 1024 * 1024, "La taille ne peut pas dépasser 20 Mo"),
  mime: z.string().min(1, "Le type MIME est requis"),
  isAdminFile: z.boolean().optional().default(false)
});

// Schéma de validation pour les paramètres de route
const projectIdSchema = z.object({
  id: z.string().uuid("ID de projet invalide")
});

const fileIdSchema = z.object({
  fileId: z.string().uuid("ID de fichier invalide")
});

/**
 * POST /projects/:id/files
 * Crée un fichier de projet et retourne une URL présignée S3
 */
export const createProjectFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Vérification de l'authentification
    if (!req.user?.id) {
      res.status(401).json({
        error: "Authentification requise",
        message: "Utilisateur non authentifié"
      });
      return;
    }

    // Validation des paramètres de route
    const { id: commandeId } = projectIdSchema.parse(req.params);

    // Validation du corps de la requête
    const fileInput = uploadFileSchema.parse(req.body) as { name: string; size: number; mime: string; isAdminFile: boolean };

    console.log(
      `📁 [FILES] ${req.user.email} crée un fichier pour le projet ${commandeId} - ${fileInput.name} (${fileInput.size} bytes, ${fileInput.mime}) - Admin: ${fileInput.isAdminFile}`
    );

    // Vérification de la propriété du projet
    const result = await FilesService.createProjectFile(
      commandeId,
      req.user.id,
      fileInput,
      req.user.role
    );

    console.log(
      `✅ [FILES] Fichier créé avec succès pour ${req.user.email} - ID: ${result.fileId}`
    );

    res.status(201).json(result);

  } catch (error) {
    console.error(
      `❌ [FILES] Erreur lors de la création du fichier pour ${req.user?.email}:`,
      error
    );

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Données invalides",
        message: error.errors.map(e => e.message).join(", "),
        details: error.errors
      });
      return;
    }

    // Gestion des erreurs métier
    if (error instanceof Error) {
      if (error.message.includes("non autorisé") || error.message.includes("non trouvé")) {
        res.status(403).json({
          error: "Accès refusé",
          message: error.message
        });
        return;
      }

      if (error.message.includes("dépasser 20 Mo")) {
        res.status(400).json({
          error: "Fichier trop volumineux",
          message: error.message
        });
        return;
      }

      if (error.message.includes("non autorisé")) {
        res.status(400).json({
          error: "Type de fichier non autorisé",
          message: error.message
        });
        return;
      }
    }

    // Erreur générique du serveur
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de créer le fichier"
    });
  }
};

/**
 * GET /projects/:id/files
 * Récupère la liste des fichiers d'un projet triés par date d'upload décroissante
 */
export const getProjectFiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Vérification de l'authentification
    if (!req.user?.id) {
      res.status(401).json({
        error: "Authentification requise",
        message: "Utilisateur non authentifié"
      });
      return;
    }

    // Validation des paramètres de route
    const { id: commandeId } = projectIdSchema.parse(req.params);

    console.log(
      `📂 [FILES] ${req.user.email} récupère les fichiers du projet ${commandeId}`
    );

    // Récupération des fichiers via le service
    const files = await FilesService.getProjectFiles(commandeId, req.user.id, req.user.role);

    console.log(
      `✅ [FILES] ${files.length} fichiers récupérés pour le projet ${commandeId} (${req.user.email})`
    );

    res.status(200).json({
      files,
      count: files.length
    });

  } catch (error) {
    console.error(
      `❌ [FILES] Erreur lors de la récupération des fichiers pour ${req.user?.email}:`,
      error
    );

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Paramètres invalides",
        message: error.errors.map(e => e.message).join(", "),
        details: error.errors
      });
      return;
    }

    // Gestion des erreurs métier
    if (error instanceof Error) {
      if (error.message.includes("non autorisé") || error.message.includes("non trouvé")) {
        res.status(403).json({
          error: "Accès refusé",
          message: error.message
        });
        return;
      }
    }

    // Erreur générique du serveur
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer les fichiers"
    });
  }
};

/**
 * DELETE /projects/:id/files/:fileId
 * Supprime un fichier de projet (soft delete)
 */
export const deleteProjectFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Vérification de l'authentification
    if (!req.user?.id) {
      res.status(401).json({
        error: "Authentification requise",
        message: "Utilisateur non authentifié"
      });
      return;
    }

    // Validation des paramètres de route
    const { id: commandeId } = projectIdSchema.parse(req.params);
    const { fileId } = fileIdSchema.parse(req.params);

    console.log(
      `🗑️ [FILES] ${req.user.email} supprime le fichier ${fileId} du projet ${commandeId}`
    );

    // Suppression via le service
    await FilesService.deleteProjectFile(commandeId, fileId, req.user.id);

    console.log(
      `✅ [FILES] Fichier ${fileId} supprimé avec succès par ${req.user.email}`
    );

    res.status(200).json({
      message: "Fichier supprimé avec succès"
    });

  } catch (error) {
    console.error(
      `❌ [FILES] Erreur lors de la suppression du fichier pour ${req.user?.email}:`,
      error
    );

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Paramètres invalides",
        message: error.errors.map(e => e.message).join(", "),
        details: error.errors
      });
      return;
    }

    // Gestion des erreurs métier
    if (error instanceof Error) {
      if (error.message.includes("non autorisé") || error.message.includes("non trouvé")) {
        res.status(403).json({
          error: "Accès refusé",
          message: error.message
        });
        return;
      }
    }

    // Erreur générique du serveur
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de supprimer le fichier"
    });
  }
};