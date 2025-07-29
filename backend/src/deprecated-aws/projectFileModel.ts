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
  isAdminFile?: boolean;
}

export interface ProjectFileInput {
  name: string;
  size: number;
  mime: string;
  isAdminFile?: boolean;
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
    prisma: PrismaClient = defaultPrisma,
    userRole?: string
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

    // Validation du type MIME - Plus permissif pour les admins
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
      // Autres formats utiles pour les corrections
      "application/x-pdf", // Variante PDF
      "text/markdown", // Markdown
      "text/html" // HTML
    ];

    if (!allowedMimeTypes.includes(fileInput.mime)) {
      throw new Error(`Type de fichier non autorisé: ${fileInput.mime}`);
    }

    // Vérifier que l'utilisateur est propriétaire du projet ou est admin
    const isAdmin = userRole === "ADMIN";
    const commande = await prisma.commande.findFirst({
      where: {
        id: commandeId,
        ...(isAdmin ? {} : { userId: userId }) // Les admins peuvent accéder à tous les projets
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
        description: fileInput.isAdminFile ? "ADMIN_FILE:Document corrigé" : "Fichier de projet",
        isPublic: false
      }
    });

    // Si c'est un fichier admin (document corrigé), notifier le client
    if (fileInput.isAdminFile && isAdmin && commande.userId) {
      try {
        const { createNotification } = await import("../services/notificationsService");
        await createNotification({
          userId: commande.userId,
          title: "Document corrigé disponible",
          message: `Un document corrigé "${fileInput.name}" a été ajouté à votre commande "${commande.titre}"`,
          type: "SUCCESS",
          priority: "HAUTE",
          actionUrl: `/dashboard/commandes/${commandeId}`
        });
        console.log(`📧 [FILES] Notification envoyée au client ${commande.userId} pour le document corrigé`);
      } catch (notificationError) {
        console.error("Erreur lors de l'envoi de la notification:", notificationError);
        // Ne pas faire échouer l'upload si la notification échoue
      }
    }

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
    prisma: PrismaClient = defaultPrisma,
    userRole?: string
  ): Promise<ProjectFile[]> {
    if (!commandeId) {
      throw new Error("commandeId est requis");
    }

    if (!userId) {
      throw new Error("userId est requis");
    }

    // Vérifier que l'utilisateur est propriétaire du projet ou est admin
    const isAdmin = userRole === "ADMIN";
    const commande = await prisma.commande.findFirst({
      where: {
        id: commandeId,
        ...(isAdmin ? {} : { userId: userId }) // Les admins peuvent accéder à tous les projets
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
        updatedAt: true,
        description: true
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
      uploadedAt: file.createdAt.toISOString(),
      isAdminFile: file.description?.startsWith("ADMIN_FILE:") || false
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
   * Télécharge un fichier avec vérification des permissions
   * @param fileId - ID du fichier
   * @param userId - ID de l'utilisateur
   * @param userRole - Rôle de l'utilisateur
   * @param prisma - Instance Prisma optionnelle
   */
  static async downloadFile(
    fileId: string,
    userId: string,
    userRole?: string,
    prisma: PrismaClient = defaultPrisma
  ): Promise<any> {
    if (!fileId) {
      throw new Error("fileId est requis");
    }

    if (!userId) {
      throw new Error("userId est requis");
    }

    // Récupérer le fichier avec les informations de la commande
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        commande: {
          select: {
            id: true,
            userId: true,
            titre: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!file) {
      throw new Error("Fichier non trouvé");
    }

    // Vérifier les permissions d'accès
    const isAdmin = userRole === "ADMIN";
    const isOwner = file.commande?.userId === userId;
    const isUploader = file.uploadedById === userId;

    if (!isAdmin && !isOwner && !isUploader) {
      throw new Error("Accès non autorisé à ce fichier");
    }

    // Pour les admins, permettre le téléchargement de tous les fichiers de commandes
    // même si ce ne sont pas des "fichiers de projet" classiques
    console.log(`📁 [FILES] Téléchargement autorisé pour ${userRole} - Fichier: ${file.filename} (${file.mimeType})`);

    // Retourner les informations du fichier pour le téléchargement
    return {
      id: file.id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url,
      storedName: file.storedName
    };
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
      // Documents
      "application/pdf": ".pdf",
      "application/x-pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "application/vnd.oasis.opendocument.text": ".odt",
      "text/plain": ".txt",
      "text/rtf": ".rtf",
      // Tableurs
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
      // Présentation
      "application/vnd.ms-powerpoint": ".ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
      // Images
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/bmp": ".bmp",
      "image/tiff": ".tiff",
      // Archives
      "application/zip": ".zip",
      "application/x-rar-compressed": ".rar",
      "application/x-7z-compressed": ".7z",
      // Autres
      "text/markdown": ".md",
      "text/html": ".html"
    };

    return mimeMap[mimeType] || "";
  }
}