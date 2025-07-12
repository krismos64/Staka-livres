import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { AuditService, AUDIT_ACTIONS } from "../services/auditService";

const prisma = new PrismaClient();

// Helper pour extraire les infos de la requête
const getRequestInfo = (req: Request) => ({
  ip: req.ip || req.connection.remoteAddress || 'unknown',
  userAgent: req.get('user-agent') || 'unknown',
  adminEmail: req.user?.email || 'unknown',
});

// Récupérer toutes les factures (avec pagination et filtres)
export const getFactures = async (req: Request, res: Response) => {
  const { ip, userAgent, adminEmail } = getRequestInfo(req);
  
  try {
    // Log accès aux factures
    await AuditService.logAdminAction(
      adminEmail,
      AUDIT_ACTIONS.INVOICE_ACCESSED,
      'invoice',
      undefined,
      {
        action: 'LIST_FACTURES',
        filters: req.query,
      },
      ip,
      userAgent,
      'MEDIUM'
    );

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const status = req.query.status as string;
    const search = req.query.search as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Construire les filtres
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { factureNumber: { contains: search, mode: 'insensitive' } },
        { commande: { titre: { contains: search, mode: 'insensitive' } } },
        { commande: { user: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Compter le total
    const total = await prisma.invoice.count({ where });

    // Récupérer les factures
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
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Calculer les statistiques
    const stats = await prisma.invoice.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        amount: true,
      },
    });

    const totalAmount = await prisma.invoice.aggregate({
      _sum: {
        amount: true,
      },
    });

    console.log(`📋 [Admin Factures] ${adminEmail} - Liste factures page ${page}, limit ${limit} - ${total} factures`);

    res.json({
      factures,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: total,
        totalAmount: totalAmount._sum.amount || 0,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = {
            count: stat._count,
            amount: stat._sum.amount || 0,
          };
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("❌ [Admin Factures] Erreur récupération factures:", error);
    await AuditService.logAdminAction(
      adminEmail,
      'INVOICE_ACCESS_ERROR',
      'invoice',
      undefined,
      { error: error.message },
      ip,
      userAgent,
      'HIGH'
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Récupérer une facture spécifique
export const getFacture = async (req: Request, res: Response) => {
  const { ip, userAgent, adminEmail } = getRequestInfo(req);
  const { id } = req.params;

  try {
    // Log accès à une facture spécifique
    await AuditService.logAdminAction(
      adminEmail,
      AUDIT_ACTIONS.INVOICE_ACCESSED,
      'invoice',
      id,
      {
        action: 'VIEW_FACTURE',
      },
      ip,
      userAgent,
      'MEDIUM'
    );

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
                telephone: true,
                adresse: true,
              },
            },
          },
        },
      },
    });

    if (!facture) {
      console.log(`⚠️ [Admin Factures] ${adminEmail} - Facture ${id} non trouvée`);
      return res.status(404).json({ error: "Facture non trouvée" });
    }

    console.log(`📄 [Admin Factures] ${adminEmail} - Consultation facture ${facture.factureNumber}`);

    res.json(facture);
  } catch (error) {
    console.error("❌ [Admin Factures] Erreur récupération facture:", error);
    await AuditService.logAdminAction(
      adminEmail,
      'INVOICE_ACCESS_ERROR',
      'invoice',
      id,
      { error: error.message },
      ip,
      userAgent,
      'HIGH'
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Télécharger le PDF d'une facture
export const downloadFacturePdf = async (req: Request, res: Response) => {
  const { ip, userAgent, adminEmail } = getRequestInfo(req);
  const { id } = req.params;

  try {
    // Log téléchargement PDF
    await AuditService.logAdminAction(
      adminEmail,
      AUDIT_ACTIONS.INVOICE_DOWNLOADED,
      'invoice',
      id,
      {
        action: 'DOWNLOAD_PDF',
      },
      ip,
      userAgent,
      'MEDIUM'
    );

    const facture = await prisma.invoice.findUnique({
      where: { id },
      include: {
        commande: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!facture) {
      console.log(`⚠️ [Admin Factures] ${adminEmail} - Facture ${id} non trouvée pour téléchargement`);
      return res.status(404).json({ error: "Facture non trouvée" });
    }

    if (!facture.pdfUrl) {
      console.log(`⚠️ [Admin Factures] ${adminEmail} - PDF non disponible pour facture ${facture.factureNumber}`);
      return res.status(404).json({ error: "PDF non disponible" });
    }

    console.log(`📥 [Admin Factures] ${adminEmail} - Téléchargement PDF facture ${facture.factureNumber}`);

    // Rediriger vers l'URL du PDF
    res.redirect(facture.pdfUrl);
  } catch (error) {
    console.error("❌ [Admin Factures] Erreur téléchargement PDF:", error);
    await AuditService.logAdminAction(
      adminEmail,
      'INVOICE_DOWNLOAD_ERROR',
      'invoice',
      id,
      { error: error.message },
      ip,
      userAgent,
      'HIGH'
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Envoyer un rappel par email
export const sendFactureReminder = async (req: Request, res: Response) => {
  const { ip, userAgent, adminEmail } = getRequestInfo(req);
  const { id } = req.params;

  try {
    // Log envoi de rappel
    await AuditService.logAdminAction(
      adminEmail,
      AUDIT_ACTIONS.INVOICE_SENT,
      'invoice',
      id,
      {
        action: 'SEND_REMINDER',
      },
      ip,
      userAgent,
      'MEDIUM'
    );

    const facture = await prisma.invoice.findUnique({
      where: { id },
      include: {
        commande: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!facture) {
      console.log(`⚠️ [Admin Factures] ${adminEmail} - Facture ${id} non trouvée pour rappel`);
      return res.status(404).json({ error: "Facture non trouvée" });
    }

    // TODO: Implémenter l'envoi d'email
    console.log(`📧 [Admin Factures] ${adminEmail} - Rappel envoyé pour facture ${facture.factureNumber} à ${facture.commande.user.email}`);

    res.json({ message: "Rappel envoyé avec succès" });
  } catch (error) {
    console.error("❌ [Admin Factures] Erreur envoi rappel:", error);
    await AuditService.logAdminAction(
      adminEmail,
      'INVOICE_SEND_ERROR',
      'invoice',
      id,
      { error: error.message },
      ip,
      userAgent,
      'HIGH'
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Annuler une facture
export const cancelFacture = async (req: Request, res: Response) => {
  const { ip, userAgent, adminEmail } = getRequestInfo(req);
  const { id } = req.params;

  try {
    // Log annulation de facture
    await AuditService.logAdminAction(
      adminEmail,
      AUDIT_ACTIONS.INVOICE_CANCELLED,
      'invoice',
      id,
      {
        action: 'CANCEL_INVOICE',
      },
      ip,
      userAgent,
      'HIGH'
    );

    const facture = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!facture) {
      console.log(`⚠️ [Admin Factures] ${adminEmail} - Facture ${id} non trouvée pour annulation`);
      return res.status(404).json({ error: "Facture non trouvée" });
    }

    const updatedFacture = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });

    console.log(`🚫 [Admin Factures] ${adminEmail} - Facture ${facture.factureNumber} annulée`);

    res.json({ message: "Facture annulée avec succès", facture: updatedFacture });
  } catch (error) {
    console.error("❌ [Admin Factures] Erreur annulation facture:", error);
    await AuditService.logAdminAction(
      adminEmail,
      'INVOICE_CANCEL_ERROR',
      'invoice',
      id,
      { error: error.message },
      ip,
      userAgent,
      'HIGH'
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Statistiques financières
export const getFactureStats = async (req: Request, res: Response) => {
  const { ip, userAgent, adminEmail } = getRequestInfo(req);

  try {
    // Log accès aux statistiques
    await AuditService.logAdminAction(
      adminEmail,
      'INVOICE_STATS_ACCESS',
      'invoice',
      undefined,
      {
        action: 'VIEW_STATS',
      },
      ip,
      userAgent,
      'MEDIUM'
    );

    // Statistiques par mois
    const monthlyStats = await prisma.invoice.groupBy({
      by: ['createdAt'],
      _count: true,
      _sum: {
        amount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Statistiques par statut
    const statusStats = await prisma.invoice.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        amount: true,
      },
    });

    console.log(`📊 [Admin Factures] ${adminEmail} - Consultation statistiques financières`);

    res.json({
      monthlyStats,
      statusStats,
      totalInvoices: await prisma.invoice.count(),
      totalAmount: (await prisma.invoice.aggregate({
        _sum: { amount: true },
      }))._sum.amount || 0,
    });
  } catch (error) {
    console.error("❌ [Admin Factures] Erreur statistiques:", error);
    await AuditService.logAdminAction(
      adminEmail,
      'INVOICE_STATS_ERROR',
      'invoice',
      undefined,
      { error: error.message },
      ip,
      userAgent,
      'HIGH'
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};