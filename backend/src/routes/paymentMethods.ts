import express from "express";
import { paymentMethodsController } from "../controllers/paymentMethodsController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /payment-methods - Récupérer les moyens de paiement de l'utilisateur
router.get("/", paymentMethodsController.getPaymentMethods);

// PUT /payment-methods/:id/default - Définir un moyen de paiement par défaut
router.put("/:id/default", paymentMethodsController.setDefaultPaymentMethod);

// DELETE /payment-methods/:id - Supprimer un moyen de paiement
router.delete("/:id", paymentMethodsController.deletePaymentMethod);

export default router;