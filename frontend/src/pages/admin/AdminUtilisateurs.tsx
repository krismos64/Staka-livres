import React, { useEffect, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { Role, User } from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";
import { useToasts } from "../../utils/toast";

type RoleFilter = Role | "TOUS";

const AdminUtilisateurs: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("TOUS");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const { showToast } = useToasts();

  const loadUsers = async (page = 1, search = "", role?: Role) => {
    try {
      setIsLoading(page === 1);
      setError(null);

      const searchParam = search.trim() || undefined;

      const response = await adminAPI.getUsers(page, 10, searchParam, role);

      setUsers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);

      if (page === 1) {
        showToast(
          "success",
          "Données chargées",
          "Liste des utilisateurs mise à jour"
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de chargement des utilisateurs";
      setError(errorMessage);
      showToast("error", "Erreur", errorMessage);
      console.error("Erreur chargement utilisateurs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const roleParam = roleFilter === "TOUS" ? undefined : roleFilter;
    loadUsers(1, searchQuery, roleParam);
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRoleFilterChange = (role: RoleFilter) => {
    setRoleFilter(role);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const roleParam = roleFilter === "TOUS" ? undefined : roleFilter;
    loadUsers(page, searchQuery, roleParam);
  };

  const handleViewUser = async (userId: string) => {
    try {
      setIsOperationLoading(true);
      const user = await adminAPI.getUserById(userId);
      setSelectedUser(user);
      setShowUserModal(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de récupération de l'utilisateur";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      setIsOperationLoading(true);

      if (user.isActive) {
        await adminAPI.deactivateUser(user.id);
        showToast(
          "success",
          "Utilisateur désactivé",
          `${user.prenom} ${user.nom} a été désactivé`
        );
      } else {
        await adminAPI.activateUser(user.id);
        showToast(
          "success",
          "Utilisateur activé",
          `${user.prenom} ${user.nom} a été activé`
        );
      }

      // Recharger la page courante
      const roleParam = roleFilter === "TOUS" ? undefined : roleFilter;
      await loadUsers(currentPage, searchQuery, roleParam);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de mise à jour du statut";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleChangeUserRole = async (user: User, newRole: Role) => {
    try {
      setIsOperationLoading(true);

      await adminAPI.updateUser(user.id, { role: newRole });
      showToast(
        "success",
        "Rôle modifié",
        `${user.prenom} ${user.nom} est maintenant ${newRole}`
      );

      // Recharger la page courante
      const roleParam = roleFilter === "TOUS" ? undefined : roleFilter;
      await loadUsers(currentPage, searchQuery, roleParam);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de modification du rôle";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsOperationLoading(true);

      await adminAPI.deleteUser(userToDelete.id);
      showToast(
        "success",
        "Utilisateur supprimé",
        `${userToDelete.prenom} ${userToDelete.nom} a été supprimé`
      );

      setShowDeleteModal(false);
      setUserToDelete(null);

      // Recharger la page courante
      const roleParam = roleFilter === "TOUS" ? undefined : roleFilter;
      await loadUsers(currentPage, searchQuery, roleParam);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de suppression de l'utilisateur";
      showToast("error", "Erreur", errorMessage);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleRefresh = () => {
    const roleParam = roleFilter === "TOUS" ? undefined : roleFilter;
    loadUsers(currentPage, searchQuery, roleParam);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getRoleBadgeColor = (role: Role) => {
    return role === Role.ADMIN
      ? "bg-purple-100 text-purple-800"
      : "bg-blue-100 text-blue-800";
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">
          Chargement des utilisateurs...
        </span>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <i className="fas fa-users text-5xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-600">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            "Actualiser"
          )}
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtre par rôle */}
          <div className="flex items-center gap-2">
            <i className="fas fa-filter text-gray-400"></i>
            <select
              value={roleFilter}
              onChange={(e) =>
                handleRoleFilterChange(e.target.value as RoleFilter)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TOUS">Tous les rôles</option>
              <option value={Role.USER}>Utilisateurs</option>
              <option value={Role.ADMIN}>Administrateurs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inscription
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                        user.isActive
                      )}`}
                    >
                      {user.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Voir détails */}
                      <button
                        onClick={() => handleViewUser(user.id)}
                        disabled={isOperationLoading}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Voir les détails"
                      >
                        <i className="fas fa-eye"></i>
                      </button>

                      {/* Changer le rôle */}
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleChangeUserRole(user, e.target.value as Role)
                        }
                        disabled={isOperationLoading}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                        title="Changer le rôle"
                      >
                        <option value={Role.USER}>USER</option>
                        <option value={Role.ADMIN}>ADMIN</option>
                      </select>

                      {/* Activer/Désactiver */}
                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        disabled={isOperationLoading}
                        className={`transition-colors ${
                          user.isActive
                            ? "text-red-600 hover:text-red-900"
                            : "text-green-600 hover:text-green-900"
                        }`}
                        title={user.isActive ? "Désactiver" : "Activer"}
                      >
                        <i
                          className={`fas ${
                            user.isActive ? "fa-times" : "fa-check"
                          }`}
                        ></i>
                      </button>

                      {/* Supprimer */}
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={isOperationLoading}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Supprimer"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* État vide */}
        {users.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun utilisateur trouvé
            </h3>
            <p className="text-gray-500">
              {searchQuery || roleFilter !== "TOUS"
                ? "Essayez de modifier vos filtres de recherche"
                : "Il n'y a pas encore d'utilisateurs dans le système"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm">
          <div className="text-sm text-gray-700">
            Page {currentPage} sur {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modal détails utilisateur */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Détails de l'utilisateur"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedUser.prenom}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.nom}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rôle
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                    selectedUser.role
                  )}`}
                >
                  {selectedUser.role}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Statut
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                    selectedUser.isActive
                  )}`}
                >
                  {selectedUser.isActive ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Inscription
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(selectedUser.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dernière modification
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(selectedUser.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteUser}
        title="Confirmer la suppression"
        message={
          userToDelete
            ? `Êtes-vous sûr de vouloir supprimer l'utilisateur ${userToDelete.prenom} ${userToDelete.nom} ? Cette action est irréversible.`
            : ""
        }
        type="danger"
        isLoading={isOperationLoading}
      />
    </div>
  );
};

export default AdminUtilisateurs;
