import { Router } from "express";
import { sendContactMessage } from "../controllers/publicController";

const router = Router();

/**
 * Routes publiques (sans authentification)
 */

/**
 * POST /public/contact
 * Envoie un message de contact depuis le formulaire public du site
 */
router.post("/contact", sendContactMessage);

export default router;