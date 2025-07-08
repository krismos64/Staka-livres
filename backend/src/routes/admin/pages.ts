import { Role } from "@prisma/client";
import { Router } from "express";
import { AdminPageController } from "../../controllers/adminPageController";
import { authenticateToken } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";

const router = Router();

// Appliquer l'authentification JWT à toutes les routes
router.use(authenticateToken);

// Appliquer la vérification du rôle ADMIN à toutes les routes
router.use(requireRole(Role.ADMIN));

/**
 * @route GET /admin/pages/stats
 * @desc Récupère les statistiques des pages
 * @access Admin only
 * @returns {PageStats} Statistiques des pages (total, published, draft, archived, scheduled)
 */
router.get("/stats", AdminPageController.getPageStats);

/**
 * @route GET /admin/pages
 * @desc Récupère la liste paginée des pages avec filtres
 * @access Admin only
 * @query {number} page - Numéro de page (défaut: 1)
 * @query {number} limit - Nombre d'éléments par page (défaut: 10, max: 100)
 * @query {string} search - Recherche dans titre, slug, contenu
 * @query {PageStatus} status - Filtre par statut (DRAFT, PUBLISHED, ARCHIVED, SCHEDULED)
 * @query {PageType} type - Filtre par type (PAGE, FAQ, BLOG, LEGAL, HELP, LANDING)
 * @query {string} category - Filtre par catégorie
 * @query {boolean} isPublic - Filtre par visibilité publique
 * @query {string} sortBy - Champ de tri (title, slug, status, type, category, sortOrder, createdAt, updatedAt, publishedAt)
 * @query {string} sortDirection - Direction du tri (asc, desc)
 * @returns {PaginatedResponse<Page>} Liste paginée des pages
 */
router.get("/", AdminPageController.getPages);

/**
 * @route GET /admin/pages/:id
 * @desc Récupère les détails d'une page par ID
 * @access Admin only
 * @param {string} id - ID de la page
 * @returns {Page} Données détaillées de la page
 */
router.get("/:id", AdminPageController.getPageById);

/**
 * @route GET /admin/pages/slug/:slug
 * @desc Récupère les détails d'une page par slug
 * @access Admin only
 * @param {string} slug - Slug de la page
 * @returns {Page} Données détaillées de la page
 */
router.get("/slug/:slug", AdminPageController.getPageBySlug);

/**
 * @route POST /admin/pages
 * @desc Crée une nouvelle page
 * @access Admin only
 * @body {CreatePageData} Données de la page à créer
 * @returns {Page} Page créée
 * @error 409 - Une page avec ce slug existe déjà
 * @error 400 - Données invalides
 */
router.post("/", AdminPageController.createPage);

/**
 * @route PUT /admin/pages/:id
 * @desc Met à jour complètement une page existante
 * @access Admin only
 * @param {string} id - ID de la page
 * @body {UpdatePageData} Données complètes de la page
 * @returns {Page} Page mise à jour
 * @error 404 - Page non trouvée
 * @error 409 - Une page avec ce slug existe déjà
 * @error 400 - Données invalides
 */
router.put("/:id", AdminPageController.updatePage);

/**
 * @route PATCH /admin/pages/:id
 * @desc Met à jour partiellement une page existante
 * @access Admin only
 * @param {string} id - ID de la page
 * @body {UpdatePageData} Données partielles à mettre à jour
 * @returns {Page} Page mise à jour
 * @error 404 - Page non trouvée
 * @error 409 - Une page avec ce slug existe déjà
 * @error 400 - Données invalides
 */
router.patch("/:id", AdminPageController.patchPage);

/**
 * @route PATCH /admin/pages/:id/publish
 * @desc Publie une page (change le statut en PUBLISHED)
 * @access Admin only
 * @param {string} id - ID de la page
 * @returns {Page} Page publiée
 * @error 404 - Page non trouvée
 * @error 400 - La page est déjà publiée
 */
router.patch("/:id/publish", AdminPageController.publishPage);

/**
 * @route PATCH /admin/pages/:id/unpublish
 * @desc Dépublie une page (change le statut en DRAFT)
 * @access Admin only
 * @param {string} id - ID de la page
 * @returns {Page} Page dépubliée
 * @error 404 - Page non trouvée
 * @error 400 - La page n'est pas publiée
 */
router.patch("/:id/unpublish", AdminPageController.unpublishPage);

/**
 * @route DELETE /admin/pages/:id
 * @desc Supprime définitivement une page
 * @access Admin only
 * @param {string} id - ID de la page
 * @returns {object} Confirmation de suppression
 * @error 404 - Page non trouvée
 * @warning Cette action est irréversible
 */
router.delete("/:id", AdminPageController.deletePage);

export default router;
