import { WelcomeEmailService } from "../../services/welcomeEmailService";

/**
 * Test simple pour vérifier que l'email de bienvenue fonctionne
 * Ce test est surtout utile pour vérifier la compilation et les erreurs de template
 */
describe("WelcomeEmailService", () => {
  describe("formatUserName", () => {
    it("devrait formater correctement le nom complet", () => {
      const result = WelcomeEmailService.formatUserName("Jean", "Dupont");
      expect(result).toBe("Jean Dupont");
    });

    it("devrait gérer le prénom seul", () => {
      const result = WelcomeEmailService.formatUserName("Jean", "");
      expect(result).toBe("Jean");
    });

    it("devrait gérer le nom seul", () => {
      const result = WelcomeEmailService.formatUserName("", "Dupont");
      expect(result).toBe("Dupont");
    });

    it("devrait retourner 'Utilisateur' par défaut", () => {
      const result = WelcomeEmailService.formatUserName("", "");
      expect(result).toBe("Utilisateur");
    });
  });

  describe("isValidEmail", () => {
    it("devrait valider un email correct", () => {
      expect(WelcomeEmailService.isValidEmail("test@example.com")).toBe(true);
    });

    it("devrait rejeter un email incorrect", () => {
      expect(WelcomeEmailService.isValidEmail("email-incorrect")).toBe(false);
    });
  });

  describe("sendWelcomeEmail", () => {
    it("ne devrait pas lever d'erreur avec des paramètres valides", async () => {
      // Ce test vérifie surtout que le template se compile sans erreur
      // En mode test/dev, l'email ne sera pas vraiment envoyé
      await expect(
        WelcomeEmailService.sendWelcomeEmail(
          "test@example.com",
          "Test Utilisateur",
          "Test"
        )
      ).resolves.not.toThrow();
    });
  });
});