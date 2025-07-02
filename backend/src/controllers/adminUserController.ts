import { Role } from "@prisma/client";
import { Request, Response } from "express";
import {
  AdminUserService,
  CreateUserData,
  UpdateUserData,
} from "../services/adminUserService";

// Logs d'audit pour les actions administratives
const logAdminAction = (
  adminEmail: string,
  action: string,
  targetUserId?: string,
  details?: any
) => {
  console.log(
    `🔐 [ADMIN AUDIT] ${adminEmail} - ${action}${
      targetUserId ? ` - User: ${targetUserId}` : ""
    }`,
    details ? JSON.stringify(details) : ""
  );
};

// Validation des données d'entrée
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRole = (role: string): role is Role => {
  return Object.values(Role).includes(role as Role);
};

const validateCreateUserData = (
  data: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (
    !data.prenom ||
    typeof data.prenom !== "string" ||
    data.prenom.trim().length < 2
  ) {
    errors.push("Le prénom doit faire au moins 2 caractères");
  }

  if (!data.nom || typeof data.nom !== "string" || data.nom.trim().length < 2) {
    errors.push("Le nom doit faire au moins 2 caractères");
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push("Email invalide");
  }

  if (
    !data.password ||
    typeof data.password !== "string" ||
    data.password.length < 6
  ) {
    errors.push("Le mot de passe doit faire au moins 6 caractères");
  }

  if (!data.role || !validateRole(data.role)) {
    errors.push("Rôle invalide (USER ou ADMIN)");
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateUserData = (
  data: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (
    data.prenom &&
    (typeof data.prenom !== "string" || data.prenom.trim().length < 2)
  ) {
    errors.push("Le prénom doit faire au moins 2 caractères");
  }

  if (
    data.nom &&
    (typeof data.nom !== "string" || data.nom.trim().length < 2)
  ) {
    errors.push("Le nom doit faire au moins 2 caractères");
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push("Email invalide");
  }

  if (data.role && !validateRole(data.role)) {
    errors.push("Rôle invalide (USER ou ADMIN)");
  }

  if (data.isActive !== undefined && typeof data.isActive !== "boolean") {
    errors.push("isActive doit être un booléen");
  }

  return { isValid: errors.length === 0, errors };
};

export class AdminUserController {
  // GET /admin/users - Liste paginée des utilisateurs
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";

      // Extraction des paramètres de requête
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 par page
      const search = req.query.search as string;
      const role = req.query.role as Role;
      const isActive =
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined;
      const sortBy = req.query.sortBy as string;
      const sortDirection = req.query.sortDirection as "asc" | "desc";

      console.log("🔍 [ADMIN_USER_CONTROLLER] Paramètres de tri reçus:", {
        sortBy,
        sortDirection,
        allQueryParams: req.query,
      });

      logAdminAction(adminEmail, "GET_USERS", undefined, {
        page,
        limit,
        search,
        role,
        isActive,
        sortBy,
        sortDirection,
      });

      // Validation des paramètres
      if (page < 1 || limit < 1) {
        res.status(400).json({
          success: false,
          error: "Paramètres de pagination invalides",
          message: "La page et la limite doivent être supérieures à 0",
        });
        return;
      }

      if (role && !validateRole(role)) {
        res.status(400).json({
          success: false,
          error: "Rôle invalide",
          message: "Le rôle doit être USER ou ADMIN",
        });
        return;
      }

      // Récupération des utilisateurs
      const result = await AdminUserService.getUsers(
        { search, role, isActive },
        { page, limit, sortBy, sortDirection }
      );

      logAdminAction(adminEmail, "GET_USERS_SUCCESS", undefined, {
        count: result.users.length,
      });

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
        message: `${result.users.length} utilisateurs récupérés`,
      });
    } catch (error) {
      console.error("❌ [ADMIN_USER_CONTROLLER] Erreur getUsers:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer les utilisateurs",
      });
    }
  }

  // GET /admin/users/:id - Détails d'un utilisateur
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID utilisateur requis",
          message: "Veuillez fournir un ID utilisateur valide",
        });
        return;
      }

      logAdminAction(adminEmail, "GET_USER_BY_ID", id);

      const user = await AdminUserService.getUserById(id);

      logAdminAction(adminEmail, "GET_USER_BY_ID_SUCCESS", id);

      res.status(200).json({
        success: true,
        data: user,
        message: "Utilisateur récupéré avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_USER_CONTROLLER] Erreur getUserById:", error);

      if (error instanceof Error && error.message.includes("introuvable")) {
        res.status(404).json({
          success: false,
          error: "Utilisateur introuvable",
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de récupérer l'utilisateur",
        });
      }
    }
  }

  // POST /admin/users - Création d'un utilisateur
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const userData = req.body;

      logAdminAction(adminEmail, "CREATE_USER_ATTEMPT", undefined, {
        email: userData.email,
        role: userData.role,
      });

      // Validation des données
      const validation = validateCreateUserData(userData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "Veuillez corriger les erreurs de validation",
          details: validation.errors,
        });
        return;
      }

      const createData: CreateUserData = {
        prenom: userData.prenom.trim(),
        nom: userData.nom.trim(),
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        role: userData.role,
        isActive: userData.isActive ?? true,
        adresse: userData.adresse?.trim(),
        telephone: userData.telephone?.trim(),
      };

      const user = await AdminUserService.createUser(createData);

      logAdminAction(adminEmail, "CREATE_USER_SUCCESS", user.id, {
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        success: true,
        data: user,
        message: `Utilisateur ${user.prenom} ${user.nom} créé avec succès`,
      });
    } catch (error) {
      console.error("❌ [ADMIN_USER_CONTROLLER] Erreur createUser:", error);

      if (error instanceof Error && error.message.includes("existe déjà")) {
        res.status(409).json({
          success: false,
          error: "Conflit de données",
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de créer l'utilisateur",
        });
      }
    }
  }

  // PATCH /admin/users/:id - Mise à jour d'un utilisateur
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID utilisateur requis",
          message: "Veuillez fournir un ID utilisateur valide",
        });
        return;
      }

      logAdminAction(adminEmail, "UPDATE_USER_ATTEMPT", id, updateData);

      // Validation des données
      const validation = validateUpdateUserData(updateData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "Veuillez corriger les erreurs de validation",
          details: validation.errors,
        });
        return;
      }

      // Nettoyer les données
      const cleanUpdateData: UpdateUserData = {};
      if (updateData.prenom) cleanUpdateData.prenom = updateData.prenom.trim();
      if (updateData.nom) cleanUpdateData.nom = updateData.nom.trim();
      if (updateData.email)
        cleanUpdateData.email = updateData.email.toLowerCase().trim();
      if (updateData.role) cleanUpdateData.role = updateData.role;
      if (updateData.isActive !== undefined)
        cleanUpdateData.isActive = updateData.isActive;
      if (updateData.adresse)
        cleanUpdateData.adresse = updateData.adresse.trim();
      if (updateData.telephone)
        cleanUpdateData.telephone = updateData.telephone.trim();

      const user = await AdminUserService.updateUser(id, cleanUpdateData);

      logAdminAction(adminEmail, "UPDATE_USER_SUCCESS", id, {
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });

      res.status(200).json({
        success: true,
        data: user,
        message: `Utilisateur ${user.prenom} ${user.nom} mis à jour avec succès`,
      });
    } catch (error) {
      console.error("❌ [ADMIN_USER_CONTROLLER] Erreur updateUser:", error);

      if (error instanceof Error) {
        if (error.message.includes("introuvable")) {
          res.status(404).json({
            success: false,
            error: "Utilisateur introuvable",
            message: error.message,
          });
        } else if (
          error.message.includes("existe déjà") ||
          error.message.includes("dernier administrateur")
        ) {
          res.status(409).json({
            success: false,
            error: "Conflit de données",
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            error: "Erreur interne du serveur",
            message: "Impossible de mettre à jour l'utilisateur",
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de mettre à jour l'utilisateur",
        });
      }
    }
  }

  // DELETE /admin/users/:id - Suppression RGPD d'un utilisateur
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID utilisateur requis",
          message: "Veuillez fournir un ID utilisateur valide",
        });
        return;
      }

      logAdminAction(adminEmail, "DELETE_USER_ATTEMPT", id);

      const result = await AdminUserService.deleteUser(id);

      logAdminAction(adminEmail, "DELETE_USER_SUCCESS", id);

      res.status(200).json({
        success: true,
        data: result,
        message: "Utilisateur supprimé définitivement (RGPD)",
      });
    } catch (error) {
      console.error("❌ [ADMIN_USER_CONTROLLER] Erreur deleteUser:", error);

      if (error instanceof Error) {
        if (error.message.includes("introuvable")) {
          res.status(404).json({
            success: false,
            error: "Utilisateur introuvable",
            message: error.message,
          });
        } else if (error.message.includes("dernier administrateur")) {
          res.status(409).json({
            success: false,
            error: "Action interdite",
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            error: "Erreur interne du serveur",
            message: "Impossible de supprimer l'utilisateur",
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de supprimer l'utilisateur",
        });
      }
    }
  }

  // PATCH /admin/users/:id/toggle-status - Activation/désactivation rapide
  static async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID utilisateur requis",
          message: "Veuillez fournir un ID utilisateur valide",
        });
        return;
      }

      logAdminAction(adminEmail, "TOGGLE_USER_STATUS_ATTEMPT", id);

      const user = await AdminUserService.toggleUserStatus(id);

      logAdminAction(adminEmail, "TOGGLE_USER_STATUS_SUCCESS", id, {
        isActive: user.isActive,
      });

      res.status(200).json({
        success: true,
        data: user,
        message: `Utilisateur ${
          user.isActive ? "activé" : "désactivé"
        } avec succès`,
      });
    } catch (error) {
      console.error(
        "❌ [ADMIN_USER_CONTROLLER] Erreur toggleUserStatus:",
        error
      );

      if (error instanceof Error) {
        if (error.message.includes("introuvable")) {
          res.status(404).json({
            success: false,
            error: "Utilisateur introuvable",
            message: error.message,
          });
        } else if (error.message.includes("dernier administrateur")) {
          res.status(409).json({
            success: false,
            error: "Action interdite",
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            error: "Erreur interne du serveur",
            message: "Impossible de modifier le statut de l'utilisateur",
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de modifier le statut de l'utilisateur",
        });
      }
    }
  }

  // GET /admin/users/stats - Statistiques des utilisateurs
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";

      logAdminAction(adminEmail, "GET_USER_STATS");

      const stats = await AdminUserService.getUserStats();

      logAdminAction(adminEmail, "GET_USER_STATS_SUCCESS", undefined, stats);

      res.status(200).json({
        success: true,
        data: stats,
        message: "Statistiques des utilisateurs récupérées",
      });
    } catch (error) {
      console.error("❌ [ADMIN_USER_CONTROLLER] Erreur getUserStats:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer les statistiques",
      });
    }
  }
}
