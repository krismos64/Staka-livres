import { Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";
import "../middleware/auth"; // Import pour les types globaux Express

const prisma = new PrismaClient();

/**
 * Contrôleur unifié pour la gestion de tous les fichiers (projets + messages)
 * Stockage local uniquement - Pas d'AWS
 */

// Schémas de validation
const uploadFileSchema = z.object({
  name: z.string().min(1, "Le nom du fichier est requis").max(255, "Le nom du fichier ne peut pas dépasser 255 caractères"),
  size: z.number().int().min(1, "La taille doit être positive").max(20 * 1024 * 1024, "La taille ne peut pas dépasser 20 Mo"),
  mime: z.string().min(1, "Le type MIME est requis"),
  isAdminFile: z.boolean().optional().default(false)
});

const projectIdSchema = z.object({
  id: z.string().uuid("ID de projet invalide")
});

const fileIdSchema = z.object({
  fileId: z.string().uuid("ID de fichier invalide")
});

// Configuration de stockage unifié
const createStorage = (subDirectory: string) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, `../../uploads/${subDirectory}`);
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique pour éviter les conflits
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Middleware multer pour les projets
const projectUploadMiddleware = multer({
  storage: createStorage("projects"),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max pour les projets
  },
  fileFilter: (req, file, cb) => {
    // Types MIME autorisés
    const allowedMimeTypes = [
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.oasis.opendocument.text", // ODT
      "text/plain",
      "text/rtf", // RTF
      // Tableurs
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // Présentation
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png", 
      "image/gif",
      "image/bmp",
      "image/tiff",
      // Archives
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      // Autres formats utiles
      "application/x-pdf",
      "text/markdown",
      "text/html"
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/files/projects/:id/upload
 * Upload direct de fichier de projet (sans S3)
 */
export const uploadProjectFile = async (
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

    // Vérifier l'accès au projet
    const isAdmin = req.user.role === "ADMIN";
    const commande = await prisma.commande.findFirst({
      where: {
        id: commandeId,
        ...(isAdmin ? {} : { userId: req.user.id })
      }
    });

    if (!commande) {
      res.status(403).json({
        error: "Accès refusé",
        message: "Projet non trouvé ou accès non autorisé"
      });
      return;
    }

    // Le fichier a été traité par multer
    if (!req.file) {
      res.status(400).json({
        error: "Fichier manquant",
        message: "Aucun fichier n'a été uploadé"
      });
      return;
    }

    console.log(
      `📁 [FILES] ${req.user.email} uploade ${req.file.originalname} pour le projet ${commandeId} - Admin: ${isAdmin}`
    );

    // Déterminer le type de fichier
    const fileType = getFileTypeFromMime(req.file.mimetype);

    // Créer l'enregistrement en base
    const file = await prisma.file.create({
      data: {
        filename: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/projects/${req.file.filename}`, // URL locale
        type: fileType as any,
        uploadedById: req.user.id,
        commandeId: commandeId,
        description: isAdmin ? "ADMIN_FILE:Document corrigé" : "Fichier de projet",
        isPublic: false
      }
    });

    // Si c'est un fichier admin (document corrigé), notifier le client
    if (isAdmin && commande.userId) {
      try {
        const { createNotification } = await import("../controllers/notificationsController");
        await createNotification(
          commande.userId,
          "Document corrigé disponible",
          `Un document corrigé "${req.file.originalname}" a été ajouté à votre commande "${commande.titre}"`,
          "SUCCESS" as any,
          "HAUTE" as any,
          `/dashboard/commandes/${commandeId}`
        );
        console.log(`📧 [FILES] Notification envoyée au client ${commande.userId} pour le document corrigé`);
      } catch (notificationError) {
        console.error("Erreur lors de l'envoi de la notification:", notificationError);
      }
    }

    console.log(
      `✅ [FILES] Fichier uploadé avec succès - ID: ${file.id}, Stocké: ${req.file.filename}`
    );

    res.status(201).json({
      fileId: file.id,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimeType,
      url: file.url,
      message: "Fichier uploadé avec succès"
    });

  } catch (error) {
    console.error(`❌ [FILES] Erreur lors de l'upload:`, error);

    // Nettoyer le fichier si erreur après upload
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Données invalides",
        message: error.errors.map(e => e.message).join(", "),
        details: error.errors
      });
      return;
    }

    // Gestion des erreurs multer
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          error: "Fichier trop volumineux",
          message: "La taille du fichier ne peut pas dépasser 20 Mo"
        });
        return;
      }
    }

    // Gestion des erreurs métier
    if (error instanceof Error) {
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
      message: "Impossible d'uploader le fichier"
    });
  }
};

/**
 * GET /api/files/projects/:id/files
 * Récupère les fichiers d'un projet
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

    // Vérifier l'accès au projet
    const isAdmin = req.user.role === "ADMIN";
    const commande = await prisma.commande.findFirst({
      where: {
        id: commandeId,
        ...(isAdmin ? {} : { userId: req.user.id })
      }
    });

    if (!commande) {
      res.status(403).json({
        error: "Accès refusé",
        message: "Projet non trouvé ou accès non autorisé"
      });
      return;
    }

    console.log(
      `📂 [FILES] ${req.user.email} récupère les fichiers du projet ${commandeId}`
    );

    // Récupérer les fichiers
    const files = await prisma.file.findMany({
      where: {
        commandeId: commandeId,
      },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        url: true,
        type: true,
        commandeId: true,
        createdAt: true,
        description: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const formattedFiles = files.map(file => ({
      id: file.id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url,
      type: file.type,
      commandeId: file.commandeId!,
      uploadedAt: file.createdAt.toISOString(),
      isAdminFile: file.description?.startsWith("ADMIN_FILE:") || false
    }));

    console.log(
      `✅ [FILES] ${formattedFiles.length} fichiers récupérés pour le projet ${commandeId}`
    );

    res.status(200).json({
      files: formattedFiles,
      count: formattedFiles.length
    });

  } catch (error) {
    console.error(`❌ [FILES] Erreur lors de la récupération:`, error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Paramètres invalides",
        message: error.errors.map(e => e.message).join(", ")
      });
      return;
    }

    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer les fichiers"
    });
  }
};

/**
 * GET /api/files/download/:fileId
 * Télécharge un fichier depuis le stockage local
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
    const { fileId } = fileIdSchema.parse(req.params);

    console.log(`📥 [FILES] ${req.user.email} télécharge le fichier ${fileId}`);

    // Récupérer le fichier avec vérification des permissions
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        commande: {
          select: {
            id: true,
            userId: true,
            titre: true
          }
        }
      }
    });

    if (!file) {
      res.status(404).json({ 
        error: "Fichier non trouvé",
        message: "Le fichier demandé n'existe pas"
      });
      return;
    }

    // Vérifier les permissions d'accès
    const isAdmin = req.user.role === "ADMIN";
    const isOwner = file.commande?.userId === req.user.id;
    const isUploader = file.uploadedById === req.user.id;

    if (!isAdmin && !isOwner && !isUploader) {
      res.status(403).json({ 
        error: "Accès refusé",
        message: "Vous n'avez pas accès à ce fichier"
      });
      return;
    }

    // Construire le chemin du fichier
    let filePath: string;
    
    // Déterminer le répertoire selon l'URL stockée
    if (file.url.includes('/uploads/projects/')) {
      filePath = path.join(__dirname, "../../uploads/projects", file.storedName);
    } else if (file.url.includes('/uploads/messages/')) {
      filePath = path.join(__dirname, "../../uploads/messages", file.storedName);
    } else {
      // Fallback pour les anciens fichiers
      filePath = path.join(__dirname, "../../uploads/projects", file.storedName);
    }

    // Vérifier que le fichier existe physiquement
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ [FILES] Fichier physique non trouvé: ${filePath}`);
      res.status(404).json({ 
        error: "Fichier physique non trouvé",
        message: "Le fichier n'existe plus sur le serveur"
      });
      return;
    }

    console.log(`✅ [FILES] Envoi du fichier ${file.filename} à ${req.user.email}`);

    // Définir les headers appropriés
    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", file.size);

    // Envoyer le fichier
    res.sendFile(filePath);

  } catch (error) {
    console.error("❌ [FILES] Erreur lors du téléchargement:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Paramètres invalides",
        message: error.errors.map(e => e.message).join(", ")
      });
      return;
    }

    res.status(500).json({ 
      error: "Erreur lors du téléchargement du fichier",
      message: "Une erreur interne s'est produite"
    });
  }
};

/**
 * DELETE /api/files/projects/:id/files/:fileId
 * Supprime un fichier de projet
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

    console.log(`🗑️ [FILES] ${req.user.email} supprime le fichier ${fileId} du projet ${commandeId}`);

    // Vérifier que l'utilisateur est propriétaire du projet (pas de suppression admin files)
    const commande = await prisma.commande.findFirst({
      where: {
        id: commandeId,
        userId: req.user.id
      }
    });

    if (!commande) {
      res.status(403).json({
        error: "Accès refusé",
        message: "Projet non trouvé ou accès non autorisé"
      });
      return;
    }

    // Vérifier que le fichier existe et appartient au projet
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        commandeId: commandeId,
        uploadedById: req.user.id  // Seul l'uploader peut supprimer
      }
    });

    if (!file) {
      res.status(404).json({
        error: "Fichier non trouvé",
        message: "Fichier non trouvé ou accès non autorisé"
      });
      return;
    }

    // Empêcher la suppression des fichiers admin
    if (file.description?.startsWith("ADMIN_FILE:")) {
      res.status(403).json({
        error: "Suppression interdite",
        message: "Les documents corrigés ne peuvent pas être supprimés"
      });
      return;
    }

    // Supprimer le fichier physique
    let filePath: string;
    if (file.url.includes('/uploads/projects/')) {
      filePath = path.join(__dirname, "../../uploads/projects", file.storedName);
    } else {
      filePath = path.join(__dirname, "../../uploads/messages", file.storedName);
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer l'enregistrement en base
    await prisma.file.delete({
      where: {
        id: fileId
      }
    });

    console.log(`✅ [FILES] Fichier ${fileId} supprimé avec succès par ${req.user.email}`);

    res.status(200).json({
      message: "Fichier supprimé avec succès"
    });

  } catch (error) {
    console.error(`❌ [FILES] Erreur lors de la suppression:`, error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Paramètres invalides",
        message: error.errors.map(e => e.message).join(", ")
      });
      return;
    }

    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de supprimer le fichier"
    });
  }
};

// Utilitaires
function getFileTypeFromMime(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z")) return "ARCHIVE";
  if (mimeType.includes("audio")) return "AUDIO";
  if (mimeType.includes("video")) return "VIDEO";
  return "DOCUMENT";
}

// Export du middleware
export { projectUploadMiddleware };