import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Role } from "../../../types/shared";

// Mock complet d'useAdminUsers pour éviter l'import d'adminAPI
const mockUseAdminUsers = jest.fn();

// Mocks des modules avant les imports
jest.mock("../../../hooks/useAdminUsers", () => ({
  useAdminUsers: mockUseAdminUsers,
}));

jest.mock("../../../utils/toast", () => ({
  useToasts: () => ({
    showToast: jest.fn(),
    addToast: jest.fn(),
    removeToast: jest.fn(),
    clearAllToasts: jest.fn(),
    toasts: [],
  }),
}));

// Import du composant après les mocks
import AdminUtilisateurs from "../AdminUtilisateurs";

// Mock data
const mockUsers = [
  {
    id: "user-1",
    prenom: "John",
    nom: "Doe",
    email: "john.doe@example.com",
    role: Role.USER,
    isActive: true,
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z",
  },
  {
    id: "user-2",
    prenom: "Jane",
    nom: "Admin",
    email: "jane.admin@example.com",
    role: Role.ADMIN,
    isActive: false,
    createdAt: "2025-01-01T11:00:00Z",
    updatedAt: "2025-01-01T11:00:00Z",
  },
];

const mockStats = {
  total: 2,
  actifs: 1,
  admin: 1,
  recents: 1,
};

const mockHookReturnValue = {
  users: mockUsers,
  totalPages: 1,
  totalUsers: 2,
  currentPage: 1,
  isLoading: false,
  error: null,
  stats: mockStats,
  loadUsers: jest.fn(),
  loadUserStats: jest.fn(),
  toggleUserStatus: jest.fn(),
  changeUserRole: jest.fn(),
  deleteUser: jest.fn(),
  viewUser: jest.fn(),
  refreshUsers: jest.fn(),
};

describe("AdminUtilisateurs - Tests unitaires avec mocks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAdminUsers.mockReturnValue(mockHookReturnValue);
  });

  describe("Rendu de base", () => {
    it("should render the table with users data", () => {
      render(<AdminUtilisateurs />);

      // Vérifier la présence du titre
      expect(screen.getByText("Gestion des Utilisateurs")).toBeInTheDocument();

      // Vérifier la présence des statistiques
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("Actifs")).toBeInTheDocument();
      expect(screen.getByText("Admins")).toBeInTheDocument();

      // Vérifier les données du tableau
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(screen.getByText("Jane Admin")).toBeInTheDocument();
      expect(screen.getByText("jane.admin@example.com")).toBeInTheDocument();
    });

    it("should render statistics cards correctly", () => {
      render(<AdminUtilisateurs />);

      // Vérifier les valeurs des statistiques
      expect(screen.getByText("2")).toBeInTheDocument(); // Total
      expect(screen.getByText("1")).toBeInTheDocument(); // Actifs et Admin
    });

    it("should display loading state", () => {
      mockUseAdminUsers.mockReturnValue({
        ...mockHookReturnValue,
        isLoading: true,
        users: [],
      });

      render(<AdminUtilisateurs />);

      expect(screen.getByText("Chargement...")).toBeInTheDocument();
    });

    it("should display error state", () => {
      mockUseAdminUsers.mockReturnValue({
        ...mockHookReturnValue,
        error: "Erreur de chargement",
        users: [],
      });

      render(<AdminUtilisateurs />);

      expect(screen.getByText("Erreur de chargement")).toBeInTheDocument();
    });
  });

  describe("Recherche et filtres", () => {
    it("should handle search input", async () => {
      const user = userEvent.setup();
      render(<AdminUtilisateurs />);

      const searchInput = screen.getByPlaceholderText(
        "Rechercher un utilisateur..."
      );

      await user.type(searchInput, "john");

      await waitFor(() => {
        expect(mockHookReturnValue.loadUsers).toHaveBeenCalledWith(
          1,
          "john",
          expect.any(Object),
          undefined,
          "asc"
        );
      });
    });

    it("should handle role filter", async () => {
      const user = userEvent.setup();
      render(<AdminUtilisateurs />);

      const roleSelect = screen.getByDisplayValue("Tous les rôles");

      await user.selectOptions(roleSelect, Role.ADMIN);

      await waitFor(() => {
        expect(mockHookReturnValue.loadUsers).toHaveBeenCalledWith(
          1,
          "",
          { role: Role.ADMIN },
          undefined,
          "asc"
        );
      });
    });

    it("should handle active status filter", async () => {
      const user = userEvent.setup();
      render(<AdminUtilisateurs />);

      const statusSelect = screen.getByDisplayValue("Tous les statuts");

      await user.selectOptions(statusSelect, "active");

      await waitFor(() => {
        expect(mockHookReturnValue.loadUsers).toHaveBeenCalledWith(
          1,
          "",
          { isActive: true },
          undefined,
          "asc"
        );
      });
    });
  });

  describe("Actions utilisateur", () => {
    it("should open user details modal when clicking view button", async () => {
      const user = userEvent.setup();
      mockHookReturnValue.viewUser.mockResolvedValue({
        ...mockUsers[0],
        lastLoginAt: "2025-01-01T15:00:00Z",
        commandesCount: 5,
      });

      render(<AdminUtilisateurs />);

      const viewButton = screen.getAllByText("Voir")[0];
      await user.click(viewButton);

      expect(mockHookReturnValue.viewUser).toHaveBeenCalledWith("user-1");
    });

    it("should handle role change", async () => {
      const user = userEvent.setup();
      render(<AdminUtilisateurs />);

      // Trouver le select de rôle pour John Doe
      const roleSelects = screen.getAllByDisplayValue("USER");
      await user.selectOptions(roleSelects[0], Role.ADMIN);

      await waitFor(() => {
        expect(mockHookReturnValue.changeUserRole).toHaveBeenCalledWith(
          "user-1",
          Role.ADMIN
        );
      });
    });

    it("should handle status toggle", async () => {
      const user = userEvent.setup();
      render(<AdminUtilisateurs />);

      // Trouver le toggle pour John Doe (actif)
      const activeToggle = screen.getByRole("switch", { name: /actif/i });
      await user.click(activeToggle);

      expect(mockHookReturnValue.toggleUserStatus).toHaveBeenCalledWith(
        "user-1"
      );
    });

    it("should handle user deletion with confirmation", async () => {
      const user = userEvent.setup();
      render(<AdminUtilisateurs />);

      // Cliquer sur supprimer
      const deleteButtons = screen.getAllByText("Supprimer");
      await user.click(deleteButtons[0]);

      // Vérifier que la modal de confirmation s'ouvre
      expect(screen.getByText("Confirmer la suppression")).toBeInTheDocument();

      // Confirmer la suppression
      const confirmButton = screen.getByText("Supprimer définitivement");
      await user.click(confirmButton);

      expect(mockHookReturnValue.deleteUser).toHaveBeenCalledWith("user-1");
    });

    it("should cancel user deletion", async () => {
      const user = userEvent.setup();
      render(<AdminUtilisateurs />);

      // Cliquer sur supprimer
      const deleteButtons = screen.getAllByText("Supprimer");
      await user.click(deleteButtons[0]);

      // Annuler
      const cancelButton = screen.getByText("Annuler");
      await user.click(cancelButton);

      expect(mockHookReturnValue.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe("Pagination", () => {
    it("should handle page navigation", async () => {
      const user = userEvent.setup();
      mockUseAdminUsers.mockReturnValue({
        ...mockHookReturnValue,
        totalPages: 3,
        currentPage: 1,
      });

      render(<AdminUtilisateurs />);

      // Aller à la page suivante
      const nextButton = screen.getByText("Suivant");
      await user.click(nextButton);

      expect(mockHookReturnValue.loadUsers).toHaveBeenCalledWith(
        2,
        "",
        {},
        undefined,
        "asc"
      );
    });

    it("should disable pagination buttons appropriately", () => {
      mockUseAdminUsers.mockReturnValue({
        ...mockHookReturnValue,
        totalPages: 1,
        currentPage: 1,
      });

      render(<AdminUtilisateurs />);

      const prevButton = screen.getByText("Précédent");
      const nextButton = screen.getByText("Suivant");

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });
  });

  describe("Gestion d'erreurs", () => {
    it("should display error message when loading fails", () => {
      mockUseAdminUsers.mockReturnValue({
        ...mockHookReturnValue,
        error: "Erreur de connexion au serveur",
        users: [],
      });

      render(<AdminUtilisateurs />);

      expect(
        screen.getByText("Erreur de connexion au serveur")
      ).toBeInTheDocument();
    });

    it("should handle empty state", () => {
      mockUseAdminUsers.mockReturnValue({
        ...mockHookReturnValue,
        users: [],
        totalUsers: 0,
      });

      render(<AdminUtilisateurs />);

      expect(screen.getByText("Aucun utilisateur trouvé")).toBeInTheDocument();
    });
  });
});
