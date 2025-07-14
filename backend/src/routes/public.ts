import { Router } from "express";
import { sendContactMessage, sendFreeSampleRequest } from "../controllers/publicController";
import { uploadMiddleware } from "../controllers/fileController";

const router = Router();

/**
 * Routes publiques (sans authentification)
 */

/**
 * POST /public/contact
 * Envoie un message de contact depuis le formulaire public du site
 */
router.post("/contact", sendContactMessage);

/**
 * POST /public/free-sample
 * Traite les demandes d'échantillon gratuit depuis la landing page
 */
router.post("/free-sample", uploadMiddleware.single("fichier"), sendFreeSampleRequest);

export default router;