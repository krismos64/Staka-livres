import React, { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { LogEntry, TypeLog } from "../../types/shared";
import { mockLogs } from "../../utils/mockData";

const AdminLogs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filtreType, setFiltreType] = useState<TypeLog | "tous">("tous");
  const [recherche, setRecherche] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setLogs(mockLogs);
      } catch (error) {
        console.error("Erreur lors du chargement des logs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const logsFiltres = useMemo(() => {
    return logs.filter((log) => {
      const matchRecherche =
        log.action.toLowerCase().includes(recherche.toLowerCase()) ||
        log.description.toLowerCase().includes(recherche.toLowerCase()) ||
        log.user?.email.toLowerCase().includes(recherche.toLowerCase());

      const matchType = filtreType === "tous" || log.type === filtreType;

      let matchDate = true;
      if (dateDebut) {
        matchDate = matchDate && new Date(log.createdAt) >= new Date(dateDebut);
      }
      if (dateFin) {
        matchDate =
          matchDate &&
          new Date(log.createdAt) <= new Date(dateFin + "T23:59:59");
      }

      return matchRecherche && matchType && matchDate;
    });
  }, [logs, recherche, filtreType, dateDebut, dateFin]);

  const stats = useMemo(() => {
    const total = logs.length;
    const auth = logs.filter((l) => l.type === TypeLog.AUTH).length;
    const admin = logs.filter((l) => l.type === TypeLog.ADMIN).length;
    const commande = logs.filter((l) => l.type === TypeLog.COMMANDE).length;
    const system = logs.filter((l) => l.type === TypeLog.SYSTEM).length;

    return { total, auth, admin, commande, system };
  }, [logs]);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logs & Audit</h1>
        <p className="text-gray-600">
          Historique des actions et audit de sécurité
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Action, utilisateur..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="tous">Tous les types</option>
              <option value={TypeLog.AUTH}>Authentification</option>
              <option value={TypeLog.ADMIN}>Administration</option>
              <option value={TypeLog.COMMANDE}>Commandes</option>
              <option value={TypeLog.PAIEMENT}>Paiements</option>
              <option value={TypeLog.SYSTEM}>Système</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Timeline des logs */}
      {logsFiltres.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <i className="fas fa-history text-4xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {recherche || dateDebut || dateFin
              ? "Aucun log trouvé"
              : "Aucun log disponible"}
          </h3>
          <p className="text-gray-500">
            {recherche || dateDebut || dateFin
              ? "Essayez de modifier vos critères de recherche"
              : "Les événements du système apparaîtront ici"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline des événements ({logsFiltres.length})
            </h3>

            <div className="space-y-4">
              {logsFiltres.map((log, index) => (
                <div key={log.id} className="flex space-x-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(
                        log.type
                      )}`}
                    >
                      <i className={`${getTypeIcon(log.type)} text-sm`}></i>
                    </div>
                    {index < logsFiltres.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          {log.action}
                        </h4>
                        {getTypeBadge(log.type)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {log.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {log.user && (
                        <span className="flex items-center">
                          <i className="fas fa-user mr-1"></i>
                          {log.user.prenom} {log.user.nom} ({log.user.email})
                        </span>
                      )}

                      {log.ipAddress && (
                        <span className="flex items-center">
                          <i className="fas fa-globe mr-1"></i>
                          {log.ipAddress}
                        </span>
                      )}

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <span className="flex items-center">
                          <i className="fas fa-info-circle mr-1"></i>
                          {Object.entries(log.metadata)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
