import { Request, Response } from "express";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { getProjects, getProjectCounts } from "../../controllers/projectsController";
import { ProjectService } from "../../services/projectService";

// Mock modules
vi.mock("../../services/projectService");

const mockProjectService = vi.mocked(ProjectService);

// Helper functions
const createMockReq = (user: any = {}, query: any = {}): Partial<Request> => ({
  user: {
    id: "user-123",
    email: "test@example.com",
    role: "USER",
    ...user
  },
  query
});

const createMockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.set = vi.fn().mockReturnValue(res);
  return res;
};

// Mock data
const mockProjectsResponse = {
  data: [
    {
      id: "project-1",
      title: "Roman Fantasy - Correction complète",
      type: "Roman",
      pages: 300,
      startedAt: "2023-01-15",
      deliveryAt: "2023-02-15",
      corrector: "Jean Correcteur",
      pack: "Pack Intégral",
      status: "active",
      progress: 50,
      rating: undefined,
      canDownload: false,
      createdAt: "2023-01-15T10:00:00.000Z",
      updatedAt: "2023-01-20T14:30:00.000Z"
    },
    {
      id: "project-2",
      title: "Nouvelle SF - Relecture",
      type: "Nouvelle",
      pages: 50,
      startedAt: "2023-01-10",
      deliveryAt: "2023-01-25",
      corrector: "Marie Correctrice",
      pack: "Pack Standard",
      status: "completed",
      progress: 100,
      rating: 4.5,
      canDownload: true,
      createdAt: "2023-01-10T09:00:00.000Z",
      updatedAt: "2023-01-25T16:45:00.000Z"
    },
    {
      id: "project-3",
      title: "Essai Philosophique",
      type: "Essai",
      pages: 150,
      startedAt: "2023-01-05",
      deliveryAt: undefined,
      corrector: undefined,
      pack: "Pack Essentiel",
      status: "pending",
      progress: 10,
      rating: undefined,
      canDownload: false,
      createdAt: "2023-01-05T08:00:00.000Z",
      updatedAt: "2023-01-05T08:00:00.000Z"
    }
  ],
  meta: {
    page: 1,
    pageSize: 10,
    total: 3
  }
};

const mockCountsResponse = {
  all: 10,
  active: 3,
  pending: 4,
  completed: 3
};

describe("ProjectsController - CRUD Projets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProjects", () => {
    test("devrait récupérer les projets avec paramètres par défaut", async () => {
      const req = createMockReq(
        { id: "user-123", email: "test@example.com" },
        {} // Pas de paramètres de query
      ) as Request;

      const res = createMockRes() as Response;

      mockProjectService.getProjects.mockResolvedValue(mockProjectsResponse);

      await getProjects(req, res);

      // Vérifier l'appel au service avec les valeurs par défaut
      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        "user-123",
        1, // page par défaut
        10, // limit par défaut
        {
          status: "all", // status par défaut
          search: undefined
        }
      );

      // Vérifier les headers de pagination
      expect(res.set).toHaveBeenCalledWith('X-Total-Count', '3');

      // Vérifier la réponse
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProjectsResponse);
    });

    test("devrait gérer la pagination personnalisée", async () => {
      const req = createMockReq(
        { id: "user-123", email: "test@example.com" },
        {
          page: "2",
          limit: "5"
        }
      ) as Request;

      const res = createMockRes() as Response;

      const customResponse = {
        ...mockProjectsResponse,
        data: mockProjectsResponse.data.slice(0, 1),
        meta: {
          page: 2,
          pageSize: 5,
          total: 6
        }
      };

      mockProjectService.getProjects.mockResolvedValue(customResponse);

      await getProjects(req, res);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        "user-123",
        2, // page transformée en number
        5, // limit transformée en number
        {
          status: "all",
          search: undefined
        }
      );

      expect(res.set).toHaveBeenCalledWith('X-Total-Count', '6');
      expect(res.json).toHaveBeenCalledWith(customResponse);
    });

    test("devrait gérer les filtres de statut et recherche", async () => {
      const req = createMockReq(
        { id: "user-123", email: "test@example.com" },
        {
          status: "active",
          search: "roman fantasy"
        }
      ) as Request;

      const res = createMockRes() as Response;

      const filteredResponse = {
        ...mockProjectsResponse,
        data: [mockProjectsResponse.data[0]], // Seulement le projet actif
        meta: {
          page: 1,
          pageSize: 10,
          total: 1
        }
      };

      mockProjectService.getProjects.mockResolvedValue(filteredResponse);

      await getProjects(req, res);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        "user-123",
        1,
        10,
        {
          status: "active",
          search: "roman fantasy"
        }
      );

      expect(res.json).toHaveBeenCalledWith(filteredResponse);
    });

    test("devrait rejeter les utilisateurs non authentifiés", async () => {
      const req = {
        query: {}
      } as Request; // Pas de req.user

      const res = createMockRes() as Response;

      await getProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentification requise",
        message: "Utilisateur non authentifié"
      });

      expect(mockProjectService.getProjects).not.toHaveBeenCalled();
    });



    test("devrait transformer correctement les paramètres de query", async () => {
      const req = createMockReq(
        { id: "user-123", email: "test@example.com" },
        {
          page: "3",
          limit: "25",
          status: "completed",
          search: "  spaced search  " // Avec espaces
        }
      ) as Request;

      const res = createMockRes() as Response;

      mockProjectService.getProjects.mockResolvedValue(mockProjectsResponse);

      await getProjects(req, res);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        "user-123",
        3,
        25,
        {
          status: "completed",
          search: "  spaced search  " // Pas de trim dans le contrôleur
        }
      );
    });

    test("devrait loguer correctement les opérations", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const req = createMockReq(
        { id: "user-123", email: "test@example.com" },
        {
          page: "2",
          limit: "5",
          status: "active",
          search: "test"
        }
      ) as Request;

      const res = createMockRes() as Response;

      mockProjectService.getProjects.mockResolvedValue(mockProjectsResponse);

      await getProjects(req, res);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("🔍 [PROJECTS] test@example.com récupère ses projets - Page: 2, Limit: 5, Status: active, Search: test")
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("✅ [PROJECTS] 3/3 projets récupérés pour test@example.com (page 1)")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getProjectCounts", () => {
    test("devrait récupérer les compteurs de projets", async () => {
      const req = createMockReq(
        { id: "user-123", email: "test@example.com" }
      ) as Request;

      const res = createMockRes() as Response;

      mockProjectService.getStatusCounts.mockResolvedValue(mockCountsResponse);

      await getProjectCounts(req, res);

      expect(mockProjectService.getStatusCounts).toHaveBeenCalledWith("user-123");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCountsResponse);
    });

    test("devrait rejeter les utilisateurs non authentifiés", async () => {
      const req = {} as Request; // Pas de req.user

      const res = createMockRes() as Response;

      await getProjectCounts(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentification requise",
        message: "Utilisateur non authentifié"
      });

      expect(mockProjectService.getStatusCounts).not.toHaveBeenCalled();
    });


    test("devrait loguer les opérations correctement", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const req = createMockReq(
        { id: "user-123", email: "test@example.com" }
      ) as Request;

      const res = createMockRes() as Response;

      mockProjectService.getStatusCounts.mockResolvedValue(mockCountsResponse);

      await getProjectCounts(req, res);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("🔢 [PROJECTS] test@example.com récupère les compteurs de projets")
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("✅ [PROJECTS] Compteurs récupérés pour test@example.com:"),
        mockCountsResponse
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Tests d'intégration et cas edge", () => {
    test("devrait gérer une requête avec tous les paramètres à leurs limites", async () => {
      const req = createMockReq(
        { id: "user-123", email: "test@example.com" },
        {
          page: "1",
          limit: "100", // Maximum autorisé
          status: "all",
          search: "a".repeat(100) // Maximum autorisé
        }
      ) as Request;

      const res = createMockRes() as Response;

      mockProjectService.getProjects.mockResolvedValue(mockProjectsResponse);

      await getProjects(req, res);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        "user-123",
        1,
        100,
        {
          status: "all",
          search: "a".repeat(100)
        }
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("devrait gérer les paramètres de query non définis", async () => {
      const req = createMockReq(
        { id: "user-123", email: "test@example.com" },
        {
          page: undefined,
          limit: undefined,
          status: undefined,
          search: undefined
        }
      ) as Request;

      const res = createMockRes() as Response;

      mockProjectService.getProjects.mockResolvedValue(mockProjectsResponse);

      await getProjects(req, res);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        "user-123",
        1, // Valeur par défaut
        10, // Valeur par défaut
        {
          status: "all", // Valeur par défaut
          search: undefined
        }
      );
    });

    test("devrait gérer les chaînes vides", async () => {
      const req = createMockReq(
        { id: "user-123", email: "test@example.com" },
        {
          page: "",
          limit: "",
          search: ""
        }
      ) as Request;

      const res = createMockRes() as Response;

      mockProjectService.getProjects.mockResolvedValue(mockProjectsResponse);

      await getProjects(req, res);

      expect(mockProjectService.getProjects).toHaveBeenCalledWith(
        "user-123",
        1, // Valeur par défaut pour chaîne vide
        10, // Valeur par défaut pour chaîne vide
        {
          status: "all",
          search: "" // Chaîne vide préservée
        }
      );
    });


  });
});