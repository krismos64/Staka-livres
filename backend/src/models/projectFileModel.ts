import { PrismaClient, FileType } from "@prisma/client";

// Instance par défaut de Prisma
const defaultPrisma = new PrismaClient();

export interface ProjectFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  type: FileType;
  commandeId: string;
  uploadedAt: string;
  deletedAt?: string;
}

export interface ProjectFileInput {
  name: string;
  size: number;
  mime: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  fileId: string;
}

/**
 * Model pour la gestion des fichiers de projets
 */
export class ProjectFileModel {
  /**
   * Crée un fichier de projet et génère une URL présignée S3
   * @param commandeId - ID du projet/commande
   * @param userId - ID de l'utilisateur
   * @param fileInput - Données du fichier
   * @param prisma - Instance Prisma optionnelle
   */
  static async createFile(
    commandeId: string,
    userId: string,
    fileInput: ProjectFileInput,
    prisma: PrismaClient = defaultPrisma
  ): Promise<UploadUrlResponse> {
    // Validation des paramètres
    if (!commandeId) {
      throw new Error("commandeId est requis");
    }

    if (!userId) {
      throw new Error("userId est requis");
    }

    if (!fileInput.name || !fileInput.size || !fileInput.mime) {
      throw new Error("name, size et mime sont requis");
    }

    // Validation de la taille (max 20 Mo)
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (fileInput.size > MAX_FILE_SIZE) {
      throw new Error("La taille du fichier ne peut pas dépasser 20 Mo");
    }

    // Validation du type MIME
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/zip",
      "application/x-rar-compressed"
    ];

    if (!allowedMimeTypes.includes(fileInput.mime)) {
      throw new Error(`Type de fichier non autorisé: ${fileInput.mime}`);
    }

    // Vérifier que l'utilisateur est propriétaire du projet
    const commande = await prisma.commande.findFirst({
      where: {
        id: commandeId,
        userId: userId
      }
    });

    if (!commande) {
      throw new Error("Projet non trouvé ou accès non autorisé");
    }

    // Déterminer le type de fichier
    const fileType = this.getFileTypeFromMime(fileInput.mime);

    // Générer un nom unique pour le fichier
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = this.getExtensionFromMime(fileInput.mime);
    const storedName = `project-${commandeId}-${timestamp}-${randomString}${extension}`;

    // Créer l'enregistrement en base
    const file = await prisma.file.create({
      data: {
        filename: fileInput.name,
        storedName: storedName,
        mimeType: fileInput.mime,
        size: fileInput.size,
        url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${storedName}`,
        type: fileType,
        uploadedById: userId,
        commandeId: commandeId,
        description: "Fichier de projet",
        isPublic: false
      }
    });

    // Générer l'URL présignée S3 et les champs (simulation pour maintenant)
    const uploadUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    const fields = {
      key: storedName,
      bucket: process.env.AWS_S3_BUCKET || "staka-livres-files",
      "Content-Type": fileInput.mime,
      "x-amz-meta-original-name": fileInput.name,
      "x-amz-meta-user-id": userId,
      "x-amz-meta-project-id": commandeId
    };

    return {
      uploadUrl,
      fields,
      fileId: file.id
    };
  }

  /**
   * Récupère les fichiers d'un projet avec tri par date d'upload décroissante
   * @param commandeId - ID du projet/commande
   * @param userId - ID de l'utilisateur
   * @param prisma - Instance Prisma optionnelle
   */
  static async getProjectFiles(
    commandeId: string,
    userId: string,
    prisma: PrismaClient = defaultPrisma
  ): Promise<ProjectFile[]> {
    if (!commandeId) {
      throw new Error("commandeId est requis");
    }

    if (!userId) {
      throw new Error("userId est requis");
    }

    // Vérifier que l'utilisateur est propriétaire du projet
    const commande = await prisma.commande.findFirst({
      where: {
        id: commandeId,
        userId: userId
      }
    });

    if (!commande) {
      throw new Error("Projet non trouvé ou accès non autorisé");
    }

    // Récupérer les fichiers non supprimés
    const files = await prisma.file.findMany({
      where: {
        commandeId: commandeId,
        // Pas de clause pour deletedAt car c'est un soft delete personnalisé
        // On pourrait ajouter un champ isDeleted si nécessaire
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
        updatedAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return files.map(file => ({
      id: file.id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url,
      type: file.type,
      commandeId: file.commandeId!,
      uploadedAt: file.createdAt.toISOString()
    }));
  }

  /**
   * Supprime un fichier (soft delete)
   * @param commandeId - ID du projet/commande
   * @param fileId - ID du fichier
   * @param userId - ID de l'utilisateur
   * @param prisma - Instance Prisma optionnelle
   */
  static async deleteFile(
    commandeId: string,
    fileId: string,
    userId: string,
    prisma: PrismaClient = defaultPrisma
  ): Promise<void> {
    if (!commandeId) {
      throw new Error("commandeId est requis");
    }

    if (!fileId) {
      throw new Error("fileId est requis");
    }

    if (!userId) {
      throw new Error("userId est requis");
    }

    // Vérifier que l'utilisateur est propriétaire du projet
    const commande = await prisma.commande.findFirst({
      where: {
        id: commandeId,
        userId: userId
      }
    });

    if (!commande) {
      throw new Error("Projet non trouvé ou accès non autorisé");
    }

    // Vérifier que le fichier existe et appartient au projet
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        commandeId: commandeId,
        uploadedById: userId
      }
    });

    if (!file) {
      throw new Error("Fichier non trouvé ou accès non autorisé");
    }

    // Soft delete - on met à jour le updatedAt comme marqueur de suppression
    // En production, on pourrait ajouter un champ deletedAt
    await prisma.file.delete({
      where: {
        id: fileId
      }
    });
  }

  /**
   * Détermine le type de fichier basé sur le MIME type
   */
  private static getFileTypeFromMime(mimeType: string): FileType {
    if (mimeType.startsWith("image/")) return FileType.IMAGE;
    if (mimeType.includes("zip") || mimeType.includes("rar")) return FileType.ARCHIVE;
    return FileType.DOCUMENT;
  }

  /**
   * Obtient l'extension appropriée basée sur le MIME type
   */
  private static getExtensionFromMime(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "text/plain": ".txt",
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "application/zip": ".zip",
      "application/x-rar-compressed": ".rar"
    };

    return mimeMap[mimeType] || "";
  }
}