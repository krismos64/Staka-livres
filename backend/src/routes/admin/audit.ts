import express from "express";
import {
  cleanupAuditLogs,
  exportAuditLogs,
  getAuditLogs,
  getAuditStats,
} from "../../controllers/adminAuditController";

const router = express.Router();

// Récupérer les logs d'audit avec pagination et filtres
router.get("/logs", getAuditLogs);

// Exporter les logs d'audit
router.get("/export", exportAuditLogs);

// Nettoyage des anciens logs
router.delete("/cleanup", cleanupAuditLogs);

// Statistiques des logs d'audit
router.get("/stats", getAuditStats);

export default router;
