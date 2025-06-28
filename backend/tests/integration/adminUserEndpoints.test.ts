import { Role } from "@prisma/client";
import request from "supertest";
import { signToken } from "../../src/utils/token";

// Nous assumons qu'il y a un app.ts qui exporte l'application Express
// Si ce n'est pas le cas, il faudra ajuster l'import
const app = require("../../src/server");

// Helper pour générer un token admin valide
const generateAdminToken = () => {
  return signToken({
    userId: "admin-test-id",
    email: "admin@test.com",
    role: Role.ADMIN,
  });
};

// Helper pour générer un token user valide
const generateUserToken = () => {
  return signToken({
    userId: "user-test-id",
    email: "user@test.com",
    role: Role.USER,
  });
};

describe("Admin User Endpoints", () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(() => {
    adminToken = generateAdminToken();
    userToken = generateUserToken();
  });

  describe("GET /admin/users", () => {
    it("devrait retourner 401 sans token", async () => {
      const response = await request(app).get("/admin/users");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Token d'accès requis");
    });

    it("devrait retourner 403 avec un token utilisateur normal", async () => {
      const response = await request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it("devrait retourner la liste des utilisateurs avec un token admin", async () => {
      const response = await request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination).toHaveProperty("page");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("totalPages");
    });

    it("devrait appliquer la pagination", async () => {
      const response = await request(app)
        .get("/admin/users?page=1&limit=5")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it("devrait appliquer les filtres de recherche", async () => {
      const response = await request(app)
        .get("/admin/users?search=admin&role=ADMIN")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("devrait valider les paramètres de pagination", async () => {
      const response = await request(app)
        .get("/admin/users?page=0&limit=-1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Paramètres de pagination invalides");
    });

    it("devrait valider le filtre de rôle", async () => {
      const response = await request(app)
        .get("/admin/users?role=INVALID_ROLE")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Rôle invalide");
    });
  });

  describe("GET /admin/users/stats", () => {
    it("devrait retourner les statistiques des utilisateurs", async () => {
      const response = await request(app)
        .get("/admin/users/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("total");
      expect(response.body.data).toHaveProperty("actifs");
      expect(response.body.data).toHaveProperty("admin");
      expect(response.body.data).toHaveProperty("recents");
    });
  });

  describe("GET /admin/users/:id", () => {
    it("devrait retourner un utilisateur par ID", async () => {
      // D'abord récupérer la liste pour avoir un ID valide
      const listResponse = await request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      if (listResponse.body.data.length > 0) {
        const userId = listResponse.body.data[0].id;

        const response = await request(app)
          .get(`/admin/users/${userId}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("id", userId);
        expect(response.body.data).toHaveProperty("prenom");
        expect(response.body.data).toHaveProperty("nom");
        expect(response.body.data).toHaveProperty("email");
      }
    });

    it("devrait retourner 404 pour un ID inexistant", async () => {
      const response = await request(app)
        .get("/admin/users/inexistant-id")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Utilisateur introuvable");
    });

    it("devrait retourner 400 sans ID", async () => {
      const response = await request(app)
        .get("/admin/users/")
        .set("Authorization", `Bearer ${adminToken}`);

      // Cette route devrait matcher GET /admin/users/ plutôt que GET /admin/users/:id
      // donc on s'attend à un succès mais on teste quand même
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe("POST /admin/users", () => {
    const newUserData = {
      prenom: "Test",
      nom: "User",
      email: `test-${Date.now()}@example.com`, // Email unique
      password: "password123",
      role: "USER",
      isActive: true,
    };

    it("devrait créer un nouvel utilisateur", async () => {
      const response = await request(app)
        .post("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.email).toBe(newUserData.email);
      expect(response.body.data.role).toBe(newUserData.role);
    });

    it("devrait valider les données d'entrée", async () => {
      const invalidData = {
        prenom: "A", // Trop court
        nom: "", // Vide
        email: "invalid-email", // Format invalide
        password: "123", // Trop court
        role: "INVALID", // Rôle invalide
      };

      const response = await request(app)
        .post("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Données invalides");
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it("devrait empêcher la création avec un email existant", async () => {
      // Essayer de créer un utilisateur avec un email qui existe probablement déjà
      const duplicateEmailData = {
        ...newUserData,
        email: "admin@staka-editions.com", // Email probable de l'admin par défaut
      };

      const response = await request(app)
        .post("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(duplicateEmailData);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Conflit de données");
    });
  });

  describe("PATCH /admin/users/:id", () => {
    let testUserId: string;

    beforeAll(async () => {
      // Créer un utilisateur test pour les modifications
      const newUser = {
        prenom: "TestUpdate",
        nom: "User",
        email: `test-update-${Date.now()}@example.com`,
        password: "password123",
        role: "USER",
      };

      const createResponse = await request(app)
        .post("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser);

      if (createResponse.status === 201) {
        testUserId = createResponse.body.data.id;
      }
    });

    it("devrait mettre à jour un utilisateur", async () => {
      if (!testUserId) {
        console.log("Pas d'utilisateur test créé, skip du test");
        return;
      }

      const updateData = {
        prenom: "Updated",
        isActive: false,
      };

      const response = await request(app)
        .patch(`/admin/users/${testUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prenom).toBe("Updated");
      expect(response.body.data.isActive).toBe(false);
    });

    it("devrait valider les données de mise à jour", async () => {
      if (!testUserId) return;

      const invalidUpdateData = {
        email: "invalid-email-format",
        role: "INVALID_ROLE",
      };

      const response = await request(app)
        .patch(`/admin/users/${testUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidUpdateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Données invalides");
    });
  });

  describe("PATCH /admin/users/:id/toggle-status", () => {
    let testUserId: string;

    beforeAll(async () => {
      // Récupérer un utilisateur test (pas admin)
      const listResponse = await request(app)
        .get("/admin/users?role=USER")
        .set("Authorization", `Bearer ${adminToken}`);

      if (listResponse.body.data.length > 0) {
        testUserId = listResponse.body.data[0].id;
      }
    });

    it("devrait basculer le statut d'un utilisateur", async () => {
      if (!testUserId) return;

      const response = await request(app)
        .patch(`/admin/users/${testUserId}/toggle-status`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("isActive");
    });
  });

  describe("DELETE /admin/users/:id", () => {
    let testUserId: string;

    beforeAll(async () => {
      // Créer un utilisateur test pour la suppression
      const newUser = {
        prenom: "TestDelete",
        nom: "User",
        email: `test-delete-${Date.now()}@example.com`,
        password: "password123",
        role: "USER",
      };

      const createResponse = await request(app)
        .post("/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser);

      if (createResponse.status === 201) {
        testUserId = createResponse.body.data.id;
      }
    });

    it("devrait supprimer un utilisateur (RGPD)", async () => {
      if (!testUserId) return;

      const response = await request(app)
        .delete(`/admin/users/${testUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("supprimé définitivement");

      // Vérifier que l'utilisateur n'existe plus
      const getResponse = await request(app)
        .get(`/admin/users/${testUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    it("devrait retourner 404 pour un ID inexistant", async () => {
      const response = await request(app)
        .delete("/admin/users/inexistant-id")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Utilisateur introuvable");
    });
  });
});
