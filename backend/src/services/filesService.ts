import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ProjectFileModel, ProjectFileInput, UploadUrlResponse, ProjectFile } from "../models/projectFileModel";

/**
 * Service pour la gestion des fichiers de projets avec intégration S3
 */
export class FilesService {
  private static s3Client: S3Client | null = null;

  /**
   * Initialise le client S3 si les variables d'environnement sont configurées
   */
  private static getS3Client(): S3Client | null {
    if (this.s3Client) {
      return this.s3Client;
    }

    // Vérifier si S3 est configuré
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
      console.warn("Configuration S3 manquante. Les uploads utiliseront une simulation.");
      return null;
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "eu-west-3",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    return this.s3Client;
  }

  /**
   * Crée un fichier de projet et génère une URL présignée S3
   * @param commandeId - ID du projet/commande
   * @param userId - ID de l'utilisateur
   * @param fileInput - Données du fichier
   */
  static async createProjectFile(
    commandeId: string,
    userId: string,
    fileInput: ProjectFileInput,
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

    try {
      // Créer l'enregistrement via le model
      const result = await ProjectFileModel.createFile(commandeId, userId, fileInput, undefined, userRole);

      // Obtenir le client S3
      const s3Client = this.getS3Client();

      if (s3Client) {
        // Générer une vraie URL présignée S3
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: result.fields.key,
          ContentType: fileInput.mime,
          Metadata: {
            "original-name": fileInput.name,
            "user-id": userId,
            "project-id": commandeId,
          },
        });

        const uploadUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600, // 1 heure
        });

        return {
          uploadUrl,
          fields: {
            ...result.fields,
            // Ajouter des champs requis pour le POST présigné
            "Content-Type": fileInput.mime,
          },
          fileId: result.fileId,
        };
      } else {
        // Mode simulation sans S3
        console.log("Mode simulation S3 activé");
        return {
          uploadUrl: `http://localhost:3001/api/upload/simulate/${result.fileId}`,
          fields: result.fields,
          fileId: result.fileId,
        };
      }
    } catch (error) {
      console.error("Erreur lors de la création du fichier projet:", error);
      throw error;
    }
  }

  /**
   * Récupère les fichiers d'un projet
   * @param commandeId - ID du projet/commande
   * @param userId - ID de l'utilisateur
   */
  static async getProjectFiles(
    commandeId: string,
    userId: string,
    userRole?: string
  ): Promise<ProjectFile[]> {
    if (!commandeId) {
      throw new Error("commandeId est requis");
    }

    if (!userId) {
      throw new Error("userId est requis");
    }

    try {
      return await ProjectFileModel.getProjectFiles(commandeId, userId, undefined, userRole);
    } catch (error) {
      console.error("Erreur lors de la récupération des fichiers:", error);
      throw error;
    }
  }

  /**
   * Supprime un fichier de projet
   * @param commandeId - ID du projet/commande
   * @param fileId - ID du fichier
   * @param userId - ID de l'utilisateur
   */
  static async deleteProjectFile(
    commandeId: string,
    fileId: string,
    userId: string
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

    try {
      await ProjectFileModel.deleteFile(commandeId, fileId, userId);
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier:", error);
      throw error;
    }
  }

  /**
   * Valide les paramètres d'upload communs
   */
  private static validateUploadParams(commandeId: string, userId: string, fileInput: ProjectFileInput): void {
    if (!commandeId?.trim()) {
      throw new Error("ID du projet requis");
    }

    if (!userId?.trim()) {
      throw new Error("ID utilisateur requis");
    }

    if (!fileInput.name?.trim()) {
      throw new Error("Nom du fichier requis");
    }

    if (!fileInput.mime?.trim()) {
      throw new Error("Type MIME requis");
    }

    if (typeof fileInput.size !== "number" || fileInput.size <= 0) {
      throw new Error("Taille du fichier invalide");
    }
  }
}