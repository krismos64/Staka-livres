import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { AuditService } from "../services/auditService";

const prisma = new PrismaClient();

// Helper pour extraire les infos de la requête
const getRequestInfo = (req: Request) => ({
  ip: req.ip || req.connection.remoteAddress || "unknown",
  userAgent: req.get("user-agent") || "unknown",
  adminEmail: req.user?.email || "unknown",
});

// Récupérer les logs d'audit avec pagination et filtres
export const getAuditLogs = async (req: Request, res: Response) => {
  const { ip, userAgent, adminEmail } = getRequestInfo(req);

  try {
    // Log accès aux logs d'audit
    await AuditService.logAdminAction(
      adminEmail,
      "AUDIT_LOGS_ACCESSED",
      "system",
      undefined,
      {
        action: "LIST_AUDIT_LOGS",
        filters: req.query,
      },
      ip,
      userAgent,
      "HIGH"
    );

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const action = req.query.action as string;
    const severity = req.query.severity as string;
    const targetType = req.query.targetType as string;
    const adminEmailFilter = req.query.adminEmail as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const sortBy = (req.query.sortBy as string) || "timestamp";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    // Construire les filtres
    const where: any = {};

    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }

    if (severity) {
      where.severity = severity;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (adminEmailFilter) {
      where.adminEmail = { contains: adminEmailFilter, mode: "insensitive" };
    }

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        where.timestamp.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.timestamp.lte = new Date(dateTo);
      }
    }

    // Compter le total
    const total = await prisma.auditLog.count({ where });

    // Récupérer les logs
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Calculer les statistiques
    const stats = await prisma.auditLog.groupBy({
      by: ["severity"],
      _count: true,
    });

    const actionStats = await prisma.auditLog.groupBy({
      by: ["action"],
      _count: true,
      orderBy: {
        _count: {
          action: "desc",
        },
      },
      take: 10,
    });

    console.log(
      `📋 [Admin Audit] ${adminEmail} - Liste logs page ${page}, limit ${limit} - ${total} logs`
    );

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: total,
        bySeverity: stats.reduce((acc: Record<string, number>, stat) => {
          acc[stat.severity] = stat._count;
          return acc;
        }, {}),
        topActions: actionStats.map((stat) => ({
          action: stat.action,
          count: stat._count,
        })),
      },
    });
  } catch (error) {
    console.error("❌ [Admin Audit] Erreur récupération logs:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logAdminAction(
      adminEmail,
      "AUDIT_LOGS_ACCESS_ERROR",
      "system",
      undefined,
      { error: errorMessage },
      ip,
      userAgent,
      "HIGH"
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Exporter les logs en CSV
export const exportAuditLogs = async (req: Request, res: Response) => {
  const { ip, userAgent, adminEmail } = getRequestInfo(req);

  try {
    // Log export des logs d'audit
    await AuditService.logAdminAction(
      adminEmail,
      "AUDIT_LOGS_EXPORTED",
      "system",
      undefined,
      {
        action: "EXPORT_AUDIT_LOGS",
        format: req.query.format || "csv",
        filters: req.query,
      },
      ip,
      userAgent,
      "HIGH"
    );

    // Construire les filtres (même logique que getAuditLogs)
    const where: any = {};

    if (req.query.action) {
      where.action = {
        contains: req.query.action as string,
        mode: "insensitive",
      };
    }

    if (req.query.severity) {
      where.severity = req.query.severity;
    }

    if (req.query.targetType) {
      where.targetType = req.query.targetType;
    }

    if (req.query.adminEmail) {
      where.adminEmail = {
        contains: req.query.adminEmail as string,
        mode: "insensitive",
      };
    }

    if (req.query.dateFrom || req.query.dateTo) {
      where.timestamp = {};
      if (req.query.dateFrom) {
        where.timestamp.gte = new Date(req.query.dateFrom as string);
      }
      if (req.query.dateTo) {
        where.timestamp.lte = new Date(req.query.dateTo as string);
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      take: 10000, // Limite pour éviter les exports trop volumineux
    });

    const format = (req.query.format as string) || "csv";

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-logs-${
          new Date().toISOString().split("T")[0]
        }.json"`
      );
      res.json(logs);
    } else {
      // Format CSV
      const csvHeader =
        "Timestamp,Admin Email,Action,Target Type,Target ID,Severity,IP Address,Details\n";
      const csvRows = logs
        .map((log) => {
          const details = log.details
            ? JSON.stringify(log.details).replace(/"/g, '""')
            : "";
          return `"${log.timestamp.toISOString()}","${log.adminEmail}","${
            log.action
          }","${log.targetType}","${log.targetId || ""}","${log.severity}","${
            log.ipAddress || ""
          }","${details}"`;
        })
        .join("\n");

      const csvContent = csvHeader + csvRows;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-logs-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );
      res.send(csvContent);
    }

    console.log(
      `📥 [Admin Audit] ${adminEmail} - Export logs format ${format} - ${logs.length} logs`
    );
  } catch (error) {
    console.error("❌ [Admin Audit] Erreur export logs:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logAdminAction(
      adminEmail,
      "AUDIT_LOGS_EXPORT_ERROR",
      "system",
      undefined,
      { error: errorMessage },
      ip,
      userAgent,
      "HIGH"
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Supprimer les anciens logs (nettoyage automatique)
export const cleanupAuditLogs = async (req: Request, res: Response) => {
  const { ip, userAgent, adminEmail } = getRequestInfo(req);

  try {
    const daysToKeep = parseInt(req.query.days as string) || 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Log nettoyage des logs
    await AuditService.logAdminAction(
      adminEmail,
      "AUDIT_LOGS_CLEANUP",
      "system",
      undefined,
      {
        action: "CLEANUP_AUDIT_LOGS",
        daysToKeep,
        cutoffDate: cutoffDate.toISOString(),
      },
      ip,
      userAgent,
      "HIGH"
    );

    const deletedCount = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    console.log(
      `🗑️ [Admin Audit] ${adminEmail} - Nettoyage logs - ${deletedCount.count} logs supprimés`
    );

    res.json({
      message: `${deletedCount.count} logs supprimés`,
      deletedCount: deletedCount.count,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("❌ [Admin Audit] Erreur nettoyage logs:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logAdminAction(
      adminEmail,
      "AUDIT_LOGS_CLEANUP_ERROR",
      "system",
      undefined,
      { error: errorMessage },
      ip,
      userAgent,
      "HIGH"
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Statistiques des logs d'audit
export const getAuditStats = async (req: Request, res: Response) => {
  const { ip, userAgent, adminEmail } = getRequestInfo(req);

  try {
    // Log accès aux statistiques d'audit
    await AuditService.logAdminAction(
      adminEmail,
      "AUDIT_STATS_ACCESSED",
      "system",
      undefined,
      {
        action: "VIEW_AUDIT_STATS",
      },
      ip,
      userAgent,
      "MEDIUM"
    );

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalLogs,
      last24hLogs,
      last7dLogs,
      last30dLogs,
      severityStats,
      actionStats,
      dailyStats,
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { timestamp: { gte: last24h } } }),
      prisma.auditLog.count({ where: { timestamp: { gte: last7d } } }),
      prisma.auditLog.count({ where: { timestamp: { gte: last30d } } }),
      prisma.auditLog.groupBy({
        by: ["severity"],
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ["action"],
        _count: true,
        orderBy: { _count: { action: "desc" } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ["timestamp"],
        _count: true,
        where: { timestamp: { gte: last7d } },
      }),
    ]);

    console.log(
      `📊 [Admin Audit] ${adminEmail} - Consultation statistiques audit`
    );

    res.json({
      overview: {
        totalLogs,
        last24hLogs,
        last7dLogs,
        last30dLogs,
      },
      severityStats: severityStats.reduce((acc: Record<string, number>, stat) => {
        acc[stat.severity] = stat._count;
        return acc;
      }, {}),
      topActions: actionStats.map((stat) => ({
        action: stat.action,
        count: stat._count,
      })),
      dailyActivity: dailyStats.map((stat) => ({
        date: stat.timestamp.toISOString().split("T")[0],
        count: stat._count,
      })),
    });
  } catch (error) {
    console.error("❌ [Admin Audit] Erreur statistiques:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logAdminAction(
      adminEmail,
      "AUDIT_STATS_ERROR",
      "system",
      undefined,
      { error: errorMessage },
      ip,
      userAgent,
      "HIGH"
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};
