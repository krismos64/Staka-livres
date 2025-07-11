import { Role } from "@prisma/client";
import { Router } from "express";
import { AdminCommandeController } from "../../controllers/adminCommandeController";
import { requireRole } from "../../middleware/requireRole";

const router = Router();

// Toutes les routes nécessitent le rôle ADMIN
router.use(requireRole(Role.ADMIN));

/**
 * @route GET /admin/commandes
 * @desc Récupère la liste des commandes avec filtres et pagination
 * @query {number} page - Numéro de page (défaut: 1)
 * @query {number} limit - Nombre d'éléments par page (défaut: 10)
 * @query {string} search - Recherche dans ID commande ou email client
 * @query {StatutCommande} statut - Filtre par statut de commande
 * @query {string} clientId - Filtre par ID client
 * @query {string} dateFrom - Date de début (ISO string)
 * @query {string} dateTo - Date de fin (ISO string)
 * @access Admin
 */
router.get("/", AdminCommandeController.getCommandes);

/**
 * @route GET /admin/commandes/:id
 * @desc Récupère une commande spécifique avec toutes les données détaillées
 * @param {string} id - ID de la commande
 * @access Admin
 */
router.get("/:id", AdminCommandeController.getCommandeById);

/**
 * @route PUT /admin/commandes/:id
 * @desc Met à jour le statut d'une commande
 * @param {string} id - ID de la commande
 * @body {StatutCommande} statut - Nouveau statut
 * @access Admin
 */
router.put("/:id", AdminCommandeController.updateCommandeStatut);

/**
 * @route DELETE /admin/commandes/:id
 * @desc Supprime une commande
 * @param {string} id - ID de la commande
 * @access Admin
 */
router.delete("/:id", AdminCommandeController.deleteCommande);

export default router;
