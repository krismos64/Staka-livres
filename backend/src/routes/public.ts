import { Router } from "express";
import { sendContactMessage, sendFreeSampleRequest } from "../controllers/publicController";
import { uploadMiddleware } from "../controllers/fileController";

const router = Router();

/**
 * Routes publiques (sans authentification)
 */

/**
 * GET /public/health
 * Health check endpoint pour Docker et monitoring
 */
router.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "staka-backend"
  });
});

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