import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface InvoiceData {
  id: string;
  number: string;
  amount: number;
  taxAmount: number;
  issuedAt: Date;
  dueAt: Date | null;
  commande: {
    id: string;
    titre: string;
    description: string | null;
    user: {
      id: string;
      prenom: string;
      nom: string;
      email: string;
      adresse?: string | null;
    };
  };
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Service PDF pour la génération de factures
 */
export class PdfService {
  /**
   * Génère un PDF de facture avec un design professionnel
   */
  static async buildInvoicePdf(invoiceData: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🎯 [PDF] Génération PDF pour facture ${invoiceData.number}`);

        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: `Facture ${invoiceData.number}`,
            Author: 'Staka Livres',
            Subject: 'Facture de correction de manuscrit',
            Creator: 'Staka Livres Platform'
          }
        });
        
        const chunks: Buffer[] = [];

        // Capturer les données du PDF
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          console.log(`✅ [PDF] PDF généré: ${pdfBuffer.length} bytes`);
          resolve(pdfBuffer);
        });
        doc.on("error", reject);

        // Ajouter le contenu du PDF
        this.addHeader(doc, invoiceData);
        this.addCompanyInfo(doc);
        this.addClientInfo(doc, invoiceData);
        this.addInvoiceDetails(doc, invoiceData);
        this.addItemsTable(doc, invoiceData);
        this.addTotals(doc, invoiceData);
        this.addFooter(doc, invoiceData);

        // Finaliser le PDF
        doc.end();
      } catch (error) {
        console.error("❌ [PDF] Erreur génération PDF:", error);
        reject(error);
      }
    });
  }

  /**
   * Ajoute l'en-tête de la facture
   */
  private static addHeader(doc: any, invoiceData: InvoiceData): void {
    // Logo (si disponible)
    const logoPath = path.join(__dirname, '../../assets/logo.png');
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 50, 45, { width: 80 });
      } catch (error) {
        console.warn("⚠️ [PDF] Logo non trouvé, utilisation du texte");
      }
    }

    // Titre principal
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2563eb')
       .text('FACTURE', 50, 50);

    // Numéro de facture et date
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#000000')
       .text(`Facture N° ${invoiceData.number}`, 350, 50)
       .text(`Date d'émission: ${this.formatDate(invoiceData.issuedAt)}`, 350, 70);

    if (invoiceData.dueAt) {
      doc.text(`Date d'échéance: ${this.formatDate(invoiceData.dueAt)}`, 350, 90);
    }

    // Ligne de séparation
    doc.moveTo(50, 120)
       .lineTo(550, 120)
       .strokeColor('#e5e7eb')
       .stroke();
  }

  /**
   * Ajoute les informations de l'entreprise
   */
  private static addCompanyInfo(doc: any): void {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#1f2937')
       .text('STAKA LIVRES', 50, 140);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Correction et édition de manuscrits', 50, 160)
       .text('123 Rue des Livres', 50, 175)
       .text('75000 Paris, France', 50, 190)
       .text('Tél: +33 1 23 45 67 89', 50, 205)
       .text('Email: contact@staka-livres.com', 50, 220)
       .text('SIRET: 123 456 789 00010', 50, 235);
  }

  /**
   * Ajoute les informations du client
   */
  private static addClientInfo(doc: any, invoiceData: InvoiceData): void {
    const user = invoiceData.commande.user;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1f2937')
       .text('FACTURÉ À:', 350, 140);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#374151')
       .text(`${user.prenom} ${user.nom}`, 350, 160)
       .text(user.email, 350, 175);

    if (user.adresse) {
      doc.text(user.adresse, 350, 190, { width: 150 });
    }
  }

  /**
   * Ajoute les détails de la facture
   */
  private static addInvoiceDetails(doc: any, invoiceData: InvoiceData): void {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1f2937')
       .text('PROJET:', 50, 280);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#374151')
       .text(invoiceData.commande.titre, 50, 300);

    if (invoiceData.commande.description) {
      doc.text('Description:', 50, 320)
         .text(invoiceData.commande.description, 50, 335, { width: 450 });
    }
  }

  /**
   * Ajoute le tableau des éléments
   */
  private static addItemsTable(doc: any, invoiceData: InvoiceData): void {
    const tableTop = 380;
    const itemHeight = 30;

    // En-tête du tableau
    doc.rect(50, tableTop, 500, 25)
       .fillColor('#f3f4f6')
       .fill();

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#374151')
       .text('DESCRIPTION', 60, tableTop + 8)
       .text('QTÉ', 300, tableTop + 8)
       .text('PRIX UNITAIRE HT', 350, tableTop + 8)
       .text('MONTANT TTC', 450, tableTop + 8);

    // Ligne de l'élément
    const itemY = tableTop + 25;
    
    doc.rect(50, itemY, 500, itemHeight)
       .fillColor('#ffffff')
       .fill()
       .rect(50, itemY, 500, itemHeight)
       .strokeColor('#e5e7eb')
       .stroke();

    const unitPrice = invoiceData.amount / 100;
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#000000')
       .text(invoiceData.commande.titre, 60, itemY + 8)
       .text('1', 300, itemY + 8)
       .text(`${unitPrice.toFixed(2)} €`, 350, itemY + 8)
       .text(`${unitPrice.toFixed(2)} €`, 450, itemY + 8);
  }

  /**
   * Ajoute les totaux
   */
  private static addTotals(doc: any, invoiceData: InvoiceData): void {
    const totalsY = 450;
    const totalHT = (invoiceData.amount - invoiceData.taxAmount) / 100;
    const tva = invoiceData.taxAmount / 100;
    const totalTTC = invoiceData.amount / 100;

    // Zone des totaux
    doc.rect(350, totalsY, 200, 80)
       .fillColor('#f9fafb')
       .fill()
       .rect(350, totalsY, 200, 80)
       .strokeColor('#e5e7eb')
       .stroke();

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#374151')
       .text('Total HT:', 360, totalsY + 10)
       .text(`${totalHT.toFixed(2)} €`, 480, totalsY + 10)
       .text('TVA (20%):', 360, totalsY + 30)
       .text(`${tva.toFixed(2)} €`, 480, totalsY + 30);

    // Total TTC
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1f2937')
       .text('TOTAL TTC:', 360, totalsY + 55)
       .text(`${totalTTC.toFixed(2)} €`, 460, totalsY + 55);
  }

  /**
   * Ajoute le pied de page
   */
  private static addFooter(doc: any, invoiceData: InvoiceData): void {
    // Ligne de séparation
    doc.moveTo(50, 580)
       .lineTo(550, 580)
       .strokeColor('#e5e7eb')
       .stroke();

    // Conditions de paiement
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#1f2937')
       .text('CONDITIONS DE PAIEMENT', 50, 600);

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Paiement par carte bancaire via Stripe', 50, 615)
       .text('Règlement à réception de facture', 50, 630);

    // Mentions légales
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#9ca3af')
       .text('TVA non applicable - Article 293 B du CGI', 50, 670)
       .text('En cas de retard de paiement, des pénalités de 3 fois le taux légal seront appliquées.', 50, 685)
       .text('Merci pour votre confiance !', 50, 700);

    // Informations techniques
    doc.fontSize(7)
       .fillColor('#d1d5db')
       .text(`Facture générée le ${this.formatDate(new Date())} - Staka Livres Platform`, 350, 720);
  }

  /**
   * Formate une date au format français
   */
  private static formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}