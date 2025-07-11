import React, { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { TestUtils } from "../../utils/testUtils";
import LoadingSpinner from "../common/LoadingSpinner";

interface AccessDeniedProps {
  reason?: string;
  onRetry?: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ reason, onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="max-w-md w-full text-center">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <i className="fas fa-shield-alt text-red-600 text-2xl"></i>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès Refusé</h1>

        <p className="text-gray-600 mb-6">
          {reason ||
            "Vous n'avez pas les permissions nécessaires pour accéder à cette section."}
        </p>

        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-redo mr-2"></i>
              Réessayer
            </button>
          )}

          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <i className="fas fa-home mr-2"></i>
            Retour à l'accueil
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Code d'erreur : ADMIN_ACCESS_DENIED
            <br />
            Timestamp : {new Date().toISOString()}
          </p>
        </div>
      </div>
    </div>
  </div>
);

interface SecurityAuditLog {
  timestamp: string;
  action: string;
  userId?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  result: "SUCCESS" | "DENIED" | "ERROR";
  reason?: string;
}

class SecurityAuditor {
  private static logs: SecurityAuditLog[] = [];

  static logAccessAttempt(
    action: string,
    user: any,
    result: SecurityAuditLog["result"],
    reason?: string
  ) {
    const log: SecurityAuditLog = {
      timestamp: new Date().toISOString(),
      action,
      userId: user?.id,
      userRole: user?.role,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      result,
      reason,
    };

    this.logs.push(log);

    // Log en console pour le développement
    if (result === "DENIED") {
      console.warn("🚨 Tentative d'accès non autorisée:", log);
    } else if (result === "SUCCESS") {
      console.info("✅ Accès admin autorisé:", log);
    }

    // En production, envoyer ces logs au serveur
    if (process.env.NODE_ENV === "production") {
      this.sendToServer(log);
    }
  }

  private static getClientIP(): string {
    // En développement, retourner une IP fictive
    return "127.0.0.1";
  }

  private static async sendToServer(log: SecurityAuditLog) {
    try {
      // Ici, envoyer le log au serveur
      // await fetch('/api/security/audit', { method: 'POST', body: JSON.stringify(log) });
      console.log("Security log sent to server:", log);
    } catch (error) {
      console.error("Failed to send security log:", error);
    }
  }

  static getLogs(): SecurityAuditLog[] {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
  }
}

interface RequireAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
  onAccessDenied?: (reason: string) => void;
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({
  children,
  fallback,
  onAccessDenied,
}) => {
  const { user, isLoading, isAdmin } = useAuth();
  const [validationState, setValidationState] = useState<
    "validating" | "granted" | "denied"
  >("validating");
  const [denialReason, setDenialReason] = useState<string>("");

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // Étape 1: Vérifier si l'utilisateur existe
        if (!user) {
          const reason = "Utilisateur non authentifié";
          SecurityAuditor.logAccessAttempt(
            "admin_access",
            null,
            "DENIED",
            reason
          );
          setDenialReason(reason);
          setValidationState("denied");
          onAccessDenied?.(reason);
          return;
        }

        // Étape 2: Vérifier le rôle admin
        if (!isAdmin()) {
          const reason = `Rôle insuffisant: ${user.role} (requis: ADMIN)`;
          SecurityAuditor.logAccessAttempt(
            "admin_access",
            user,
            "DENIED",
            reason
          );
          setDenialReason(reason);
          setValidationState("denied");
          onAccessDenied?.(reason);
          return;
        }

        // Étape 3: Vérifier que le compte est actif
        if (!user.isActive) {
          const reason = "Compte utilisateur désactivé";
          SecurityAuditor.logAccessAttempt(
            "admin_access",
            user,
            "DENIED",
            reason
          );
          setDenialReason(reason);
          setValidationState("denied");
          onAccessDenied?.(reason);
          return;
        }

        // Étape 4: Validation des permissions avec TestUtils
        try {
          TestUtils.validateAdminAccess(user.role);
        } catch (error) {
          const reason =
            error instanceof Error
              ? error.message
              : "Validation de sécurité échouée";
          SecurityAuditor.logAccessAttempt(
            "admin_access",
            user,
            "DENIED",
            reason
          );
          setDenialReason(reason);
          setValidationState("denied");
          onAccessDenied?.(reason);
          return;
        }

        // Étape 5: Vérifier la validité du token (simulation)
        const token = localStorage.getItem("auth_token");
        if (!token) {
          const reason = "Token d'authentification manquant";
          SecurityAuditor.logAccessAttempt(
            "admin_access",
            user,
            "DENIED",
            reason
          );
          setDenialReason(reason);
          setValidationState("denied");
          onAccessDenied?.(reason);
          return;
        }

        // Toutes les validations passées
        SecurityAuditor.logAccessAttempt("admin_access", user, "SUCCESS");
        setValidationState("granted");
      } catch (error) {
        const reason = "Erreur lors de la validation des permissions";
        SecurityAuditor.logAccessAttempt("admin_access", user, "ERROR", reason);
        setDenialReason(reason);
        setValidationState("denied");
        onAccessDenied?.(reason);
      }
    };

    if (!isLoading) {
      validateAccess();
    }
  }, [user, isLoading, isAdmin, onAccessDenied]);

  // Gestion de l'expiration du token
  useEffect(() => {
    const handleTokenExpiry = () => {
      const reason = "Session expirée - Reconnexion requise";
      SecurityAuditor.logAccessAttempt(
        "admin_session_check",
        user,
        "DENIED",
        reason
      );
      setDenialReason(reason);
      setValidationState("denied");
      onAccessDenied?.(reason);
    };

    window.addEventListener("auth:token-expired", handleTokenExpiry);
    return () =>
      window.removeEventListener("auth:token-expired", handleTokenExpiry);
  }, [user, onAccessDenied]);

  // Interface de chargement
  if (isLoading || validationState === "validating") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Interface d'accès refusé
  if (validationState === "denied") {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <AccessDenied
        reason={denialReason}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Accès accordé
  return <>{children}</>;
};

// Hook pour accéder aux logs de sécurité
export const useSecurityAudit = () => {
  return {
    logs: SecurityAuditor.getLogs(),
    clearLogs: SecurityAuditor.clearLogs,
    logAccessAttempt: SecurityAuditor.logAccessAttempt,
  };
};

// Composant utilitaire pour afficher les logs de sécurité (développement)
export const SecurityAuditPanel: React.FC = () => {
  const { logs, clearLogs } = useSecurityAudit();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white border rounded-lg shadow-lg p-4 z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Security Audit</h3>
        <button
          onClick={clearLogs}
          className="text-xs bg-gray-100 px-2 py-1 rounded"
        >
          Clear
        </button>
      </div>

      <div className="max-h-40 overflow-y-auto text-xs space-y-1">
        {logs.length === 0 ? (
          <p className="text-gray-500">Aucun log de sécurité</p>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`p-2 rounded ${
                log.result === "SUCCESS"
                  ? "bg-green-50 text-green-800"
                  : log.result === "DENIED"
                  ? "bg-red-50 text-red-800"
                  : "bg-yellow-50 text-yellow-800"
              }`}
            >
              <div className="font-medium">{log.action}</div>
              <div>Résultat: {log.result}</div>
              {log.reason && <div>Raison: {log.reason}</div>}
              <div className="text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RequireAdmin;
