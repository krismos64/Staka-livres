import { Role } from "@prisma/client";
import { Router } from "express";
import { getAdminStats } from "../controllers/adminStatsController";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Toutes les routes nécessitent une authentification et le rôle ADMIN
router.use(authenticateToken);
router.use(requireRole(Role.ADMIN));

// GET /admin/stats - Récupérer les statistiques administrateur
router.get("/", getAdminStats);

export default router;