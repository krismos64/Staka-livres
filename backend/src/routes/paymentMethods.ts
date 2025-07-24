import express from "express";
import { paymentMethodsController } from "../controllers/paymentMethodsController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// POST /payment-methods/setup-intent - Créer un Setup Intent pour l'ajout de carte
router.post("/setup-intent", paymentMethodsController.createSetupIntent);

// POST /payment-methods - Ajouter un nouveau moyen de paiement
router.post("/", paymentMethodsController.addPaymentMethod);

// GET /payment-methods - Récupérer les moyens de paiement de l'utilisateur
router.get("/", paymentMethodsController.getPaymentMethods);

// PUT /payment-methods/:id/default - Définir un moyen de paiement par défaut
router.put("/:id/default", paymentMethodsController.setDefaultPaymentMethod);

// DELETE /payment-methods/:id - Supprimer un moyen de paiement
router.delete("/:id", paymentMethodsController.deletePaymentMethod);

export default router;