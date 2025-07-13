import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectFileModel } from "../../models/projectFileModel";
import { FilesService } from "../../services/filesService";

// Mock AWS SDK
vi.mock("@aws-sdk/client-s3");
vi.mock("@aws-sdk/s3-request-presigner");

// Mock ProjectFileModel
vi.mock("../../models/projectFileModel");

const mockProjectFileModel = vi.mocked(ProjectFileModel);
const mockS3Client = vi.mocked(S3Client);
const mockGetSignedUrl = vi.mocked(getSignedUrl);

describe("FilesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_S3_BUCKET;
    delete process.env.AWS_REGION;
    
    // Reset the static s3Client to ensure clean state between tests
    (FilesService as any).s3Client = null;
  });

  describe("createProjectFile", () => {
    const mockCommandeId = "commande-123";
    const mockUserId = "user-123";
    const mockFileInput = {
      name: "test-document.pdf",
      size: 1024 * 1024, // 1MB
      mime: "application/pdf",
    };

    it("should create project file with S3 presigned URL when AWS is configured", async () => {
      // Set up AWS environment
      process.env.AWS_ACCESS_KEY_ID = "test-key";
      process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
      process.env.AWS_S3_BUCKET = "test-bucket";
      process.env.AWS_REGION = "eu-west-3";

      const mockModelResult = {
        uploadUrl: "http://localhost:3001/api/upload/simulate/file-123",
        fields: {
          key: "project-commande-123-1234567890-abcdef.pdf",
          bucket: "test-bucket",
          "Content-Type": "application/pdf",
        },
        fileId: "file-123",
      };

      mockProjectFileModel.createFile.mockResolvedValue(mockModelResult);

      // Mock S3 client and signed URL
      const mockS3Instance = {};
      mockS3Client.mockImplementation(() => mockS3Instance as any);
      mockGetSignedUrl.mockResolvedValue(
        "https://test-bucket.s3.eu-west-3.amazonaws.com/presigned-url"
      );

      const result = await FilesService.createProjectFile(
        mockCommandeId,
        mockUserId,
        mockFileInput
      );

      expect(result).toEqual({
        uploadUrl:
          "https://test-bucket.s3.eu-west-3.amazonaws.com/presigned-url",
        fields: {
          key: "project-commande-123-1234567890-abcdef.pdf",
          bucket: "test-bucket",
          "Content-Type": "application/pdf",
        },
        fileId: "file-123",
      });

      expect(mockProjectFileModel.createFile).toHaveBeenCalledWith(
        mockCommandeId,
        mockUserId,
        mockFileInput
      );

      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        mockS3Instance,
        expect.any(PutObjectCommand),
        { expiresIn: 3600 }
      );
    });

    it("should create project file with simulation URL when AWS is not configured", async () => {
      const mockModelResult = {
        uploadUrl: "https://test-bucket.s3.eu-west-3.amazonaws.com/presigned-url",
        fields: {
          key: "project-commande-123-1234567890-abcdef.pdf",
          bucket: "staka-livres-files",
          "Content-Type": "application/pdf",
        },
        fileId: "file-123",
      };

      mockProjectFileModel.createFile.mockResolvedValue(mockModelResult);

      const result = await FilesService.createProjectFile(
        mockCommandeId,
        mockUserId,
        mockFileInput
      );

      // When AWS is not configured, expect simulation URL
      expect(result).toEqual({
        uploadUrl: "http://localhost:3001/api/upload/simulate/file-123",
        fields: mockModelResult.fields,
        fileId: "file-123",
      });

      expect(mockS3Client).not.toHaveBeenCalled();
      expect(mockGetSignedUrl).not.toHaveBeenCalled();
    });

    it("should validate file size limit", async () => {
      const largeFileInput = {
        name: "large-file.pdf",
        size: 25 * 1024 * 1024, // 25MB
        mime: "application/pdf",
      };

      await expect(
        FilesService.createProjectFile(
          mockCommandeId,
          mockUserId,
          largeFileInput
        )
      ).rejects.toThrow("La taille du fichier ne peut pas dépasser 20 Mo");
    });

    it("should validate required parameters", async () => {
      await expect(
        FilesService.createProjectFile("", mockUserId, mockFileInput)
      ).rejects.toThrow("commandeId est requis");

      await expect(
        FilesService.createProjectFile(mockCommandeId, "", mockFileInput)
      ).rejects.toThrow("userId est requis");

      await expect(
        FilesService.createProjectFile(mockCommandeId, mockUserId, {
          name: "",
          size: 1024,
          mime: "application/pdf",
        })
      ).rejects.toThrow("name, size et mime sont requis");
    });

    it("should handle errors from ProjectFileModel", async () => {
      mockProjectFileModel.createFile.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        FilesService.createProjectFile(
          mockCommandeId,
          mockUserId,
          mockFileInput
        )
      ).rejects.toThrow("Database error");
    });
  });

  describe("getProjectFiles", () => {
    const mockCommandeId = "commande-123";
    const mockUserId = "user-123";

    it("should return project files", async () => {
      const mockFiles = [
        {
          id: "file-1",
          filename: "test.pdf",
          mimeType: "application/pdf",
          size: 1024,
          url: "https://bucket.s3.region.amazonaws.com/test.pdf",
          type: "DOCUMENT" as const,
          commandeId: mockCommandeId,
          uploadedAt: "2023-12-01T10:00:00Z",
        },
      ];

      mockProjectFileModel.getProjectFiles.mockResolvedValue(mockFiles);

      const result = await FilesService.getProjectFiles(
        mockCommandeId,
        mockUserId
      );

      expect(result).toEqual(mockFiles);
      expect(mockProjectFileModel.getProjectFiles).toHaveBeenCalledWith(
        mockCommandeId,
        mockUserId
      );
    });

    it("should validate required parameters", async () => {
      await expect(
        FilesService.getProjectFiles("", mockUserId)
      ).rejects.toThrow("commandeId est requis");

      await expect(
        FilesService.getProjectFiles(mockCommandeId, "")
      ).rejects.toThrow("userId est requis");
    });

    it("should handle errors from ProjectFileModel", async () => {
      mockProjectFileModel.getProjectFiles.mockRejectedValue(
        new Error("Access denied")
      );

      await expect(
        FilesService.getProjectFiles(mockCommandeId, mockUserId)
      ).rejects.toThrow("Access denied");
    });
  });

  describe("deleteProjectFile", () => {
    const mockCommandeId = "commande-123";
    const mockFileId = "file-123";
    const mockUserId = "user-123";

    it("should delete project file successfully", async () => {
      mockProjectFileModel.deleteFile.mockResolvedValue();

      await expect(
        FilesService.deleteProjectFile(mockCommandeId, mockFileId, mockUserId)
      ).resolves.not.toThrow();

      expect(mockProjectFileModel.deleteFile).toHaveBeenCalledWith(
        mockCommandeId,
        mockFileId,
        mockUserId
      );
    });

    it("should validate required parameters", async () => {
      await expect(
        FilesService.deleteProjectFile("", mockFileId, mockUserId)
      ).rejects.toThrow("commandeId est requis");

      await expect(
        FilesService.deleteProjectFile(mockCommandeId, "", mockUserId)
      ).rejects.toThrow("fileId est requis");

      await expect(
        FilesService.deleteProjectFile(mockCommandeId, mockFileId, "")
      ).rejects.toThrow("userId est requis");
    });

    it("should handle errors from ProjectFileModel", async () => {
      mockProjectFileModel.deleteFile.mockRejectedValue(
        new Error("File not found")
      );

      await expect(
        FilesService.deleteProjectFile(mockCommandeId, mockFileId, mockUserId)
      ).rejects.toThrow("File not found");
    });
  });
});
