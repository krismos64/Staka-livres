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

/**
 * GET /files/download/:fileId
 * Télécharge un fichier (projet ou message) avec vérification des permissions
 */
export const downloadProjectFile = async (
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
    console.log(`🔍 [FILES] Tentative de téléchargement - fileId: ${req.params.fileId}, user: ${req.user.email}`);
    
    const { fileId } = fileIdSchema.parse(req.params);

    console.log(
      `📥 [FILES] ${req.user.email} télécharge le fichier ${fileId}`
    );

    try {
      // Essayer d'abord le téléchargement comme fichier de projet
      const fileData = await FilesService.downloadProjectFile(fileId, req.user.id, req.user.role);
      
      console.log(
        `✅ [FILES] Fichier de projet ${fileId} téléchargé avec succès par ${req.user.email}`
      );

      // Pour les fichiers de projets, vérifier si l'URL S3 est valide
      if (fileData.url && fileData.url.startsWith('http') && !fileData.url.includes('undefined')) {
        // Redirection vers l'URL S3 valide
        res.redirect(302, fileData.url);
      } else {
        // URL S3 non valide ou mode simulation - créer un fichier de démonstration
        console.log(`⚠️ [FILES] URL S3 non valide pour ${fileId}, génération d'un fichier de démonstration`);
        
        // En mode développement, générer un fichier de démonstration selon le type
        let content: Buffer;
        let mimeType: string;
        
        if (fileData.mimeType === 'application/pdf' || fileData.filename.endsWith('.pdf')) {
          // Générer un PDF de démonstration
          mimeType = 'application/pdf';
          content = Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 125
>>
stream
BT
/F1 12 Tf
72 720 Td
(Document corrigé par l'équipe Staka) Tj
0 -20 Td
(Fichier: ${fileData.filename}) Tj
0 -20 Td
(Mode développement - Fichier de démonstration) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000015 00000 n 
0000000074 00000 n 
0000000131 00000 n 
0000000295 00000 n 
0000000470 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
557
%%EOF`);
        } else if (fileData.mimeType === 'text/plain' || fileData.filename.endsWith('.txt')) {
          // Générer un fichier texte de démonstration
          mimeType = 'text/plain';
          content = Buffer.from(`Document corrigé par l'équipe Staka
======================================

Fichier original: ${fileData.filename}
Date de correction: ${new Date().toLocaleDateString('fr-FR')}

Contenu du document corrigé:
---------------------------

Ceci est un fichier de démonstration généré en mode développement.
Le vrai fichier corrigé serait disponible en production avec une configuration S3 complète.

Voici quelques corrections types que nous apportons:
- Orthographe et grammaire
- Structure et cohérence
- Style et clarté
- Formatage et présentation

Merci de nous avoir fait confiance pour la correction de votre document.

L'équipe Staka Éditions
contact@staka.fr`);
        } else {
          // Fichier générique
          mimeType = fileData.mimeType || 'application/octet-stream';
          content = Buffer.from(`Fichier corrigé: ${fileData.filename}
Mode développement - Fichier de démonstration
Généré le: ${new Date().toISOString()}
Taille originale: ${fileData.size} bytes`);
        }

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
        res.setHeader('Content-Length', content.length);
        res.send(content);
      }
      return;

    } catch (projectError) {
      console.log(`🔄 [FILES] Fichier ${fileId} non trouvé comme fichier de projet, tentative comme fichier de message`);
      
      // Si ça échoue, essayer comme fichier de message
      // Importer dynamiquement la fonction de téléchargement de messages
      const { downloadMessageFile } = await import("../controllers/fileController");
      
      // Rediriger vers la fonction de téléchargement de messages
      return downloadMessageFile(req, res);
    }

  } catch (error) {
    console.error(
      `❌ [FILES] Erreur lors du téléchargement du fichier pour ${req.user?.email}:`,
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
      if (error.message.includes("non trouvé")) {
        res.status(404).json({
          error: "Fichier non trouvé",
          message: error.message
        });
        return;
      }

      if (error.message.includes("non autorisé")) {
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
      message: "Impossible de télécharger le fichier"
    });
  }
};