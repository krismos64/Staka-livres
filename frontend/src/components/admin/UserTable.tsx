import React from "react";
import { Role, User } from "../../types/shared";
import LoadingSpinner from "../common/LoadingSpinner";

interface UserTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (user: User) => React.ReactNode;
}

interface UserTableAction {
  key: string;
  label: string;
  icon: string;
  className?: string;
  onClick: (user: User) => void;
  disabled?: (user: User) => boolean;
  hidden?: (user: User) => boolean;
}

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  isOperationLoading?: boolean;
  columns?: UserTableColumn[];
  actions?: UserTableAction[];
  onSort?: (column: string, direction: "asc" | "desc") => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  emptyStateMessage?: string;
  emptyStateIcon?: string;
  className?: string;
  "aria-label"?: string;
}

const defaultColumns: UserTableColumn[] = [
  {
    key: "user",
    label: "Utilisateur",
    render: (user) => (
      <div className="flex items-center">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-semibold text-sm">
            {user.prenom.charAt(0)}
            {user.nom.charAt(0)}
          </span>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">
            {user.prenom} {user.nom}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
    render: (user) => <div className="text-sm text-gray-900">{user.email}</div>,
  },
  {
    key: "role",
    label: "Rôle",
    sortable: true,
    render: (user) => (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.role === Role.ADMIN
            ? "bg-purple-100 text-purple-800"
            : "bg-blue-100 text-blue-800"
        }`}
      >
        {user.role}
      </span>
    ),
  },
  {
    key: "status",
    label: "Statut",
    sortable: true,
    render: (user) => (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.isActive
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {user.isActive ? "Actif" : "Inactif"}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Inscription",
    sortable: true,
    render: (user) => (
      <div className="text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </div>
    ),
  },
];

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading = false,
  isOperationLoading = false,
  columns = defaultColumns,
  actions = [],
  onSort,
  sortColumn,
  sortDirection,
  emptyStateMessage = "Aucun utilisateur trouvé",
  emptyStateIcon = "fas fa-users",
  className = "",
  "aria-label": ariaLabel = "Table des utilisateurs",
}) => {
  const handleSort = (column: UserTableColumn) => {
    if (!column.sortable || !onSort) return;

    const newDirection =
      sortColumn === column.key && sortDirection === "asc" ? "desc" : "asc";
    onSort(column.key, newDirection);
  };

  const getSortIcon = (column: UserTableColumn) => {
    if (!column.sortable) return null;

    if (sortColumn !== column.key) {
      return (
        <i className="fas fa-sort text-gray-400 ml-1" aria-hidden="true"></i>
      );
    }

    return (
      <i
        className={`fas fa-sort-${
          sortDirection === "asc" ? "up" : "down"
        } text-blue-600 ml-1`}
        aria-hidden="true"
      ></i>
    );
  };

  // États de chargement
  if (isLoading && users.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-64"
        role="status"
        aria-live="polite"
        aria-label="Chargement des utilisateurs"
      >
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">
          Chargement des utilisateurs...
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full"
          role="table"
          aria-label={ariaLabel}
          aria-rowcount={users.length}
          aria-colcount={columns.length + (actions.length > 0 ? 1 : 0)}
        >
          <thead className="bg-gray-50">
            <tr role="row">
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                  } ${column.className || ""}`}
                  onClick={() => handleSort(column)}
                  role="columnheader"
                  aria-colindex={index + 1}
                  aria-sort={
                    sortColumn === column.key
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : column.sortable
                      ? "none"
                      : undefined
                  }
                  tabIndex={column.sortable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (
                      column.sortable &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      e.preventDefault();
                      handleSort(column);
                    }
                  }}
                >
                  <span className="flex items-center">
                    {column.label}
                    {getSortIcon(column)}
                  </span>
                </th>
              ))}
              {actions.length > 0 && (
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  role="columnheader"
                  aria-colindex={columns.length + 1}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
            {users.map((user, rowIndex) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 transition-colors"
                role="row"
                aria-rowindex={rowIndex + 1}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap ${
                      column.className || ""
                    }`}
                    role="gridcell"
                    aria-colindex={colIndex + 1}
                  >
                    {column.render
                      ? column.render(user)
                      : (user as any)[column.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                    role="gridcell"
                    aria-colindex={columns.length + 1}
                  >
                    <div className="flex items-center justify-end space-x-2">
                      {actions
                        .filter((action) => !action.hidden?.(user))
                        .map((action) => (
                          <button
                            key={action.key}
                            onClick={() => action.onClick(user)}
                            disabled={
                              isOperationLoading || action.disabled?.(user)
                            }
                            className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              action.className ||
                              "text-blue-600 hover:text-blue-900"
                            }`}
                            title={action.label}
                            aria-label={`${action.label} pour ${user.prenom} ${user.nom}`}
                          >
                            <i className={action.icon} aria-hidden="true"></i>
                          </button>
                        ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* État vide */}
      {users.length === 0 && !isLoading && (
        <div className="text-center py-12" role="status" aria-live="polite">
          <div className="mb-4">
            <i
              className={`${emptyStateIcon} text-gray-400 text-4xl`}
              aria-hidden="true"
            ></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyStateMessage}
          </h3>
          <p className="text-gray-500">
            Essayez de modifier vos filtres de recherche ou ajoutez de nouveaux
            utilisateurs.
          </p>
        </div>
      )}

      {/* Overlay de chargement pour les opérations */}
      {isOperationLoading && (
        <div
          className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center"
          role="status"
          aria-live="polite"
          aria-label="Opération en cours"
        >
          <div className="flex items-center">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-gray-600">Opération en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ===============================
// PRESET D'ACTIONS COURANTES
// ===============================

export const createUserTableActions = (handlers: {
  onView?: (user: User) => void;
  onEdit?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  onChangeRole?: (user: User, newRole: Role) => void;
  onDelete?: (user: User) => void;
  onExport?: (user: User) => void;
}): UserTableAction[] => {
  const actions: UserTableAction[] = [];

  if (handlers.onView) {
    actions.push({
      key: "view",
      label: "Voir les détails",
      icon: "fas fa-eye",
      className: "text-blue-600 hover:text-blue-900",
      onClick: handlers.onView,
    });
  }

  if (handlers.onEdit) {
    actions.push({
      key: "edit",
      label: "Modifier",
      icon: "fas fa-edit",
      className: "text-green-600 hover:text-green-900",
      onClick: handlers.onEdit,
    });
  }

  if (handlers.onToggleStatus) {
    actions.push({
      key: "toggleStatus",
      label: "Activer/Désactiver",
      icon: "fas fa-power-off",
      className: "text-yellow-600 hover:text-yellow-900",
      onClick: handlers.onToggleStatus,
    });
  }

  if (handlers.onDelete) {
    actions.push({
      key: "delete",
      label: "Supprimer",
      icon: "fas fa-trash",
      className: "text-red-600 hover:text-red-900",
      onClick: handlers.onDelete,
    });
  }

  return actions;
};

// ===============================
// COMPOSANT ROLE SELECTOR ACCESSIBLE
// ===============================

interface RoleSelectorProps {
  user: User;
  onRoleChange: (user: User, newRole: Role) => void;
  disabled?: boolean;
  className?: string;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  user,
  onRoleChange,
  disabled = false,
  className = "",
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = event.target.value as Role;
    if (newRole !== user.role) {
      onRoleChange(user, newRole);
    }
  };

  return (
    <select
      value={user.role}
      onChange={handleChange}
      disabled={disabled}
      className={`text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={`Changer le rôle de ${user.prenom} ${user.nom}`}
    >
      <option value={Role.USER}>USER</option>
      <option value={Role.ADMIN}>ADMIN</option>
    </select>
  );
};

export default UserTable;
