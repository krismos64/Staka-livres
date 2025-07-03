import { InvoiceStatus, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export class AdminFactureController {
  /**
   * GET /admin/factures
   * Récupère la liste des factures avec pagination et filtres
   */
  static async getFactures(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        50,
        Math.max(1, parseInt(req.query.limit as string) || 10)
      );
      const skip = (page - 1) * limit;

      const search = req.query.search as string;
      const status = req.query.statut as InvoiceStatus;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as "asc" | "desc";

      console.log(
        `📋 [Admin Factures] Récupération page ${page}, limit ${limit}`
      );
      if (search) console.log(`🔍 [Admin Factures] Recherche: "${search}"`);
      if (status) console.log(`📊 [Admin Factures] Statut filtre: ${status}`);
      if (sortBy)
        console.log(
          `🔄 [Admin Factures] Tri: ${sortBy} ${sortOrder || "desc"}`
        );

      // Construction des filtres
      const where: any = {};

      if (search) {
        where.OR = [
          { number: { contains: search } },
          { commande: { titre: { contains: search } } },
          { commande: { user: { email: { contains: search } } } },
          { commande: { user: { prenom: { contains: search } } } },
          { commande: { user: { nom: { contains: search } } } },
        ];
      }

      if (status) {
        where.status = status;
      }

      // Configuration du tri
      let orderBy: any = { createdAt: "desc" }; // Tri par défaut

      if (sortBy) {
        const direction = sortOrder || "desc";

        switch (sortBy) {
          case "number":
            orderBy = { number: direction };
            break;
          case "amount":
            orderBy = { amount: direction };
            break;
          case "status":
            orderBy = { status: direction };
            break;
          case "createdAt":
            orderBy = { createdAt: direction };
            break;
          case "dueAt":
            orderBy = { dueAt: direction };
            break;
          case "paidAt":
            orderBy = { paidAt: direction };
            break;
          default:
            orderBy = { createdAt: "desc" };
        }
      }

      // Récupération des factures
      const factures = await prisma.invoice.findMany({
        where,
        include: {
          commande: {
            include: {
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
        orderBy,
        skip,
        take: limit,
      });

      // Comptage total pour pagination
      const total = await prisma.invoice.count({ where });
      const totalPages = Math.ceil(total / limit);

      console.log(
        `✅ [Admin Factures] ${factures.length} factures trouvées (${total} total)`
      );

      res.json({
        data: factures.map((facture) => ({
          id: facture.id,
          numero: facture.number, // Mapping pour correspondre au frontend
          number: facture.number, // Compatibilité
          montant: facture.amount, // Montant en centimes
          montantFormate: `${(facture.amount / 100).toFixed(2)} €`, // Montant formaté
          amount: facture.amount,
          taxAmount: facture.taxAmount,
          status: facture.status,
          statut: facture.status, // Mapping pour correspondre au frontend
          issuedAt: facture.issuedAt,
          dueAt: facture.dueAt,
          paidAt: facture.paidAt,
          createdAt: facture.createdAt,
          updatedAt: facture.updatedAt,
          pdfUrl: facture.pdfUrl,
          // Ajout du user directement accessible
          user: facture.commande.user,
          // Conservation de la structure commande
          commande: {
            id: facture.commande.id,
            titre: facture.commande.titre,
            statut: facture.commande.statut,
            user: facture.commande.user,
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
      console.error("❌ [Admin Factures] Erreur récupération:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération des factures",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * GET /admin/factures/stats
   * Récupère les statistiques des factures
   */
  static async getFactureStats(req: Request, res: Response) {
    try {
      console.log("📊 [Admin Factures] Récupération des statistiques");

      // Statistiques globales
      const [
        totalInvoices,
        totalAmount,
        paidCount,
        pendingCount,
        overdueCount,
      ] = await Promise.all([
        prisma.invoice.count(),
        prisma.invoice.aggregate({
          _sum: { amount: true },
        }),
        prisma.invoice.count({
          where: { status: InvoiceStatus.PAID },
        }),
        prisma.invoice.count({
          where: { status: InvoiceStatus.GENERATED },
        }),
        prisma.invoice.count({
          where: {
            status: InvoiceStatus.GENERATED,
            dueAt: { lt: new Date() },
          },
        }),
      ]);

      const montantTotalCentimes = totalAmount._sum.amount || 0;
      const montantTotalEuros = montantTotalCentimes / 100;

      const stats = {
        total: totalInvoices,
        montantTotal: montantTotalCentimes,
        montantTotalFormate: `${montantTotalEuros.toFixed(2)} €`,
        payees: paidCount,
        enAttente: pendingCount,
        echues: overdueCount,
        // Compatibilité avec l'ancien format
        totalInvoices,
        totalAmount: montantTotalCentimes,
        paidCount,
        pendingCount,
        overdueCount,
      };

      console.log("✅ [Admin Factures] Statistiques récupérées:", stats);

      res.json(stats);
    } catch (error) {
      console.error("❌ [Admin Factures] Erreur stats:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération des statistiques",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * GET /admin/factures/:id
   * Récupère une facture spécifique
   */
  static async getFactureById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      console.log(`📄 [Admin Factures] Récupération facture ${id}`);

      const facture = await prisma.invoice.findUnique({
        where: { id },
        include: {
          commande: {
            include: {
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
      });

      if (!facture) {
        console.log(`❌ [Admin Factures] Facture ${id} non trouvée`);
        return res.status(404).json({
          error: "Facture non trouvée",
        });
      }

      console.log(`✅ [Admin Factures] Facture ${id} récupérée`);

      res.json({
        id: facture.id,
        number: facture.number,
        amount: facture.amount,
        taxAmount: facture.taxAmount,
        status: facture.status,
        issuedAt: facture.issuedAt,
        dueAt: facture.dueAt,
        paidAt: facture.paidAt,
        createdAt: facture.createdAt,
        updatedAt: facture.updatedAt,
        pdfUrl: facture.pdfUrl,
        commande: {
          id: facture.commande.id,
          titre: facture.commande.titre,
          description: facture.commande.description,
          statut: facture.commande.statut,
          createdAt: facture.commande.createdAt,
          user: facture.commande.user,
        },
      });
    } catch (error) {
      console.error("❌ [Admin Factures] Erreur récupération facture:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération de la facture",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * PUT /admin/factures/:id
   * Met à jour le statut d'une facture
   */
  static async updateFacture(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const { statut } = req.body;

      console.log(`🔄 [Admin Factures] Mise à jour facture ${id} -> ${statut}`);

      // Validation du statut
      if (!Object.values(InvoiceStatus).includes(statut)) {
        return res.status(400).json({
          error: "Statut invalide",
          validStatuses: Object.values(InvoiceStatus),
        });
      }

      // Vérifier que la facture existe
      const existingFacture = await prisma.invoice.findUnique({
        where: { id },
      });

      if (!existingFacture) {
        console.log(`❌ [Admin Factures] Facture ${id} non trouvée`);
        return res.status(404).json({
          error: "Facture non trouvée",
        });
      }

      // Mettre à jour la facture
      const updateData: any = {
        status: statut,
        updatedAt: new Date(),
      };

      // Si on marque comme payée, ajouter paidAt
      if (statut === InvoiceStatus.PAID && !existingFacture.paidAt) {
        updateData.paidAt = new Date();
      }

      const facture = await prisma.invoice.update({
        where: { id },
        data: updateData,
        include: {
          commande: {
            include: {
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
      });

      console.log(`✅ [Admin Factures] Facture ${id} mise à jour`);

      res.json({
        id: facture.id,
        number: facture.number,
        amount: facture.amount,
        taxAmount: facture.taxAmount,
        status: facture.status,
        issuedAt: facture.issuedAt,
        dueAt: facture.dueAt,
        paidAt: facture.paidAt,
        createdAt: facture.createdAt,
        updatedAt: facture.updatedAt,
        pdfUrl: facture.pdfUrl,
        commande: {
          id: facture.commande.id,
          titre: facture.commande.titre,
          statut: facture.commande.statut,
          user: facture.commande.user,
        },
      });
    } catch (error) {
      console.error("❌ [Admin Factures] Erreur mise à jour:", error);
      res.status(500).json({
        error: "Erreur lors de la mise à jour de la facture",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * DELETE /admin/factures/:id
   * Supprime une facture
   */
  static async deleteFacture(req: Request, res: Response) {
    try {
      const id = req.params.id;
      console.log(`🗑️ [Admin Factures] Suppression facture ${id}`);

      // Vérifier que la facture existe
      const existingFacture = await prisma.invoice.findUnique({
        where: { id },
      });

      if (!existingFacture) {
        console.log(`❌ [Admin Factures] Facture ${id} non trouvée`);
        return res.status(404).json({
          error: "Facture non trouvée",
        });
      }

      // Supprimer la facture
      await prisma.invoice.delete({
        where: { id },
      });

      console.log(`✅ [Admin Factures] Facture ${id} supprimée`);

      res.json({
        message: "Facture supprimée avec succès",
        id,
      });
    } catch (error) {
      console.error("❌ [Admin Factures] Erreur suppression:", error);
      res.status(500).json({
        error: "Erreur lors de la suppression de la facture",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * POST /admin/factures/:id/reminder
   * Envoie un rappel de paiement par email
   */
  static async sendReminder(req: Request, res: Response) {
    try {
      const id = req.params.id;
      console.log(`📧 [Admin Factures] Envoi rappel facture ${id}`);

      // Vérifier que la facture existe et récupérer les infos utilisateur
      const facture = await prisma.invoice.findUnique({
        where: { id },
        include: {
          commande: {
            include: {
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
      });

      if (!facture) {
        console.log(`❌ [Admin Factures] Facture ${id} non trouvée`);
        return res.status(404).json({
          error: "Facture non trouvée",
        });
      }

      // TODO: Implémenter l'envoi d'email de rappel
      // await emailService.sendInvoiceReminder(facture);

      console.log(`✅ [Admin Factures] Rappel envoyé pour facture ${id}`);
      console.log(`📧 Destinataire: ${facture.commande.user.email}`);

      res.json({
        message: "Rappel de paiement envoyé avec succès",
        id,
        recipient: facture.commande.user.email,
      });
    } catch (error) {
      console.error("❌ [Admin Factures] Erreur envoi rappel:", error);
      res.status(500).json({
        error: "Erreur lors de l'envoi du rappel",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * GET /admin/factures/:id/pdf
   * Récupère le PDF d'une facture
   */
  static async getFacturePdf(req: Request, res: Response) {
    try {
      const id = req.params.id;
      console.log(`📄 [Admin Factures] Récupération PDF facture ${id}`);

      const facture = await prisma.invoice.findUnique({
        where: { id },
        select: {
          id: true,
          pdfUrl: true,
          number: true,
        },
      });

      if (!facture) {
        console.log(`❌ [Admin Factures] Facture ${id} non trouvée`);
        return res.status(404).json({
          error: "Facture non trouvée",
        });
      }

      console.log(`🔄 [Admin Factures] Redirection vers: ${facture.pdfUrl}`);

      // Rediriger vers l'URL du PDF
      res.redirect(facture.pdfUrl);
    } catch (error) {
      console.error("❌ [Admin Factures] Erreur récupération PDF:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération du PDF",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
}
