import { PrismaClient } from "@prisma/client";
import express from "express";
import path from "path";
import fs from "fs";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /invoices
 * Liste paginée des factures de l'utilisateur connecté
 */
router.get(
  "/",
  authenticateToken,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req as any).user.id;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        50,
        Math.max(1, parseInt(req.query.limit as string) || 10)
      );
      const skip = (page - 1) * limit;

      console.log(
        `📋 [Invoices] Récupération des factures pour utilisateur ${userId}`
      );
      console.log(`📄 [Invoices] Pagination: page ${page}, limit ${limit}`);

      // Récupérer les factures avec informations de commande
      const invoices = await prisma.invoice.findMany({
        where: {
          commande: {
            userId: userId,
          },
        },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          pdfUrl: true,
          commande: {
            select: {
              id: true,
              titre: true,
              statut: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      });

      // Compter le total pour la pagination
      const total = await prisma.invoice.count({
        where: {
          commande: {
            userId: userId,
          },
        },
      });

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      console.log(
        `✅ [Invoices] ${invoices.length} factures trouvées (${total} total)`
      );

      res.json({
        invoices: invoices.map((invoice) => ({
          id: invoice.id,
          amount: invoice.amount,
          amountFormatted: `${(invoice.amount / 100).toFixed(2)} €`,
          createdAt: invoice.createdAt,
          pdfUrl: invoice.pdfUrl,
          commande: {
            id: invoice.commande.id,
            titre: invoice.commande.titre,
            statut: invoice.commande.statut,
            createdAt: invoice.commande.createdAt,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      });
    } catch (error) {
      console.error("❌ [Invoices] Erreur lors de la récupération:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération des factures",
      });
    }
  }
);

/**
 * GET /invoices/:id/download
 * Téléchargement sécurisé du PDF de facture (stockage local)
 */
router.get(
  "/:id/download",
  authenticateToken,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req as any).user.id;
      const invoiceId = req.params.id;

      console.log(
        `📥 [Invoices] Demande de téléchargement facture ${invoiceId} par utilisateur ${userId}`
      );

      // Récupérer la facture avec vérification de propriétaire
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          commande: {
            select: {
              userId: true,
              titre: true,
            },
          },
        },
      });

      if (!invoice) {
        console.log(`❌ [Invoices] Facture ${invoiceId} non trouvée`);
        return res.status(404).json({
          error: "Facture non trouvée",
        });
      }

      // Vérifier que la facture appartient à l'utilisateur
      if (invoice.commande.userId !== userId) {
        console.log(
          `❌ [Invoices] Accès non autorisé à la facture ${invoiceId} pour utilisateur ${userId}`
        );
        return res.status(403).json({
          error: "Accès non autorisé à cette facture",
        });
      }

      console.log(
        `✅ [Invoices] Facture ${invoiceId} validée pour téléchargement`
      );

      // Construire le chemin du fichier local
      if (invoice.pdfUrl.startsWith('/uploads/invoices/')) {
        const filename = path.basename(invoice.pdfUrl);
        const filePath = path.join(__dirname, '../../uploads/invoices', filename);
        
        // Vérifier que le fichier existe
        if (!fs.existsSync(filePath)) {
          console.log(`❌ [Invoices] Fichier non trouvé: ${filePath}`);
          return res.status(404).json({
            error: "Fichier de facture non trouvé",
          });
        }

        // Configurer les headers pour le téléchargement
        const downloadFilename = `facture-${invoice.commande.titre.replace(
          /[^a-zA-Z0-9]/g,
          "-"
        )}-${invoiceId.slice(-8)}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${downloadFilename}"`
        );
        res.setHeader("Cache-Control", "private, no-cache");

        // Envoyer le fichier
        res.sendFile(filePath);
        console.log(`✅ [Invoices] Fichier envoyé avec succès: ${downloadFilename}`);
      } else {
        // Fallback vers redirection pour les anciennes URLs
        console.log(`🔄 [Invoices] Redirection vers URL: ${invoice.pdfUrl}`);
        return res.redirect(invoice.pdfUrl);
      }
    } catch (error) {
      console.error("❌ [Invoices] Erreur lors du téléchargement:", error);
      res.status(500).json({
        error: "Erreur lors du téléchargement de la facture",
      });
    }
  }
);

/**
 * GET /invoices/:id
 * Détails d'une facture spécifique
 */
router.get(
  "/:id",
  authenticateToken,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req as any).user.id;
      const invoiceId = req.params.id;

      console.log(
        `📄 [Invoices] Récupération détails facture ${invoiceId} pour utilisateur ${userId}`
      );

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          commande: {
            select: {
              id: true,
              userId: true,
              titre: true,
              description: true,
              statut: true,
              createdAt: true,
              updatedAt: true,
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
        console.log(`❌ [Invoices] Facture ${invoiceId} non trouvée`);
        return res.status(404).json({
          error: "Facture non trouvée",
        });
      }

      // Vérifier que la facture appartient à l'utilisateur
      if (invoice.commande.userId !== userId) {
        console.log(
          `❌ [Invoices] Accès non autorisé à la facture ${invoiceId}`
        );
        return res.status(403).json({
          error: "Accès non autorisé à cette facture",
        });
      }

      console.log(
        `✅ [Invoices] Détails facture ${invoiceId} récupérés avec succès`
      );

      res.json({
        id: invoice.id,
        amount: invoice.amount,
        amountFormatted: `${(invoice.amount / 100).toFixed(2)} €`,
        createdAt: invoice.createdAt,
        pdfUrl: invoice.pdfUrl,
        commande: {
          id: invoice.commande.id,
          titre: invoice.commande.titre,
          description: invoice.commande.description,
          statut: invoice.commande.statut,
          createdAt: invoice.commande.createdAt,
          updatedAt: invoice.commande.updatedAt,
          user: invoice.commande.user,
        },
      });
    } catch (error) {
      console.error(
        "❌ [Invoices] Erreur lors de la récupération des détails:",
        error
      );
      res.status(500).json({
        error: "Erreur lors de la récupération des détails de la facture",
      });
    }
  }
);

export default router;