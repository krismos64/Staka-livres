import { Role } from "@prisma/client";
import { Router } from "express";
import { AdminInvoiceController } from "../../controllers/adminInvoiceController";
import { requireRole } from "../../middleware/requireRole";

const router = Router();

// Toutes les routes nécessitent le rôle ADMIN
router.use(requireRole(Role.ADMIN));

// Routes admin factures avec stockage local

// GET /admin/factures - Liste paginée des factures
router.get("/", AdminInvoiceController.getAllInvoices);

// GET /admin/factures/:id - Détails d'une facture spécifique
router.get("/:id", AdminInvoiceController.getInvoiceById);

// GET /admin/factures/:id/download - Télécharger le PDF
router.get("/:id/download", AdminInvoiceController.downloadInvoice);

// POST /admin/factures/:id/resend - Renvoyer par email
router.post("/:id/resend", AdminInvoiceController.resendInvoice);

// POST /admin/factures/:id/regenerate - Régénérer le PDF
router.post("/:id/regenerate", AdminInvoiceController.regenerateInvoice);

export default router;