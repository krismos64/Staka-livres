import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProjectFile,
  deleteProjectFile,
  getProjectFiles,
} from "../../controllers/filesController";
import { FilesService } from "../../services/filesService";

// Mock FilesService
vi.mock("../../services/filesService");
const mockFilesService = vi.mocked(FilesService);

// Helper to create mock request and response
const createMockReq = (
  params: any = {},
  body: any = {},
  user: any = { id: "550e8400-e29b-41d4-a716-446655440000", email: "test@example.com" }
): Partial<Request> => ({
  params,
  body,
  user,
});

const createMockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("FilesController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProjectFile", () => {
    const mockParams = { id: "550e8400-e29b-41d4-a716-446655440001" };
    const mockBody = {
      name: "test-document.pdf",
      size: 1024 * 1024,
      mime: "application/pdf",
    };

    it("should create project file successfully", async () => {
      const req = createMockReq(mockParams, mockBody);
      const res = createMockRes();

      const mockResult = {
        uploadUrl: "https://bucket.s3.region.amazonaws.com/presigned-url",
        fields: {
          key: "project-550e8400-e29b-41d4-a716-446655440001-1234567890-abcdef.pdf",
          bucket: "test-bucket",
          "Content-Type": "application/pdf",
        },
        fileId: "550e8400-e29b-41d4-a716-446655440002",
      };

      mockFilesService.createProjectFile.mockResolvedValue(mockResult);

      await createProjectFile(req as Request, res as Response);

      expect(mockFilesService.createProjectFile).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440000",
        mockBody
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should return 401 if user is not authenticated", async () => {
      const req = createMockReq(mockParams, mockBody, null);
      const res = createMockRes();

      await createProjectFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentification requise",
        message: "Utilisateur non authentifié",
      });
    });

    it("should return 400 for invalid UUID in params", async () => {
      const req = createMockReq({ id: "invalid-uuid" }, mockBody);
      const res = createMockRes();

      await createProjectFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Données invalides",
        message: expect.stringContaining("ID de projet invalide"),
        details: expect.any(Array),
      });
    });

    it("should return 400 for invalid body data", async () => {
      const req = createMockReq(mockParams, { name: "", size: 0 });
      const res = createMockRes();

      await createProjectFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Données invalides",
        message: expect.any(String),
        details: expect.any(Array),
      });
    });

    it("should return 400 for file too large", async () => {
      const req = createMockReq(mockParams, mockBody);
      const res = createMockRes();

      mockFilesService.createProjectFile.mockRejectedValue(
        new Error("La taille du fichier ne peut pas dépasser 20 Mo")
      );

      await createProjectFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Fichier trop volumineux",
        message: "La taille du fichier ne peut pas dépasser 20 Mo",
      });
    });

    it("should return 403 for unauthorized access", async () => {
      const req = createMockReq(mockParams, mockBody);
      const res = createMockRes();

      vi.spyOn(mockFilesService, 'createProjectFile').mockRejectedValue(
        new Error("Projet non trouvé ou accès non autorisé")
      );

      await createProjectFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Accès refusé",
        message: "Projet non trouvé ou accès non autorisé",
      });
    });

    it("should return 500 for unexpected errors", async () => {
      const req = createMockReq(mockParams, mockBody);
      const res = createMockRes();

      vi.spyOn(mockFilesService, 'createProjectFile').mockRejectedValue(
        new Error("Unexpected error")
      );

      await createProjectFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erreur interne du serveur",
        message: "Impossible de créer le fichier",
      });
    });
  });

  describe("getProjectFiles", () => {
    const mockParams = { id: "550e8400-e29b-41d4-a716-446655440001" };

    it("should get project files successfully", async () => {
      const req = createMockReq(mockParams);
      const res = createMockRes();

      const mockFiles = [
        {
          id: "file-1",
          filename: "test.pdf",
          mimeType: "application/pdf",
          size: 1024,
          url: "https://bucket.s3.region.amazonaws.com/test.pdf",
          type: "DOCUMENT" as const,
          commandeId: "550e8400-e29b-41d4-a716-446655440001",
          uploadedAt: "2023-12-01T10:00:00Z",
        },
      ];

      mockFilesService.getProjectFiles.mockResolvedValue(mockFiles);

      await getProjectFiles(req as Request, res as Response);

      expect(mockFilesService.getProjectFiles).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440000"
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        files: mockFiles,
        count: 1,
      });
    });

    it("should return 401 if user is not authenticated", async () => {
      const req = createMockReq(mockParams, {}, null);
      const res = createMockRes();

      await getProjectFiles(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentification requise",
        message: "Utilisateur non authentifié",
      });
    });

    it("should return 403 for unauthorized access", async () => {
      const req = createMockReq(mockParams);
      const res = createMockRes();

      vi.spyOn(mockFilesService, 'getProjectFiles').mockRejectedValue(
        new Error("Projet non trouvé ou accès non autorisé")
      );

      await getProjectFiles(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Accès refusé",
        message: "Projet non trouvé ou accès non autorisé",
      });
    });
  });

  describe("deleteProjectFile", () => {
    const mockParams = { id: "550e8400-e29b-41d4-a716-446655440001", fileId: "550e8400-e29b-41d4-a716-446655440002" };

    it("should delete project file successfully", async () => {
      const req = createMockReq(mockParams);
      const res = createMockRes();

      mockFilesService.deleteProjectFile.mockResolvedValue();

      await deleteProjectFile(req as Request, res as Response);

      expect(mockFilesService.deleteProjectFile).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440002",
        "550e8400-e29b-41d4-a716-446655440000"
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Fichier supprimé avec succès",
      });
    });

    it("should return 401 if user is not authenticated", async () => {
      const req = createMockReq(mockParams, {}, null);
      const res = createMockRes();

      await deleteProjectFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentification requise",
        message: "Utilisateur non authentifié",
      });
    });

    it("should return 400 for invalid UUIDs", async () => {
      const req = createMockReq({ id: "invalid-uuid", fileId: "also-invalid" });
      const res = createMockRes();

      await deleteProjectFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Paramètres invalides",
        message: expect.any(String),
        details: expect.any(Array),
      });
    });

    it("should return 403 for unauthorized access", async () => {
      const req = createMockReq(mockParams);
      const res = createMockRes();

      vi.spyOn(mockFilesService, 'deleteProjectFile').mockRejectedValue(
        new Error("Fichier non trouvé ou accès non autorisé")
      );

      await deleteProjectFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Accès refusé",
        message: "Fichier non trouvé ou accès non autorisé",
      });
    });

    it("should return 500 for unexpected errors", async () => {
      const req = createMockReq(mockParams);
      const res = createMockRes();

      vi.spyOn(mockFilesService, 'deleteProjectFile').mockRejectedValue(
        new Error("Unexpected error")
      );

      await deleteProjectFile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erreur interne du serveur",
        message: "Impossible de supprimer le fichier",
      });
    });
  });
});
