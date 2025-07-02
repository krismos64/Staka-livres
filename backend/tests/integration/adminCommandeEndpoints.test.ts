import { PrismaClient, Role, StatutCommande } from "@prisma/client";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../src/app";

const prisma = new PrismaClient();

// Helper pour créer un token admin
const createAdminToken = (userId: string = "admin-test-id") => {
  return jwt.sign(
    {
      id: userId,
      email: "admin@test.com",
      role: Role.ADMIN,
    },
    process.env.JWT_SECRET || "test_secret",
    { expiresIn: "1h" }
  );
};

// Helper pour créer un token user normal
const createUserToken = (userId: string = "user-test-id") => {
  return jwt.sign(
    {
      id: userId,
      email: "user@test.com",
      role: Role.USER,
    },
    process.env.JWT_SECRET || "test_secret",
    { expiresIn: "1h" }
  );
};

// Helper pour créer une commande de test
const createTestCommande = async (overrides: any = {}) => {
  // D'abord créer un utilisateur test
  const testUser = await prisma.user.upsert({
    where: { email: "testuser@example.com" },
    update: {},
    create: {
      id: "test-user-id",
      prenom: "Test",
      nom: "User",
      email: "testuser@example.com",
      password: "hashedpassword",
      role: Role.USER,
    },
  });

  return await prisma.commande.create({
    data: {
      titre: "Test Commande",
      description: "Description de test",
      statut: StatutCommande.EN_ATTENTE,
      userId: testUser.id,
      ...overrides,
    },
    include: {
      user: {
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
        },
      },
    },
  });
};

describe("Admin Commandes Endpoints", () => {
  let adminToken: string;
  let userToken: string;
  let testCommande: any;

  beforeAll(async () => {
    adminToken = createAdminToken();
    userToken = createUserToken();
  });

  beforeEach(async () => {
    // Nettoyer les données de test avant chaque test
    await prisma.commande.deleteMany({
      where: {
        titre: {
          contains: "Test",
        },
      },
    });

    // Créer une commande de test
    testCommande = await createTestCommande();
  });

  afterAll(async () => {
    // Nettoyer les données de test après tous les tests
    await prisma.commande.deleteMany({
      where: {
        titre: {
          contains: "Test",
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "test",
        },
      },
    });
    await prisma.$disconnect();
  });

  describe("GET /admin/commandes", () => {
    it("devrait récupérer la liste des commandes avec statistiques", async () => {
      const response = await request(app)
        .get("/admin/commandes")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("stats");
      expect(response.body).toHaveProperty("page");
      expect(response.body).toHaveProperty("totalPages");

      // Vérifier la structure des stats
      expect(response.body.stats).toHaveProperty("total");
      expect(response.body.stats).toHaveProperty("byStatut");
      expect(response.body.stats.byStatut).toHaveProperty("EN_ATTENTE");
      expect(response.body.stats.byStatut).toHaveProperty("EN_COURS");
      expect(response.body.stats.byStatut).toHaveProperty("TERMINE");
      expect(response.body.stats.byStatut).toHaveProperty("ANNULEE");
      expect(response.body.stats.byStatut).toHaveProperty("SUSPENDUE");

      // Au moins une commande de test doit être présente
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.stats.total).toBeGreaterThan(0);
    });

    it("devrait appliquer les filtres de recherche", async () => {
      const response = await request(app)
        .get("/admin/commandes")
        .query({ search: "testuser@example.com" })
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.filters.search).toBe("testuser@example.com");

      // Au moins notre commande de test devrait être trouvée
      if (response.body.data.length > 0) {
        expect(
          response.body.data.some((cmd: any) =>
            cmd.user.email.includes("testuser")
          )
        ).toBe(true);
      }
    });

    it("devrait appliquer le filtre par statut", async () => {
      const response = await request(app)
        .get("/admin/commandes")
        .query({ statut: StatutCommande.EN_ATTENTE })
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.filters.statut).toBe(StatutCommande.EN_ATTENTE);

      // Toutes les commandes retournées doivent avoir le statut EN_ATTENTE
      response.body.data.forEach((cmd: any) => {
        expect(cmd.statut).toBe(StatutCommande.EN_ATTENTE);
      });
    });

    it("devrait gérer la pagination", async () => {
      const response = await request(app)
        .get("/admin/commandes")
        .query({ page: 1, limit: 1 })
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it("devrait refuser l'accès aux utilisateurs non-admin", async () => {
      await request(app)
        .get("/admin/commandes")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);
    });

    it("devrait refuser l'accès sans token", async () => {
      await request(app).get("/admin/commandes").expect(401);
    });
  });

  describe("PUT /admin/commandes/:id", () => {
    it("devrait mettre à jour le statut d'une commande", async () => {
      const response = await request(app)
        .put(`/admin/commandes/${testCommande.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ statut: StatutCommande.EN_COURS })
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("commande");
      expect(response.body.commande.statut).toBe(StatutCommande.EN_COURS);

      // Vérifier que la BD a été mise à jour
      const updatedCommande = await prisma.commande.findUnique({
        where: { id: testCommande.id },
      });
      expect(updatedCommande?.statut).toBe(StatutCommande.EN_COURS);
    });

    it("devrait retourner 400 pour un statut invalide", async () => {
      const response = await request(app)
        .put(`/admin/commandes/${testCommande.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ statut: "STATUT_INVALIDE" })
        .expect(400);

      expect(response.body.error).toBe("Statut invalide");
    });

    it("devrait retourner 404 pour une commande inexistante", async () => {
      const response = await request(app)
        .put("/admin/commandes/commande-inexistante")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ statut: StatutCommande.EN_COURS })
        .expect(404);

      expect(response.body.error).toBe("Commande non trouvée");
    });

    it("devrait retourner 400 sans statut dans le body", async () => {
      await request(app)
        .put(`/admin/commandes/${testCommande.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it("devrait refuser l'accès aux utilisateurs non-admin", async () => {
      await request(app)
        .put(`/admin/commandes/${testCommande.id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ statut: StatutCommande.EN_COURS })
        .expect(403);
    });
  });

  describe("DELETE /admin/commandes/:id", () => {
    it("devrait supprimer une commande existante", async () => {
      const response = await request(app)
        .delete(`/admin/commandes/${testCommande.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("supprimée avec succès");

      // Vérifier que la commande a été supprimée de la BD
      const deletedCommande = await prisma.commande.findUnique({
        where: { id: testCommande.id },
      });
      expect(deletedCommande).toBeNull();
    });

    it("devrait retourner 404 pour une commande inexistante", async () => {
      const response = await request(app)
        .delete("/admin/commandes/commande-inexistante")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe("Commande non trouvée");
    });

    it("devrait refuser l'accès aux utilisateurs non-admin", async () => {
      await request(app)
        .delete(`/admin/commandes/${testCommande.id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);
    });

    it("devrait refuser l'accès sans token", async () => {
      await request(app)
        .delete(`/admin/commandes/${testCommande.id}`)
        .expect(401);
    });
  });
});
