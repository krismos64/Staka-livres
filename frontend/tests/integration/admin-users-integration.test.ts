import { Role } from "../../src/types/shared";
import {
  activateUser,
  createUser,
  deactivateUser,
  deleteUser,
  getUserById,
  getUserStats,
  getUsers,
  toggleUserStatus,
  updateUser,
} from "../../src/utils/adminAPI";

// Test d'intégration pour les endpoints admin/users
describe("Admin Users API Integration", () => {
  // Variables pour les tests
  let createdUserId: string;
  const testUser = {
    prenom: "Integration",
    nom: "Test",
    email: `integration-test-${Date.now()}@example.com`,
    password: "password123",
    role: Role.USER,
  };

  beforeAll(() => {
    // Simuler que nous sommes en mode non-demo pour les tests d'intégration
    // Assurez-vous que VITE_DEMO_MODE n'est pas défini ou est false
    delete (import.meta as any).env.VITE_DEMO_MODE;
  });

  describe("Workflow complet CRUD utilisateurs", () => {
    it("devrait récupérer les statistiques des utilisateurs", async () => {
      const stats = await getUserStats();

      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("actifs");
      expect(stats).toHaveProperty("admin");
      expect(stats).toHaveProperty("recents");
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.actifs).toBe("number");
    });

    it("devrait récupérer la liste des utilisateurs avec pagination", async () => {
      const response = await getUsers({ page: 1, limit: 10 });

      expect(response).toHaveProperty("data");
      expect(response).toHaveProperty("pagination");
      expect(Array.isArray(response.data)).toBe(true);

      expect(response.pagination).toHaveProperty("page", 1);
      expect(response.pagination).toHaveProperty("limit", 10);
      expect(response.pagination).toHaveProperty("total");
      expect(response.pagination).toHaveProperty("totalPages");
    });

    it("devrait filtrer les utilisateurs par rôle", async () => {
      const adminUsers = await getUsers({
        page: 1,
        limit: 10,
        role: Role.ADMIN,
      });

      expect(adminUsers.data).toBeDefined();
      // Vérifier que tous les utilisateurs retournés sont des admins
      adminUsers.data?.forEach((user) => {
        expect(user.role).toBe(Role.ADMIN);
      });
    });

    it("devrait rechercher des utilisateurs", async () => {
      const searchResults = await getUsers({
        page: 1,
        limit: 10,
        search: "admin",
      });

      expect(searchResults.data).toBeDefined();
      // Vérifier que les résultats contiennent le terme recherché
      if (searchResults.data && searchResults.data.length > 0) {
        const containsSearchTerm = searchResults.data.some(
          (user) =>
            user.prenom.toLowerCase().includes("admin") ||
            user.nom.toLowerCase().includes("admin") ||
            user.email.toLowerCase().includes("admin")
        );
        expect(containsSearchTerm).toBe(true);
      }
    });

    it("devrait créer un nouvel utilisateur", async () => {
      const createdUser = await createUser(testUser);

      expect(createdUser).toHaveProperty("id");
      expect(createdUser.prenom).toBe(testUser.prenom);
      expect(createdUser.nom).toBe(testUser.nom);
      expect(createdUser.email).toBe(testUser.email);
      expect(createdUser.role).toBe(testUser.role);
      expect(createdUser.isActive).toBe(true);

      // Sauvegarder l'ID pour les autres tests
      createdUserId = createdUser.id;
    });

    it("devrait récupérer un utilisateur par ID", async () => {
      if (!createdUserId) {
        throw new Error("Aucun utilisateur créé pour ce test");
      }

      const user = await getUserById(createdUserId);

      expect(user.id).toBe(createdUserId);
      expect(user.prenom).toBe(testUser.prenom);
      expect(user.nom).toBe(testUser.nom);
      expect(user.email).toBe(testUser.email);
    });

    it("devrait mettre à jour un utilisateur", async () => {
      if (!createdUserId) {
        throw new Error("Aucun utilisateur créé pour ce test");
      }

      const updateData = {
        prenom: "Integration-Updated",
        isActive: false,
      };

      const updatedUser = await updateUser(createdUserId, updateData);

      expect(updatedUser.id).toBe(createdUserId);
      expect(updatedUser.prenom).toBe(updateData.prenom);
      expect(updatedUser.isActive).toBe(false);
    });

    it("devrait basculer le statut d'un utilisateur", async () => {
      if (!createdUserId) {
        throw new Error("Aucun utilisateur créé pour ce test");
      }

      // L'utilisateur est actuellement inactif (isActive: false)
      const toggledUser = await toggleUserStatus(createdUserId);

      expect(toggledUser.id).toBe(createdUserId);
      expect(toggledUser.isActive).toBe(true); // Devrait être activé
    });

    it("devrait activer un utilisateur", async () => {
      if (!createdUserId) {
        throw new Error("Aucun utilisateur créé pour ce test");
      }

      // D'abord désactiver
      await deactivateUser(createdUserId);

      // Puis activer
      const activatedUser = await activateUser(createdUserId);

      expect(activatedUser.id).toBe(createdUserId);
      expect(activatedUser.isActive).toBe(true);
    });

    it("devrait désactiver un utilisateur", async () => {
      if (!createdUserId) {
        throw new Error("Aucun utilisateur créé pour ce test");
      }

      const deactivatedUser = await deactivateUser(createdUserId);

      expect(deactivatedUser.id).toBe(createdUserId);
      expect(deactivatedUser.isActive).toBe(false);
    });

    it("devrait supprimer un utilisateur (RGPD)", async () => {
      if (!createdUserId) {
        throw new Error("Aucun utilisateur créé pour ce test");
      }

      // Supprimer l'utilisateur
      await deleteUser(createdUserId);

      // Vérifier que l'utilisateur n'existe plus
      await expect(getUserById(createdUserId)).rejects.toThrow();
    });
  });

  describe("Gestion des erreurs", () => {
    it("devrait gérer les utilisateurs inexistants", async () => {
      await expect(getUserById("inexistant-id")).rejects.toThrow();
    });

    it("devrait gérer les données de création invalides", async () => {
      const invalidUser = {
        prenom: "A", // Trop court
        nom: "", // Vide
        email: "invalid-email", // Format invalide
        password: "123", // Trop court
        role: Role.USER,
      };

      await expect(createUser(invalidUser)).rejects.toThrow();
    });

    it("devrait empêcher la création d'utilisateurs avec email dupliqué", async () => {
      // Essayer de créer un utilisateur avec l'email de l'admin
      const duplicateUser = {
        prenom: "Duplicate",
        nom: "Test",
        email: "admin@staka-editions.com", // Email existant
        password: "password123",
        role: Role.USER,
      };

      await expect(createUser(duplicateUser)).rejects.toThrow();
    });
  });

  describe("Pagination et filtres avancés", () => {
    it("devrait gérer la pagination correctement", async () => {
      // Test avec une limite très petite pour forcer la pagination
      const page1 = await getUsers({ page: 1, limit: 1 });

      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.limit).toBe(1);
      expect(page1.data?.length).toBeLessThanOrEqual(1);

      if (page1.pagination.totalPages > 1) {
        const page2 = await getUsers({ page: 2, limit: 1 });
        expect(page2.pagination.page).toBe(2);
        expect(page2.data?.length).toBeLessThanOrEqual(1);

        // Vérifier que les utilisateurs sont différents
        if (
          page1.data &&
          page2.data &&
          page1.data.length > 0 &&
          page2.data.length > 0
        ) {
          expect(page1.data[0].id).not.toBe(page2.data[0].id);
        }
      }
    });

    it("devrait filtrer par statut actif/inactif", async () => {
      const activeUsers = await getUsers({
        page: 1,
        limit: 10,
        isActive: true,
      });
      const inactiveUsers = await getUsers({
        page: 1,
        limit: 10,
        isActive: false,
      });

      // Vérifier que tous les utilisateurs actifs sont bien actifs
      activeUsers.data?.forEach((user) => {
        expect(user.isActive).toBe(true);
      });

      // Vérifier que tous les utilisateurs inactifs sont bien inactifs
      inactiveUsers.data?.forEach((user) => {
        expect(user.isActive).toBe(false);
      });
    });

    it("devrait combiner plusieurs filtres", async () => {
      const filteredUsers = await getUsers({
        page: 1,
        limit: 10,
        search: "admin", // recherche
        role: Role.ADMIN, // rôle
        isActive: true, // actifs uniquement
      });

      expect(filteredUsers.data).toBeDefined();
      // Tous les résultats doivent être des admins actifs
      filteredUsers.data?.forEach((user) => {
        expect(user.role).toBe(Role.ADMIN);
        expect(user.isActive).toBe(true);
      });
    });
  });
});
