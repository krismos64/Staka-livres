import { Router } from "express";
import { login, me, register } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Route publique - Inscription
router.post("/register", register);

// Route publique - Connexion
router.post("/login", login);

// Route protégée - Informations utilisateur
router.get("/me", authenticateToken, me);

export default router;
