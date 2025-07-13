import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";

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

/**
 * Service PDF pour la génération de factures avec pdf-lib
 */
export class PdfService {
  /**
   * Génère un PDF de facture avec un design professionnel
   */
  static async buildInvoicePdf(invoiceData: InvoiceData): Promise<Buffer> {
    try {
      console.log(`🎯 [PDF] Génération PDF pour facture ${invoiceData.number}`);

      // Créer un nouveau document PDF
      const pdfDoc = await PDFDocument.create();
      
      // Définir les métadonnées
      pdfDoc.setTitle(`Facture ${invoiceData.number}`);
      pdfDoc.setAuthor('Staka Livres');
      pdfDoc.setSubject('Facture de correction de manuscrit');
      pdfDoc.setCreator('Staka Livres Platform');
      pdfDoc.setProducer('pdf-lib');

      // Ajouter une page A4
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 en points
      
      // Charger les polices
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Couleurs
      const blueColor = rgb(0.15, 0.39, 0.92); // #2563eb
      const darkGrayColor = rgb(0.12, 0.16, 0.22); // #1f2937
      const mediumGrayColor = rgb(0.42, 0.45, 0.50); // #6b7280
      const lightGrayColor = rgb(0.90, 0.91, 0.93); // #e5e7eb

      let currentY = 750; // Position Y de départ

      // Logo et en-tête
      try {
        const logoPath = path.join(__dirname, '../../assets/logo.png');
        if (fs.existsSync(logoPath)) {
          const logoBytes = fs.readFileSync(logoPath);
          const logoImage = await pdfDoc.embedPng(logoBytes);
          const logoDims = logoImage.scale(0.3);
          page.drawImage(logoImage, {
            x: 50,
            y: currentY - 50,
            width: logoDims.width,
            height: logoDims.height,
          });
        }
      } catch (error) {
        console.warn("⚠️ [PDF] Logo non trouvé, utilisation du texte");
      }

      // Titre FACTURE
      page.drawText('FACTURE', {
        x: 50,
        y: currentY,
        size: 24,
        font: helveticaBold,
        color: blueColor,
      });

      // Informations facture (droite)
      page.drawText(`Facture N° ${invoiceData.number}`, {
        x: 350,
        y: currentY,
        size: 12,
        font: helvetica,
        color: darkGrayColor,
      });

      page.drawText(`Date d'émission: ${this.formatDate(invoiceData.issuedAt)}`, {
        x: 350,
        y: currentY - 20,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      if (invoiceData.dueAt) {
        page.drawText(`Date d'échéance: ${this.formatDate(invoiceData.dueAt)}`, {
          x: 350,
          y: currentY - 40,
          size: 10,
          font: helvetica,
          color: darkGrayColor,
        });
      }

      currentY -= 80;

      // Ligne de séparation
      page.drawLine({
        start: { x: 50, y: currentY },
        end: { x: 545, y: currentY },
        thickness: 1,
        color: lightGrayColor,
      });

      currentY -= 30;

      // Informations entreprise
      page.drawText('STAKA LIVRES', {
        x: 50,
        y: currentY,
        size: 14,
        font: helveticaBold,
        color: darkGrayColor,
      });

      currentY -= 20;
      const companyInfo = [
        'Correction et édition de manuscrits',
        '123 Rue des Livres',
        '75000 Paris, France',
        'Tél: +33 1 23 45 67 89',
        'Email: contact@staka-livres.com',
        'SIRET: 123 456 789 00010'
      ];

      companyInfo.forEach(info => {
        page.drawText(info, {
          x: 50,
          y: currentY,
          size: 10,
          font: helvetica,
          color: mediumGrayColor,
        });
        currentY -= 15;
      });

      // Informations client (droite)
      let clientY = currentY + (companyInfo.length * 15) + 20;
      page.drawText('FACTURÉ À:', {
        x: 350,
        y: clientY,
        size: 12,
        font: helveticaBold,
        color: darkGrayColor,
      });

      clientY -= 20;
      const user = invoiceData.commande.user;
      page.drawText(`${user.prenom} ${user.nom}`, {
        x: 350,
        y: clientY,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      clientY -= 15;
      page.drawText(user.email, {
        x: 350,
        y: clientY,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      if (user.adresse) {
        const adresseLines = user.adresse.split('\n');
        adresseLines.forEach(ligne => {
          clientY -= 15;
          page.drawText(ligne, {
            x: 350,
            y: clientY,
            size: 10,
            font: helvetica,
            color: darkGrayColor,
          });
        });
      }

      currentY -= 60;

      // Détails du projet
      page.drawText('PROJET:', {
        x: 50,
        y: currentY,
        size: 12,
        font: helveticaBold,
        color: darkGrayColor,
      });

      currentY -= 20;
      page.drawText(invoiceData.commande.titre, {
        x: 50,
        y: currentY,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      if (invoiceData.commande.description) {
        currentY -= 20;
        page.drawText('Description:', {
          x: 50,
          y: currentY,
          size: 10,
          font: helvetica,
          color: darkGrayColor,
        });
        
        currentY -= 15;
        // Découper la description en lignes si nécessaire
        const maxWidth = 450;
        const words = invoiceData.commande.description.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = helvetica.widthOfTextAtSize(testLine, 10);
          
          if (textWidth > maxWidth && currentLine) {
            page.drawText(currentLine, {
              x: 50,
              y: currentY,
              size: 10,
              font: helvetica,
              color: darkGrayColor,
            });
            currentY -= 15;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          page.drawText(currentLine, {
            x: 50,
            y: currentY,
            size: 10,
            font: helvetica,
            color: darkGrayColor,
          });
        }
      }

      currentY -= 40;

      // Tableau des éléments
      const tableTop = currentY;
      
      // En-tête du tableau (rectangle de fond)
      page.drawRectangle({
        x: 50,
        y: tableTop - 25,
        width: 495,
        height: 25,
        color: rgb(0.95, 0.96, 0.97), // #f3f4f6
      });

      // Bordure en-tête
      page.drawRectangle({
        x: 50,
        y: tableTop - 25,
        width: 495,
        height: 25,
        borderColor: lightGrayColor,
        borderWidth: 1,
      });

      // Textes en-tête
      page.drawText('DESCRIPTION', {
        x: 60,
        y: tableTop - 18,
        size: 10,
        font: helveticaBold,
        color: darkGrayColor,
      });

      page.drawText('QTÉ', {
        x: 300,
        y: tableTop - 18,
        size: 10,
        font: helveticaBold,
        color: darkGrayColor,
      });

      page.drawText('PRIX UNITAIRE HT', {
        x: 350,
        y: tableTop - 18,
        size: 10,
        font: helveticaBold,
        color: darkGrayColor,
      });

      page.drawText('MONTANT TTC', {
        x: 450,
        y: tableTop - 18,
        size: 10,
        font: helveticaBold,
        color: darkGrayColor,
      });

      // Ligne de l'élément
      const itemY = tableTop - 25;
      
      page.drawRectangle({
        x: 50,
        y: itemY - 30,
        width: 495,
        height: 30,
        borderColor: lightGrayColor,
        borderWidth: 1,
      });

      const unitPrice = invoiceData.amount / 100;
      
      page.drawText(invoiceData.commande.titre, {
        x: 60,
        y: itemY - 18,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      page.drawText('1', {
        x: 300,
        y: itemY - 18,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      page.drawText(`${unitPrice.toFixed(2)} €`, {
        x: 350,
        y: itemY - 18,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      page.drawText(`${unitPrice.toFixed(2)} €`, {
        x: 450,
        y: itemY - 18,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      currentY = itemY - 60;

      // Zone des totaux
      const totalsY = currentY;
      const totalHT = (invoiceData.amount - invoiceData.taxAmount) / 100;
      const tva = invoiceData.taxAmount / 100;
      const totalTTC = invoiceData.amount / 100;

      // Rectangle de fond pour les totaux
      page.drawRectangle({
        x: 350,
        y: totalsY - 80,
        width: 195,
        height: 80,
        color: rgb(0.98, 0.98, 0.99), // #f9fafb
        borderColor: lightGrayColor,
        borderWidth: 1,
      });

      page.drawText('Total HT:', {
        x: 360,
        y: totalsY - 20,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      page.drawText(`${totalHT.toFixed(2)} €`, {
        x: 480,
        y: totalsY - 20,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      page.drawText('TVA (20%):', {
        x: 360,
        y: totalsY - 40,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      page.drawText(`${tva.toFixed(2)} €`, {
        x: 480,
        y: totalsY - 40,
        size: 10,
        font: helvetica,
        color: darkGrayColor,
      });

      // Total TTC
      page.drawText('TOTAL TTC:', {
        x: 360,
        y: totalsY - 65,
        size: 12,
        font: helveticaBold,
        color: darkGrayColor,
      });

      page.drawText(`${totalTTC.toFixed(2)} €`, {
        x: 460,
        y: totalsY - 65,
        size: 12,
        font: helveticaBold,
        color: darkGrayColor,
      });

      currentY -= 120;

      // Pied de page
      // Ligne de séparation
      page.drawLine({
        start: { x: 50, y: currentY },
        end: { x: 545, y: currentY },
        thickness: 1,
        color: lightGrayColor,
      });

      currentY -= 30;

      // Conditions de paiement
      page.drawText('CONDITIONS DE PAIEMENT', {
        x: 50,
        y: currentY,
        size: 10,
        font: helveticaBold,
        color: darkGrayColor,
      });

      currentY -= 20;
      const paymentConditions = [
        'Paiement par carte bancaire via Stripe',
        'Règlement à réception de facture'
      ];

      paymentConditions.forEach(condition => {
        page.drawText(condition, {
          x: 50,
          y: currentY,
          size: 9,
          font: helvetica,
          color: mediumGrayColor,
        });
        currentY -= 15;
      });

      currentY -= 20;

      // Mentions légales
      const legalMentions = [
        'TVA non applicable - Article 293 B du CGI',
        'En cas de retard de paiement, des pénalités de 3 fois le taux légal seront appliquées.',
        'Merci pour votre confiance !'
      ];

      legalMentions.forEach(mention => {
        page.drawText(mention, {
          x: 50,
          y: currentY,
          size: 8,
          font: helvetica,
          color: rgb(0.66, 0.68, 0.72), // #9ca3af
        });
        currentY -= 12;
      });

      // Informations techniques (en bas à droite)
      page.drawText(`Facture générée le ${this.formatDate(new Date())} - Staka Livres Platform`, {
        x: 300,
        y: 30,
        size: 7,
        font: helvetica,
        color: rgb(0.82, 0.84, 0.86), // #d1d5db
      });

      // Générer le PDF en tant que buffer
      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Buffer.from(pdfBytes);
      
      console.log(`✅ [PDF] PDF généré: ${pdfBuffer.length} bytes`);
      return pdfBuffer;

    } catch (error) {
      console.error("❌ [PDF] Erreur génération PDF:", error);
      throw error;
    }
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