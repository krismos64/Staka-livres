import { Role } from "@prisma/client";
import { Router } from "express";
import { getDemoStatus, refreshDemoData, resetDemoData } from "../../controllers/demoController";
import { requireRole } from "../../middleware/requireRole";

/**
 * Routes pour la gestion du mode démonstration
 * Endpoints sécurisés pour administrateurs uniquement
 * 
 * Développé par Christophe Mostefaoui - 27 Juillet 2025
 * Production déployée sur livrestaka.fr
 */

const router = Router();

// Middleware : toutes les routes démo nécessitent les droits admin
router.use(requireRole(Role.ADMIN));

/**
 * POST /api/admin/demo/refresh
 * Rafraîchit les données de démonstration
 * - Supprime les anciennes données de démo
 * - Génère de nouvelles données aléatoirement
 * - Audit log de l'opération
 */
router.post("/refresh", refreshDemoData);

/**
 * POST /api/admin/demo/reset
 * Remet les données de démonstration à l'état initial
 * - Supprime toutes les données de démo
 * - Génère un jeu de données cohérent initial
 * - Audit log de l'opération
 */
router.post("/reset", resetDemoData);

/**
 * GET /api/admin/demo/status
 * Retourne le statut actuel des données de démonstration
 * - Compte les éléments de démo existants
 * - Indique si des données de démo sont présentes
 * - Utile pour les vérifications frontend
 */
router.get("/status", getDemoStatus);

export default router;