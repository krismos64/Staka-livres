import express from "express";
import { paymentController } from "../controllers/paymentController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Routes de paiement (authentifiées)
router.post(
  "/create-checkout-session",
  authenticateToken,
  paymentController.createCheckoutSession
);
router.get(
  "/status/:sessionId",
  authenticateToken,
  paymentController.getPaymentStatus
);

// Webhook Stripe (pas d'authentification JWT)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

export default router;
