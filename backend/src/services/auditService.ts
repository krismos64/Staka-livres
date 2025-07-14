import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Types pour les événements d'audit
export interface AuditEvent {
  timestamp: Date;
  adminEmail: string;
  action: string;
  targetType: 'user' | 'command' | 'invoice' | 'payment' | 'file' | 'auth' | 'system';
  targetId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Actions d'audit standardisées
export const AUDIT_ACTIONS = {
  // Authentification
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Gestion des utilisateurs
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_DATA_EXPORTED: 'USER_DATA_EXPORTED',
  USER_MESSAGE_SUPPORT_EMAIL_SENT: 'USER_MESSAGE_SUPPORT_EMAIL_SENT',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  
  // Gestion des commandes
  COMMAND_CREATED: 'COMMAND_CREATED',
  COMMAND_UPDATED: 'COMMAND_UPDATED',
  COMMAND_DELETED: 'COMMAND_DELETED',
  COMMAND_STATUS_CHANGED: 'COMMAND_STATUS_CHANGED',
  
  // Gestion des factures
  INVOICE_ACCESSED: 'INVOICE_ACCESSED',
  INVOICE_DOWNLOADED: 'INVOICE_DOWNLOADED',
  INVOICE_SENT: 'INVOICE_SENT',
  INVOICE_CANCELLED: 'INVOICE_CANCELLED',
  INVOICE_UPDATED: 'INVOICE_UPDATED',
  
  // Gestion des paiements
  PAYMENT_SESSION_CREATED: 'PAYMENT_SESSION_CREATED',
  PAYMENT_STATUS_CHECKED: 'PAYMENT_STATUS_CHECKED',
  PAYMENT_WEBHOOK_RECEIVED: 'PAYMENT_WEBHOOK_RECEIVED',
  
  // Gestion des fichiers
  FILE_UPLOADED: 'FILE_UPLOADED',
  FILE_DOWNLOADED: 'FILE_DOWNLOADED',
  FILE_DELETED: 'FILE_DELETED',
  FILE_ACCESSED: 'FILE_ACCESSED',
  
  // Accès et sécurité
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  SECURITY_BREACH: 'SECURITY_BREACH',
} as const;

// Niveaux de sévérité
export const SEVERITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

// Service d'audit centralisé
export class AuditService {
  
  /**
   * Enregistre un événement d'audit
   */
  static async logEvent(event: AuditEvent): Promise<void> {
    try {
      // Log immédiat dans la console pour debugging
      const timestamp = event.timestamp.toISOString();
      const severity = event.severity || 'MEDIUM';
      const icon = AuditService.getSeverityIcon(severity);
      
      console.log(`${icon} [AUDIT] ${timestamp} - ${event.action} - Admin: ${event.adminEmail} - Target: ${event.targetType}${event.targetId ? ':' + event.targetId : ''} - IP: ${event.ipAddress || 'unknown'}`);
      
      if (event.details) {
        console.log(`📄 [AUDIT DETAILS] ${JSON.stringify(event.details)}`);
      }
      
      // Persistence en base de données
      await prisma.auditLog.create({
        data: {
          timestamp: event.timestamp,
          adminEmail: event.adminEmail,
          action: event.action,
          targetType: event.targetType as any,
          targetId: event.targetId,
          details: event.details ? JSON.stringify(event.details) : null,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          severity: event.severity || 'MEDIUM',
        },
      });
      
    } catch (error) {
      console.error('❌ [AUDIT ERROR] Erreur lors de l\'enregistrement de l\'audit:', error);
      // Ne pas faire échouer la requête si l'audit échoue
    }
  }
  
  /**
   * Enregistre une action d'administration
   */
  static async logAdminAction(
    adminEmail: string,
    action: string,
    targetType: AuditEvent['targetType'],
    targetId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
    severity: AuditEvent['severity'] = 'MEDIUM'
  ): Promise<void> {
    await AuditService.logEvent({
      timestamp: new Date(),
      adminEmail,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      userAgent,
      severity,
    });
  }
  
  /**
   * Enregistre un événement de sécurité
   */
  static async logSecurityEvent(
    email: string,
    action: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
    severity: AuditEvent['severity'] = 'HIGH'
  ): Promise<void> {
    await AuditService.logEvent({
      timestamp: new Date(),
      adminEmail: email,
      action,
      targetType: 'auth',
      details,
      ipAddress,
      userAgent,
      severity,
    });
  }
  
  /**
   * Enregistre un accès à un fichier sensible
   */
  static async logFileAccess(
    userEmail: string,
    fileId: string,
    action: 'access' | 'download' | 'upload' | 'delete',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await AuditService.logEvent({
      timestamp: new Date(),
      adminEmail: userEmail,
      action: `FILE_${action.toUpperCase()}`,
      targetType: 'file',
      targetId: fileId,
      ipAddress,
      userAgent,
      severity: action === 'delete' ? 'HIGH' : 'MEDIUM',
    });
  }
  
  /**
   * Enregistre un accès à une facture
   */
  static async logInvoiceAccess(
    userEmail: string,
    invoiceId: string,
    action: 'access' | 'download' | 'send' | 'cancel',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await AuditService.logEvent({
      timestamp: new Date(),
      adminEmail: userEmail,
      action: `INVOICE_${action.toUpperCase()}`,
      targetType: 'invoice',
      targetId: invoiceId,
      ipAddress,
      userAgent,
      severity: action === 'cancel' ? 'HIGH' : 'MEDIUM',
    });
  }
  
  /**
   * Enregistre une opération de paiement
   */
  static async logPaymentOperation(
    userEmail: string,
    sessionId: string,
    action: 'create' | 'check' | 'webhook',
    amount?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await AuditService.logEvent({
      timestamp: new Date(),
      adminEmail: userEmail,
      action: `PAYMENT_${action.toUpperCase()}`,
      targetType: 'payment',
      targetId: sessionId,
      details: amount ? { amount } : undefined,
      ipAddress,
      userAgent,
      severity: 'MEDIUM',
    });
  }
  
  /**
   * Retourne l'icône correspondant au niveau de sévérité
   */
  private static getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'LOW': return '🔷';
      case 'MEDIUM': return '🔶';
      case 'HIGH': return '🔴';
      case 'CRITICAL': return '🚨';
      default: return '📝';
    }
  }
}

// Middleware d'audit pour les requêtes
export const auditMiddleware = (action: string, targetType: AuditEvent['targetType'], severity: AuditEvent['severity'] = 'MEDIUM') => {
  return async (req: any, res: any, next: any) => {
    try {
      const userEmail = req.user?.email || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';
      
      // Extraire l'ID de la cible depuis les paramètres
      const targetId = req.params.id || req.params.sessionId || req.params.invoiceId;
      
      await AuditService.logAdminAction(
        userEmail,
        action,
        targetType,
        targetId,
        {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.body ? Object.keys(req.body) : undefined, // Ne pas logger les valeurs sensibles
        },
        ipAddress,
        userAgent,
        severity
      );
      
      next();
    } catch (error) {
      console.error('❌ [AUDIT MIDDLEWARE ERROR]', error);
      next(); // Continuer même si l'audit échoue
    }
  };
};