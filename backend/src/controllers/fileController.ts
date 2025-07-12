import { FileType, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Interface pour étendre Request avec le fichier multer
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

const prisma = new PrismaClient();

// Configuration de stockage pour multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/messages");
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique pour éviter les conflits
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

// Configuration multer avec validation
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Types MIME autorisés
    const allowedMimeTypes = [
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Archives
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      // Audio
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      // Video
      "video/mp4",
      "video/avi",
      "video/quicktime",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
    }
  },
});

// Fonction utilitaire pour déterminer le type de fichier
function getFileTypeFromMime(mimeType: string): FileType {
  if (mimeType.startsWith("image/")) return FileType.IMAGE;
  if (mimeType.startsWith("audio/")) return FileType.AUDIO;
  if (mimeType.startsWith("video/")) return FileType.VIDEO;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z")
  )
    return FileType.ARCHIVE;
  return FileType.DOCUMENT;
}

/**
 * Upload d'un fichier pour les messages
 */
export const uploadMessageFile = async (
  req: RequestWithFile,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "Aucun fichier fourni" });
      return;
    }

    // Construire l'URL du fichier
    const fileUrl = `/uploads/messages/${file.filename}`;

    // Enregistrer en base de données
    const savedFile = await prisma.file.create({
      data: {
        filename: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        url: fileUrl,
        type: getFileTypeFromMime(file.mimetype),
        uploadedById: userId,
        description: req.body.description || null,
        isPublic: false, // Les fichiers de message sont privés par défaut
      },
    });

    res.status(201).json({
      message: "Fichier uploadé avec succès",
      file: {
        id: savedFile.id,
        filename: savedFile.filename,
        size: savedFile.size,
        mimeType: savedFile.mimeType,
        url: savedFile.url,
        type: savedFile.type,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    res.status(500).json({ error: "Erreur lors de l'upload du fichier" });
  }
};

/**
 * Télécharger un fichier de message
 */
export const downloadMessageFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Récupérer le fichier de la base de données
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        messageAttachments: {
          include: {
            message: {
              include: {
                sender: true,
                receiver: true,
              },
            },
          },
        },
      },
    });

    if (!file) {
      res.status(404).json({ error: "Fichier non trouvé" });
      return;
    }

    // Vérifier les permissions d'accès
    let hasAccess = false;

    // Les admins ont accès à tous les fichiers
    if (userRole === "ADMIN") {
      hasAccess = true;
    } else {
      // Pour les utilisateurs, vérifier qu'ils sont participants au message
      for (const attachment of file.messageAttachments) {
        const message = attachment.message;
        if (
          message.senderId === userId ||
          message.receiverId === userId ||
          file.uploadedById === userId
        ) {
          hasAccess = true;
          break;
        }
      }
    }

    if (!hasAccess) {
      res.status(403).json({ error: "Accès non autorisé à ce fichier" });
      return;
    }

    // Construire le chemin du fichier
    const filePath = path.join(
      __dirname,
      "../../uploads/messages",
      file.storedName
    );

    // Vérifier que le fichier existe physiquement
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Fichier physique non trouvé" });
      return;
    }

    // Définir les headers appropriés
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`
    );
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", file.size);

    // Envoyer le fichier
    res.sendFile(filePath);
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    res.status(500).json({ error: "Erreur lors du téléchargement du fichier" });
  }
};

/**
 * Supprimer un fichier de message
 */
export const deleteMessageFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Récupérer le fichier
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      res.status(404).json({ error: "Fichier non trouvé" });
      return;
    }

    // Vérifier les permissions (seul l'uploader ou un admin peut supprimer)
    if (file.uploadedById !== userId && userRole !== "ADMIN") {
      res
        .status(403)
        .json({ error: "Accès non autorisé pour supprimer ce fichier" });
      return;
    }

    // Supprimer le fichier physique
    const filePath = path.join(
      __dirname,
      "../../uploads/messages",
      file.storedName
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer de la base de données (cascade supprimera les MessageAttachment)
    await prisma.file.delete({
      where: { id: fileId },
    });

    res.json({ message: "Fichier supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du fichier" });
  }
};

/**
 * Lister les fichiers uploadés par un utilisateur
 */
export const listUserFiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const files = await prisma.file.findMany({
      where: {
        uploadedById: userId,
      },
      select: {
        id: true,
        filename: true,
        size: true,
        mimeType: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    });

    const total = await prisma.file.count({
      where: { uploadedById: userId },
    });

    res.json({
      files,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des fichiers" });
  }
};
