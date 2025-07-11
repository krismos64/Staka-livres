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
        titre: "L'Écho du Temps",
        description: "Roman contemporain explorant les thèmes du temps et de la mémoire",
        statut: StatutCommande.EN_COURS,
        dateEcheance: new Date("2025-01-15"),
        amount: 450,
        noteCorrecteur: "En cours de correction",
        createdAt: new Date("2025-01-05"),
        updatedAt: new Date("2025-01-03"),
      },
    }),
    prisma.commande.create({
      data: {
        id: "cmd-active-2",
        userId,
        titre: "Mémoires d'une Vie",
        description: "Biographie personnelle retraçant 60 années d'expériences",
        statut: StatutCommande.EN_COURS,
        dateEcheance: new Date("2025-01-20"),
        amount: 320,
        createdAt: new Date("2025-01-10"),
        updatedAt: new Date("2025-01-02"),
      },
    }),
    // Commandes EN_ATTENTE (pending)
    prisma.commande.create({
      data: {
        id: "cmd-pending-1",
        userId,
        titre: "Nouvelles du Cœur",
        description: "Recueil de nouvelles romantiques et émouvantes avec 150 pages",
        statut: StatutCommande.EN_ATTENTE,
        dateEcheance: new Date("2025-01-25"),
        amount: 200,
        createdAt: new Date("2025-01-12"),
        updatedAt: new Date("2025-01-04"),
      },
    }),
    // Commandes TERMINE (completed)
    prisma.commande.create({
      data: {
        id: "cmd-completed-1",
        userId,
        titre: "Guide de Jardinage",
        description: "Guide pratique pour cultiver son jardin",
        statut: StatutCommande.TERMINE,
        dateEcheance: new Date("2025-01-10"),
        dateFinition: new Date("2025-01-08"),
        amount: 800,
        noteCorrecteur: "Travail excellent, correction terminée",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-08"),
      },
    }),
    prisma.commande.create({
      data: {
        id: "cmd-completed-2",
        userId,
        titre: "Poésie Moderne",
        description: "Recueil de poèmes contemporains",
        statut: StatutCommande.TERMINE,
        dateEcheance: new Date("2025-01-05"),
        dateFinition: new Date("2025-01-03"),
        amount: 150,
        noteCorrecteur: "Correction terminée avec succès",
        createdAt: new Date("2024-12-20"),
        updatedAt: new Date("2025-01-03"),
      },
    }),
  ]);

  // Créer quelques fichiers pour les projets terminés
  await prisma.file.createMany({
    data: [
      {
        id: "file-1",
        filename: "guide_jardinage_corrige.pdf",
        storedName: "file_store_1.pdf",
        mimeType: "application/pdf",
        size: 1024000,
        url: "https://example.com/file1.pdf",
        type: "DOCUMENT",
        uploadedById: userId,
        commandeId: "cmd-completed-1",
      },
      {
        id: "file-2",
        filename: "poesie_moderne_corrige.docx",
        storedName: "file_store_2.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 512000,
        url: "https://example.com/file2.docx",
        type: "DOCUMENT",
        uploadedById: userId,
        commandeId: "cmd-completed-2",
      },
    ],
  });

  return { testUser, commandes };
};

describe("Projects Endpoints", () => {
  beforeAll(async () => {
    // Nettoyer la base de données avant les tests
    await prisma.file.deleteMany({
      where: { uploadedById: "test-user-projects" },
    });
    await prisma.commande.deleteMany({
      where: { userId: "test-user-projects" },
    });
    await prisma.user.deleteMany({
      where: { email: "projects@test.com" },
    });
  });

  afterAll(async () => {
    // Nettoyer après les tests
    await prisma.file.deleteMany({
      where: { uploadedById: "test-user-projects" },
    });
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
      await prisma.file.deleteMany({
        where: { uploadedById: "test-user-projects" },
      });
      await prisma.commande.deleteMany({
        where: { userId: "test-user-projects" },
      });
      await prisma.user.deleteMany({
        where: { email: "projects@test.com" },
      });
    });

    it("should return paginated projects with proper structure", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("meta");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(5);

      // Vérifier la structure meta
      expect(response.body.meta).toHaveProperty("page", 1);
      expect(response.body.meta).toHaveProperty("pageSize", 10);
      expect(response.body.meta).toHaveProperty("total", 5);

      // Vérifier la structure des projets
      const project = response.body.data[0];
      expect(project).toHaveProperty("id");
      expect(project).toHaveProperty("title");
      expect(project).toHaveProperty("type");
      expect(project).toHaveProperty("pages");
      expect(project).toHaveProperty("startedAt");
      expect(project).toHaveProperty("pack");
      expect(project).toHaveProperty("status");
      expect(project).toHaveProperty("progress");
      expect(project).toHaveProperty("canDownload");

      // Vérifier le header X-Total-Count
      expect(response.headers["x-total-count"]).toBe("5");
    });

    it("should return projects with page=2&limit=5&status=active", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?page=2&limit=5&status=active")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0); // 2 actifs, donc page 2 vide
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.pageSize).toBe(5);
      expect(response.body.meta.total).toBe(2);
    });

    it("should filter by status correctly", async () => {
      const token = createUserToken("test-user-projects");

      // Test status=active
      const activeResponse = await request(app)
        .get("/projects?status=active")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(activeResponse.body.data).toHaveLength(2);
      activeResponse.body.data.forEach((project: any) => {
        expect(project.status).toBe("active");
      });

      // Test status=pending
      const pendingResponse = await request(app)
        .get("/projects?status=pending")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(pendingResponse.body.data).toHaveLength(1);
      expect(pendingResponse.body.data[0].status).toBe("pending");

      // Test status=completed
      const completedResponse = await request(app)
        .get("/projects?status=completed")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(completedResponse.body.data).toHaveLength(2);
      completedResponse.body.data.forEach((project: any) => {
        expect(project.status).toBe("completed");
        expect(project.canDownload).toBe(true); // Projects terminés avec fichiers
      });
    });

    it("should search by title correctly", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?search=Écho")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("L'Écho du Temps");
    });

    it("should handle case insensitive search", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?search=mémoires")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("Mémoires d'une Vie");
    });

    // Edge Cases
    it("should return 400 for limit=0", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?limit=0")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Paramètres invalides");
      expect(response.body.message).toContain("limit doit être entre 1 et 50");
    });

    it("should return 400 for page=-1", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?page=-1")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Paramètres invalides");
      expect(response.body.message).toContain("page doit être ≥ 1");
    });

    it("should return 400 for limit>50", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?limit=51")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Paramètres invalides");
      expect(response.body.message).toContain("limit doit être entre 1 et 50");
    });

    it("should return 400 for invalid status", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects?status=invalid")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Paramètres invalides");
    });

    it("should return 400 for search too long", async () => {
      const token = createUserToken("test-user-projects");
      const longSearch = "a".repeat(101);

      const response = await request(app)
        .get(`/projects?search=${longSearch}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Paramètres invalides");
      expect(response.body.message).toContain("search doit faire ≤ 100 caractères");
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app)
        .get("/projects")
        .expect(401);

      expect(response.body).toHaveProperty("error", "Token d'accès requis");
    });

    it("should return 401 for invalid token", async () => {
      const response = await request(app)
        .get("/projects")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toHaveProperty("error", "Token invalide");
    });

    it("should respect ordering by delivery date desc", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const projects = response.body.data;
      expect(projects).toHaveLength(5);

      // Vérifier l'ordre par date de livraison desc
      expect(projects[0].title).toBe("Nouvelles du Cœur"); // 2025-01-25
      expect(projects[1].title).toBe("Mémoires d'une Vie"); // 2025-01-20
      expect(projects[2].title).toBe("L'Écho du Temps"); // 2025-01-15
      expect(projects[3].title).toBe("Guide de Jardinage"); // 2025-01-10
      expect(projects[4].title).toBe("Poésie Moderne"); // 2025-01-05
    });

    it("should map project types correctly", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const projectsByType = response.body.data.reduce((acc: any, project: any) => {
        acc[project.title] = project.type;
        return acc;
      }, {});

      expect(projectsByType["L'Écho du Temps"]).toBe("Roman");
      expect(projectsByType["Mémoires d'une Vie"]).toBe("Manuscrit"); // Biographie -> Manuscrit
      expect(projectsByType["Nouvelles du Cœur"]).toBe("Manuscrit"); // Recueil -> Manuscrit
      expect(projectsByType["Guide de Jardinage"]).toBe("Guide");
      expect(projectsByType["Poésie Moderne"]).toBe("Poésie");
    });

    it("should calculate progress based on status", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const progressByStatus = response.body.data.reduce((acc: any, project: any) => {
        acc[project.status] = project.progress;
        return acc;
      }, {});

      expect(progressByStatus.pending).toBe(0);
      expect(progressByStatus.active).toBe(50);
      expect(progressByStatus.completed).toBe(100);
    });
  });

  describe("GET /projects/counts", () => {
    beforeEach(async () => {
      await createTestUserWithCommandes();
    });

    afterEach(async () => {
      await prisma.file.deleteMany({
        where: { uploadedById: "test-user-projects" },
      });
      await prisma.commande.deleteMany({
        where: { userId: "test-user-projects" },
      });
      await prisma.user.deleteMany({
        where: { email: "projects@test.com" },
      });
    });

    it("should return status counts", async () => {
      const token = createUserToken("test-user-projects");

      const response = await request(app)
        .get("/projects/counts")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        all: 5,
        active: 2,
        pending: 1,
        completed: 2,
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app)
        .get("/projects/counts")
        .expect(401);

      expect(response.body).toHaveProperty("error", "Token d'accès requis");
    });
  });
});