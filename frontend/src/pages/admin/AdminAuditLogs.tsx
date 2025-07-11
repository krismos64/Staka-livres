import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { 
  useAdminAuditLogs, 
  useAdminAuditStats, 
  useExportAuditLogs, 
  useCleanupAuditLogs,
  AuditLog,
  AuditLogsParams,
  AUDIT_SEVERITIES,
  AUDIT_TARGET_TYPES,
  AUDIT_ACTIONS 
} from "../../hooks/useAdminAudit";
import { useDebouncedSearch } from "../../hooks/useDebouncedSearch";

const AdminAuditLogs: React.FC = () => {
  // State pour les filtres
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<AuditLogsParams>({
    page: 1,
    limit: 50,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(90);

  // Search hook
  const { debouncedSearchTerm, searchTerm, setSearchTerm } = useDebouncedSearch({ delay: 300 });

  // Mise à jour des filtres avec la recherche
  const effectiveFilters = useMemo(() => ({
    ...filters,
    page: currentPage,
    adminEmail: debouncedSearchTerm || undefined,
  }), [filters, currentPage, debouncedSearchTerm]);

  // Hooks pour les données
  const { data: auditData, isLoading, error } = useAdminAuditLogs(effectiveFilters);
  const { data: statsData } = useAdminAuditStats();
  const exportMutation = useExportAuditLogs();
  const cleanupMutation = useCleanupAuditLogs();

  // Gestionnaires d'événements
  const handleFilterChange = (key: keyof AuditLogsParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
    setCurrentPage(1);
  };

  const handleExport = (format: 'csv' | 'json') => {
    exportMutation.mutate({
      ...effectiveFilters,
      format
    });
  };

  const handleCleanup = () => {
    cleanupMutation.mutate(cleanupDays, {
      onSuccess: () => {
        setShowCleanupModal(false);
      }
    });
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = AUDIT_SEVERITIES.find(s => s.value === severity);
    if (!severityConfig) return <span className="px-2 py-1 text-xs rounded bg-gray-100">{severity}</span>;

    const bgColor = {
      'LOW': 'bg-blue-100 text-blue-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    }[severity] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${bgColor}`}>
        {severityConfig.label}
      </span>
    );
  };

  const getTargetTypeLabel = (targetType: string) => {
    const typeConfig = AUDIT_TARGET_TYPES.find(t => t.value === targetType);
    return typeConfig?.label || targetType;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-red-800">Erreur</h3>
            <p className="text-red-600 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔐 Logs d'Audit</h1>
            <p className="text-gray-600 mt-1">
              Supervision des activités administratives et de sécurité
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleExport('csv')}
              disabled={exportMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              📥 Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exportMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              📄 Export JSON
            </button>
            <button
              onClick={() => setShowCleanupModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              🗑️ Nettoyage
            </button>
          </div>
        </div>

        {/* Statistiques rapides */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{statsData.overview.totalLogs}</div>
              <div className="text-sm text-gray-600">Total des logs</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{statsData.overview.last24hLogs}</div>
              <div className="text-sm text-gray-600">Dernières 24h</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">{statsData.overview.last7dLogs}</div>
              <div className="text-sm text-gray-600">7 derniers jours</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{statsData.overview.last30dLogs}</div>
              <div className="text-sm text-gray-600">30 derniers jours</div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche par email admin
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les actions</option>
                {AUDIT_ACTIONS.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sévérité
              </label>
              <select
                value={filters.severity || ''}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les sévérités</option>
                {AUDIT_SEVERITIES.map(severity => (
                  <option key={severity.value} value={severity.value}>
                    {severity.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de cible
              </label>
              <select
                value={filters.targetType || ''}
                onChange={(e) => handleFilterChange('targetType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les types</option>
                {AUDIT_TARGET_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limite par page
              </label>
              <select
                value={filters.limit || 50}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table des logs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              Logs d'audit
              {auditData?.pagination && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({auditData.pagination.total} entrées)
                </span>
              )}
            </h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Chargement des logs...</p>
            </div>
          ) : !auditData?.logs?.length ? (
            <div className="p-8 text-center text-gray-500">
              Aucun log trouvé avec les critères sélectionnés.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cible
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sévérité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditData.logs.map((log: AuditLog) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.adminEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{getTargetTypeLabel(log.targetType)}</div>
                          {log.targetId && (
                            <div className="text-xs text-gray-400">ID: {log.targetId}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSeverityBadge(log.severity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        {log.details ? (
                          <div className="truncate" title={log.details}>
                            {log.details}
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {auditData?.pagination && auditData.pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Page {auditData.pagination.page} sur {auditData.pagination.pages}
                  {' '}({auditData.pagination.total} entrées)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(auditData.pagination.pages, currentPage + 1))}
                    disabled={currentPage === auditData.pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de confirmation pour le nettoyage */}
        <ConfirmationModal
          isOpen={showCleanupModal}
          onClose={() => setShowCleanupModal(false)}
          onConfirm={handleCleanup}
          title="Nettoyage des logs d'audit"
          message={
            <div>
              <p className="mb-4">
                Cette action va supprimer définitivement tous les logs d'audit plus anciens que le nombre de jours spécifié.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conserver les logs des derniers (jours):
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(parseInt(e.target.value) || 90)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          }
          confirmText="Supprimer"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          isLoading={cleanupMutation.isPending}
        />
      </div>
    </div>
  );
};

export default AdminAuditLogs;