import { Role } from "@prisma/client";
import { Router } from "express";
import { FaqController } from "../../controllers/faqController";
import { authenticateToken } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";

const router = Router();

// Appliquer l'authentification JWT à toutes les routes
router.use(authenticateToken);

// Appliquer la vérification du rôle ADMIN à toutes les routes
router.use(requireRole(Role.ADMIN));

/**
 * @route GET /admin/faq
 * @desc Récupère la liste paginée des FAQ avec filtres
 * @access Admin only
 * @query {number} page - Numéro de page (défaut: 1)
 * @query {number} limit - Nombre d'éléments par page (défaut: 10, max: 100)
 * @query {string} search - Recherche dans question et réponse
 * @query {boolean} visible - Filtre par visibilité
 * @query {string} categorie - Filtre par catégorie
 * @returns {PaginatedResponse<FAQ>} Liste paginée des FAQ
 */
router.get("/", FaqController.getFAQ);

/**
 * @route GET /admin/faq/:id
 * @desc Récupère les détails d'une FAQ par ID
 * @access Admin only
 * @param {string} id - ID de la FAQ
 * @returns {FAQ} Données détaillées de la FAQ
 */
router.get("/:id", FaqController.getFAQById);

/**
 * @route POST /admin/faq
 * @desc Crée une nouvelle FAQ
 * @access Admin only
 * @body {CreateFAQData} Données de la FAQ à créer
 * @returns {FAQ} FAQ créée
 */
router.post("/", FaqController.createFAQ);

/**
 * @route PUT /admin/faq/:id
 * @desc Met à jour une FAQ existante
 * @access Admin only
 * @param {string} id - ID de la FAQ
 * @body {UpdateFAQData} Données à mettre à jour
 * @returns {FAQ} FAQ mise à jour
 */
router.put("/:id", FaqController.updateFAQ);

/**
 * @route DELETE /admin/faq/:id
 * @desc Supprime définitivement une FAQ
 * @access Admin only
 * @param {string} id - ID de la FAQ
 * @returns {object} Confirmation de suppression
 */
router.delete("/:id", FaqController.deleteFAQ);

export default router;
