import {
  createFAQ,
  deleteFAQ,
  getCommandes,
  getDashboardStats,
  getFacturePdf,
  getFactures,
  getUsers,
  updateCommande,
  updateFAQ,
} from "./adminAPI";
import { PERFORMANCE_THRESHOLDS, TestUtils } from "./testUtils";

// Interface pour les résultats de tests
interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

export class FunctionalTestRunner {
  private results: TestSuite[] = [];

  // Tests de workflow CRUD complets
  async runCRUDTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: "Tests CRUD Complets",
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
    };

    // Test Utilisateurs CRUD
    await this.runTest(suite, "Utilisateurs - Lecture", async () => {
      const users = await getUsers({ page: 1, limit: 10 });
      if (!users.data || users.data.length === 0) {
        throw new Error("Aucun utilisateur trouvé");
      }
      TestUtils.validatePagination(
        users.pagination.page,
        users.pagination.totalPages,
        users.pagination.limit,
        users.pagination.total
      );
      return users;
    });

    await this.runTest(
      suite,
      "Utilisateurs - Recherche & Filtres",
      async () => {
        const searchResults = await getUsers({
          page: 1,
          limit: 10,
          search: "test",
        });
        const filterResults = await getUsers({
          page: 1,
          limit: 10,
          role: "ADMIN" as any,
        });

        TestUtils.validateSearchAndFilters(
          searchResults.data || [],
          "test",
          {}
        );
        TestUtils.validateSearchAndFilters(filterResults.data || [], "", {
          role: "ADMIN",
        });

        return { searchResults, filterResults };
      }
    );

    // Test Commandes CRUD
    await this.runTest(suite, "Commandes - Gestion statuts", async () => {
      const commandes = await getCommandes({ page: 1, limit: 10 });
      if (commandes.data && commandes.data.length > 0) {
        const commande = commandes.data[0];
        // Simulation changement de statut
        await updateCommande(commande.id, {
          statut: "EN_COURS" as any,
          noteCorrecteur: "Test automatique",
        });
      }
      return commandes;
    });

    // Test Factures et exports
    await this.runTest(suite, "Factures - Export PDF", async () => {
      const factures = await getFactures(1, 10);
      if (factures.data && factures.data.length > 0) {
        const facture = factures.data[0];
        const pdfBlob = await getFacturePdf(facture.id);
        if (!pdfBlob) {
          throw new Error("PDF vide généré");
        }
      }
      return factures;
    });

    // Test FAQ - CRUD complet
    await this.runTest(suite, "FAQ - CRUD Complet", async () => {
      // Créer une FAQ de test
      const newFAQ = await createFAQ({
        question: "Question de test automatique",
        answer: "Réponse de test automatique",
        categorie: "Test",
        ordre: 999,
        visible: false,
      });

      // Modifier la FAQ
      const updatedFAQ = await updateFAQ(newFAQ.id, {
        visible: true,
        answer: "Réponse modifiée",
      });

      // Supprimer la FAQ
      await deleteFAQ(newFAQ.id);

      return { newFAQ, updatedFAQ };
    });

    return suite;
  }

  // Tests de performance et charge
  async runPerformanceTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: "Tests de Performance",
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
    };

    await this.runTest(
      suite,
      "Performance - Chargement Dashboard",
      async () => {
        const result = await TestUtils.performanceTest(
          () => getDashboardStats(),
          PERFORMANCE_THRESHOLDS.pageLoad
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        if (!result.withinExpectedTime) {
          throw new Error(
            `Trop lent: ${result.duration}ms (max: ${PERFORMANCE_THRESHOLDS.pageLoad}ms)`
          );
        }

        return result;
      }
    );

    await this.runTest(
      suite,
      "Performance - Recherche Utilisateurs",
      async () => {
        const result = await TestUtils.performanceTest(
          () => getUsers({ page: 1, limit: 10, search: "test" }),
          PERFORMANCE_THRESHOLDS.search
        );

        if (!result.success || !result.withinExpectedTime) {
          throw new Error(`Recherche trop lente: ${result.duration}ms`);
        }

        return result;
      }
    );

    return suite;
  }

  // Tests de sécurité et permissions
  async runSecurityTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: "Tests de Sécurité",
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
    };

    await this.runTest(suite, "Sécurité - Validation rôle admin", async () => {
      try {
        TestUtils.validateAdminAccess("USER");
        throw new Error("Validation de sécurité échouée - USER autorisé");
      } catch (error) {
        // C'est le comportement attendu
        if (error instanceof Error && error.message.includes("Accès refusé")) {
          return { valid: true, message: "Accès USER correctement bloqué" };
        }
        throw error;
      }
    });

    await this.runTest(suite, "Sécurité - Sanitization données", async () => {
      const sensitiveData = {
        nom: "Test",
        email: "test@example.com",
        password: "secret123",
        token: "jwt-token-secret",
        stripePaymentId: "pi_secret",
      };

      const sanitized = TestUtils.sanitizeUserData(sensitiveData);

      if (sanitized.password || sanitized.token || sanitized.stripePaymentId) {
        throw new Error("Données sensibles non supprimées");
      }

      return { original: sensitiveData, sanitized };
    });

    await this.runTest(suite, "Sécurité - Conformité RGPD", async () => {
      const userData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
      };

      const compliance = TestUtils.validateRGPDCompliance("export", userData);

      if (!compliance.compliant) {
        throw new Error("Non-conformité RGPD détectée");
      }

      return compliance;
    });

    return suite;
  }

  // Tests d'erreurs et récupération
  async runErrorHandlingTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: "Tests de Gestion d'Erreurs",
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
    };

    await this.runTest(suite, "Erreur - API indisponible", async () => {
      try {
        TestUtils.simulateAPIError("network");
        throw new Error("Erreur non simulée");
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Serveur indisponible")
        ) {
          return { errorHandled: true, errorType: "network" };
        }
        throw error;
      }
    });

    await this.runTest(suite, "Erreur - Token expiré", async () => {
      try {
        TestUtils.simulateAPIError("auth");
        throw new Error("Erreur non simulée");
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Token JWT expiré")
        ) {
          return { errorHandled: true, errorType: "auth" };
        }
        throw error;
      }
    });

    await this.runTest(suite, "Validation - Champs obligatoires", async () => {
      try {
        TestUtils.validateFormData({ nom: "", email: "test@example.com" }, [
          "nom",
          "email",
          "prenom",
        ]);
        throw new Error("Validation échouée");
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Champs obligatoires manquants")
        ) {
          return { validationWorking: true };
        }
        throw error;
      }
    });

    return suite;
  }

  // Tests d'interface utilisateur
  async runUITests(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: "Tests Interface Utilisateur",
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
    };

    await this.runTest(suite, "UI - États de chargement", async () => {
      // Simuler un chargement avec délai
      await TestUtils.simulateNetworkDelay(500);
      return { loadingStateSimulated: true, duration: 500 };
    });

    await this.runTest(suite, "UI - Pagination", async () => {
      // Tester différentes configurations de pagination
      const testCases = [
        { page: 1, totalPages: 5, pageSize: 10, totalItems: 42 },
        { page: 3, totalPages: 3, pageSize: 20, totalItems: 60 },
        { page: 1, totalPages: 1, pageSize: 10, totalItems: 5 },
      ];

      for (const testCase of testCases) {
        TestUtils.validatePagination(
          testCase.page,
          testCase.totalPages,
          testCase.pageSize,
          testCase.totalItems
        );
      }

      return { paginationTests: testCases.length, allPassed: true };
    });

    return suite;
  }

  // Exécuter un test individuel
  private async runTest(
    suite: TestSuite,
    testName: string,
    testFn: () => Promise<any>
  ): Promise<void> {
    const startTime = performance.now();

    try {
      const result = await testFn();
      const duration = performance.now() - startTime;

      suite.results.push({
        testName,
        passed: true,
        duration,
        details: result,
      });

      suite.passedTests++;
    } catch (error) {
      const duration = performance.now() - startTime;

      suite.results.push({
        testName,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });

      suite.failedTests++;
    }

    suite.totalTests++;
    suite.totalDuration += suite.results[suite.results.length - 1].duration;
  }

  // Exécuter tous les tests
  async runAllTests(): Promise<{
    suites: TestSuite[];
    summary: {
      totalSuites: number;
      totalTests: number;
      totalPassed: number;
      totalFailed: number;
      totalDuration: number;
      successRate: number;
    };
  }> {
    console.log("🧪 Début des tests fonctionnels...");

    this.results = [];

    // Exécuter toutes les suites de tests
    const suites = await Promise.all([
      this.runCRUDTests(),
      this.runPerformanceTests(),
      this.runSecurityTests(),
      this.runErrorHandlingTests(),
      this.runUITests(),
    ]);

    this.results = suites;

    // Calculer le résumé
    const summary = {
      totalSuites: suites.length,
      totalTests: suites.reduce((acc, suite) => acc + suite.totalTests, 0),
      totalPassed: suites.reduce((acc, suite) => acc + suite.passedTests, 0),
      totalFailed: suites.reduce((acc, suite) => acc + suite.failedTests, 0),
      totalDuration: suites.reduce(
        (acc, suite) => acc + suite.totalDuration,
        0
      ),
      successRate: 0,
    };

    summary.successRate =
      summary.totalTests > 0
        ? (summary.totalPassed / summary.totalTests) * 100
        : 0;

    console.log("✅ Tests terminés:", summary);

    return { suites, summary };
  }

  // Générer un rapport détaillé
  generateReport(): string {
    let report = "# 📊 Rapport de Tests Fonctionnels\n\n";

    for (const suite of this.results) {
      report += `## ${suite.suiteName}\n`;
      report += `- Tests: ${suite.totalTests}\n`;
      report += `- Réussis: ${suite.passedTests} ✅\n`;
      report += `- Échoués: ${suite.failedTests} ❌\n`;
      report += `- Durée: ${suite.totalDuration.toFixed(2)}ms\n\n`;

      for (const test of suite.results) {
        const status = test.passed ? "✅" : "❌";
        report += `### ${status} ${test.testName}\n`;
        report += `- Durée: ${test.duration.toFixed(2)}ms\n`;

        if (!test.passed && test.error) {
          report += `- Erreur: \`${test.error}\`\n`;
        }

        report += "\n";
      }
    }

    return report;
  }
}

// Instance globale pour les tests
export const functionalTestRunner = new FunctionalTestRunner();

// Fonction utilitaire pour lancer tous les tests
export const runAdminTests = async () => {
  return await functionalTestRunner.runAllTests();
};

export default FunctionalTestRunner;
