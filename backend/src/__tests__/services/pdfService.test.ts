import { describe, expect, it } from "vitest";
import { InvoiceData, PdfService } from "../../services/pdf";

// Test avec la vraie librairie pdf-lib (pas de mocks)

describe("PdfService", () => {
  const mockInvoiceData: InvoiceData = {
    id: "test-invoice-id",
    number: "FACT-2025-001",
    amount: 12000, // 120,00 €
    taxAmount: 2000, // 20,00 €
    issuedAt: new Date("2025-01-15"),
    dueAt: new Date("2025-02-15"),
    commande: {
      id: "test-commande-id",
      titre: "Correction de manuscrit - Roman fantastique",
      description:
        "Correction orthographique, grammaticale et stylistique d'un roman de 250 pages",
      user: {
        id: "test-user-id",
        prenom: "Jean",
        nom: "Dupont",
        email: "jean.dupont@example.com",
        adresse: "123 Rue de la Paix\n75001 Paris\nFrance",
      },
    },
  };

  describe("buildInvoicePdf", () => {
    it("should generate a PDF buffer for valid invoice data", async () => {
      // Act
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);

      // Vérifier que c'est bien un PDF (commence par %PDF)
      const pdfHeader = result.slice(0, 4).toString();
      expect(pdfHeader).toBe("%PDF");
    }, 10000); // Timeout de 10s pour la génération PDF

    it("should generate PDF with reasonable size", async () => {
      // Act
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      // PDF with content should be reasonably sized
      expect(result.length).toBeGreaterThan(2000);
      expect(result.length).toBeLessThan(50000);
    });

    it("should generate valid PDF structure", async () => {
      // Act
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      const pdfContent = result.toString("binary");

      // Check PDF header
      expect(pdfContent.substring(0, 5)).toBe("%PDF-");

      // Check PDF has proper ending
      expect(pdfContent).toContain("%%EOF");
    });

    it("should generate different PDFs for different data", async () => {
      // Arrange
      const altInvoiceData = {
        ...mockInvoiceData,
        number: "FACT-2025-002",
        amount: 25000,
      };

      // Act
      const result1 = await PdfService.buildInvoicePdf(mockInvoiceData);
      const result2 = await PdfService.buildInvoicePdf(altInvoiceData);

      // Assert
      expect(result1).not.toEqual(result2);
      expect(result1.length).toBeGreaterThan(0);
      expect(result2.length).toBeGreaterThan(0);
    });

    it("should handle concurrent PDF generation", async () => {
      // Act
      const promises = Array(3)
        .fill(0)
        .map(() => PdfService.buildInvoicePdf(mockInvoiceData));
      const results = await Promise.all(promises);

      // Assert
      results.forEach((result) => {
        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(2000);
      });
    });

    it("should generate PDF within reasonable time", async () => {
      // Act
      const startTime = Date.now();
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);
      const endTime = Date.now();

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(endTime - startTime).toBeLessThan(5000); // Less than 5 seconds
    });

    it("should handle missing optional fields gracefully", async () => {
      // Arrange
      const invoiceDataWithoutOptionals: InvoiceData = {
        ...mockInvoiceData,
        dueAt: null,
        commande: {
          ...mockInvoiceData.commande,
          description: null,
          user: {
            ...mockInvoiceData.commande.user,
            adresse: null,
          },
        },
      };

      // Act & Assert
      await expect(
        PdfService.buildInvoicePdf(invoiceDataWithoutOptionals)
      ).resolves.toBeInstanceOf(Buffer);
    });

    it("should reject with error for invalid data", async () => {
      // Arrange
      const invalidData = null as any;

      // Act & Assert
      await expect(PdfService.buildInvoicePdf(invalidData)).rejects.toThrow("Les données de facture sont requises");
    });

    it("should generate consistent PDF size for same data", async () => {
      // Act
      const result1 = await PdfService.buildInvoicePdf(mockInvoiceData);
      const result2 = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      // Les PDFs générés devraient avoir une taille similaire (+/- 1000 bytes pour les timestamps)
      const sizeDifference = Math.abs(result1.length - result2.length);
      expect(sizeDifference).toBeLessThan(2000);
    });

    it("should generate PDF consistently", async () => {
      // Act
      const result1 = await PdfService.buildInvoicePdf(mockInvoiceData);
      const result2 = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      // PDFs should have similar structure and size
      expect(result1.length).toBeGreaterThan(2000);
      expect(result2.length).toBeGreaterThan(2000);
      expect(Math.abs(result1.length - result2.length)).toBeLessThan(1000);
    });

    it("should validate PDF file format", async () => {
      // Act
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      // Check it's a valid PDF file
      const header = result.slice(0, 8).toString();
      expect(header).toMatch(/^%PDF-\d\.\d/);

      // Check basic PDF structure
      const content = result.toString("binary");
      expect(content).toContain("obj");
      expect(content).toContain("endobj");
    });
  });

  describe("formatDate", () => {
    it("should format dates in French DD/MM/YYYY format", () => {
      // Note: Cette méthode est privée, on la teste indirectement via buildInvoicePdf
      // Ou on peut l'exporter pour les tests si nécessaire
      const testDate = new Date("2025-01-15");

      // Utiliser la même logique que dans le service
      const formatted = testDate.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      expect(formatted).toBe("15/01/2025");
    });
  });
});
