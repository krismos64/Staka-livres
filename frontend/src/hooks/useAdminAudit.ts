import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { tokenUtils } from "../utils/auth";

// Correction : toujours /api côté navigateur, backend:3001 côté Node
const API_BASE_URL =
  typeof window !== "undefined" ? "/api" : "http://backend:3001";

// Types pour les logs d'audit
export interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetType: 'user' | 'command' | 'invoice' | 'payment' | 'file' | 'auth' | 'system';
  targetId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    total: number;
    bySeverity: Record<string, number>;
    topActions: Array<{
      action: string;
      count: number;
    }>;
  };
}

export interface AuditStatsResponse {
  overview: {
    totalLogs: number;
    last24hLogs: number;
    last7dLogs: number;
    last30dLogs: number;
  };
  severityStats: Record<string, number>;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
}

export interface AuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  severity?: string;
  targetType?: string;
  adminEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Functions
const auditAPI = {
  async getAuditLogs(params: AuditLogsParams = {}): Promise<AuditLogsResponse> {
    const token = tokenUtils.get();
    const urlParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        urlParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/admin/audit/logs?${urlParams}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  async getAuditStats(): Promise<AuditStatsResponse> {
    const token = tokenUtils.get();
    const response = await fetch(`${API_BASE_URL}/admin/audit/stats`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  async exportAuditLogs(params: AuditLogsParams & { format?: 'csv' | 'json' }): Promise<Blob> {
    const token = tokenUtils.get();
    const urlParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        urlParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/admin/audit/export?${urlParams}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.blob();
  },

  async cleanupAuditLogs(days: number = 90): Promise<{ message: string; deletedCount: number }> {
    const token = tokenUtils.get();
    const response = await fetch(`${API_BASE_URL}/admin/audit/cleanup?days=${days}`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },
};

// Hooks React Query
export const useAdminAuditLogs = (params: AuditLogsParams = {}) => {
  return useQuery({
    queryKey: ["admin-audit-logs", params],
    queryFn: () => auditAPI.getAuditLogs(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAdminAuditStats = () => {
  return useQuery({
    queryKey: ["admin-audit-stats"],
    queryFn: () => auditAPI.getAuditStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useExportAuditLogs = () => {
  return useMutation({
    mutationFn: (params: AuditLogsParams & { format?: 'csv' | 'json' }) => 
      auditAPI.exportAuditLogs(params),
    onSuccess: (blob, variables) => {
      // Téléchargement automatique du fichier
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const format = variables.format || 'csv';
      const date = new Date().toISOString().split('T')[0];
      link.download = `audit-logs-${date}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
};

export const useCleanupAuditLogs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (days: number) => auditAPI.cleanupAuditLogs(days),
    onSuccess: () => {
      // Invalider les caches après nettoyage
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-stats"] });
    },
  });
};

// Constantes pour les filtres
export const AUDIT_SEVERITIES = [
  { value: 'LOW', label: 'Faible', color: 'text-blue-600' },
  { value: 'MEDIUM', label: 'Moyen', color: 'text-yellow-600' },
  { value: 'HIGH', label: 'Élevé', color: 'text-orange-600' },
  { value: 'CRITICAL', label: 'Critique', color: 'text-red-600' },
] as const;

export const AUDIT_TARGET_TYPES = [
  { value: 'user', label: 'Utilisateur' },
  { value: 'command', label: 'Commande' },
  { value: 'invoice', label: 'Facture' },
  { value: 'payment', label: 'Paiement' },
  { value: 'file', label: 'Fichier' },
  { value: 'auth', label: 'Authentification' },
  { value: 'system', label: 'Système' },
] as const;

export const AUDIT_ACTIONS = [
  // Authentification
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'REGISTER_SUCCESS',
  'REGISTER_FAILED',
  
  // Gestion des utilisateurs
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_ROLE_CHANGED',
  'USER_STATUS_CHANGED',
  
  // Gestion des factures
  'INVOICE_ACCESSED',
  'INVOICE_DOWNLOADED',
  'INVOICE_SENT',
  'INVOICE_CANCELLED',
  
  // Gestion des paiements
  'PAYMENT_SESSION_CREATED',
  'PAYMENT_STATUS_CHECKED',
  'PAYMENT_WEBHOOK_RECEIVED',
  
  // Audit
  'AUDIT_LOGS_ACCESSED',
  'AUDIT_LOGS_EXPORTED',
  'AUDIT_LOGS_CLEANUP',
  
  // Sécurité
  'UNAUTHORIZED_ACCESS',
  'SUSPICIOUS_ACTIVITY',
  'SECURITY_BREACH',
] as const;