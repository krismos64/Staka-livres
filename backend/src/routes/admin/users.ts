import { Role } from "@prisma/client";
import { Router } from "express";
import { AdminUserController } from "../../controllers/adminUserController";
import { authenticateToken } from "../../middleware/auth";
import { requireRole } from "../../middleware/requireRole";

const router = Router();

// Appliquer l'authentification JWT à toutes les routes
router.use(authenticateToken);

// Appliquer la vérification du rôle ADMIN à toutes les routes
router.use(requireRole(Role.ADMIN));

/**
 * @route GET /admin/users/stats
 * @desc Récupère les statistiques des utilisateurs
 * @access Admin only
 * @returns {UserStats} Statistiques utilisateurs
 */
router.get("/stats", AdminUserController.getUserStats);

/**
 * @route GET /admin/users
 * @desc Récupère la liste paginée des utilisateurs avec filtres
 * @access Admin only
 * @query {number} page - Numéro de page (défaut: 1)
 * @query {number} limit - Nombre d'éléments par page (défaut: 10, max: 100)
 * @query {string} search - Recherche dans nom, prénom, email
 * @query {Role} role - Filtre par rôle (USER ou ADMIN)
 * @query {boolean} isActive - Filtre par statut actif/inactif
 * @returns {PaginatedResponse<User>} Liste paginée des utilisateurs
 */
router.get("/", AdminUserController.getUsers);

/**
 * @route GET /admin/users/:id
 * @desc Récupère les détails d'un utilisateur par ID
 * @access Admin only
 * @param {string} id - ID de l'utilisateur
 * @returns {User} Données détaillées de l'utilisateur
 */
router.get("/:id", AdminUserController.getUserById);

/**
 * @route POST /admin/users
 * @desc Crée un nouvel utilisateur
 * @access Admin only
 * @body {CreateUserData} Données de l'utilisateur à créer
 * @returns {User} Utilisateur créé
 */
router.post("/", AdminUserController.createUser);

/**
 * @route PATCH /admin/users/:id
 * @desc Met à jour un utilisateur existant
 * @access Admin only
 * @param {string} id - ID de l'utilisateur
 * @body {UpdateUserData} Données à mettre à jour
 * @returns {User} Utilisateur mis à jour
 */
router.patch("/:id", AdminUserController.updateUser);

/**
 * @route PATCH /admin/users/:id/toggle-status
 * @desc Active/désactive rapidement un utilisateur
 * @access Admin only
 * @param {string} id - ID de l'utilisateur
 * @returns {User} Utilisateur avec statut modifié
 */
router.patch("/:id/toggle-status", AdminUserController.toggleUserStatus);

/**
 * @route DELETE /admin/users/:id
 * @desc Supprime définitivement un utilisateur (RGPD)
 * @access Admin only
 * @param {string} id - ID de l'utilisateur
 * @returns {object} Confirmation de suppression
 * @warning Cette action est irréversible et supprime toutes les données associées
 */
router.delete("/:id", AdminUserController.deleteUser);

export default router;
