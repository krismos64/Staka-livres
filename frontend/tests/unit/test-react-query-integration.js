// Script de test pour valider l'intégration React Query
// Lancer dans la console du navigateur sur http://localhost:3000/billing

console.log("🧪 Test d'intégration React Query - Système de Facturation");

// Test 1: Vérifier que React Query est chargé
function testReactQueryLoaded() {
  console.log("\n📋 Test 1: Chargement React Query");

  if (window.__REACT_QUERY_CLIENT__) {
    console.log("✅ React Query client détecté");
    return true;
  } else {
    console.log("❌ React Query client non trouvé");
    return false;
  }
}

// Test 2: Vérifier la configuration API
function testApiConfig() {
  console.log("\n📋 Test 2: Configuration API");

  const expectedEndpoints = [
    "http://localhost:3001/invoices",
    "http://localhost:3001/invoices/123",
    "http://localhost:3001/invoices/123/download",
  ];

  expectedEndpoints.forEach((url) => {
    fetch(url, { method: "HEAD" })
      .then((response) => {
        if (response.status === 401) {
          console.log(`✅ Endpoint ${url} répond (401 = auth requis)`);
        } else {
          console.log(`⚠️ Endpoint ${url} status: ${response.status}`);
        }
      })
      .catch((error) => {
        console.log(`❌ Endpoint ${url} erreur:`, error.message);
      });
  });
}

// Test 3: Simuler un token et tester les hooks
function testWithMockToken() {
  console.log("\n📋 Test 3: Simulation avec token mock");

  // Injecter un token de test
  const mockToken =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjk5OTk5OTk5OTl9.mock_signature";
  localStorage.setItem("auth_token", mockToken);
  console.log("✅ Token mock injecté dans localStorage");

  // Recharger la page pour déclencher useInvoices
  console.log("🔄 Pour tester les hooks, rechargez la page (F5)");
  console.log("👀 Observez les requêtes dans l'onglet Network des DevTools");

  // Observer les erreurs dans la console
  const originalError = console.error;
  console.error = function (...args) {
    if (args[0] && args[0].includes("React Query")) {
      console.log("🔍 Erreur React Query interceptée:", args);
    }
    originalError.apply(console, args);
  };
}

// Test 4: Vérifier les composants de facturation
function testBillingComponents() {
  console.log("\n📋 Test 4: Composants de facturation");

  const components = [
    "CurrentInvoiceCard",
    "InvoiceHistoryCard",
    "InvoiceDetailsModal",
    "PaymentMethodsCard",
    "AnnualSummaryCard",
    "SupportCard",
  ];

  components.forEach((comp) => {
    const elements = document.querySelectorAll(
      `[data-component="${comp}"], .${comp.toLowerCase()}`
    );
    if (elements.length > 0) {
      console.log(`✅ Composant ${comp} présent (${elements.length} éléments)`);
    } else {
      console.log(`⚠️ Composant ${comp} non trouvé dans le DOM`);
    }
  });
}

// Test 5: Tester le téléchargement de PDF (sans vraie facture)
function testPdfDownload() {
  console.log("\n📋 Test 5: Simulation téléchargement PDF");

  // Simuler la fonction downloadInvoice
  window.testDownloadInvoice = async function (invoiceId) {
    console.log(`🔄 Test téléchargement facture: ${invoiceId}`);

    try {
      const response = await fetch(
        `http://localhost:3001/invoices/${invoiceId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (response.ok) {
        console.log("✅ Endpoint téléchargement accessible");
        const blob = await response.blob();
        console.log("✅ Blob reçu:", blob.size, "bytes");
      } else {
        console.log(`⚠️ Status téléchargement: ${response.status}`);
      }
    } catch (error) {
      console.log("❌ Erreur téléchargement:", error.message);
    }
  };

  console.log("💡 Utilisez testDownloadInvoice('test-id') pour tester");
}

// Lancement des tests
function runAllTests() {
  console.log("🚀 Démarrage des tests d'intégration React Query\n");

  testReactQueryLoaded();
  testApiConfig();
  testBillingComponents();
  testPdfDownload();

  setTimeout(() => {
    testWithMockToken();
  }, 2000);

  console.log("\n🎯 Tests terminés!");
  console.log("📖 Consultez le guide complet dans test-billing-integration.md");
}

// Auto-exécution si dans un contexte navigateur
if (typeof window !== "undefined") {
  runAllTests();
} else {
  console.log(
    "Script prêt. Exécutez runAllTests() dans la console du navigateur."
  );
}

// Export pour utilisation manuelle
window.billingTests = {
  runAllTests,
  testReactQueryLoaded,
  testApiConfig,
  testBillingComponents,
  testPdfDownload,
  testWithMockToken,
};
