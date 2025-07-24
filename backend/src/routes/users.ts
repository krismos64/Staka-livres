import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * Routes RGPD pour les utilisateurs
 */

// Export des données utilisateur (RGPD)
router.get("/me/export", authenticateToken, UserController.exportUserData);

// Statistiques utilisateur
router.get("/me/stats", authenticateToken, UserController.getUserStats);

// Mise à jour du profil utilisateur
router.put("/me/profile", authenticateToken, UserController.updateProfile);

// Changement de mot de passe
router.put("/me/password", authenticateToken, UserController.changePassword);

// Préférences utilisateur
router.get("/me/preferences", authenticateToken, UserController.getUserPreferences);
router.put("/me/preferences", authenticateToken, UserController.updateUserPreferences);

// Désactivation du compte utilisateur
router.put("/me/deactivate", authenticateToken, UserController.deactivateAccount);

// Suppression du compte utilisateur (RGPD)
router.delete("/me", authenticateToken, UserController.deleteAccount);

export default router;