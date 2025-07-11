import { Router } from "express";
import { getProjects, getProjectCounts } from "../controllers/projectsController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Route protégée - Récupération des projets de l'utilisateur authentifié avec pagination
// GET /projects?page=1&limit=10&status=all&search=titre
router.get("/", authenticateToken, getProjects);

// Route protégée - Récupération des compteurs par statut
// GET /projects/counts
router.get("/counts", authenticateToken, getProjectCounts);

export default router;