import React, { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { LogEntry, PaginatedResponse, TypeLog } from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";
import { useToasts } from "../../utils/toast";

const AdminLogs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filtreType, setFiltreType] = useState<TypeLog | "tous">("tous");
  const [recherche, setRecherche] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const { showToast } = useToasts();

  const ITEMS_PER_PAGE = 20;

  const loadLogs = async (page = 1) => {
    try {
      setLoading(page === 1);
      setError(null);

      const response: PaginatedResponse<LogEntry> = await adminAPI.getLogs(
        page,
        ITEMS_PER_PAGE,
        filtreType !== "tous" ? filtreType : undefined,
        selectedUserId || undefined,
        dateDebut || undefined,
        dateFin || undefined
      );

      setLogs(response.data || []);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);

      if (page === 1) {
        showToast("success", "Logs chargés", "Journal d'audit mis à jour");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de chargement des logs";
      setError(errorMessage);
      showToast("error", "Erreur", errorMessage);
      console.error("Erreur chargement logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, []);

  // Recharger quand les filtres changent
  useEffect(() => {
    if (!loading) {
      setCurrentPage(1);
      loadLogs(1);
    }
  }, [filtreType, selectedUserId, dateDebut, dateFin]);

  const logsFiltres = useMemo(() => {
    if (!recherche) return logs;

    return logs.filter((log) => {
      const matchRecherche =
        log.action.toLowerCase().includes(recherche.toLowerCase()) ||
        log.description.toLowerCase().includes(recherche.toLowerCase()) ||
        log.user?.email.toLowerCase().includes(recherche.toLowerCase()) ||
        log.user?.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
        log.user?.prenom?.toLowerCase().includes(recherche.toLowerCase());

      return matchRecherche;
    });
  }, [logs, recherche]);

  const stats = useMemo(() => {
    const total = totalItems;
    const auth = logs.filter((l) => l.type === TypeLog.AUTH).length;
    const admin = logs.filter((l) => l.type === TypeLog.ADMIN).length;
    const commande = logs.filter((l) => l.type === TypeLog.COMMANDE).length;
    const paiement = logs.filter((l) => l.type === TypeLog.PAIEMENT).length;
    const system = logs.filter((l) => l.type === TypeLog.SYSTEM).length;

    return { total, auth, admin, commande, paiement, system };
  }, [logs, totalItems]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      loadLogs(page);
    }
  };

  const handleRefresh = () => {
    loadLogs(currentPage);
  };

  const handleExport = async () => {
    try {
      setIsOperationLoading(true);

      const blob = await adminAPI.exportLogs(
        "csv",
        filtreType !== "tous" ? filtreType : undefined,
        dateDebut || undefined,
        dateFin || undefined
      );

      // Créer le lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("success", "Export réussi", "Le fichier CSV a été téléchargé");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur d'export des logs";
      showToast("error", "Erreur", errorMessage);
      console.error("Erreur export logs:", err);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const resetFilters = () => {
    setFiltreType("tous");
    setRecherche("");
    setDateDebut("");
    setDateFin("");
    setSelectedUserId("");
    setCurrentPage(1);
  };

  const getTypeIcon = (type: TypeLog) => {
    const icons = {
      [TypeLog.AUTH]: "fas fa-sign-in-alt",
      [TypeLog.ADMIN]: "fas fa-shield-alt",
      [TypeLog.COMMANDE]: "fas fa-shopping-cart",
      [TypeLog.PAIEMENT]: "fas fa-credit-card",
      [TypeLog.SYSTEM]: "fas fa-cog",
    };
    return icons[type] || "fas fa-info-circle";
  };

  const getTypeColor = (type: TypeLog) => {
    const colors = {
      [TypeLog.AUTH]: "text-blue-600 bg-blue-100",
      [TypeLog.ADMIN]: "text-red-600 bg-red-100",
      [TypeLog.COMMANDE]: "text-green-600 bg-green-100",
      [TypeLog.PAIEMENT]: "text-purple-600 bg-purple-100",
      [TypeLog.SYSTEM]: "text-gray-600 bg-gray-100",
    };
    return colors[type] || "text-gray-600 bg-gray-100";
  };

  const getTypeBadge = (type: TypeLog) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
        type
      )}`}
    >
      <i className={`${getTypeIcon(type)} mr-1`}></i>
      {type}
    </span>
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Logs & Audit</h1>
          <p className="text-gray-600">
            Historique des actions et audit de sécurité
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Logs & Audit</h1>
          <p className="text-gray-600">
            Historique des actions et audit de sécurité
          </p>
        </div>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-redo mr-2"></i>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs & Audit</h1>
          <p className="text-gray-600">
            Historique des actions et audit de sécurité
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isOperationLoading}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <i className="fas fa-redo mr-2"></i>
            Actualiser
          </button>
          <button
            onClick={handleExport}
            disabled={isOperationLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isOperationLoading && (
              <LoadingSpinner size="sm" className="mr-2" />
            )}
            <i className="fas fa-download mr-2"></i>
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-list text-gray-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Authentification</p>
              <p className="text-xl font-bold text-blue-600">{stats.auth}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-sign-in-alt text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administration</p>
              <p className="text-xl font-bold text-red-600">{stats.admin}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-shield-alt text-red-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Commandes</p>
              <p className="text-xl font-bold text-green-600">
                {stats.commande}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-shopping-cart text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paiements</p>
              <p className="text-xl font-bold text-purple-600">
                {stats.paiement}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-credit-card text-purple-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Système</p>
              <p className="text-xl font-bold text-gray-600">{stats.system}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-cog text-gray-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Action, utilisateur..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filtreType}
              onChange={(e) =>
                setFiltreType(e.target.value as TypeLog | "tous")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tous">Tous</option>
              <option value={TypeLog.AUTH}>Authentification</option>
              <option value={TypeLog.ADMIN}>Administration</option>
              <option value={TypeLog.COMMANDE}>Commandes</option>
              <option value={TypeLog.PAIEMENT}>Paiements</option>
              <option value={TypeLog.SYSTEM}>Système</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Utilisateur
            </label>
            <input
              type="text"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="ID utilisateur"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date fin
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              <i className="fas fa-times mr-2"></i>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Timeline des logs */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {logsFiltres.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <i className="fas fa-history text-4xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun log trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              {recherche || filtreType !== "tous" || dateDebut || dateFin
                ? "Aucun log ne correspond aux critères de recherche"
                : "Aucune activité enregistrée pour le moment"}
            </p>
            <button
              onClick={resetFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-filter mr-2"></i>
              Supprimer les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logsFiltres.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">{getTypeBadge(log.type)}</td>
                    <td className="px-6 py-4 text-sm">
                      {log.user ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {log.user.nom} {log.user.prenom}
                          </div>
                          <div className="text-gray-500">{log.user.email}</div>
                          <div className="text-xs text-gray-400">
                            ID: {log.userId}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Système</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      <div className="line-clamp-2">{log.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.ipAddress && (
                        <span className="text-xs text-gray-600">
                          {log.ipAddress}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm border">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de{" "}
                <span className="font-medium">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                à{" "}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
                </span>{" "}
                sur <span className="font-medium">{totalItems}</span> résultats
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                {/* Pages numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
