import { S3InvoiceService } from "../../services/s3InvoiceService";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

// Mock AWS SDK
jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");

const mockS3Client = S3Client as jest.MockedClass<typeof S3Client>;
const mockPutObjectCommand = PutObjectCommand as jest.MockedClass<typeof PutObjectCommand>;
const mockGetObjectCommand = GetObjectCommand as jest.MockedClass<typeof GetObjectCommand>;
const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

describe("S3InvoiceService", () => {
  const originalEnv = process.env;
  const mockInvoiceId = "test-invoice-id";
  const mockInvoiceNumber = "FACT-2025-001";
  const mockPdfBuffer = Buffer.from("PDF content");

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env = {
      ...originalEnv,
      AWS_ACCESS_KEY_ID: "test-access-key",
      AWS_SECRET_ACCESS_KEY: "test-secret-key",
      AWS_S3_BUCKET: "test-bucket",
      AWS_REGION: "eu-west-3"
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("uploadInvoicePdf", () => {
    it("should upload PDF to S3 successfully", async () => {
      // Arrange
      const mockSend = jest.fn().mockResolvedValue({});
      mockS3Client.prototype.send = mockSend;

      // Act
      const result = await S3InvoiceService.uploadInvoicePdf(
        mockPdfBuffer, 
        mockInvoiceId, 
        mockInvoiceNumber
      );

      // Assert
      expect(result).toBe("https://test-bucket.s3.eu-west-3.amazonaws.com/invoices/test-invoice-id.pdf");
      expect(mockSend).toHaveBeenCalledTimes(1);
      
      const putCommand = mockSend.mock.calls[0][0];
      expect(putCommand.input).toMatchObject({
        Bucket: "test-bucket",
        Key: "invoices/test-invoice-id.pdf",
        ContentType: "application/pdf",
        ContentDisposition: `attachment; filename="Facture_${mockInvoiceNumber}.pdf"`,
        ACL: "private"
      });
    });

    it("should return mock URL when S3 is not configured", async () => {
      // Arrange
      delete process.env.AWS_ACCESS_KEY_ID;

      // Act
      const result = await S3InvoiceService.uploadInvoicePdf(
        mockPdfBuffer, 
        mockInvoiceId, 
        mockInvoiceNumber
      );

      // Assert
      expect(result).toBe("https://mock-s3.amazonaws.com/invoices/test-invoice-id.pdf");
    });

    it("should throw error when S3 upload fails", async () => {
      // Arrange
      const mockError = new Error("S3 upload failed");
      const mockSend = jest.fn().mockRejectedValue(mockError);
      mockS3Client.prototype.send = mockSend;

      // Act & Assert
      await expect(S3InvoiceService.uploadInvoicePdf(
        mockPdfBuffer, 
        mockInvoiceId, 
        mockInvoiceNumber
      )).rejects.toThrow("Échec de l'upload S3: Error: S3 upload failed");
    });

    it("should include correct metadata in upload", async () => {
      // Arrange
      const mockSend = jest.fn().mockResolvedValue({});
      mockS3Client.prototype.send = mockSend;

      // Act
      await S3InvoiceService.uploadInvoicePdf(
        mockPdfBuffer, 
        mockInvoiceId, 
        mockInvoiceNumber
      );

      // Assert
      const putCommand = mockSend.mock.calls[0][0];
      expect(putCommand.input).toMatchObject({
        Metadata: {
          "invoice-id": mockInvoiceId,
          "invoice-number": mockInvoiceNumber,
          "generated-at": expect.any(String)
        }
      });
    });
  });

  describe("generateSignedUrl", () => {
    it("should generate signed URL successfully", async () => {
      // Arrange
      const mockSignedUrl = "https://test-bucket.s3.amazonaws.com/invoices/test-invoice-id.pdf?signature=abc123";
      mockGetSignedUrl.mockResolvedValue(mockSignedUrl);

      // Act
      const result = await S3InvoiceService.generateSignedUrl(mockInvoiceId, mockInvoiceNumber);

      // Assert
      expect(result).toBe(mockSignedUrl);
      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
      
      const [client, command, options] = mockGetSignedUrl.mock.calls[0];
      expect(command.input).toMatchObject({
        Bucket: "test-bucket",
        Key: "invoices/test-invoice-id.pdf",
        ResponseContentDisposition: `attachment; filename="Facture_${mockInvoiceNumber}.pdf"`
      });
      expect(options?.expiresIn).toBe(7 * 24 * 60 * 60); // 7 jours
    });

    it("should return mock URL when S3 is not configured", async () => {
      // Arrange
      delete process.env.AWS_ACCESS_KEY_ID;

      // Act
      const result = await S3InvoiceService.generateSignedUrl(mockInvoiceId, mockInvoiceNumber);

      // Assert
      expect(result).toBe("https://mock-s3.amazonaws.com/invoices/test-invoice-id.pdf?signed=true&expires=7days");
    });

    it("should throw error when signed URL generation fails", async () => {
      // Arrange
      const mockError = new Error("Signed URL generation failed");
      mockGetSignedUrl.mockRejectedValue(mockError);

      // Act & Assert
      await expect(S3InvoiceService.generateSignedUrl(mockInvoiceId, mockInvoiceNumber))
        .rejects.toThrow("Échec de la génération d'URL signée: Error: Signed URL generation failed");
    });
  });

  describe("downloadInvoicePdf", () => {
    it("should download PDF from S3 successfully", async () => {
      // Arrange
      const mockBody = new Readable();
      mockBody.push("PDF content");
      mockBody.push(null);
      
      const mockSend = jest.fn().mockResolvedValue({ Body: mockBody });
      mockS3Client.prototype.send = mockSend;

      // Act
      const result = await S3InvoiceService.downloadInvoicePdf(mockInvoiceId);

      // Assert
      expect(result).toBe(mockBody);
      expect(mockSend).toHaveBeenCalledTimes(1);
      
      const getCommand = mockSend.mock.calls[0][0];
      expect(getCommand.input).toMatchObject({
        Bucket: "test-bucket",
        Key: "invoices/test-invoice-id.pdf"
      });
    });

    it("should return mock stream when S3 is not configured", async () => {
      // Arrange
      delete process.env.AWS_ACCESS_KEY_ID;

      // Act
      const result = await S3InvoiceService.downloadInvoicePdf(mockInvoiceId);

      // Assert
      expect(result).toBeInstanceOf(Readable);
    });

    it("should throw error when file not found", async () => {
      // Arrange
      const mockSend = jest.fn().mockResolvedValue({ Body: null });
      mockS3Client.prototype.send = mockSend;

      // Act & Assert
      await expect(S3InvoiceService.downloadInvoicePdf(mockInvoiceId))
        .rejects.toThrow("Échec du téléchargement S3: Error: Fichier PDF introuvable");
    });

    it("should throw error when S3 download fails", async () => {
      // Arrange
      const mockError = new Error("S3 download failed");
      const mockSend = jest.fn().mockRejectedValue(mockError);
      mockS3Client.prototype.send = mockSend;

      // Act & Assert
      await expect(S3InvoiceService.downloadInvoicePdf(mockInvoiceId))
        .rejects.toThrow("Échec du téléchargement S3: Error: S3 download failed");
    });
  });

  describe("invoiceExists", () => {
    it("should return true when invoice exists", async () => {
      // Arrange
      const mockSend = jest.fn().mockResolvedValue({});
      mockS3Client.prototype.send = mockSend;

      // Act
      const result = await S3InvoiceService.invoiceExists(mockInvoiceId);

      // Assert
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should return false when invoice does not exist", async () => {
      // Arrange
      const noSuchKeyError = new Error("NoSuchKey");
      noSuchKeyError.name = "NoSuchKey";
      const mockSend = jest.fn().mockRejectedValue(noSuchKeyError);
      mockS3Client.prototype.send = mockSend;

      // Act
      const result = await S3InvoiceService.invoiceExists(mockInvoiceId);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true when S3 is not configured", async () => {
      // Arrange
      delete process.env.AWS_ACCESS_KEY_ID;

      // Act
      const result = await S3InvoiceService.invoiceExists(mockInvoiceId);

      // Assert
      expect(result).toBe(true);
    });

    it("should throw error for other S3 errors", async () => {
      // Arrange
      const mockError = new Error("Access denied");
      mockError.name = "AccessDenied";
      const mockSend = jest.fn().mockRejectedValue(mockError);
      mockS3Client.prototype.send = mockSend;

      // Act & Assert
      await expect(S3InvoiceService.invoiceExists(mockInvoiceId))
        .rejects.toThrow("Access denied");
    });
  });

  describe("S3 Client initialization", () => {
    it("should not initialize S3 client when environment variables are missing", async () => {
      // Arrange
      delete process.env.AWS_ACCESS_KEY_ID;

      // Act
      const result = await S3InvoiceService.uploadInvoicePdf(
        mockPdfBuffer, 
        mockInvoiceId, 
        mockInvoiceNumber
      );

      // Assert
      expect(result).toContain("mock-s3.amazonaws.com");
    });

    it("should initialize S3 client with correct configuration", async () => {
      // Arrange
      const mockSend = jest.fn().mockResolvedValue({});
      mockS3Client.prototype.send = mockSend;

      // Act
      await S3InvoiceService.uploadInvoicePdf(
        mockPdfBuffer, 
        mockInvoiceId, 
        mockInvoiceNumber
      );

      // Assert
      expect(mockS3Client).toHaveBeenCalledWith({
        region: "eu-west-3",
        credentials: {
          accessKeyId: "test-access-key",
          secretAccessKey: "test-secret-key",
        },
      });
    });
  });
});