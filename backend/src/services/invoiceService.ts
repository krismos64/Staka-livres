import { PrismaClient } from "@prisma/client";
import { PdfService, InvoiceData } from "./pdf";
// Note: S3InvoiceService supprimé - utilisation du stockage local uniquement
import { MailerService } from "../utils/mailer";

const prisma = new PrismaClient();

export interface CommandeWithUser {
  id: string;
  titre: string;
  description: string | null;
  amount: number | null;
  updatedAt: Date;
  user: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    adresse?: string | null;
  };
}

/**
 * Service de gestion des factures - Version 2025 avec pdf-lib
 */
export class InvoiceService {
  /**
   * Génère un PDF de facture pour une commande en utilisant le nouveau PdfService
   */
  static async generateInvoicePDF(commande: CommandeWithUser): Promise<Buffer> {
    console.log(`🎯 [Invoice] Génération PDF pour commande ${commande.id}`);

    // Préparer les données pour le service PDF
    const invoiceData: InvoiceData = {
      id: commande.id,
      number: `INV-${commande.id.slice(-8).toUpperCase()}`,
      amount: commande.amount || 0,
      taxAmount: Math.round((commande.amount || 0) * 0.2), // TVA 20%
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      commande: {
        id: commande.id,
        titre: commande.titre,
        description: commande.description,
        user: commande.user,
      },
    };

    return await PdfService.buildInvoicePdf(invoiceData);
  }

  /**
   * Sauvegarde le PDF de facture en local et retourne l'URL
   */
  static async uploadInvoicePdf(
    pdfBuffer: Buffer,
    commandeId: string
  ): Promise<string> {
    const fs = await import("fs");
    const path = await import("path");
    
    const invoiceNumber = `INV-${commandeId.slice(-8).toUpperCase()}`;
    const uploadsDir = path.join(__dirname, "../../uploads/invoices");
    
    // Créer le dossier si nécessaire
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `${invoiceNumber}-${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, filename);
    
    // Écrire le fichier
    fs.writeFileSync(filePath, pdfBuffer);
    
    // Retourner l'URL locale
    return `/uploads/invoices/${filename}`;
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
      const invoiceNumber = `FACT-${new Date().getFullYear()}-${Date.now()
        .toString()
        .slice(-6)}`;
      const invoice = await prisma.invoice.create({
        data: {
          commandeId: commande.id,
          number: invoiceNumber,
          amount: commande.amount!,
          pdfUrl,
          status: "GENERATED",
          issuedAt: new Date(),
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
