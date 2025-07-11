import { PrismaClient, Role, StatutCommande } from "@prisma/client";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../src/app";

const prisma = new PrismaClient();

// Helper pour créer un token utilisateur
const createUserToken = (userId: string = "user-test-id") => {
  return jwt.sign(
    {
      userId,
      email: "user@test.com",
      role: Role.USER,
    },
    process.env.JWT_SECRET || "test_secret",
    { expiresIn: "1h" }
  );
};

// Helper pour créer un utilisateur et ses commandes de test
const createTestUserWithCommandes = async (userId: string = "test-user-projects") => {
  // Créer un utilisateur test
  const testUser = await prisma.user.upsert({
    where: { email: "projects@test.com" },
    update: {},
    create: {
      id: userId,
      prenom: "Test",
      nom: "Projects",
      email: "projects@test.com",
      password: "hashedpassword",
      role: Role.USER,
    },
  });

  // Créer plusieurs commandes avec différents statuts
  const commandes = await Promise.all([
    // Commandes EN_COURS (active)
    prisma.commande.create({
      data: {
        id: "cmd-active-1",
        userId,
        titre: "Projet actif 1",
        description: "Description projet 1",
        statut: StatutCommande.EN_COURS,
        updatedAt: new Date("2024-01-03"),
      },
    }),
    prisma.commande.create({
      data: {
        id: "cmd-active-2",
        userId,
        titre: "Projet actif 2",
        description: "Description projet 2",
        statut: StatutCommande.EN_COURS,
        updatedAt: new Date("2024-01-02"),
      },
    }),
    prisma.commande.create({
      data: {
        id: "cmd-active-3",
        userId,
        titre: "Projet actif 3",
        description: "Description projet 3",
        statut: StatutCommande.EN_COURS,
        updatedAt: new Date("2024-01-01"),
      },
    }),
    // Commandes avec autres statuts
    prisma.commande.create({
      data: {
        id: "cmd-waiting-1",
        userId,
        titre: "Projet en attente",
        description: "Description projet en attente",
        statut: StatutCommande.EN_ATTENTE,
        updatedAt: new Date("2024-01-04"),
      },
    }),
    prisma.commande.create({
      data: {
        id: "cmd-finished-1",
        userId,
        titre: "Projet terminé",
        description: "Description projet terminé",
        statut: StatutCommande.TERMINE,
        updatedAt: new Date("2024-01-05"),
      },
    }),
  ]);

  return { testUser, commandes };
};

describe("Projects Endpoints", () => {
  beforeAll(async () => {
    // Nettoyer la base de données avant les tests
    await prisma.commande.deleteMany({
      where: { userId: "test-user-projects" },
    });
    await prisma.user.deleteMany({
      where: { email: "projects@test.com" },
    });
  });

  afterAll(async () => {
    // Nettoyer après les tests
    await prisma.commande.deleteMany({
      where: { userId: "test-user-projects" },
    });
    await prisma.user.deleteMany({
      where: { email: "projects@test.com" },
    });
    await prisma.$disconnect();
  });

  describe("GET /projects", () => {
    beforeEach(async () => {
      // Créer les données de test avant chaque test
      await createTestUserWithCommandes();
    });

    afterEach(async () => {
      // Nettoyer après chaque test
      await prisma.commande.deleteMany({
        where: { userId: "test-user-projects" },
      });
      await prisma.user.deleteMany({
        where: { email: "projects@test.com" },
      });
    });

    it("should return active projects for authenticated user", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
      
      // Vérifier l'ordre (plus récent en premier)
      expect(response.body[0].title).toBe("Projet actif 1");
      expect(response.body[1].title).toBe("Projet actif 2");
      expect(response.body[2].title).toBe("Projet actif 3");
      
      // Vérifier la structure de la réponse
      response.body.forEach((project: any) => {
        expect(project).toHaveProperty("id");
        expect(project).toHaveProperty("title");
        expect(project).toHaveProperty("status");
        expect(project).toHaveProperty("updatedAt");
        expect(project.status).toBe("EN_COURS");
      });
    });

    it("should return projects with status=active&limit=2", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?status=active&limit=2")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe("Projet actif 1");
      expect(response.body[1].title).toBe("Projet actif 2");
    });

    it("should return 400 for limit=0", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?limit=0")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Paramètre limit invalide");
    });

    it("should return 400 for limit>20", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?limit=21")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Paramètre limit invalide");
    });

    it("should return 400 for invalid limit (non-numeric)", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?limit=invalid")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Paramètre limit invalide");
    });

    it("should return projects with different status", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?status=EN_ATTENTE")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe("Projet en attente");
      expect(response.body[0].status).toBe("EN_ATTENTE");
    });

    it("should return empty array for status without projects", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?status=ANNULEE")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app)
        .get("/projects")
        .expect(401);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Token d'accès requis");
    });

    it("should return 401 for invalid token", async () => {
      const response = await request(app)
        .get("/projects")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Token invalide");
    });

    it("should respect default limit of 3", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
    });

    it("should respect default status of active", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((project: any) => {
        expect(project.status).toBe("EN_COURS");
      });
    });
  });
});