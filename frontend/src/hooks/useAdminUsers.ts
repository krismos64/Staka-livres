import { useCallback, useState } from "react";
import { PaginatedResponse, Role, User, UserStats } from "../types/shared";
import { adminAPI } from "../utils/adminAPI";
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

export interface UseAdminUsersReturn {
  // État
  users: User[];
  stats: UserStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isOperationLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalUsers: number;

  // Actions de chargement
  loadUsers: (
    page?: number,
    search?: string,
    filters?: UserFilters
  ) => Promise<void>;
  refreshUsers: () => Promise<void>;
  loadUserStats: () => Promise<void>;

  // Actions utilisateur atomiques
  viewUser: (userId: string) => Promise<User | null>;
  createUser: (userData: {
    prenom: string;
    nom: string;
    email: string;
    password: string;
    role: Role;
    isActive?: boolean;
  }) => Promise<User | null>;
  updateUser: (
    userId: string,
    updates: {
      prenom?: string;
      nom?: string;
      email?: string;
      role?: Role;
      isActive?: boolean;
    }
  ) => Promise<User | null>;
  toggleUserStatus: (userId: string) => Promise<User | null>;
  changeUserRole: (userId: string, newRole: Role) => Promise<User | null>;
  deleteUser: (userId: string) => Promise<boolean>;
  exportUsers: (
    filters?: UserFilters & { format?: "csv" | "json" }
  ) => Promise<Blob | null>;

  // Utilitaires
  setCurrentPage: (page: number) => void;
  clearError: () => void;
  getUserById: (userId: string) => User | null;
  isUserInCurrentPage: (userId: string) => boolean;
}

export const useAdminUsers = (
  options: UseAdminUsersOptions = {}
): UseAdminUsersReturn => {
  const { initialPage = 1, pageSize = 10, onError, onSuccess } = options;

  const { showToast } = useToasts();

  // État local
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // État de la dernière requête pour refresh intelligent
  const [lastQuery, setLastQuery] = useState<{
    page: number;
    search?: string;
    filters?: UserFilters;
  }>({
    page: initialPage,
  });

  // Gestionnaire d'erreur centralisé
  const handleError = useCallback(
    (err: unknown, defaultMessage: string) => {
      const errorMessage = err instanceof Error ? err.message : defaultMessage;
      setError(errorMessage);

      if (onError) {
        onError(err instanceof Error ? err : new Error(defaultMessage));
      } else {
        showToast("error", "Erreur", errorMessage);
      }

      console.error(defaultMessage, err);
    },
    [onError, showToast]
  );

  // Gestionnaire de succès centralisé
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

  // Chargement des utilisateurs
  const loadUsers = useCallback(
    async (page = currentPage, search?: string, filters?: UserFilters) => {
      try {
        setIsLoading(true);
        setError(null);

        const searchParam = search?.trim() || undefined;
        const response: PaginatedResponse<User> = await adminAPI.getUsers(
          page,
          pageSize,
          searchParam,
          filters?.role,
          filters?.isActive
        );

        setUsers(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalUsers(response.pagination?.total || 0);
        setCurrentPage(page);

        // Sauvegarder les paramètres de la requête pour refresh
        setLastQuery({ page, search, filters });
      } catch (err) {
        handleError(err, "Erreur de chargement des utilisateurs");
        setUsers([]);
        setTotalPages(1);
        setTotalUsers(0);
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, pageSize, handleError]
  );

  // Rafraîchissement avec derniers paramètres
  const refreshUsers = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await loadUsers(lastQuery.page, lastQuery.search, lastQuery.filters);
      handleSuccess("Liste des utilisateurs mise à jour");
    } catch (err) {
      handleError(err, "Erreur de rafraîchissement");
    } finally {
      setIsRefreshing(false);
    }
  }, [lastQuery, loadUsers, handleSuccess, handleError]);

  // Chargement des statistiques
  const loadUserStats = useCallback(async () => {
    try {
      const userStats = await adminAPI.getUserStats();
      setStats(userStats);
    } catch (err) {
      handleError(err, "Erreur de chargement des statistiques");
    }
  }, [handleError]);

  // Voir un utilisateur
  const viewUser = useCallback(
    async (userId: string): Promise<User | null> => {
      try {
        setIsOperationLoading(true);
        const user = await adminAPI.getUserById(userId);
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

  // Créer un utilisateur
  const createUser = useCallback(
    async (userData: {
      prenom: string;
      nom: string;
      email: string;
      password: string;
      role: Role;
      isActive?: boolean;
    }): Promise<User | null> => {
      try {
        setIsOperationLoading(true);
        const newUser = await adminAPI.createUser(userData);

        // Rafraîchir la liste si on est sur la première page
        if (currentPage === 1) {
          await refreshUsers();
        }

        handleSuccess(
          `Utilisateur ${newUser.prenom} ${newUser.nom} créé avec succès`
        );
        return newUser;
      } catch (err) {
        handleError(err, "Erreur de création de l'utilisateur");
        return null;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [currentPage, refreshUsers, handleSuccess, handleError]
  );

  // Mettre à jour un utilisateur
  const updateUser = useCallback(
    async (
      userId: string,
      updates: {
        prenom?: string;
        nom?: string;
        email?: string;
        role?: Role;
        isActive?: boolean;
      }
    ): Promise<User | null> => {
      try {
        setIsOperationLoading(true);
        const updatedUser = await adminAPI.updateUser(userId, updates);

        // Mettre à jour localement
        setUsers((prevUsers) =>
          prevUsers.map((user) => (user.id === userId ? updatedUser : user))
        );

        handleSuccess(
          `Utilisateur ${updatedUser.prenom} ${updatedUser.nom} mis à jour`
        );
        return updatedUser;
      } catch (err) {
        handleError(err, "Erreur de mise à jour de l'utilisateur");
        return null;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [handleSuccess, handleError]
  );

  // Basculer le statut d'un utilisateur
  const toggleUserStatus = useCallback(
    async (userId: string): Promise<User | null> => {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        handleError(
          new Error("Utilisateur non trouvé"),
          "Utilisateur non trouvé"
        );
        return null;
      }

      try {
        setIsOperationLoading(true);
        const updatedUser = await adminAPI.toggleUserStatus(userId);

        // Mettre à jour localement
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userId ? updatedUser : u))
        );

        const action = updatedUser.isActive ? "activé" : "désactivé";
        handleSuccess(
          `Utilisateur ${updatedUser.prenom} ${updatedUser.nom} ${action}`
        );

        return updatedUser;
      } catch (err) {
        handleError(err, "Erreur de changement de statut");
        return null;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [users, handleSuccess, handleError]
  );

  // Changer le rôle d'un utilisateur
  const changeUserRole = useCallback(
    async (userId: string, newRole: Role): Promise<User | null> => {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        handleError(
          new Error("Utilisateur non trouvé"),
          "Utilisateur non trouvé"
        );
        return null;
      }

      if (user.role === newRole) {
        showToast("info", "Information", "L'utilisateur a déjà ce rôle");
        return user;
      }

      try {
        setIsOperationLoading(true);
        const updatedUser = await adminAPI.updateUser(userId, {
          role: newRole,
        });

        // Mettre à jour localement
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userId ? updatedUser : u))
        );

        handleSuccess(
          `Rôle de ${updatedUser.prenom} ${updatedUser.nom} changé vers ${newRole}`
        );
        return updatedUser;
      } catch (err) {
        handleError(err, "Erreur de changement de rôle");
        return null;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [users, handleSuccess, handleError, showToast]
  );

  // Supprimer un utilisateur (RGPD)
  const deleteUser = useCallback(
    async (userId: string): Promise<boolean> => {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        handleError(
          new Error("Utilisateur non trouvé"),
          "Utilisateur non trouvé"
        );
        return false;
      }

      try {
        setIsOperationLoading(true);
        await adminAPI.deleteUser(userId);

        // Supprimer localement
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
        setTotalUsers((prev) => prev - 1);

        // Si la page actuelle devient vide et qu'on n'est pas sur la page 1,
        // retourner à la page précédente
        const remainingUsers = users.filter((u) => u.id !== userId);
        if (remainingUsers.length === 0 && currentPage > 1) {
          const newPage = currentPage - 1;
          setCurrentPage(newPage);
          await loadUsers(newPage, lastQuery.search, lastQuery.filters);
        }

        handleSuccess(
          `Utilisateur ${user.prenom} ${user.nom} supprimé définitivement (RGPD)`
        );
        return true;
      } catch (err) {
        handleError(err, "Erreur de suppression de l'utilisateur");
        return false;
      } finally {
        setIsOperationLoading(false);
      }
    },
    [users, currentPage, lastQuery, loadUsers, handleSuccess, handleError]
  );

  // Export des utilisateurs
  const exportUsers = useCallback(
    async (
      filters?: UserFilters & { format?: "csv" | "json" }
    ): Promise<Blob | null> => {
      try {
        setIsOperationLoading(true);

        // TODO: Implémenter l'export quand l'endpoint sera disponible
        // const blob = await adminAPI.exportUsers(filters);

        // Simulation pour l'instant
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

  // Utilitaires
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getUserById = useCallback(
    (userId: string): User | null => {
      return users.find((user) => user.id === userId) || null;
    },
    [users]
  );

  const isUserInCurrentPage = useCallback(
    (userId: string): boolean => {
      return users.some((user) => user.id === userId);
    },
    [users]
  );

  return {
    // État
    users,
    stats,
    isLoading,
    isRefreshing,
    isOperationLoading,
    error,
    currentPage,
    totalPages,
    totalUsers,

    // Actions de chargement
    loadUsers,
    refreshUsers,
    loadUserStats,

    // Actions utilisateur atomiques
    viewUser,
    createUser,
    updateUser,
    toggleUserStatus,
    changeUserRole,
    deleteUser,
    exportUsers,

    // Utilitaires
    setCurrentPage,
    clearError,
    getUserById,
    isUserInCurrentPage,
  };
};
