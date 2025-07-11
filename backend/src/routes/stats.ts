import express from "express";
import { statsController } from "../controllers/statsController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /stats/annual?year=2025 - Récupérer les statistiques annuelles de l'utilisateur
router.get("/annual", statsController.getAnnualStats);

export default router;