import React from "react";
import { Role } from "../../types/shared";
import LoadingSpinner from "../common/LoadingSpinner";

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: Role | "TOUS";
  onRoleFilterChange: (role: Role | "TOUS") => void;
  isSearching?: boolean;
  isLoading?: boolean;
  onClearSearch?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  filterAriaLabel?: string;
  showAdvancedFilters?: boolean;
  activeFilter?: boolean | "TOUS";
  onActiveFilterChange?: (active: boolean | "TOUS") => void;
}

type RoleFilter = Role | "TOUS";
type ActiveFilter = boolean | "TOUS";

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  isSearching = false,
  isLoading = false,
  onClearSearch,
  onRefresh,
  onExport,
  className = "",
  searchPlaceholder = "Rechercher par nom, prénom ou email...",
  searchAriaLabel = "Rechercher des utilisateurs",
  filterAriaLabel = "Filtrer par rôle",
  showAdvancedFilters = false,
  activeFilter = "TOUS",
  onActiveFilterChange,
}) => {
  const hasFilters =
    searchTerm.trim() || roleFilter !== "TOUS" || activeFilter !== "TOUS";

  const handleClearAll = () => {
    onSearchChange("");
    onRoleFilterChange("TOUS");
    if (onActiveFilterChange) {
      onActiveFilterChange("TOUS");
    }
    if (onClearSearch) {
      onClearSearch();
    }
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Section Recherche */}
        <div className="flex-1">
          <label htmlFor="search-input" className="sr-only">
            {searchAriaLabel}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {isSearching ? (
                <LoadingSpinner size="sm" />
              ) : (
                <i
                  className="fas fa-search text-gray-400"
                  aria-hidden="true"
                ></i>
              )}
            </div>
            <input
              id="search-input"
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={searchAriaLabel}
              aria-describedby="search-description"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                disabled={isLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                aria-label="Effacer la recherche"
                title="Effacer la recherche"
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            )}
          </div>
          <div id="search-description" className="sr-only">
            Saisissez votre recherche. Les résultats s'affichent
            automatiquement.
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-4">
          {/* Filtre par rôle */}
          <div className="flex items-center gap-2">
            <i className="fas fa-filter text-gray-400" aria-hidden="true"></i>
            <label htmlFor="role-filter" className="sr-only">
              {filterAriaLabel}
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value as RoleFilter)}
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={filterAriaLabel}
            >
              <option value="TOUS">Tous les rôles</option>
              <option value={Role.USER}>Utilisateurs</option>
              <option value={Role.ADMIN}>Administrateurs</option>
            </select>
          </div>

          {/* Filtre par statut (optionnel) */}
          {showAdvancedFilters && onActiveFilterChange && (
            <div className="flex items-center gap-2">
              <i
                className="fas fa-toggle-on text-gray-400"
                aria-hidden="true"
              ></i>
              <label htmlFor="status-filter" className="sr-only">
                Filtrer par statut
              </label>
              <select
                id="status-filter"
                value={
                  activeFilter === "TOUS"
                    ? "TOUS"
                    : activeFilter
                    ? "true"
                    : "false"
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "TOUS") {
                    onActiveFilterChange("TOUS");
                  } else {
                    onActiveFilterChange(value === "true");
                  }
                }}
                disabled={isLoading}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Filtrer par statut"
              >
                <option value="TOUS">Tous les statuts</option>
                <option value="true">Actifs</option>
                <option value="false">Inactifs</option>
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Indicateur de filtres actifs */}
          {hasFilters && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-600 font-medium">
                Filtres actifs
              </span>
              <button
                onClick={handleClearAll}
                disabled={isLoading}
                className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
                aria-label="Effacer tous les filtres"
              >
                Tout effacer
              </button>
            </div>
          )}

          {/* Bouton Actualiser */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label="Actualiser la liste"
              title="Actualiser"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <i className="fas fa-sync-alt" aria-hidden="true"></i>
              )}
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          )}

          {/* Bouton Export */}
          {onExport && (
            <button
              onClick={onExport}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label="Exporter les données"
              title="Exporter"
            >
              <i className="fas fa-download" aria-hidden="true"></i>
              <span className="hidden sm:inline">Exporter</span>
            </button>
          )}
        </div>
      </div>

      {/* Résumé des filtres pour l'accessibilité */}
      {hasFilters && (
        <div
          className="mt-3 text-sm text-gray-600"
          role="status"
          aria-live="polite"
          aria-label="Résumé des filtres actifs"
        >
          Filtres actifs :{" "}
          {searchTerm && (
            <span>
              Recherche "{searchTerm}"
              {(roleFilter !== "TOUS" || activeFilter !== "TOUS") && ", "}
            </span>
          )}
          {roleFilter !== "TOUS" && (
            <span>
              Rôle {roleFilter}
              {activeFilter !== "TOUS" && ", "}
            </span>
          )}
          {activeFilter !== "TOUS" && (
            <span>Statut {activeFilter ? "Actif" : "Inactif"}</span>
          )}
        </div>
      )}
    </div>
  );
};

// ===============================
// COMPOSANT STATISTIQUES RAPIDES
// ===============================

interface QuickStatsProps {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  isLoading?: boolean;
  className?: string;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  totalUsers,
  activeUsers,
  adminUsers,
  isLoading = false,
  className = "",
}) => {
  if (isLoading) {
    return (
      <div
        className={`bg-white p-4 rounded-lg shadow-sm ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Chargement des statistiques"
      >
        <div className="flex items-center justify-center">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-gray-600">
            Chargement des statistiques...
          </span>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total utilisateurs",
      value: totalUsers,
      icon: "fas fa-users",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Utilisateurs actifs",
      value: activeUsers,
      icon: "fas fa-user-check",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Administrateurs",
      value: adminUsers,
      icon: "fas fa-user-shield",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-lg p-4 flex items-center`}
            role="group"
            aria-labelledby={`stat-${index}-label`}
          >
            <div className={`${stat.color} mr-3`}>
              <i className={`${stat.icon} text-xl`} aria-hidden="true"></i>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value.toLocaleString("fr-FR")}
              </div>
              <div id={`stat-${index}-label`} className="text-sm text-gray-600">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchAndFilters;
