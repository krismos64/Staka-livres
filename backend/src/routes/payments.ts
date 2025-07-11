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


export default router;
