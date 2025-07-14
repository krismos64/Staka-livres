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
}