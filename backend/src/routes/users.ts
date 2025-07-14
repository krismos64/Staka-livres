import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * Routes RGPD pour les utilisateurs
 */

// Export des données utilisateur (RGPD)
router.get("/me/export", authenticateToken, UserController.exportUserData);

// Suppression du compte utilisateur (RGPD)
router.delete("/me", authenticateToken, UserController.deleteAccount);

export default router;