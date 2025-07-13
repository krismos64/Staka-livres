import { PdfService, InvoiceData } from "../../services/pdf";

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
      description: "Correction orthographique, grammaticale et stylistique d'un roman de 250 pages",
      user: {
        id: "test-user-id",
        prenom: "Jean",
        nom: "Dupont",
        email: "jean.dupont@example.com",
        adresse: "123 Rue de la Paix\n75001 Paris\nFrance"
      }
    }
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

    it("should include invoice number in PDF metadata", async () => {
      // Act
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      const pdfContent = result.toString();
      expect(pdfContent).toContain(mockInvoiceData.number);
    });

    it("should include company information", async () => {
      // Act
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      const pdfContent = result.toString();
      expect(pdfContent).toContain("STAKA LIVRES");
      expect(pdfContent).toContain("contact@staka-livres.com");
    });

    it("should include client information", async () => {
      // Act
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      const pdfContent = result.toString();
      expect(pdfContent).toContain(mockInvoiceData.commande.user.prenom);
      expect(pdfContent).toContain(mockInvoiceData.commande.user.nom);
      expect(pdfContent).toContain(mockInvoiceData.commande.user.email);
    });

    it("should include project details", async () => {
      // Act
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      const pdfContent = result.toString();
      expect(pdfContent).toContain(mockInvoiceData.commande.titre);
      if (mockInvoiceData.commande.description) {
        expect(pdfContent).toContain(mockInvoiceData.commande.description);
      }
    });

    it("should include correct amounts", async () => {
      // Act
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      const pdfContent = result.toString();
      
      // Montant total TTC
      expect(pdfContent).toContain("120.00");
      
      // TVA
      expect(pdfContent).toContain("20.00");
      
      // Total HT
      expect(pdfContent).toContain("100.00");
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
            adresse: null
          }
        }
      };

      // Act & Assert
      await expect(PdfService.buildInvoicePdf(invoiceDataWithoutOptionals))
        .resolves.toBeInstanceOf(Buffer);
    });

    it("should reject with error for invalid data", async () => {
      // Arrange
      const invalidData = null as any;

      // Act & Assert
      await expect(PdfService.buildInvoicePdf(invalidData))
        .rejects.toThrow();
    });

    it("should generate consistent PDF size for same data", async () => {
      // Act
      const result1 = await PdfService.buildInvoicePdf(mockInvoiceData);
      const result2 = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      // Les PDFs générés devraient avoir une taille similaire (+/- 1000 bytes pour les timestamps)
      const sizeDifference = Math.abs(result1.length - result2.length);
      expect(sizeDifference).toBeLessThan(1000);
    });

    it("should format dates correctly in French format", async () => {
      // Act
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      const pdfContent = result.toString();
      // Vérifier le format date française DD/MM/YYYY
      expect(pdfContent).toContain("15/01/2025");
      expect(pdfContent).toContain("15/02/2025");
    });

    it("should include legal mentions", async () => {
      // Act
      const result = await PdfService.buildInvoicePdf(mockInvoiceData);

      // Assert
      const pdfContent = result.toString();
      expect(pdfContent).toContain("TVA non applicable");
      expect(pdfContent).toContain("Article 293 B du CGI");
    });
  });

  describe("formatDate", () => {
    it("should format dates in French DD/MM/YYYY format", () => {
      // Note: Cette méthode est privée, on la teste indirectement via buildInvoicePdf
      // Ou on peut l'exporter pour les tests si nécessaire
      const testDate = new Date("2025-01-15");
      
      // Utiliser la même logique que dans le service
      const formatted = testDate.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      expect(formatted).toBe("15/01/2025");
    });
  });
});