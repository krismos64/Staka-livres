import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Commande, PrismaClient, User } from "@prisma/client";
import PDFDocument from "pdfkit";
import { MailerService } from "../utils/mailer";

const prisma = new PrismaClient();

// Configuration S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-west-3",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export interface CommandeWithUser extends Commande {
  user: User;
}

/**
 * Service de gestion des factures
 */
export class InvoiceService {
  /**
   * Génère un PDF de facture pour une commande
   */
  static async generateInvoicePDF(commande: CommandeWithUser): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🎯 [Invoice] Génération PDF pour commande ${commande.id}`);

        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        // Capturer les données du PDF
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          console.log(`✅ [Invoice] PDF généré: ${pdfBuffer.length} bytes`);
          resolve(pdfBuffer);
        });
        doc.on("error", reject);

        // En-tête de la facture
        doc.fontSize(20).font("Helvetica-Bold").text("FACTURE", 50, 50);
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(
            `Facture N° INV-${commande.id.slice(-8).toUpperCase()}`,
            50,
            80
          );
        doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 50, 100);

        // Informations entreprise
        doc.fontSize(14).font("Helvetica-Bold").text("STAKA LIVRES", 350, 50);
        doc
          .fontSize(10)
          .font("Helvetica")
          .text("123 Rue des Livres", 350, 70)
          .text("75000 Paris, France", 350, 85)
          .text("Tél: +33 1 23 45 67 89", 350, 100)
          .text("Email: contact@staka-livres.com", 350, 115);

        // Informations client
        doc.fontSize(12).font("Helvetica-Bold").text("FACTURÉ À:", 50, 160);
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`${commande.user.prenom} ${commande.user.nom}`, 50, 180)
          .text(commande.user.email, 50, 195);

        // Ligne de séparation
        doc.moveTo(50, 230).lineTo(550, 230).stroke();

        // Détails de la commande
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("DÉTAILS DE LA COMMANDE", 50, 250);

        const tableTop = 280;
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Description", 50, tableTop)
          .text("Quantité", 250, tableTop)
          .text("Prix unitaire", 350, tableTop)
          .text("Total", 450, tableTop);

        // Ligne sous l'en-tête du tableau
        doc
          .moveTo(50, tableTop + 20)
          .lineTo(550, tableTop + 20)
          .stroke();

        // Contenu du tableau
        const itemY = tableTop + 35;
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(commande.titre, 50, itemY)
          .text("1", 250, itemY)
          .text(`${(commande.amount! / 100).toFixed(2)} €`, 350, itemY)
          .text(`${(commande.amount! / 100).toFixed(2)} €`, 450, itemY);

        if (commande.description) {
          doc
            .fontSize(8)
            .text(commande.description, 50, itemY + 15, { width: 180 });
        }

        // Ligne de séparation
        doc
          .moveTo(50, itemY + 40)
          .lineTo(550, itemY + 40)
          .stroke();

        // Total
        const totalY = itemY + 60;
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("TOTAL:", 400, totalY)
          .text(`${(commande.amount! / 100).toFixed(2)} €`, 450, totalY);

        // Pied de page
        doc
          .fontSize(8)
          .font("Helvetica")
          .text("Merci pour votre confiance !", 50, 700)
          .text("TVA non applicable - Article 293 B du CGI", 50, 715)
          .text(
            `Commande traitée le ${commande.updatedAt.toLocaleDateString(
              "fr-FR"
            )}`,
            50,
            730
          );

        // Finaliser le PDF
        doc.end();
      } catch (error) {
        console.error("❌ [Invoice] Erreur génération PDF:", error);
        reject(error);
      }
    });
  }

  /**
   * Upload un PDF sur S3 et retourne l'URL publique
   */
  static async uploadInvoicePdf(
    pdfBuffer: Buffer,
    commandeId: string
  ): Promise<string> {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.S3_BUCKET_NAME) {
      console.warn("⚠️ [Invoice] S3 non configuré - simulation d'upload");
      const mockUrl = `https://mock-s3.amazonaws.com/invoices/INV-${commandeId.slice(
        -8
      )}.pdf`;
      console.log(`📤 [Invoice] Simulation upload: ${mockUrl}`);
      return mockUrl;
    }

    try {
      const fileName = `invoices/INV-${commandeId.slice(-8)}-${Date.now()}.pdf`;
      const bucketName = process.env.S3_BUCKET_NAME;

      console.log(`📤 [Invoice] Upload vers S3: ${fileName}`);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: pdfBuffer,
        ContentType: "application/pdf",
        ContentDisposition: "attachment",
      });

      await s3Client.send(command);

      const fileUrl = `https://${bucketName}.s3.${
        process.env.AWS_REGION || "eu-west-3"
      }.amazonaws.com/${fileName}`;
      console.log(`✅ [Invoice] Fichier uploadé: ${fileUrl}`);

      return fileUrl;
    } catch (error) {
      console.error("❌ [Invoice] Erreur upload S3:", error);
      throw new Error(`Échec de l'upload S3: ${error}`);
    }
  }

  /**
   * Processus complet: génération + upload + envoi email + création en base
   */
  static async processInvoiceForCommande(
    commande: CommandeWithUser
  ): Promise<void> {
    try {
      console.log(
        `🎯 [Invoice] Traitement facture pour commande ${commande.id}`
      );

      // 1. Générer le PDF
      const pdfBuffer = await this.generateInvoicePDF(commande);

      // 2. Upload sur S3
      const pdfUrl = await this.uploadInvoicePdf(pdfBuffer, commande.id);

      // 3. Créer l'enregistrement en base
      const invoice = await prisma.invoice.create({
        data: {
          commandeId: commande.id,
          amount: commande.amount!,
          pdfUrl,
        },
      });

      console.log(`💾 [Invoice] Facture créée en base: ${invoice.id}`);

      // 4. Envoyer par email
      await MailerService.sendInvoiceEmail(
        commande.user.email,
        pdfUrl,
        commande.titre
      );

      console.log(
        `✅ [Invoice] Processus terminé pour commande ${commande.id}`
      );
    } catch (error) {
      console.error(`❌ [Invoice] Erreur lors du traitement:`, error);
      throw error;
    }
  }
}

export default InvoiceService;
