import { Role } from "@prisma/client";
import { Router } from "express";
import { AdminFactureController } from "../../controllers/adminFactureController";
import { requireRole } from "../../middleware/requireRole";

const router = Router();

// Toutes les routes nécessitent le rôle ADMIN
router.use(requireRole(Role.ADMIN));

/**
 * @route GET /admin/factures/stats
 * @desc Récupère les statistiques des factures
 * @access Admin
 */
router.get("/stats", AdminFactureController.getFactureStats);

/**
 * @route GET /admin/factures
 * @desc Récupère la liste des factures avec filtres et pagination
 * @query {number} page - Numéro de page (défaut: 1)
 * @query {number} limit - Nombre d'éléments par page (défaut: 10)
 * @query {string} search - Recherche dans numéro facture, titre commande ou email client
 * @query {InvoiceStatus} statut - Filtre par statut de facture
 * @access Admin
 */
router.get("/", AdminFactureController.getFactures);

/**
 * @route GET /admin/factures/:id
 * @desc Récupère une facture spécifique avec toutes les données détaillées
 * @param {string} id - ID de la facture
 * @access Admin
 */
router.get("/:id", AdminFactureController.getFactureById);

/**
 * @route PUT /admin/factures/:id
 * @desc Met à jour le statut d'une facture
 * @param {string} id - ID de la facture
 * @body {InvoiceStatus} statut - Nouveau statut
 * @access Admin
 */
router.put("/:id", AdminFactureController.updateFacture);

/**
 * @route DELETE /admin/factures/:id
 * @desc Supprime une facture
 * @param {string} id - ID de la facture
 * @access Admin
 */
router.delete("/:id", AdminFactureController.deleteFacture);

/**
 * @route POST /admin/factures/:id/reminder
 * @desc Envoie un rappel de paiement par email
 * @param {string} id - ID de la facture
 * @access Admin
 */
router.post("/:id/reminder", AdminFactureController.sendReminder);

/**
 * @route GET /admin/factures/:id/pdf
 * @desc Récupère le PDF d'une facture
 * @param {string} id - ID de la facture
 * @access Admin
 */
router.get("/:id/pdf", AdminFactureController.getFacturePdf);

/**
 * @route GET /admin/factures/:id/download
 * @desc Télécharge directement le PDF d'une facture
 * @param {string} id - ID de la facture
 * @access Admin
 */
router.get("/:id/download", AdminFactureController.downloadFacture);

export default router;
