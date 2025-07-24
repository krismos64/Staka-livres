import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { AuditService, AUDIT_ACTIONS } from "../services/auditService";

/**
 * Contrôleur pour les opérations utilisateur RGPD
 */
export class UserController {
  
  /**
   * Suppression de compte utilisateur (RGPD)
   * DELETE /api/users/me
   */
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;
      
      if (!userId || !userEmail) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return;
      }

      // Suppression du compte via le service
      await UserService.deleteUserAccount(userId);

      // Audit log
      await AuditService.logAdminAction(
        userEmail,
        AUDIT_ACTIONS.USER_DELETED,
        'user',
        userId,
        { 
          reason: 'RGPD_REQUEST',
          method: 'self_deletion'
        },
        req.ip,
        req.get('user-agent'),
        'HIGH'
      );

      // Réponse 204 No Content (compte supprimé)
      res.status(204).end();
      
    } catch (error) {
      console.error('❌ [UserController] Erreur suppression compte:', error);
      res.status(500).json({ 
        error: "Erreur lors de la suppression du compte",
        message: error instanceof Error ? error.message : "Erreur interne"
      });
    }
  }

  /**
   * Désactivation de compte utilisateur
   * PUT /api/users/me/deactivate
   */
  static async deactivateAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;
      
      if (!userId || !userEmail) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return;
      }

      // Désactivation du compte via le service
      await UserService.deactivateUserAccount(userId);

      // Audit log
      await AuditService.logAdminAction(
        userEmail,
        AUDIT_ACTIONS.USER_UPDATED,
        'user',
        userId,
        { 
          action: 'account_deactivation',
          method: 'self_service'
        },
        req.ip,
        req.get('user-agent'),
        'MEDIUM'
      );

      // Réponse de confirmation
      res.status(200).json({
        message: "Compte désactivé avec succès"
      });
      
    } catch (error) {
      console.error('❌ [UserController] Erreur désactivation compte:', error);
      res.status(500).json({ 
        error: "Erreur lors de la désactivation du compte",
        message: error instanceof Error ? error.message : "Erreur interne"
      });
    }
  }

  /**
   * Export des données utilisateur (RGPD)
   * GET /api/users/me/export
   */
  static async exportUserData(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;
      
      if (!userId || !userEmail) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return;
      }

      // Export des données via le service
      await UserService.exportUserData(userId, userEmail);

      // Audit log
      await AuditService.logAdminAction(
        userEmail,
        AUDIT_ACTIONS.USER_DATA_EXPORTED,
        'user',
        userId,
        { 
          export_method: 'email',
          data_types: ['profile', 'commandes', 'invoices', 'messages']
        },
        req.ip,
        req.get('user-agent'),
        'MEDIUM'
      );

      // Réponse de confirmation
      res.status(200).json({
        message: "Vos données ont été exportées et envoyées par email",
        email: userEmail,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [UserController] Erreur export données:', error);
      res.status(500).json({ 
        error: "Erreur lors de l'export des données",
        message: error instanceof Error ? error.message : "Erreur interne"
      });
    }
  }

  /**
   * Statistiques utilisateur pour le profil
   * GET /api/users/me/stats
   */
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return;
      }

      const stats = await UserService.getUserStats(userId);

      res.status(200).json(stats);
      
    } catch (error) {
      console.error('❌ [UserController] Erreur récupération stats:', error);
      res.status(500).json({ 
        error: "Erreur lors de la récupération des statistiques",
        message: error instanceof Error ? error.message : "Erreur interne"
      });
    }
  }

  /**
   * Mise à jour du profil utilisateur
   * PUT /api/users/me/profile
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { prenom, nom, telephone, adresse, bio } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return;
      }

      const updatedUser = await UserService.updateUserProfile(userId, {
        prenom,
        nom,
        telephone,
        adresse,
        bio
      });

      // Audit log
      await AuditService.logAdminAction(
        req.user?.email || 'unknown',
        AUDIT_ACTIONS.USER_UPDATED,
        'user',
        userId,
        { 
          fields_updated: Object.keys(req.body),
          method: 'profile_update'
        },
        req.ip,
        req.get('user-agent'),
        'LOW'
      );

      res.status(200).json({
        message: "Profil mis à jour avec succès",
        user: updatedUser
      });
      
    } catch (error) {
      console.error('❌ [UserController] Erreur mise à jour profil:', error);
      res.status(500).json({ 
        error: "Erreur lors de la mise à jour du profil",
        message: error instanceof Error ? error.message : "Erreur interne"
      });
    }
  }

  /**
   * Changement de mot de passe
   * PUT /api/users/me/password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({ 
          error: "Mot de passe actuel et nouveau mot de passe requis" 
        });
        return;
      }

      await UserService.changeUserPassword(userId, currentPassword, newPassword);

      // Audit log
      await AuditService.logAdminAction(
        req.user?.email || 'unknown',
        AUDIT_ACTIONS.USER_UPDATED,
        'user',
        userId,
        { 
          action: 'password_change',
          method: 'self_service'
        },
        req.ip,
        req.get('user-agent'),
        'MEDIUM'
      );

      res.status(200).json({
        message: "Mot de passe changé avec succès"
      });
      
    } catch (error) {
      console.error('❌ [UserController] Erreur changement mot de passe:', error);
      
      if (error instanceof Error && error.message.includes('Mot de passe actuel incorrect')) {
        res.status(400).json({ 
          error: "Mot de passe actuel incorrect"
        });
      } else {
        res.status(500).json({ 
          error: "Erreur lors du changement de mot de passe",
          message: error instanceof Error ? error.message : "Erreur interne"
        });
      }
    }
  }

  /**
   * Récupération des préférences utilisateur
   * GET /api/users/me/preferences
   */
  static async getUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return;
      }

      const preferences = await UserService.getUserPreferences(userId);

      res.status(200).json(preferences);
      
    } catch (error) {
      console.error('❌ [UserController] Erreur récupération préférences:', error);
      res.status(500).json({ 
        error: "Erreur lors de la récupération des préférences",
        message: error instanceof Error ? error.message : "Erreur interne"
      });
    }
  }

  /**
   * Mise à jour des préférences utilisateur
   * PUT /api/users/me/preferences
   */
  static async updateUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const preferences = req.body;
      
      if (!userId) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return;
      }

      const updatedPreferences = await UserService.updateUserPreferences(userId, preferences);

      // Audit log
      await AuditService.logAdminAction(
        req.user?.email || 'unknown',
        AUDIT_ACTIONS.USER_UPDATED,
        'user',
        userId,
        { 
          action: 'preferences_update',
          preferences_updated: Object.keys(preferences)
        },
        req.ip,
        req.get('user-agent'),
        'LOW'
      );

      res.status(200).json({
        message: "Préférences mises à jour avec succès",
        preferences: updatedPreferences
      });
      
    } catch (error) {
      console.error('❌ [UserController] Erreur mise à jour préférences:', error);
      res.status(500).json({ 
        error: "Erreur lors de la mise à jour des préférences",
        message: error instanceof Error ? error.message : "Erreur interne"
      });
    }
  }
}