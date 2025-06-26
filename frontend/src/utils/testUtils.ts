// Interface pour les résultats de tests
interface TestResult {
  success: boolean;
  duration: number;
  details: string;
  errors?: string[];
}

// Utilitaires pour les tests et la validation
export class TestUtils {
  // Simulation d'erreurs API
  static simulateAPIError(
    type: "network" | "auth" | "permission" | "server" = "network"
  ) {
    const errors = {
      network: new Error("Erreur réseau - Serveur indisponible"),
      auth: new Error("Token JWT expiré - Veuillez vous reconnecter"),
      permission: new Error("Permissions insuffisantes - Accès refusé"),
      server: new Error("Erreur serveur interne - Réessayez plus tard"),
    };

    throw errors[type];
  }

  // Validation des données avant envoi
  static validateFormData(data: Record<string, any>, requiredFields: string[]) {
    const missing = requiredFields.filter(
      (field) => !data[field] || data[field] === ""
    );
    if (missing.length > 0) {
      throw new Error(`Champs obligatoires manquants: ${missing.join(", ")}`);
    }
    return true;
  }

  // Simulation de lenteur réseau
  static async simulateNetworkDelay(ms: number = 2000) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Validation de sécurité pour les permissions admin
  static validateAdminAccess(userRole: string, requiredRole: string = "ADMIN") {
    if (userRole !== requiredRole) {
      throw new Error("Accès refusé - Rôle administrateur requis");
    }
    return true;
  }

  // Nettoyage et validation des données sensibles
  static sanitizeUserData(data: any) {
    const sanitized = { ...data };

    // Supprimer les champs sensibles pour les logs
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.stripePaymentId;

    return sanitized;
  }

  // Validation de conformité RGPD
  static validateRGPDCompliance(action: string, userData: any) {
    const sensitiveFields = ["email", "nom", "prenom", "adresse", "telephone"];
    const hasSensitiveData = sensitiveFields.some((field) => userData[field]);

    if (hasSensitiveData && action === "export") {
      console.warn(
        "⚠️ Export de données personnelles - Vérifier la conformité RGPD"
      );
      return {
        compliant: true,
        warning: "Données personnelles incluses dans l'export",
        recommendation: "Informer l'utilisateur et obtenir son consentement",
      };
    }

    return { compliant: true };
  }

  // Test de charge et performance
  static async performanceTest(
    operation: () => Promise<any>,
    expectedMaxTime: number = 3000
  ) {
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        success: true,
        duration,
        withinExpectedTime: duration <= expectedMaxTime,
        result,
      };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        success: false,
        duration,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  // Validation de la pagination
  static validatePagination(
    currentPage: number,
    totalPages: number,
    pageSize: number,
    totalItems: number
  ) {
    const errors: string[] = [];

    if (currentPage < 1) errors.push("Page courante invalide (< 1)");
    if (currentPage > totalPages && totalPages > 0)
      errors.push("Page courante supérieure au total");
    if (pageSize < 1) errors.push("Taille de page invalide (< 1)");
    if (totalItems < 0) errors.push("Nombre total d'éléments invalide (< 0)");

    const expectedTotalPages = Math.ceil(totalItems / pageSize);
    if (totalPages !== expectedTotalPages) {
      errors.push(
        `Calcul total pages incorrect: attendu ${expectedTotalPages}, reçu ${totalPages}`
      );
    }

    if (errors.length > 0) {
      throw new Error(`Erreurs de pagination: ${errors.join(", ")}`);
    }

    return true;
  }

  // Test de la recherche et des filtres
  static validateSearchAndFilters(
    results: any[],
    searchTerm: string,
    filters: Record<string, any>
  ) {
    if (!searchTerm && Object.keys(filters).length === 0) {
      return true; // Pas de filtres appliqués
    }

    // Validation que les résultats correspondent aux critères
    const validResults = results.every((item) => {
      // Test de recherche textuelle
      if (searchTerm) {
        const searchableFields = [
          "nom",
          "prenom",
          "email",
          "titre",
          "description",
        ];
        const matchesSearch = searchableFields.some((field) =>
          item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (!matchesSearch) return false;
      }

      // Test des filtres
      for (const [filterKey, filterValue] of Object.entries(filters)) {
        if (filterValue && item[filterKey] !== filterValue) {
          return false;
        }
      }

      return true;
    });

    if (!validResults) {
      throw new Error(
        "Certains résultats ne correspondent pas aux critères de recherche/filtrage"
      );
    }

    return true;
  }
}

// Configuration pour les tests de charge
export const PERFORMANCE_THRESHOLDS = {
  pageLoad: 2000, // 2 secondes max pour charger une page
  apiCall: 1500, // 1.5 secondes max pour un appel API
  search: 500, // 500ms max pour une recherche
  export: 10000, // 10 secondes max pour un export
} as const;

// Utilitaires pour simuler différents états de l'application
export class MockStateManager {
  static createMockUser(role: "USER" | "ADMIN" = "ADMIN") {
    return {
      id: "test-user-id",
      prenom: "Admin",
      nom: "Test",
      email: "admin@test.com",
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static createMockAuthState(
    isAuthenticated: boolean = true,
    role: "USER" | "ADMIN" = "ADMIN"
  ) {
    return {
      user: isAuthenticated ? this.createMockUser(role) : null,
      token: isAuthenticated ? "mock-jwt-token" : null,
      isLoading: false,
      isAuthenticated,
    };
  }

  static simulateJWTExpiry() {
    // Simule l'expiration du token JWT
    localStorage.removeItem("auth_token");
    window.dispatchEvent(new CustomEvent("auth:token-expired"));
  }
}

export default TestUtils;

/**
 * Tests spécifiques au mode démo
 */
export class DemoModeTestSuite {
  /**
   * Valide que le mode démo est correctement configuré et fonctionne
   */
  static async validateDemoMode(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      console.log("🎭 [DEMO TEST] Validation du mode démonstration...");

      // 1. Vérifier la détection du mode démo
      const urlParams = new URLSearchParams(window.location.search);
      const isDemoActive = urlParams.get("demo") === "true";

      if (!isDemoActive) {
        errors.push("Mode démo non activé dans l'URL (manque ?demo=true)");
        return {
          success: false,
          duration: Date.now() - startTime,
          details: "Mode démo requis pour ce test",
          errors,
        };
      }

      // 2. Vérifier que MockDataService est importé et fonctionne
      const { MockDataService } = await import("../utils/mockData");

      if (!MockDataService.isDemoMode()) {
        errors.push("MockDataService.isDemoMode() retourne false");
      }

      // 3. Tester les données fictives utilisateurs
      console.log("🔍 Test des données utilisateurs...");
      const usersResponse = await MockDataService.getUsers(1, 5);

      if (!usersResponse.success) {
        errors.push("Échec récupération données utilisateurs fictives");
      }

      if (!usersResponse.data || usersResponse.data.length === 0) {
        errors.push("Aucune donnée utilisateur fictive trouvée");
      }

      if (!usersResponse.pagination) {
        errors.push("Pagination manquante pour les utilisateurs");
      }

      // 4. Tester les données fictives commandes
      console.log("🔍 Test des données commandes...");
      const commandesResponse = await MockDataService.getCommandes(1, 5);

      if (!commandesResponse.success || !commandesResponse.data) {
        errors.push("Échec récupération données commandes fictives");
      }

      // 5. Tester la recherche et filtrage
      console.log("🔍 Test recherche et filtres...");
      const searchResponse = await MockDataService.getCommandes(
        1,
        10,
        undefined,
        "Marie"
      );

      if (!searchResponse.success) {
        errors.push("Échec test de recherche");
      }

      // 6. Tester les statistiques calculées
      console.log("🔍 Test statistiques dashboard...");
      const stats = await MockDataService.getDashboardStats();

      if (!stats.userStats || !stats.commandeStats || !stats.factureStats) {
        errors.push("Statistiques dashboard incomplètes");
      }

      // 7. Vérifier la latence simulée
      const latencyStart = Date.now();
      await MockDataService.getFactures(1, 5);
      const latencyDuration = Date.now() - latencyStart;

      if (latencyDuration < 100) {
        errors.push("Latence réseau non simulée (trop rapide)");
      }

      // 8. Tester les actions démo spécifiques
      console.log("🔍 Test actions démo...");
      try {
        const refreshResult = await MockDataService.refreshDemoData();
        if (!refreshResult.success) {
          errors.push("Action rafraîchir données démo échoue");
        }

        const resetResult = await MockDataService.resetDemoData();
        if (!resetResult.success) {
          errors.push("Action reset données démo échoue");
        }
      } catch (error) {
        errors.push(`Erreur actions démo: ${error}`);
      }

      console.log("✅ [DEMO TEST] Validation du mode démo terminée");

      return {
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: `Mode démo validé avec ${errors.length} erreur(s)`,
        errors,
      };
    } catch (error) {
      console.error("❌ [DEMO TEST] Erreur lors de la validation:", error);
      return {
        success: false,
        duration: Date.now() - startTime,
        details: `Erreur validation mode démo: ${error}`,
        errors: [...errors, `Exception: ${error}`],
      };
    }
  }

  /**
   * Teste la cohérence des données fictives entre les différentes entités
   */
  static async validateDataConsistency(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      console.log("🔗 [DEMO TEST] Validation cohérence des données...");

      const { MockDataService } = await import("../utils/mockData");

      // Récupérer toutes les données
      const [users, commandes, factures] = await Promise.all([
        MockDataService.getUsers(1, 100),
        MockDataService.getCommandes(1, 100),
        MockDataService.getFactures(1, 100),
      ]);

      // Vérifier que les commandes ont des utilisateurs valides
      const userIds = users.data?.map((u) => u.id) || [];
      const invalidCommandes =
        commandes.data?.filter(
          (c) => c.userId && !userIds.includes(c.userId)
        ) || [];

      if (invalidCommandes.length > 0) {
        errors.push(
          `${invalidCommandes.length} commandes avec utilisateurs invalides`
        );
      }

      // Vérifier que les factures ont des commandes valides
      const commandeIds = commandes.data?.map((c) => c.id) || [];
      const invalidFactures =
        factures.data?.filter(
          (f) => f.commandeId && !commandeIds.includes(f.commandeId)
        ) || [];

      if (invalidFactures.length > 0) {
        errors.push(
          `${invalidFactures.length} factures avec commandes invalides`
        );
      }

      // Vérifier que les montants des factures sont cohérents
      const invalidAmounts =
        factures.data?.filter((f) => f.montant <= 0 || !f.montantFormate) || [];

      if (invalidAmounts.length > 0) {
        errors.push(
          `${invalidAmounts.length} factures avec montants invalides`
        );
      }

      console.log("✅ [DEMO TEST] Validation cohérence terminée");

      return {
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: `Cohérence validée avec ${errors.length} erreur(s)`,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        details: `Erreur validation cohérence: ${error}`,
        errors: [...errors, `Exception: ${error}`],
      };
    }
  }

  /**
   * Lance tous les tests du mode démo
   */
  static async runAllDemoTests(): Promise<{
    success: boolean;
    totalDuration: number;
    results: Record<string, TestResult>;
  }> {
    const startTime = Date.now();

    console.log("🎭 [DEMO SUITE] Lancement des tests mode démo...");

    const results = {
      demoMode: await this.validateDemoMode(),
      dataConsistency: await this.validateDataConsistency(),
    };

    const success = Object.values(results).every((r) => r.success);
    const totalDuration = Date.now() - startTime;

    console.log(`🎯 [DEMO SUITE] Tests terminés en ${totalDuration}ms`);
    console.log(
      `📊 [DEMO SUITE] Résultat: ${success ? "✅ SUCCÈS" : "❌ ÉCHEC"}`
    );

    return {
      success,
      totalDuration,
      results,
    };
  }
}

// Fonction utilitaire pour tester rapidement le mode démo depuis la console
(window as any).testDemoMode = async () => {
  console.log("🎮 Test rapide du mode démo...");
  const result = await DemoModeTestSuite.runAllDemoTests();
  console.table(result.results);
  return result;
};
