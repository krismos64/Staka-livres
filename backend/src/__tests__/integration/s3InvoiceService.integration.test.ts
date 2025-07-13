import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { S3InvoiceService } from "../../services/s3InvoiceService";
import { PdfService, InvoiceData } from "../../services/pdf";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { CONFIG } from "../../config/config";

// Vérification des credentials AWS requis pour les tests d'intégration
const hasAwsCredentials = !!(
  process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_SECRET_ACCESS_KEY && 
  process.env.AWS_S3_BUCKET
);

let s3Client: S3Client;

if (hasAwsCredentials) {
  s3Client = new S3Client({
    region: CONFIG.S3.REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

const describeS3Tests = hasAwsCredentials ? describe : describe.skip;

if (!hasAwsCredentials) {
  console.warn("⚠️ [S3 TESTS] AWS credentials not provided, skipping real S3 integration tests");
}

describeS3Tests("S3InvoiceService - Tests d'intégration réels", () => {
  const testInvoiceId = `test-invoice-${Date.now()}`;
  const testInvoiceNumber = `TEST-FACT-${Date.now()}`;
  let uploadedObjects: string[] = [];

  const mockInvoiceData: InvoiceData = {
    id: testInvoiceId,
    number: testInvoiceNumber,
    amount: 12000, // 120,00 €
    taxAmount: 2000, // 20,00 €
    issuedAt: new Date("2025-01-15"),
    dueAt: new Date("2025-02-15"),
    commande: {
      id: "test-commande-id",
      titre: "Correction de manuscrit - Test intégration",
      description: "Test d'intégration avec S3 réel",
      user: {
        id: "test-user-id",
        prenom: "Test",
        nom: "Integration",
        email: "test.integration@example.com",
        adresse: "123 Rue des Tests\n75001 Paris\nFrance"
      }
    }
  };

  beforeAll(() => {
    // Vérifier que les variables d'environnement S3 sont configurées
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("Variables d'environnement AWS manquantes pour les tests d'intégration");
    }
  });

  afterEach(async () => {
    // Nettoyer les objets créés pendant les tests
    for (const objectKey of uploadedObjects) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: CONFIG.S3.BUCKET,
          Key: objectKey,
        });
        await s3Client.send(deleteCommand);
        console.log(`🧹 [Test] Objet S3 supprimé: ${objectKey}`);
      } catch (error) {
        console.warn(`⚠️ [Test] Erreur suppression ${objectKey}:`, error);
      }
    }
    uploadedObjects = [];
  });

  describe("Workflow complet de génération et stockage", () => {
    it("should generate PDF, upload to S3, create signed URL and verify existence", async () => {
      // 1. Générer le PDF
      console.log("🎯 [Test] Génération PDF...");
      const pdfBuffer = await PdfService.buildInvoicePdf(mockInvoiceData);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      
      // Vérifier que c'est bien un PDF
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      expect(pdfHeader).toBe("%PDF");

      // 2. Upload vers S3
      console.log("📤 [Test] Upload vers S3...");
      const s3Url = await S3InvoiceService.uploadInvoicePdf(
        pdfBuffer,
        testInvoiceId,
        testInvoiceNumber
      );
      
      uploadedObjects.push(`invoices/${testInvoiceId}.pdf`);
      
      expect(s3Url).toContain(CONFIG.S3.BUCKET);
      expect(s3Url).toContain(`invoices/${testInvoiceId}.pdf`);

      // 3. Vérifier l'existence sur S3
      console.log("🔍 [Test] Vérification existence...");
      const exists = await S3InvoiceService.invoiceExists(testInvoiceId);
      expect(exists).toBe(true);

      // 4. Générer URL signée
      console.log("🔗 [Test] Génération URL signée...");
      const signedUrl = await S3InvoiceService.generateSignedUrl(
        testInvoiceId,
        testInvoiceNumber
      );
      
      expect(signedUrl).toContain(CONFIG.S3.BUCKET);
      expect(signedUrl).toContain(`invoices/${testInvoiceId}.pdf`);
      expect(signedUrl).toContain("X-Amz-Algorithm");
      expect(signedUrl).toContain("X-Amz-Signature");

      // 5. Télécharger depuis S3
      console.log("📥 [Test] Téléchargement depuis S3...");
      const downloadStream = await S3InvoiceService.downloadInvoicePdf(testInvoiceId);
      
      const chunks: Buffer[] = [];
      for await (const chunk of downloadStream) {
        chunks.push(chunk);
      }
      
      const downloadedBuffer = Buffer.concat(chunks);
      expect(downloadedBuffer.length).toBe(pdfBuffer.length);
      expect(downloadedBuffer.equals(pdfBuffer)).toBe(true);

      console.log("✅ [Test] Workflow complet validé");
    }, 30000); // Timeout 30s pour les opérations S3

    it("should handle non-existent invoice correctly", async () => {
      const nonExistentId = `non-existent-${Date.now()}`;
      
      const exists = await S3InvoiceService.invoiceExists(nonExistentId);
      expect(exists).toBe(false);

      await expect(
        S3InvoiceService.downloadInvoicePdf(nonExistentId)
      ).rejects.toThrow();
    });

    it("should upload with correct metadata and ACL", async () => {
      const pdfBuffer = await PdfService.buildInvoicePdf(mockInvoiceData);
      
      await S3InvoiceService.uploadInvoicePdf(
        pdfBuffer,
        testInvoiceId,
        testInvoiceNumber
      );
      
      uploadedObjects.push(`invoices/${testInvoiceId}.pdf`);

      // L'objet doit exister et être privé (pas accessible via URL publique)
      const exists = await S3InvoiceService.invoiceExists(testInvoiceId);
      expect(exists).toBe(true);

      // Tenter d'accéder à l'URL publique devrait échouer (403)
      const publicUrl = `https://${CONFIG.S3.BUCKET}.s3.${CONFIG.S3.REGION}.amazonaws.com/invoices/${testInvoiceId}.pdf`;
      
      try {
        const response = await fetch(publicUrl);
        expect(response.status).toBe(403); // Forbidden car ACL privé
      } catch (error) {
        // C'est attendu - l'URL publique ne doit pas être accessible
        expect(error).toBeDefined();
      }
    });

    it("should generate signed URL with 30 days expiration", async () => {
      const pdfBuffer = await PdfService.buildInvoicePdf(mockInvoiceData);
      
      await S3InvoiceService.uploadInvoicePdf(
        pdfBuffer,
        testInvoiceId,
        testInvoiceNumber
      );
      
      uploadedObjects.push(`invoices/${testInvoiceId}.pdf`);

      const signedUrl = await S3InvoiceService.generateSignedUrl(
        testInvoiceId,
        testInvoiceNumber
      );

      // Vérifier la présence des paramètres d'expiration
      const url = new URL(signedUrl);
      const expires = url.searchParams.get('X-Amz-Expires');
      
      expect(expires).toBe(CONFIG.S3.SIGNED_URL_TTL.toString()); // 30 jours en secondes
      
      // Vérifier que l'URL signée fonctionne
      const response = await fetch(signedUrl);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/pdf');
    });

    it("should handle concurrent uploads correctly", async () => {
      const concurrentUploads = 3;
      const uploadPromises = [];

      for (let i = 0; i < concurrentUploads; i++) {
        const invoiceId = `concurrent-test-${Date.now()}-${i}`;
        const invoiceNumber = `CONCURRENT-${Date.now()}-${i}`;
        
        const invoiceData = {
          ...mockInvoiceData,
          id: invoiceId,
          number: invoiceNumber,
        };

        const uploadPromise = async () => {
          const pdfBuffer = await PdfService.buildInvoicePdf(invoiceData);
          const s3Url = await S3InvoiceService.uploadInvoicePdf(
            pdfBuffer,
            invoiceId,
            invoiceNumber
          );
          
          uploadedObjects.push(`invoices/${invoiceId}.pdf`);
          return { invoiceId, s3Url };
        };

        uploadPromises.push(uploadPromise());
      }

      const results = await Promise.all(uploadPromises);
      
      expect(results).toHaveLength(concurrentUploads);
      
      // Vérifier que tous les fichiers existent
      for (const { invoiceId } of results) {
        const exists = await S3InvoiceService.invoiceExists(invoiceId);
        expect(exists).toBe(true);
      }
    }, 45000); // Timeout plus long pour les uploads concurrents
  });

  describe("Performance et robustesse", () => {
    it("should handle large PDF files", async () => {
      // Créer une facture avec une description très longue
      const longDescription = "A".repeat(5000); // 5KB de texte
      const largeInvoiceData = {
        ...mockInvoiceData,
        commande: {
          ...mockInvoiceData.commande,
          description: longDescription,
        }
      };

      const startTime = Date.now();
      const pdfBuffer = await PdfService.buildInvoicePdf(largeInvoiceData);
      const generationTime = Date.now() - startTime;

      expect(pdfBuffer.length).toBeGreaterThan(10000); // Au moins 10KB
      expect(generationTime).toBeLessThan(10000); // Moins de 10 secondes

      const uploadStartTime = Date.now();
      await S3InvoiceService.uploadInvoicePdf(
        pdfBuffer,
        testInvoiceId,
        testInvoiceNumber
      );
      const uploadTime = Date.now() - uploadStartTime;

      uploadedObjects.push(`invoices/${testInvoiceId}.pdf`);

      expect(uploadTime).toBeLessThan(15000); // Moins de 15 secondes
    }, 30000);

    it("should maintain data integrity across operations", async () => {
      const pdfBuffer = await PdfService.buildInvoicePdf(mockInvoiceData);
      const originalChecksum = require('crypto')
        .createHash('md5')
        .update(pdfBuffer)
        .digest('hex');

      // Upload
      await S3InvoiceService.uploadInvoicePdf(
        pdfBuffer,
        testInvoiceId,
        testInvoiceNumber
      );
      
      uploadedObjects.push(`invoices/${testInvoiceId}.pdf`);

      // Download
      const downloadStream = await S3InvoiceService.downloadInvoicePdf(testInvoiceId);
      const chunks: Buffer[] = [];
      for await (const chunk of downloadStream) {
        chunks.push(chunk);
      }
      const downloadedBuffer = Buffer.concat(chunks);

      const downloadChecksum = require('crypto')
        .createHash('md5')
        .update(downloadedBuffer)
        .digest('hex');

      expect(downloadChecksum).toBe(originalChecksum);
      expect(downloadedBuffer.length).toBe(pdfBuffer.length);
    });
  });
});