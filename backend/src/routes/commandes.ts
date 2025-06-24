import { Router } from "express";
import {
  createCommande,
  getUserCommandeById,
  getUserCommandes,
} from "../controllers/commandeClientController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Appliquer l'authentification JWT à toutes les routes
router.use(authenticateToken);

// 📝 Créer une nouvelle commande
router.post("/", createCommande);

// 📋 Récupérer toutes les commandes de l'utilisateur connecté
router.get("/", getUserCommandes);

// 🔍 Récupérer une commande spécifique de l'utilisateur
router.get("/:id", getUserCommandeById);

export default router;
