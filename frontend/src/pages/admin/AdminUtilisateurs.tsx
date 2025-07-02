import React, { useEffect, useState } from "react";
import {
  QuickStats,
  SearchAndFilters,
} from "../../components/admin/SearchAndFilters";
import {
  createUserTableActions,
  UserTable,
} from "../../components/admin/UserTable";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import Modal from "../../components/common/Modal";
import { useAdminUsers, UserFilters } from "../../hooks/useAdminUsers";
import { useDebouncedSearch } from "../../hooks/useDebouncedSearch";
import { Role, User, UserDetailed } from "../../types/shared";

type RoleFilter = Role | "TOUS";

const userSortOptions = [
  { value: "createdAt", label: "Date d'inscription" },
  { value: "nom", label: "Nom d'utilisateur" },
  { value: "email", label: "Email" },
  { value: "role", label: "Rôle" },
  { value: "isActive", label: "Statut" },
];

const AdminUtilisateurs: React.FC = () => {
  // Hooks
  const {
    users,
    stats,
    isLoading,
    isOperationLoading,
    error,
    currentPage,
    totalPages,
    totalUsers,
    loadUsers,
    loadUserStats,
    refreshUsers,
    toggleUserStatus,
    deleteUser,
    changeUserRole,
    viewUser,
    exportUsers,
    clearError,
    setCurrentPage,
  } = useAdminUsers();

  const { debouncedSearchTerm, searchTerm, setSearchTerm, isSearching } =
    useDebouncedSearch({ delay: 300 });

  // États pour les filtres et le tri
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("TOUS");
  const [activeFilter, setActiveFilter] = useState<boolean | "TOUS">("TOUS");
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // États des modales
  const [userToConfirm, setUserToConfirm] = useState<User | null>(null);
  const [roleToConfirm, setRoleToConfirm] = useState<{
    user: User;
    newRole: Role;
  } | null>(null);
  const [userToView, setUserToView] = useState<UserDetailed | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isRoleModalOpen, setRoleModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);

  // Chargement initial des stats
  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

  // Chargement initial et rechargement sur changements
  useEffect(() => {
    console.log("🔄 [AdminUtilisateurs] useEffect loadUsers déclenché", {
      debouncedSearchTerm,
      roleFilter,
      activeFilter,
      sortColumn,
      sortDirection,
    });

    const filters: UserFilters = {};
    if (roleFilter !== "TOUS") filters.role = roleFilter;
    if (activeFilter !== "TOUS") filters.isActive = activeFilter;

    loadUsers(1, debouncedSearchTerm, filters, sortColumn, sortDirection);
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    roleFilter,
    activeFilter,
    sortColumn,
    sortDirection,
    loadUsers,
  ]);

  // Gestionnaires
  const handleSort = (column: string) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortDirection(newDirection);
  };

  const handlePageChange = (page: number) => {
    const filters: UserFilters = {};
    if (roleFilter !== "TOUS") filters.role = roleFilter;
    if (activeFilter !== "TOUS") filters.isActive = activeFilter;

    loadUsers(page, debouncedSearchTerm, filters, sortColumn, sortDirection);
  };

  // Actions de la table
  const tableActions = createUserTableActions({
    onView: async (user) => {
      const fullUser = await viewUser(user.id);
      if (fullUser) {
        setUserToView(fullUser);
        setDetailsModalOpen(true);
      }
    },
    onToggleStatus: (user) => {
      setUserToConfirm(user);
      setStatusModalOpen(true);
    },
    onChangeRole: (user, newRole) => {
      setRoleToConfirm({ user, newRole });
      setRoleModalOpen(true);
    },
    onDelete: (user) => {
      setUserToConfirm(user);
      setDeleteModalOpen(true);
    },
  });

  // Handlers des modales
  const confirmDelete = async () => {
    if (userToConfirm) {
      await deleteUser(userToConfirm.id);
      setDeleteModalOpen(false);
      setUserToConfirm(null);
    }
  };

  const confirmToggleStatus = async () => {
    if (userToConfirm) {
      await toggleUserStatus(userToConfirm.id);
      setStatusModalOpen(false);
      setUserToConfirm(null);
    }
  };

  const confirmChangeRole = async () => {
    if (roleToConfirm) {
      await changeUserRole(roleToConfirm.user.id, roleToConfirm.newRole);
      setRoleModalOpen(false);
      setRoleToConfirm(null);
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-700">
        Erreur: {error}.{" "}
        <button onClick={() => clearError()} className="font-bold underline">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <QuickStats
        totalUsers={stats?.total || totalUsers}
        activeUsers={stats?.actifs || 0}
        adminUsers={stats?.admin || 0}
        isLoading={isLoading && !stats}
      />

      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        isSearching={isSearching}
        isLoading={isLoading}
        showAdvancedFilters
      />

      <UserTable
        users={users}
        isLoading={isLoading}
        isOperationLoading={isOperationLoading}
        actions={tableActions}
        onSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages}
          </span>
          <div>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md mr-2 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modales de confirmation */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userToConfirm?.prenom} ${userToConfirm?.nom} ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={isOperationLoading}
        type="danger"
      />
      <ConfirmationModal
        isOpen={isStatusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title="Confirmer le changement de statut"
        message={`Changer le statut de ${userToConfirm?.prenom} ${
          userToConfirm?.nom
        } vers "${userToConfirm?.isActive ? "Inactif" : "Actif"}" ?`}
        confirmText="Confirmer"
        isLoading={isOperationLoading}
      />
      <ConfirmationModal
        isOpen={isRoleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        onConfirm={confirmChangeRole}
        title="Confirmer le changement de rôle"
        message={`Changer le rôle de ${roleToConfirm?.user.prenom} vers "${roleToConfirm?.newRole}" ?`}
        confirmText="Confirmer"
        isLoading={isOperationLoading}
      />

      {/* Modale de détails */}
      {isDetailsModalOpen && userToView && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Profil utilisateur"
          size="xl"
        >
          <div className="space-y-6">
            {/* En-tête avec avatar et infos principales */}
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <div className="flex-shrink-0">
                {userToView.avatar ? (
                  <img
                    src={userToView.avatar}
                    alt={`${userToView.prenom} ${userToView.nom}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-white shadow-md">
                    <span className="text-xl font-bold text-white">
                      {userToView.prenom?.charAt(0)?.toUpperCase()}
                      {userToView.nom?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900">
                  {userToView.prenom} {userToView.nom}
                </h3>
                <p className="text-gray-600">{userToView.email}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userToView.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {userToView.role === "ADMIN"
                      ? "Administrateur"
                      : "Utilisateur"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userToView.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {userToView.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Informations personnelles
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nom complet</p>
                      <p className="font-medium text-gray-900">
                        {userToView.prenom} {userToView.nom}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">
                        {userToView.email}
                      </p>
                    </div>
                  </div>

                  {userToView.telephone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="font-medium text-gray-900">
                          {userToView.telephone}
                        </p>
                      </div>
                    </div>
                  )}

                  {userToView.adresse && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Adresse</p>
                        <p className="font-medium text-gray-900">
                          {userToView.adresse}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistiques et activité */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Activité et statistiques
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Inscrit le</p>
                      <p className="font-medium text-gray-900">
                        {new Date(userToView.createdAt).toLocaleDateString(
                          "fr-FR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Dernière modification
                      </p>
                      <p className="font-medium text-gray-900">
                        {new Date(userToView.updatedAt).toLocaleDateString(
                          "fr-FR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Statistiques d'activité si disponibles */}
                  {userToView._count && (
                    <>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Commandes</p>
                          <p className="font-medium text-gray-900">
                            {userToView._count.commandes || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-teal-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Messages envoyés
                          </p>
                          <p className="font-medium text-gray-900">
                            {userToView._count.sentMessages || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-pink-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 17h5l-5 5v-5zM8.5 14.5L4 19l5-5zM12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Notifications</p>
                          <p className="font-medium text-gray-900">
                            {userToView._count.notifications || 0}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setDetailsModalOpen(false);
                  setUserToConfirm(userToView);
                  setStatusModalOpen(true);
                }}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  userToView.isActive
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {userToView.isActive ? "Désactiver" : "Activer"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUtilisateurs;
