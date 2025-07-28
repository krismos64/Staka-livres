import { useCallback, useRef, useState } from "react";
import { Role, User, UserDetailed, UserStats } from "../types/shared";
import {
  AdminUsersParams,
  deleteUser as deleteUserAPI,
  getUserById,
  getUsers,
  getUserStats,
  updateUser,
} from "../utils/adminAPI";
import { useToasts } from "../utils/toast";

export interface UserFilters {
  role?: Role;
  isActive?: boolean;
}

export interface UseAdminUsersOptions {
  initialPage?: number;
  pageSize?: number;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export const useAdminUsers = (options: UseAdminUsersOptions = {}) => {
  const { initialPage = 1, pageSize = 10, onError, onSuccess } = options;
  const { showToast } = useToasts();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const lastQueryRef = useRef<AdminUsersParams>({});

  const handleError = useCallback(
    (err: unknown, defaultMessage: string) => {
      const errorMessage = err instanceof Error ? err.message : defaultMessage;
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      } else {
        showToast("error", "Erreur", errorMessage);
      }
      console.error(defaultMessage, err);
    },
    [onError, showToast]
  );

  const handleSuccess = useCallback(
    (message: string) => {
      if (onSuccess) {
        onSuccess(message);
      } else {
        showToast("success", "Succès", message);
      }
    },
    [onSuccess, showToast]
  );

  const loadUsers = useCallback(
    async (
      page = initialPage,
      search?: string,
      filters: UserFilters = {},
      sortBy?: string,
      sortDirection: "asc" | "desc" = "asc"
    ) => {
      setIsLoading(true);
      setError(null);

      const params: AdminUsersParams = {
        page,
        limit: pageSize,
        search: search?.trim() || undefined,
        sortBy,
        sortDirection,
        ...filters,
      };
      lastQueryRef.current = params;

      console.log("📡 [useAdminUsers] Appel API avec params:", params);

      try {
        const response = await getUsers(params);
        setUsers(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalUsers(response.pagination?.total || 0);
        setCurrentPage(response.pagination?.page || 1);
      } catch (err) {
        handleError(err, "Erreur de chargement des utilisateurs");
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, initialPage, handleError]
  );

  const loadUserStats = useCallback(async () => {
    try {
      const userStats = await getUserStats();
      setStats(userStats);
    } catch (err) {
      handleError(err, "Erreur de chargement des statistiques");
    }
  }, [handleError]);

  const refreshUsers = useCallback(async () => {
    await loadUsers(
      lastQueryRef.current.page,
      lastQueryRef.current.search,
      {
        role: lastQueryRef.current.role,
        isActive: lastQueryRef.current.isActive,
      },
      lastQueryRef.current.sortBy,
      lastQueryRef.current.sortDirection
    );
    handleSuccess("Liste des utilisateurs mise à jour");
  }, [loadUsers, handleSuccess]);

  const toggleUserStatus = useCallback(
    async (userId: string) => {
      setIsOperationLoading(true);
      try {
        const updatedUser: User = await toggleUserStatus(userId);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? updatedUser : u))
        );
        handleSuccess(`Statut de l'utilisateur mis à jour.`);
        return true;
      } catch (err) {
        handleError(err, "Erreur lors du changement de statut");
        refreshUsers();
        return false;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [handleError, handleSuccess, refreshUsers]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      setIsOperationLoading(true);
      let success = false;
      try {
        await deleteUserAPI(userId);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setTotalUsers((prev) => prev - 1);
        handleSuccess("Utilisateur supprimé avec succès.");
        success = true;
      } catch (err) {
        handleError(err, "Erreur lors de la suppression de l'utilisateur");
        refreshUsers();
      } finally {
        setIsOperationLoading(false);
      }
      return success;
    },
    [handleError, handleSuccess, refreshUsers]
  );

  const viewUser = useCallback(
    async (userId: string): Promise<UserDetailed | null> => {
      try {
        setIsOperationLoading(true);
        const user = await getUserById(userId);
        return user;
      } catch (err) {
        handleError(err, "Erreur de récupération de l'utilisateur");
        return null;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [handleError]
  );

  const changeUserRole = useCallback(
    async (userId: string, newRole: Role): Promise<boolean> => {
      setIsOperationLoading(true);
      try {
        const updatedUser: User = await updateUser(userId, {
          role: newRole,
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? updatedUser : u))
        );
        handleSuccess("Rôle de l'utilisateur mis à jour.");
        return true;
      } catch (err) {
        handleError(err, "Erreur lors du changement de rôle.");
        refreshUsers();
        return false;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [handleError, handleSuccess, refreshUsers]
  );

  const exportUsers = useCallback(
    async (
      filters?: UserFilters & { format?: "csv" | "json" }
    ): Promise<Blob | null> => {
      // NOTE: L'export côté client est conservé pour l'instant
      try {
        setIsOperationLoading(true);
        const csvData = users
          .map(
            (user) =>
              `"${user.prenom}","${user.nom}","${user.email}","${user.role}","${
                user.isActive ? "Actif" : "Inactif"
              }","${user.createdAt}"`
          )
          .join("\n");
        const header =
          '"Prénom","Nom","Email","Rôle","Statut","Date création"\n';
        const blob = new Blob([header + csvData], {
          type: "text/csv;charset=utf-8;",
        });
        handleSuccess(`Export de ${users.length} utilisateurs généré`);
        return blob;
      } catch (err) {
        handleError(err, "Erreur d'export des utilisateurs");
        return null;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [users, handleSuccess, handleError]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
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
    viewUser,
    changeUserRole,
    exportUsers,
    clearError,
    setCurrentPage,
  };
};
