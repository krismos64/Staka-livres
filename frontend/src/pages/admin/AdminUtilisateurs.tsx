import React, { useEffect, useState } from "react";
import {
  ChangeRoleModal,
  DeactivateUserModal,
  DeleteUserModal,
  ExportDataModal,
} from "../../components/admin/ConfirmationModals";
import SearchAndFilters, {
  QuickStats,
} from "../../components/admin/SearchAndFilters";
import UserTable, {
  createUserTableActions,
} from "../../components/admin/UserTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { useAdminUsers, UserFilters } from "../../hooks/useAdminUsers";
import { useDebouncedSearch } from "../../hooks/useDebouncedSearch";
import { Role, User } from "../../types/shared";

type RoleFilter = Role | "TOUS";

interface ModalState {
  showUserDetails: boolean;
  showDeleteConfirm: boolean;
  showStatusConfirm: boolean;
  showRoleConfirm: boolean;
  showExportConfirm: boolean;
}

interface ModalData {
  selectedUser: User | null;
  userToDelete: User | null;
  userToToggle: User | null;
  userToChangeRole: User | null;
  newRole: Role | null;
}

const AdminUtilisateurs: React.FC = () => {
  // Hooks de recherche avec debounce
  const {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    isSearching,
    clearSearch,
  } = useDebouncedSearch({
    delay: 300,
    minLength: 0,
  });

  // Hook de gestion des utilisateurs
  const {
    users,
    stats,
    isLoading,
    isRefreshing,
    isOperationLoading,
    error,
    currentPage,
    totalPages,
    totalUsers,
    loadUsers,
    refreshUsers,
    loadUserStats,
    viewUser,
    toggleUserStatus,
    changeUserRole,
    deleteUser,
    exportUsers,
    setCurrentPage,
    clearError,
  } = useAdminUsers({
    initialPage: 1,
    pageSize: 10,
  });

  // États locaux pour les filtres et modales
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("TOUS");
  const [activeFilter, setActiveFilter] = useState<boolean | "TOUS">("TOUS");
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // États des modales
  const [modals, setModals] = useState<ModalState>({
    showUserDetails: false,
    showDeleteConfirm: false,
    showStatusConfirm: false,
    showRoleConfirm: false,
    showExportConfirm: false,
  });

  const [modalData, setModalData] = useState<ModalData>({
    selectedUser: null,
    userToDelete: null,
    userToToggle: null,
    userToChangeRole: null,
    newRole: null,
  });

  // Charger les utilisateurs et stats au montage du composant
  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

  // Recharger quand les filtres changent
  useEffect(() => {
    const filters: UserFilters = {};

    if (roleFilter !== "TOUS") {
      filters.role = roleFilter;
    }

    if (activeFilter !== "TOUS") {
      filters.isActive = activeFilter;
    }

    loadUsers(1, debouncedSearchTerm, filters);
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    roleFilter,
    activeFilter,
    loadUsers,
    setCurrentPage,
  ]);

  // Gestionnaires d'événements
  const handleRoleFilterChange = (role: RoleFilter) => {
    setRoleFilter(role);
  };

  const handleActiveFilterChange = (active: boolean | "TOUS") => {
    setActiveFilter(active);
  };

  const handleSort = (column: string, direction: "asc" | "desc") => {
    setSortColumn(column);
    setSortDirection(direction);
    // TODO: Implémenter le tri côté serveur si nécessaire
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const filters: UserFilters = {};

    if (roleFilter !== "TOUS") {
      filters.role = roleFilter;
    }

    if (activeFilter !== "TOUS") {
      filters.isActive = activeFilter;
    }

    loadUsers(page, debouncedSearchTerm, filters);
  };

  // Actions utilisateur
  const handleViewUser = async (user: User) => {
    const userData = await viewUser(user.id);
    if (userData) {
      setModalData((prev) => ({ ...prev, selectedUser: userData }));
      setModals((prev) => ({ ...prev, showUserDetails: true }));
    }
  };

  const handleToggleUserStatus = (user: User) => {
    setModalData((prev) => ({ ...prev, userToToggle: user }));
    setModals((prev) => ({ ...prev, showStatusConfirm: true }));
  };

  const handleChangeUserRole = (user: User, newRole: Role) => {
    setModalData((prev) => ({ ...prev, userToChangeRole: user, newRole }));
    setModals((prev) => ({ ...prev, showRoleConfirm: true }));
  };

  const handleDeleteUser = (user: User) => {
    setModalData((prev) => ({ ...prev, userToDelete: user }));
    setModals((prev) => ({ ...prev, showDeleteConfirm: true }));
  };

  const handleExportUsers = () => {
    setModals((prev) => ({ ...prev, showExportConfirm: true }));
  };

  // Confirmations des actions
  const confirmToggleStatus = async () => {
    if (modalData.userToToggle) {
      const success = await toggleUserStatus(modalData.userToToggle.id);
      if (success) {
        closeModal("showStatusConfirm");
      }
    }
  };

  const confirmChangeRole = async () => {
    if (modalData.userToChangeRole && modalData.newRole) {
      const success = await changeUserRole(
        modalData.userToChangeRole.id,
        modalData.newRole
      );
      if (success) {
        closeModal("showRoleConfirm");
      }
    }
  };

  const confirmDeleteUser = async () => {
    if (modalData.userToDelete) {
      const success = await deleteUser(modalData.userToDelete.id);
      if (success) {
        closeModal("showDeleteConfirm");
      }
    }
  };

  const confirmExportUsers = async (format: "csv" | "json") => {
    const filters: UserFilters = {};

    if (roleFilter !== "TOUS") {
      filters.role = roleFilter;
    }

    if (activeFilter !== "TOUS") {
      filters.isActive = activeFilter;
    }

    const blob = await exportUsers({ ...filters, format });
    if (blob) {
      // Télécharger le fichier
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `utilisateurs_${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      closeModal("showExportConfirm");
    }
  };

  // Utilitaires de modales
  const closeModal = (modalKey: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [modalKey]: false }));

    // Nettoyer les données après fermeture
    setTimeout(() => {
      setModalData({
        selectedUser: null,
        userToDelete: null,
        userToToggle: null,
        userToChangeRole: null,
        newRole: null,
      });
    }, 300);
  };

  const closeAllModals = () => {
    setModals({
      showUserDetails: false,
      showDeleteConfirm: false,
      showStatusConfirm: false,
      showRoleConfirm: false,
      showExportConfirm: false,
    });
  };

  // Configuration des actions de la table
  const tableActions = createUserTableActions({
    onView: handleViewUser,
    onToggleStatus: handleToggleUserStatus,
    onChangeRole: handleChangeUserRole,
    onDelete: handleDeleteUser,
  });

  // Gestion des erreurs
  useEffect(() => {
    if (error) {
      console.error("Erreur AdminUtilisateurs:", error);
    }
  }, [error]);

  // Calculs des statistiques locales
  const activeUsersCount = users.filter((u) => u.isActive).length;
  const adminUsersCount = users.filter((u) => u.role === Role.ADMIN).length;

  return (
    <div className="space-y-6 p-6">
      {/* En-tête avec titre et actions principales */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les comptes utilisateurs, leurs rôles et permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => clearError()}
            disabled={!error}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            title="Effacer les erreurs"
          >
            <i className="fas fa-times-circle"></i>
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <QuickStats
        totalUsers={stats?.total || totalUsers}
        activeUsers={stats?.actifs || activeUsersCount}
        adminUsers={stats?.admin || adminUsersCount}
        isLoading={isLoading && !stats}
      />

      {/* Barre de recherche et filtres */}
      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleFilterChange}
        isSearching={isSearching}
        isLoading={isLoading || isRefreshing}
        onClearSearch={clearSearch}
        onRefresh={refreshUsers}
        onExport={handleExportUsers}
        showAdvancedFilters={true}
        activeFilter={activeFilter}
        onActiveFilterChange={handleActiveFilterChange}
        searchPlaceholder="Rechercher par nom, prénom ou email..."
        searchAriaLabel="Rechercher des utilisateurs"
        filterAriaLabel="Filtrer par rôle"
      />

      {/* Affichage des erreurs */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle mt-1"></i>
            </div>
            <div className="ml-3">
              <h3 className="font-medium">Erreur de chargement</h3>
              <p className="mt-1 text-sm">{error}</p>
              <div className="mt-3">
                <button
                  onClick={refreshUsers}
                  className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table des utilisateurs */}
      <UserTable
        users={users}
        isLoading={isLoading}
        isOperationLoading={isOperationLoading}
        actions={tableActions}
        onSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        emptyStateMessage={
          debouncedSearchTerm ||
          roleFilter !== "TOUS" ||
          activeFilter !== "TOUS"
            ? "Aucun utilisateur ne correspond à vos critères de recherche"
            : "Aucun utilisateur trouvé"
        }
        emptyStateIcon="fas fa-users"
        aria-label="Table des utilisateurs avec actions"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm"
          role="navigation"
          aria-label="Pagination des utilisateurs"
        >
          <div className="text-sm text-gray-700">
            Page {currentPage} sur {totalPages} • {totalUsers} utilisateur
            {totalUsers > 1 ? "s" : ""} au total
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Page précédente"
            >
              Précédent
            </button>

            {/* Affichage des numéros de pages (simplifié) */}
            <span className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md">
              {currentPage}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Page suivante"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modal détails utilisateur */}
      <Modal
        isOpen={modals.showUserDetails}
        onClose={() => closeModal("showUserDetails")}
        title="Détails de l'utilisateur"
        size="md"
      >
        {modalData.selectedUser && (
          <div
            className="space-y-4"
            role="region"
            aria-label="Détails de l'utilisateur"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {modalData.selectedUser.prenom}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {modalData.selectedUser.nom}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {modalData.selectedUser.email}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rôle
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    modalData.selectedUser.role === Role.ADMIN
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {modalData.selectedUser.role}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Statut
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    modalData.selectedUser.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {modalData.selectedUser.isActive ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Inscription
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(
                    modalData.selectedUser.createdAt
                  ).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dernière modification
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(
                    modalData.selectedUser.updatedAt
                  ).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modales de confirmation */}
      <DeleteUserModal
        isOpen={modals.showDeleteConfirm}
        user={modalData.userToDelete}
        isLoading={isOperationLoading}
        onClose={() => closeModal("showDeleteConfirm")}
        onConfirm={confirmDeleteUser}
      />

      <DeactivateUserModal
        isOpen={modals.showStatusConfirm}
        user={modalData.userToToggle}
        isLoading={isOperationLoading}
        onClose={() => closeModal("showStatusConfirm")}
        onConfirm={confirmToggleStatus}
      />

      <ChangeRoleModal
        isOpen={modals.showRoleConfirm}
        user={modalData.userToChangeRole}
        newRole={modalData.newRole}
        isLoading={isOperationLoading}
        onClose={() => closeModal("showRoleConfirm")}
        onConfirm={confirmChangeRole}
      />

      <ExportDataModal
        isOpen={modals.showExportConfirm}
        userCount={totalUsers}
        filters={{
          roleFilter: roleFilter !== "TOUS" ? roleFilter : undefined,
          activeFilter: activeFilter !== "TOUS" ? activeFilter : undefined,
          search: debouncedSearchTerm || undefined,
        }}
        isLoading={isOperationLoading}
        onClose={() => closeModal("showExportConfirm")}
        onConfirm={confirmExportUsers}
      />

      {/* Overlay de chargement global */}
      {isLoading && users.length === 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50"
          role="status"
          aria-live="polite"
          aria-label="Chargement en cours"
        >
          <div className="bg-white rounded-lg p-6 flex items-center">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-gray-700">
              Chargement des utilisateurs...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUtilisateurs;
