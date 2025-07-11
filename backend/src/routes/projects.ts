import { Router } from "express";
import { getUserProjects } from "../controllers/projectsController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Route protégée - Récupération des projets de l'utilisateur authentifié
// GET /projects?status=active&limit=3
router.get("/", authenticateToken, getUserProjects);

export default router;