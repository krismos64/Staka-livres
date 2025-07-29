import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { InvoiceService } from "../services/invoiceService";
import { MailerService } from "../utils/mailer";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

/**
 * Contrôleur admin pour la gestion des factures (stockage local)
 */
export class AdminInvoiceController {
  /**
   * GET /admin/factures
   * Liste paginée de toutes les factures
   */
  static async getAllInvoices(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      console.log(`📋 [AdminInvoices] Récupération factures - Page ${page}, Limit ${limit}`);

      // Récupérer les factures avec informations complètes
      const invoices = await prisma.invoice.findMany({
        include: {
          commande: {
            select: {
              id: true,
              titre: true,
              statut: true,
              amount: true,
              user: {
                select: {
                  id: true,
                  prenom: true,
                  nom: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      });

      // Compter le total
      const total = await prisma.invoice.count();
      const totalPages = Math.ceil(total / limit);

      console.log(`✅ [AdminInvoices] ${invoices.length} factures récupérées (${total} total)`);

      res.json({
        invoices: invoices.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          amount: invoice.amount,
          amountFormatted: `${(invoice.amount / 100).toFixed(2)} €`,
          pdfUrl: invoice.pdfUrl,
          createdAt: invoice.createdAt,
          commande: {
            id: invoice.commande.id,
            titre: invoice.commande.titre,
            statut: invoice.commande.statut,
            amount: invoice.commande.amount,
            client: {
              id: invoice.commande.user.id,
              nom: `${invoice.commande.user.prenom} ${invoice.commande.user.nom}`,
              email: invoice.commande.user.email,
            },
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error("❌ [AdminInvoices] Erreur récupération factures:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération des factures",
      });
    }
  }

  /**
   * GET /admin/factures/:id
   * Détails d'une facture spécifique
   */
  static async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const invoiceId = req.params.id;

      console.log(`📄 [AdminInvoices] Récupération détails facture ${invoiceId}`);

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          commande: {
            include: {
              user: {
                select: {
                  id: true,
                  prenom: true,
                  nom: true,
                  email: true,
                  adresse: true,
                  telephone: true,
                },
              },
            },
          },
        },
      });

      if (!invoice) {
        console.log(`❌ [AdminInvoices] Facture ${invoiceId} non trouvée`);
        res.status(404).json({
          error: "Facture non trouvée",
        });
        return;
      }

      console.log(`✅ [AdminInvoices] Détails facture ${invoiceId} récupérés`);

      res.json({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount,
        amountFormatted: `${(invoice.amount / 100).toFixed(2)} €`,
        pdfUrl: invoice.pdfUrl,
        createdAt: invoice.createdAt,
        commande: {
          id: invoice.commande.id,
          titre: invoice.commande.titre,
          description: invoice.commande.description,
          statut: invoice.commande.statut,
          amount: invoice.commande.amount,
          createdAt: invoice.commande.createdAt,
          client: {
            id: invoice.commande.user.id,
            prenom: invoice.commande.user.prenom,
            nom: invoice.commande.user.nom,
            email: invoice.commande.user.email,
            adresse: invoice.commande.user.adresse,
            telephone: invoice.commande.user.telephone,
          },
        },
      });
    } catch (error) {
      console.error("❌ [AdminInvoices] Erreur récupération détails:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération des détails de la facture",
      });
    }
  }

  /**
   * GET /admin/factures/:id/download
   * Téléchargement sécurisé du PDF (stockage local)
   */
  static async downloadInvoice(req: Request, res: Response): Promise<void> {
    try {
      const invoiceId = req.params.id;

      console.log(`📥 [AdminInvoices] Demande téléchargement facture ${invoiceId}`);

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          commande: {
            select: {
              titre: true,
            },
          },
        },
      });

      if (!invoice) {
        console.log(`❌ [AdminInvoices] Facture ${invoiceId} non trouvée`);
        res.status(404).json({
          error: "Facture non trouvée",
        });
        return;
      }

      // Construire le chemin du fichier local
      if (invoice.pdfUrl.startsWith('/uploads/invoices/')) {
        const filename = path.basename(invoice.pdfUrl);
        const filePath = path.join(__dirname, '../../uploads/invoices', filename);
        
        // Vérifier que le fichier existe
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️ [AdminInvoices] Fichier PDF non trouvé: ${filePath}`);
          res.status(404).json({
            error: "Fichier PDF non trouvé sur le serveur",
          });
          return;
        }

        // Configurer les headers pour le téléchargement
        const downloadFilename = `facture-${invoice.number}-${invoice.commande.titre.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${downloadFilename}"`);
        res.setHeader("Cache-Control", "private, no-cache");

        // Envoyer le fichier
        res.sendFile(filePath);
        console.log(`✅ [AdminInvoices] Fichier envoyé: ${downloadFilename}`);
      } else {
        // Fallback vers redirection pour les anciennes URLs
        console.log(`🔄 [AdminInvoices] Redirection vers URL: ${invoice.pdfUrl}`);
        res.redirect(invoice.pdfUrl);
      }
    } catch (error) {
      console.error("❌ [AdminInvoices] Erreur téléchargement:", error);
      res.status(500).json({
        error: "Erreur lors du téléchargement de la facture",
      });
    }
  }

  /**
   * POST /admin/factures/:id/regenerate
   * Régénérer le PDF d'une facture
   */
  static async regenerateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const invoiceId = req.params.id;

      console.log(`🔄 [AdminInvoices] Régénération facture ${invoiceId}`);

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          commande: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!invoice) {
        console.log(`❌ [AdminInvoices] Facture ${invoiceId} non trouvée`);
        res.status(404).json({
          error: "Facture non trouvée",
        });
        return;
      }

      // Régénérer le PDF avec InvoiceService
      const pdfBuffer = await InvoiceService.generateInvoicePDF({
        id: invoice.commande.id,
        titre: invoice.commande.titre,
        description: invoice.commande.description,
        amount: invoice.commande.amount,
        updatedAt: invoice.commande.updatedAt,
        user: {
          id: invoice.commande.user.id,
          prenom: invoice.commande.user.prenom,
          nom: invoice.commande.user.nom,
          email: invoice.commande.user.email,
          adresse: invoice.commande.user.adresse,
        },
      });

      // Sauvegarder le nouveau PDF
      const newPdfUrl = await InvoiceService.uploadInvoicePdf(pdfBuffer, invoice.commande.id);

      // Mettre à jour l'URL en base
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { pdfUrl: newPdfUrl },
      });

      console.log(`✅ [AdminInvoices] Facture ${invoiceId} régénérée avec succès`);

      res.json({
        message: "Facture régénérée avec succès",
        pdfUrl: newPdfUrl,
      });
    } catch (error) {
      console.error("❌ [AdminInvoices] Erreur régénération:", error);
      res.status(500).json({
        error: "Erreur lors de la régénération de la facture",
      });
    }
  }

  /**
   * POST /admin/factures/:id/resend
   * Renvoyer une facture par email au client
   */
  static async resendInvoice(req: Request, res: Response): Promise<void> {
    try {
      const invoiceId = req.params.id;

      console.log(`📧 [AdminInvoices] Renvoi facture ${invoiceId} par email`);

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          commande: {
            include: {
              user: {
                select: {
                  prenom: true,
                  nom: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!invoice) {
        console.log(`❌ [AdminInvoices] Facture ${invoiceId} non trouvée`);
        res.status(404).json({
          error: "Facture non trouvée",
        });
        return;
      }

      // Vérifier que le PDF existe
      if (invoice.pdfUrl.startsWith('/uploads/invoices/')) {
        const filename = path.basename(invoice.pdfUrl);
        const filePath = path.join(__dirname, '../../uploads/invoices', filename);
        
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️ [AdminInvoices] PDF manquant, régénération...`);
          // Régénérer automatiquement si le PDF manque
          await AdminInvoiceController.regenerateInvoice(req, res);
          return;
        }

        // Lire le fichier PDF
        const pdfBuffer = fs.readFileSync(filePath);

        // Envoyer par email
        await MailerService.sendEmail({
          to: invoice.commande.user.email,
          subject: `Facture ${invoice.number} - ${invoice.commande.titre}`,
          html: `
            <h2>Votre facture Staka Livres</h2>
            <p>Bonjour ${invoice.commande.user.prenom},</p>
            <p>Veuillez trouver ci-joint votre facture n° <strong>${invoice.number}</strong> pour la commande "${invoice.commande.titre}".</p>
            <p>Montant : <strong>${(invoice.amount / 100).toFixed(2)} €</strong></p>
            <p>Cordialement,<br>L'équipe Staka Livres</p>
          `,
          attachments: [
            {
              filename: `facture-${invoice.number}.pdf`,
              content: pdfBuffer.toString('base64'),
              type: 'application/pdf',
              disposition: 'attachment',
            },
          ],
        });

        console.log(`✅ [AdminInvoices] Facture ${invoiceId} renvoyée à ${invoice.commande.user.email}`);

        res.json({
          message: `Facture renvoyée avec succès à ${invoice.commande.user.email}`,
        });
      } else {
        res.status(400).json({
          error: "Format de facture non supporté pour l'envoi par email",
        });
      }
    } catch (error) {
      console.error("❌ [AdminInvoices] Erreur renvoi email:", error);
      res.status(500).json({
        error: "Erreur lors du renvoi de la facture par email",
      });
    }
  }
}