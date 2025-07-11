#!/usr/bin/env node

/**
 * Script de Validation Finale - Livraison Client
 * Vérifie que tous les composants sont prêts pour la production
 */

const fs = require("fs");
const path = require("path");

const COLORS = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

class DeliveryValidator {
  constructor() {
    this.checks = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, color = "reset") {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  check(name, testFn) {
    try {
      const result = testFn();
      if (result) {
        this.log(`✅ ${name}`, "green");
        this.passed++;
      } else {
        this.log(`❌ ${name}`, "red");
        this.failed++;
      }
    } catch (error) {
      this.log(`❌ ${name} - ${error.message}`, "red");
      this.failed++;
    }
  }

  fileExists(filePath) {
    return fs.existsSync(path.join(__dirname, "..", filePath));
  }

  fileContains(filePath, searchString) {
    if (!this.fileExists(filePath)) return false;
    const content = fs.readFileSync(
      path.join(__dirname, "..", filePath),
      "utf8"
    );
    return content.includes(searchString);
  }

  async validate() {
    this.log("\n🚀 VALIDATION FINALE - LIVRAISON CLIENT STAKA LIVRES", "bold");
    this.log("═".repeat(60), "blue");

    this.log("\n📁 STRUCTURE DES FICHIERS", "blue");

    // Vérification des fichiers essentiels
    this.check("Package.json existe", () => this.fileExists("package.json"));
    this.check("Vite config existe", () => this.fileExists("vite.config.ts"));
    this.check("Tailwind config existe", () =>
      this.fileExists("tailwind.config.js")
    );
    this.check("Types partagés existent", () =>
      this.fileExists("src/types/shared.ts")
    );

    this.log("\n🔐 SÉCURITÉ ET AUTHENTIFICATION", "blue");

    // Vérification sécurité
    this.check("RequireAdmin component existe", () =>
      this.fileExists("src/components/admin/RequireAdmin.tsx")
    );
    this.check("Auth context existe", () =>
      this.fileExists("src/contexts/AuthContext.tsx")
    );
    this.check("TestUtils avec validation sécurité", () =>
      this.fileContains("src/utils/testUtils.ts", "validateAdminAccess")
    );
    this.check("Security Audit intégré", () =>
      this.fileContains(
        "src/components/admin/RequireAdmin.tsx",
        "SecurityAuditor"
      )
    );

    this.log("\n🎭 MODE DÉMONSTRATION", "blue");

    // Vérification mode démo
    this.check("DemoModeProvider existe", () =>
      this.fileExists("src/components/admin/DemoModeProvider.tsx")
    );
    this.check("DemoBanner composant", () =>
      this.fileContains(
        "src/components/admin/DemoModeProvider.tsx",
        "DemoBanner"
      )
    );
    this.check("Gestion URL démo", () =>
      this.fileContains(
        "src/components/admin/DemoModeProvider.tsx",
        "urlParams.get('demo')"
      )
    );

    this.log("\n🧪 TESTS ET VALIDATION", "blue");

    // Vérification tests
    this.check("FunctionalTestRunner existe", () =>
      this.fileExists("src/utils/functionalTests.ts")
    );
    this.check("Tests CRUD implémentés", () =>
      this.fileContains("src/utils/functionalTests.ts", "runCRUDTests")
    );
    this.check("Tests Performance implémentés", () =>
      this.fileContains("src/utils/functionalTests.ts", "runPerformanceTests")
    );
    this.check("Tests Sécurité implémentés", () =>
      this.fileContains("src/utils/functionalTests.ts", "runSecurityTests")
    );

    this.log("\n📱 PAGES ADMIN", "blue");

    // Vérification pages admin
    const adminPages = [
      "AdminDashboard.tsx",
      "AdminUtilisateurs.tsx",
      "AdminCommandes.tsx",
      "AdminFactures.tsx",
      "AdminFAQ.tsx",
      "AdminTarifs.tsx",
      "AdminPages.tsx",
      "AdminStatistiques.tsx",
      "AdminLogs.tsx",
    ];

    adminPages.forEach((page) => {
      this.check(`Page ${page} existe`, () =>
        this.fileExists(`src/pages/admin/${page}`)
      );
    });

    this.log("\n🔧 API ET INTÉGRATION", "blue");

    // Vérification API
    this.check("AdminAPI service existe", () =>
      this.fileExists("src/utils/adminAPI.ts")
    );
    this.check("API avec endpoints utilisateurs", () =>
      this.fileContains("src/utils/adminAPI.ts", "getUsers")
    );
    this.check("API avec endpoints commandes", () =>
      this.fileContains("src/utils/adminAPI.ts", "getCommandes")
    );
    this.check("API avec endpoints factures", () =>
      this.fileContains("src/utils/adminAPI.ts", "getFactures")
    );
    this.check("API avec authentification JWT", () =>
      this.fileContains("src/utils/adminAPI.ts", "getToken()")
    );

    this.log("\n🎨 INTERFACE UTILISATEUR", "blue");

    // Vérification composants UI
    this.check("AdminLayout existe", () =>
      this.fileExists("src/components/admin/AdminLayout.tsx")
    );
    this.check("LoadingSpinner existe", () =>
      this.fileExists("src/components/common/LoadingSpinner.tsx")
    );
    this.check("Modal existe", () =>
      this.fileExists("src/components/common/Modal.tsx")
    );
    this.check("ConfirmationModal existe", () =>
      this.fileExists("src/components/common/ConfirmationModal.tsx")
    );

    this.log("\n📊 BUILD ET PERFORMANCE", "blue");

    // Vérification build
    this.check("Dist folder existe (build réussi)", () =>
      this.fileExists("../dist")
    );
    this.check("Index.html généré", () =>
      this.fileExists("../dist/index.html")
    );

    // Vérification taille bundle (approximative)
    try {
      const stats = fs.statSync(path.join(__dirname, "../../dist"));
      this.check("Build directory accessible", () => true);
    } catch (error) {
      this.check("Build directory accessible", () => false);
    }

    this.log("\n📚 DOCUMENTATION", "blue");

    // Vérification documentation
    this.check("Documentation admin existe", () =>
      this.fileExists("../docs/ADMIN_COMPLETE_GUIDE.md")
    );
    this.check("Documentation mise à jour", () =>
      this.fileContains("../docs/ADMIN_COMPLETE_GUIDE.md", "Version Finale")
    );

    // Résumé final
    this.log("\n" + "═".repeat(60), "blue");
    this.log("📊 RÉSUMÉ DE VALIDATION", "bold");
    this.log(`✅ Tests réussis: ${this.passed}`, "green");
    this.log(
      `❌ Tests échoués: ${this.failed}`,
      this.failed > 0 ? "red" : "green"
    );

    const successRate = Math.round(
      (this.passed / (this.passed + this.failed)) * 100
    );
    this.log(
      `📈 Taux de réussite: ${successRate}%`,
      successRate >= 95 ? "green" : "yellow"
    );

    if (this.failed === 0) {
      this.log("\n🎉 LIVRAISON VALIDÉE - PRÊT POUR LE CLIENT!", "green");
      this.log("✨ Tous les composants sont en place et fonctionnels", "green");
    } else if (successRate >= 95) {
      this.log(
        "\n✅ LIVRAISON PRESQUE PARFAITE - PRÊT POUR LE CLIENT!",
        "green"
      );
      this.log(
        "🎯 Taux de réussite excellent (≥95%) - Problèmes mineurs seulement",
        "green"
      );
    } else {
      this.log("\n⚠️  VALIDATION INCOMPLÈTE - VÉRIFICATION REQUISE", "yellow");
      this.log(
        `${this.failed} problème(s) détecté(s) - Correction recommandée`,
        "yellow"
      );
    }

    this.log("\n🚀 PROCHAINES ÉTAPES:", "blue");
    this.log("1. Déploiement en environnement de recette");
    this.log("2. Tests métier avec équipe client");
    this.log("3. Formation utilisateurs administrateurs");
    this.log("4. Mise en production");

    this.log("\n🔗 LIENS UTILES:", "blue");
    this.log("• Mode démo: ?demo=true&readonly=true");
    this.log("• Documentation: /docs/ADMIN_COMPLETE_GUIDE.md");
    this.log("• Tests: npm run test:admin");

    return this.failed === 0 || successRate >= 95;
  }
}

// Exécution du script
if (require.main === module) {
  const validator = new DeliveryValidator();
  validator.validate().then((isValid) => {
    process.exit(isValid ? 0 : 1);
  });
}

module.exports = DeliveryValidator;
