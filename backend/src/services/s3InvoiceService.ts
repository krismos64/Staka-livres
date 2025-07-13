import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

/**
 * Service S3 spécialisé pour la gestion des factures PDF
 */
export class S3InvoiceService {
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
      console.warn("Configuration S3 manquante pour les factures. Mode simulation activé.");
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
   * Upload un PDF de facture vers S3
   * @param pdfBuffer - Buffer du PDF
   * @param invoiceId - ID de la facture
   * @param invoiceNumber - Numéro de la facture
   * @returns URL S3 du fichier
   */
  static async uploadInvoicePdf(
    pdfBuffer: Buffer,
    invoiceId: string,
    invoiceNumber: string
  ): Promise<string> {
    const s3Client = this.getS3Client();

    if (!s3Client) {
      // Mode simulation sans S3
      const mockUrl = `https://mock-s3.amazonaws.com/invoices/${invoiceId}.pdf`;
      console.log(`📤 [S3] Simulation upload facture: ${mockUrl}`);
      return mockUrl;
    }

    try {
      const key = `invoices/${invoiceId}.pdf`;
      const bucketName = process.env.AWS_S3_BUCKET!;

      console.log(`📤 [S3] Upload facture vers S3: ${key}`);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
        ContentDisposition: `attachment; filename="Facture_${invoiceNumber}.pdf"`,
        Metadata: {
          "invoice-id": invoiceId,
          "invoice-number": invoiceNumber,
          "generated-at": new Date().toISOString(),
        },
        // ACL privé pour la sécurité
        ACL: "private",
      });

      await s3Client.send(command);

      const fileUrl = `https://${bucketName}.s3.${
        process.env.AWS_REGION || "eu-west-3"
      }.amazonaws.com/${key}`;
      
      console.log(`✅ [S3] Facture uploadée: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      console.error("❌ [S3] Erreur upload facture:", error);
      throw new Error(`Échec de l'upload S3: ${error}`);
    }
  }

  /**
   * Génère une URL signée pour télécharger une facture (valide 7 jours)
   * @param invoiceId - ID de la facture
   * @param invoiceNumber - Numéro de la facture pour le nom du fichier
   * @returns URL signée
   */
  static async generateSignedUrl(
    invoiceId: string,
    invoiceNumber: string
  ): Promise<string> {
    const s3Client = this.getS3Client();

    if (!s3Client) {
      // Mode simulation
      const mockUrl = `https://mock-s3.amazonaws.com/invoices/${invoiceId}.pdf?signed=true&expires=7days`;
      console.log(`🔗 [S3] Simulation URL signée: ${mockUrl}`);
      return mockUrl;
    }

    try {
      const key = `invoices/${invoiceId}.pdf`;
      const bucketName = process.env.AWS_S3_BUCKET!;

      console.log(`🔗 [S3] Génération URL signée pour: ${key}`);

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
        ResponseContentDisposition: `attachment; filename="Facture_${invoiceNumber}.pdf"`,
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 7 * 24 * 60 * 60, // 7 jours en secondes
      });

      console.log(`✅ [S3] URL signée générée (expire dans 7 jours)`);
      return signedUrl;
    } catch (error) {
      console.error("❌ [S3] Erreur génération URL signée:", error);
      throw new Error(`Échec de la génération d'URL signée: ${error}`);
    }
  }

  /**
   * Télécharge un PDF de facture depuis S3
   * @param invoiceId - ID de la facture
   * @returns Stream du fichier PDF
   */
  static async downloadInvoicePdf(invoiceId: string): Promise<Readable> {
    const s3Client = this.getS3Client();

    if (!s3Client) {
      // Mode simulation - retourner un stream vide
      console.log(`📥 [S3] Simulation téléchargement facture: ${invoiceId}`);
      const mockStream = new Readable();
      mockStream.push("PDF simulation content");
      mockStream.push(null);
      return mockStream;
    }

    try {
      const key = `invoices/${invoiceId}.pdf`;
      const bucketName = process.env.AWS_S3_BUCKET!;

      console.log(`📥 [S3] Téléchargement facture depuis S3: ${key}`);

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new Error("Fichier PDF introuvable");
      }

      console.log(`✅ [S3] Facture téléchargée depuis S3`);
      return response.Body as Readable;
    } catch (error) {
      console.error("❌ [S3] Erreur téléchargement facture:", error);
      throw new Error(`Échec du téléchargement S3: ${error}`);
    }
  }

  /**
   * Vérifie si une facture existe sur S3
   * @param invoiceId - ID de la facture
   * @returns true si le fichier existe
   */
  static async invoiceExists(invoiceId: string): Promise<boolean> {
    const s3Client = this.getS3Client();

    if (!s3Client) {
      // Mode simulation - toujours true
      console.log(`🔍 [S3] Simulation vérification existence: ${invoiceId}`);
      return true;
    }

    try {
      const key = `invoices/${invoiceId}.pdf`;
      const bucketName = process.env.AWS_S3_BUCKET!;

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === "NoSuchKey") {
        return false;
      }
      console.error("❌ [S3] Erreur vérification existence:", error);
      throw error;
    }
  }
}