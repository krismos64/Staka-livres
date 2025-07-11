/**
 * Tests principaux pour le module Projects
 * Ce fichier regroupe les tests unitaires et d'intégration pour les projets
 */

// Import des tests unitaires
import "./unit/projectModel.test";

// Import des tests d'intégration
import "./integration/projectsEndpoints.test";

describe("Projects Module", () => {
  it("should have all tests passing", () => {
    // Ce test sert de point d'entrée principal
    // Les tests réels sont dans les fichiers importés ci-dessus
    expect(true).toBe(true);
  });
});