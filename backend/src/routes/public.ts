import { Router } from "express";
import { sendContactMessage, sendFreeSampleRequest } from "../controllers/publicController";
import { uploadMiddleware } from "../controllers/fileController";
import { createPublicOrder, getPublicOrderById } from "../controllers/publicCommandeController";
import { activateAccount, verifyActivationToken } from "../controllers/activationController";

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

/**
 * POST /public/order
 * Créer une commande publique (tunnel invité)
 * Body: { prenom, nom, email, password, telephone?, adresse?, serviceId, consentementRgpd }
 */
router.post("/order", createPublicOrder);

/**
 * GET /public/order/:id
 * Récupérer les détails d'une commande publique par son ID
 */
router.get("/order/:id", getPublicOrderById);

/**
 * GET /public/activate/:token
 * Activer un compte utilisateur via token d'activation
 */
router.get("/activate/:token", activateAccount);

/**
 * GET /public/activate/:token/verify
 * Vérifier le statut d'un token d'activation (sans l'activer)
 */
router.get("/activate/:token/verify", verifyActivationToken);

export default router;