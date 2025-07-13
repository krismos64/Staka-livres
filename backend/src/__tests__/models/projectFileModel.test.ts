import { FileType, PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ProjectFileInput,
  ProjectFileModel,
} from "../../models/projectFileModel";

// Mock Prisma Client
vi.mock("@prisma/client", async (importOriginal) => ({
  ...(await importOriginal()),
  PrismaClient: vi.fn(),
  FileType: {
    IMAGE: "IMAGE",
    DOCUMENT: "DOCUMENT",
    ARCHIVE: "ARCHIVE",
  },
}));

const mockPrismaClient = {
  commande: {
    findFirst: vi.fn(),
  },
  file: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
  },
} as any;

vi.mocked(PrismaClient).mockImplementation(() => mockPrismaClient);

describe("ProjectFileModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createFile", () => {
    const mockCommandeId = "commande-123";
    const mockUserId = "user-123";
    const mockFileInput: ProjectFileInput = {
      name: "test-document.pdf",
      size: 1024 * 1024, // 1MB
      mime: "application/pdf",
    };

    it("should create a file successfully", async () => {
      // Mock commande exists and belongs to user
      mockPrismaClient.commande.findFirst.mockResolvedValue({
        id: mockCommandeId,
        userId: mockUserId,
        titre: "Test Project",
        description: null,
        fichierUrl: null,
        statut: "EN_ATTENTE",
        noteClient: null,
        noteCorrecteur: null,
        paymentStatus: null,
        stripeSessionId: null,
        amount: null,
        dateEcheance: null,
        dateFinition: null,
        priorite: "NORMALE",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Mock file creation
      const mockFile = {
        id: "file-123",
        filename: mockFileInput.name,
        storedName: "project-commande-123-1234567890-abcdef.pdf",
        mimeType: mockFileInput.mime,
        size: mockFileInput.size,
        url: "https://bucket.s3.region.amazonaws.com/stored-name.pdf",
        type: FileType.DOCUMENT,
        uploadedById: mockUserId,
        commandeId: mockCommandeId,
        description: "Fichier de projet",
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.file.create.mockResolvedValue(mockFile as any);

      // Set environment variables for test
      process.env.AWS_S3_BUCKET = "test-bucket";
      process.env.AWS_REGION = "eu-west-3";

      const result = await ProjectFileModel.createFile(
        mockCommandeId,
        mockUserId,
        mockFileInput,
        mockPrismaClient
      );

      expect(result).toEqual({
        uploadUrl: "https://test-bucket.s3.eu-west-3.amazonaws.com/",
        fields: {
          key: expect.stringContaining("project-commande-123-"),
          bucket: "test-bucket",
          "Content-Type": "application/pdf",
          "x-amz-meta-original-name": "test-document.pdf",
          "x-amz-meta-user-id": mockUserId,
          "x-amz-meta-project-id": mockCommandeId,
        },
        fileId: "file-123",
      });

      expect(mockPrismaClient.commande.findFirst).toHaveBeenCalledWith({
        where: { id: mockCommandeId, userId: mockUserId },
      });

      expect(mockPrismaClient.file.create).toHaveBeenCalledWith({
        data: {
          filename: mockFileInput.name,
          storedName: expect.stringContaining("project-commande-123-"),
          mimeType: mockFileInput.mime,
          size: mockFileInput.size,
          url: expect.stringContaining(
            "https://test-bucket.s3.eu-west-3.amazonaws.com/"
          ),
          type: FileType.DOCUMENT,
          uploadedById: mockUserId,
          commandeId: mockCommandeId,
          description: "Fichier de projet",
          isPublic: false,
        },
      });
    });

    it("should throw error if file is too large", async () => {
      const largeFileInput: ProjectFileInput = {
        name: "large-file.pdf",
        size: 25 * 1024 * 1024, // 25MB (over 20MB limit)
        mime: "application/pdf",
      };

      await expect(
        ProjectFileModel.createFile(
          mockCommandeId,
          mockUserId,
          largeFileInput,
          mockPrismaClient
        )
      ).rejects.toThrow("La taille du fichier ne peut pas dépasser 20 Mo");
    });

    it("should throw error for unsupported mime type", async () => {
      const unsupportedFileInput: ProjectFileInput = {
        name: "script.js",
        size: 1024,
        mime: "application/javascript",
      };

      await expect(
        ProjectFileModel.createFile(
          mockCommandeId,
          mockUserId,
          unsupportedFileInput,
          mockPrismaClient
        )
      ).rejects.toThrow("Type de fichier non autorisé: application/javascript");
    });

    it("should throw error if user doesn't own the project", async () => {
      mockPrismaClient.commande.findFirst.mockResolvedValue(null);

      await expect(
        ProjectFileModel.createFile(
          mockCommandeId,
          mockUserId,
          mockFileInput,
          mockPrismaClient
        )
      ).rejects.toThrow("Projet non trouvé ou accès non autorisé");
    });

    it("should throw error for missing parameters", async () => {
      await expect(
        ProjectFileModel.createFile(
          "",
          mockUserId,
          mockFileInput,
          mockPrismaClient
        )
      ).rejects.toThrow("commandeId est requis");

      await expect(
        ProjectFileModel.createFile(
          mockCommandeId,
          "",
          mockFileInput,
          mockPrismaClient
        )
      ).rejects.toThrow("userId est requis");

      await expect(
        ProjectFileModel.createFile(
          mockCommandeId,
          mockUserId,
          { name: "", size: 1024, mime: "application/pdf" },
          mockPrismaClient
        )
      ).rejects.toThrow("name, size et mime sont requis");
    });
  });

  describe("getProjectFiles", () => {
    const mockCommandeId = "commande-123";
    const mockUserId = "user-123";

    it("should return project files sorted by creation date desc", async () => {
      // Mock commande exists and belongs to user
      mockPrismaClient.commande.findFirst.mockResolvedValue({
        id: mockCommandeId,
        userId: mockUserId,
      } as any);

      const mockFiles = [
        {
          id: "file-2",
          filename: "newer-file.pdf",
          mimeType: "application/pdf",
          size: 2048,
          url: "https://bucket.s3.region.amazonaws.com/newer-file.pdf",
          type: FileType.DOCUMENT,
          commandeId: mockCommandeId,
          createdAt: new Date("2023-12-02"),
          updatedAt: new Date("2023-12-02"),
        },
        {
          id: "file-1",
          filename: "older-file.pdf",
          mimeType: "application/pdf",
          size: 1024,
          url: "https://bucket.s3.region.amazonaws.com/older-file.pdf",
          type: FileType.DOCUMENT,
          commandeId: mockCommandeId,
          createdAt: new Date("2023-12-01"),
          updatedAt: new Date("2023-12-01"),
        },
      ];

      mockPrismaClient.file.findMany.mockResolvedValue(mockFiles as any);

      const result = await ProjectFileModel.getProjectFiles(
        mockCommandeId,
        mockUserId,
        mockPrismaClient
      );

      expect(result).toHaveLength(2);
      expect(result[0].filename).toBe("newer-file.pdf");
      expect(result[1].filename).toBe("older-file.pdf");

      expect(mockPrismaClient.file.findMany).toHaveBeenCalledWith({
        where: { commandeId: mockCommandeId },
        select: {
          id: true,
          filename: true,
          mimeType: true,
          size: true,
          url: true,
          type: true,
          commandeId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should throw error if user doesn't own the project", async () => {
      mockPrismaClient.commande.findFirst.mockResolvedValue(null);

      await expect(
        ProjectFileModel.getProjectFiles(
          mockCommandeId,
          mockUserId,
          mockPrismaClient
        )
      ).rejects.toThrow("Projet non trouvé ou accès non autorisé");
    });
  });

  describe("deleteFile", () => {
    const mockCommandeId = "commande-123";
    const mockFileId = "file-123";
    const mockUserId = "user-123";

    it("should delete file successfully", async () => {
      // Mock commande exists and belongs to user
      mockPrismaClient.commande.findFirst.mockResolvedValue({
        id: mockCommandeId,
        userId: mockUserId,
      } as any);

      // Mock file exists and belongs to user and project
      mockPrismaClient.file.findFirst.mockResolvedValue({
        id: mockFileId,
        commandeId: mockCommandeId,
        uploadedById: mockUserId,
      } as any);

      mockPrismaClient.file.delete.mockResolvedValue({} as any);

      await expect(
        ProjectFileModel.deleteFile(
          mockCommandeId,
          mockFileId,
          mockUserId,
          mockPrismaClient
        )
      ).resolves.not.toThrow();

      expect(mockPrismaClient.file.delete).toHaveBeenCalledWith({
        where: { id: mockFileId },
      });
    });

    it("should throw error if file doesn't exist or user doesn't have access", async () => {
      mockPrismaClient.commande.findFirst.mockResolvedValue({
        id: mockCommandeId,
        userId: mockUserId,
      } as any);

      mockPrismaClient.file.findFirst.mockResolvedValue(null);

      await expect(
        ProjectFileModel.deleteFile(
          mockCommandeId,
          mockFileId,
          mockUserId,
          mockPrismaClient
        )
      ).rejects.toThrow("Fichier non trouvé ou accès non autorisé");
    });
  });

  describe("utility methods", () => {
    it("should determine correct file type from mime", () => {
      expect(ProjectFileModel["getFileTypeFromMime"]("image/jpeg")).toBe(
        FileType.IMAGE
      );
      expect(ProjectFileModel["getFileTypeFromMime"]("application/zip")).toBe(
        FileType.ARCHIVE
      );
      expect(ProjectFileModel["getFileTypeFromMime"]("application/pdf")).toBe(
        FileType.DOCUMENT
      );
    });

    it("should get correct extension from mime type", () => {
      expect(ProjectFileModel["getExtensionFromMime"]("application/pdf")).toBe(
        ".pdf"
      );
      expect(ProjectFileModel["getExtensionFromMime"]("image/jpeg")).toBe(
        ".jpg"
      );
      expect(ProjectFileModel["getExtensionFromMime"]("application/zip")).toBe(
        ".zip"
      );
    });
  });
});
