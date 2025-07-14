import { Router } from "express";
import { login, me, register, requestPasswordReset, resetPassword } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";
import { passwordResetRateLimiter, authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Route publique - Inscription
router.post("/register", authRateLimiter, register);

// Route publique - Connexion
router.post("/login", authRateLimiter, login);

// Route publique - Demande de réinitialisation de mot de passe
router.post("/request-password-reset", passwordResetRateLimiter, requestPasswordReset);

// Route publique - Réinitialisation de mot de passe
router.post("/reset-password", resetPassword);

// Route protégée - Informations utilisateur
router.get("/me", authenticateToken, me);

export default router;
