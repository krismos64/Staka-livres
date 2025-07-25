/// <reference types="cypress" />

/**
 * Tests E2E - Paiements Enterprise (Intégration)
 * 
 * Tests d'intégration enterprise pour le système de paiement avec Stripe.
 * Couvre les scénarios complexes, l'intégration complète avec les services
 * externes et les cas d'usage métier avancés nécessitant un backend complet.
 * 
 * Couverture enterprise :
 * - Tests de charge paiements simultanés
 * - Intégration comptabilité et facturation
 * - Analytics paiements et prédictions IA
 * - Compliance et audit financier
 * - Optimisation conversion et UX
 */

describe("💳 Paiements Enterprise - Tests Intégration", () => {
  const testEnvironment = {
    loadTest: {
      concurrentPayments: 50,
      duration: 300, // 5 minutes
      targetTPS: 10 // Transactions par seconde
    },
    currencies: ["EUR", "USD", "GBP", "CAD"],
    paymentMethods: ["card", "sepa", "bancontact", "ideal", "giropay"],
    enterpriseClients: [
      {
        name: "Enterprise Corp",
        volume: "high",
        creditLimit: 50000,
        paymentTerms: "net-30"
      },
      {
        name: "SME Business", 
        volume: "medium",
        creditLimit: 10000,
        paymentTerms: "net-15"
      }
    ]
  };

  before(() => {
    cy.task("log", "🚀 Démarrage des tests enterprise paiements");
    cy.resetDatabase();
    
    // Vérifier la configuration enterprise
    cy.request({
      method: "GET",
      url: `${Cypress.env("API_BASE_URL")}/system/payment-capacity`,
      timeout: 30000
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.maxConcurrentPayments).to.be.greaterThan(50);
      expect(response.body.stripeConnectionStatus).to.eq("active");
      cy.task("log", `✅ Capacité paiement: ${response.body.maxConcurrentPayments} simultanés`);
    });
  });

  context("⚡ Tests de Charge et Performance", () => {
    it("devrait gérer 50 paiements simultanés sans dégradation", () => {
      const startTime = Date.now();
      const paymentPromises = [];

      // Créer des clients de test
      for (let i = 1; i <= testEnvironment.loadTest.concurrentPayments; i++) {
        const clientData = {
          email: `loadtest.${i}@example.com`,
          name: `Load Test Client ${i}`,
          projectAmount: 100 + (i * 10) // Montants variables
        };

        paymentPromises.push(
          cy.request({
            method: "POST",
            url: `${Cypress.env("API_BASE_URL")}/payments/simulate-concurrent`,
            body: {
              clientEmail: clientData.email,
              amount: clientData.projectAmount * 100, // Centimes
              currency: "eur",
              paymentMethod: "card",
              testCard: "4242424242424242",
              concurrentId: i
            },
            timeout: 45000
          }).then((response) => {
            expect(response.status).to.eq(200);
            return response.body;
          })
        );
      }

      // Exécuter tous les paiements en parallèle
      cy.wrap(Promise.all(paymentPromises)).then((responses) => {
        const processingTime = Date.now() - startTime;
        const tps = testEnvironment.loadTest.concurrentPayments / (processingTime / 1000);
        
        cy.task("log", `⚡ ${testEnvironment.loadTest.concurrentPayments} paiements traités en ${processingTime}ms`);
        cy.task("log", `📊 TPS réalisé: ${tps.toFixed(2)}`);
        
        // Vérifications de performance
        expect(processingTime).to.be.lessThan(60000); // Moins de 60 secondes
        expect(tps).to.be.greaterThan(5); // Au moins 5 TPS
        
        // Vérifier que tous les paiements ont réussi
        responses.forEach((response, index) => {
          expect(response.paymentIntent.status).to.eq("succeeded");
          expect(response.processingTime).to.be.lessThan(10000); // Chaque paiement < 10s
        });
      });

      // Vérifier l'état du système après la charge
      cy.loginAsAdmin();
      cy.visit("/admin/system-health");

      cy.get('[data-cy="payment-system-status"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Système stable")
        .should("contain", "Aucune dégradation détectée");

      // Métriques de performance
      cy.get('[data-cy="performance-metrics"]')
        .should("contain", `${testEnvironment.loadTest.concurrentPayments} paiements traités`)
        .should("contain", "Temps de réponse moyen:")
        .should("contain", "Taux de succès: 100%");

      // Vérifier la cohérence des données
      cy.visit("/admin/transactions");
      
      cy.get('[data-cy="recent-transactions"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="transaction-count"]')
        .invoke("text")
        .then((count) => {
          const transactionCount = parseInt(count);
          expect(transactionCount).to.be.greaterThan(testEnvironment.loadTest.concurrentPayments * 0.95); // Au moins 95%
        });
    });

    it("devrait maintenir les performances sous charge continue", () => {
      // Test de charge soutenue
      const sustainedLoadConfig = {
        duration: 180, // 3 minutes
        ratePerSecond: 5,
        totalTransactions: 900
      };

      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/start-sustained-load-test`,
        body: sustainedLoadConfig,
        timeout: 30000
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.testId).to.exist;
        cy.wrap(response.body.testId).as("loadTestId");
      });

      // Monitorer les performances pendant le test
      cy.loginAsAdmin();
      cy.visit("/admin/real-time-monitoring");

      // Attendre que le test soit en cours
      cy.get('[data-cy="active-load-test"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "Test de charge en cours");

      // Vérifier les métriques en temps réel
      const checkMetrics = () => {
        cy.get('[data-cy="current-tps"]', { timeout: 5000 })
          .invoke("text")
          .then((tps) => {
            const currentTps = parseFloat(tps);
            expect(currentTps).to.be.greaterThan(3); // Minimum 3 TPS
            expect(currentTps).to.be.lessThan(8); // Maximum 8 TPS
          });

        cy.get('[data-cy="average-response-time"]')
          .invoke("text")
          .then((responseTime) => {
            const avgTime = parseInt(responseTime.replace("ms", ""));
            expect(avgTime).to.be.lessThan(3000); // Moins de 3 secondes
          });

        cy.get('[data-cy="error-rate"]')
          .invoke("text")
          .then((errorRate) => {
            const rate = parseFloat(errorRate.replace("%", ""));
            expect(rate).to.be.lessThan(1); // Moins de 1% d'erreurs
          });
      };

      // Vérifier les métriques à intervalles réguliers
      checkMetrics();
      
      cy.wait(60000); // Attendre 1 minute
      checkMetrics();
      
      cy.wait(60000); // Attendre encore 1 minute
      checkMetrics();

      // Attendre la fin du test
      cy.get('[data-cy="load-test-completed"]', { timeout: 120000 })
        .should("be.visible")
        .should("contain", "Test de charge terminé avec succès");

      // Analyser les résultats finaux
      cy.get('@loadTestId').then((testId) => {
        cy.request({
          method: "GET",
          url: `${Cypress.env("API_BASE_URL")}/admin/load-test-results/${testId}`
        }).then((response) => {
          const results = response.body;
          
          expect(results.totalTransactions).to.be.greaterThan(sustainedLoadConfig.totalTransactions * 0.9);
          expect(results.averageResponseTime).to.be.lessThan(2000);
          expect(results.errorRate).to.be.lessThan(0.01);
          expect(results.throughput).to.be.greaterThan(4);
          
          cy.task("log", `📊 Résultats charge soutenue:`);
          cy.task("log", `   - Transactions: ${results.totalTransactions}`);
          cy.task("log", `   - Temps réponse moyen: ${results.averageResponseTime}ms`);
          cy.task("log", `   - Taux d'erreur: ${(results.errorRate * 100).toFixed(2)}%`);
          cy.task("log", `   - Débit: ${results.throughput.toFixed(2)} TPS`);
        });
      });
    });

    it("devrait récupérer gracieusement des pics de charge extrêmes", () => {
      // Simuler un pic de charge extrême
      const extremeLoadConfig = {
        peakTPS: 25, // 25 transactions par seconde
        duration: 30, // 30 secondes de pic
        totalTransactions: 750
      };

      cy.task("log", "🔥 Démarrage test de pic de charge extrême");

      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/simulate-extreme-peak`,
        body: extremeLoadConfig,
        timeout: 60000
      });

      // Monitorer la réaction du système
      cy.loginAsAdmin();
      cy.visit("/admin/system-alerts");

      // Le système devrait détecter la surcharge
      cy.get('[data-cy="overload-detection"]', { timeout: 45000 })
        .should("be.visible")
        .should("contain", "Pic de charge détecté")
        .should("contain", "Mode dégradé activé");

      // Vérifier les mesures d'atténuation automatiques
      cy.get('[data-cy="mitigation-measures"]')
        .should("contain", "Rate limiting activé")
        .should("contain", "Queue de paiements étendue")
        .should("contain", "Notifications client ajustées");

      // Attendre la fin du pic
      cy.get('[data-cy="peak-recovery"]', { timeout: 90000 })
        .should("be.visible")
        .should("contain", "Système stabilisé")
        .should("contain", "Mode normal restauré");

      // Analyser l'impact sur les utilisateurs
      cy.visit("/admin/user-impact-analysis");

      cy.get('[data-cy="impact-metrics"]', { timeout: 15000 })
        .should("be.visible");

      cy.get('[data-cy="affected-users"]')
        .invoke("text")
        .then((affectedCount) => {
          const affected = parseInt(affectedCount);
          expect(affected).to.be.lessThan(100); // Impact limité
        });

      cy.get('[data-cy="average-delay"]')
        .invoke("text")
        .then((delay) => {
          const avgDelay = parseInt(delay.replace("s", ""));
          expect(avgDelay).to.be.lessThan(30); // Délai acceptable
        });

      // Vérifier que tous les paiements ont été traités
      cy.get('[data-cy="queued-payments-processed"]')
        .should("contain", "Toutes les transactions en queue traitées")
        .should("contain", "Aucune perte de données");
    });
  });

  context("🌍 Multi-Currency et Méthodes de Paiement", () => {
    it("devrait gérer tous les modes de paiement européens", () => {
      const europeanPaymentMethods = [
        { method: "sepa_debit", country: "DE", currency: "EUR", testData: "DE89370400440532013000" },
        { method: "bancontact", country: "BE", currency: "EUR", testData: "4000000000000085" },
        { method: "ideal", country: "NL", currency: "EUR", testData: "ideal_bank_selection" },
        { method: "giropay", country: "DE", currency: "EUR", testData: "giropay_redirect" },
        { method: "sofort", country: "AT", currency: "EUR", testData: "sofort_redirect" }
      ];

      europeanPaymentMethods.forEach((payMethod, index) => {
        cy.task("log", `💳 Test ${payMethod.method} (${payMethod.country})`);

        // Créer un projet pour ce mode de paiement
        cy.loginAsUser();
        cy.visit("/commander");
        
        cy.get('[data-cy="project-title"]').type(`Test ${payMethod.method} ${index}`);
        cy.get('[data-cy="project-pages"]').type("100");
        
        // Sélectionner la localisation pour le mode de paiement approprié
        cy.get('[data-cy="billing-country"]').select(payMethod.country);
        cy.get('[data-cy="validate-order"]').click();

        // Vérifier que le mode de paiement est proposé
        cy.get('[data-cy="payment-methods"]', { timeout: 15000 })
          .should("be.visible");

        cy.get(`[data-cy="payment-method-${payMethod.method}"]`)
          .should("be.visible")
          .should("not.be.disabled")
          .click();

        // Configuration spécifique selon le mode de paiement
        if (payMethod.method === "sepa_debit") {
          cy.get('[data-cy="sepa-iban"]').type(payMethod.testData);
          cy.get('[data-cy="sepa-consent"]').check();
          
        } else if (payMethod.method === "ideal") {
          cy.get('[data-cy="ideal-bank"]').select("abn_amro");
          
        } else if (payMethod.method === "bancontact") {
          cy.get('[data-cy="bancontact-card"]').type(payMethod.testData);
        }

        // Simuler le processus de paiement
        cy.get('[data-cy="proceed-payment"]').click();

        // Vérifier la redirection/traitement approprié
        if (["ideal", "giropay", "sofort"].includes(payMethod.method)) {
          // Méthodes avec redirection
          cy.url({ timeout: 20000 }).should(("include"), payMethod.method);
          
          // Simuler le retour de redirection
          cy.request({
            method: "POST",
            url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
            headers: { "Stripe-Signature": "test-signature" },
            body: {
              id: `evt_${payMethod.method}_success_${index}`,
              type: "payment_intent.succeeded",
              data: {
                object: {
                  id: `pi_${payMethod.method}_${index}`,
                  amount: 20000,
                  currency: payMethod.currency.toLowerCase(),
                  payment_method_types: [payMethod.method],
                  status: "succeeded"
                }
              }
            }
          });
          
        } else {
          // Méthodes directes (SEPA, Bancontact)
          cy.get('[data-cy="payment-processing"]', { timeout: 20000 })
            .should("be.visible");
        }

        // Vérifier la confirmation de paiement
        cy.get('[data-cy="payment-success"]', { timeout: 30000 })
          .should("be.visible")
          .should("contain", "Paiement confirmé");

        cy.logout();
      });

      // Analyser les statistiques multi-méthodes
      cy.loginAsAdmin();
      cy.visit("/admin/payment-methods-analytics");

      cy.get('[data-cy="payment-methods-distribution"]', { timeout: 15000 })
        .should("be.visible");

      europeanPaymentMethods.forEach((payMethod) => {
        cy.get('[data-cy="method-stats"]')
          .should("contain", payMethod.method)
          .should("contain", "100% success"); // Tous les tests ont réussi
      });

      // Vérifier les taux de conversion par méthode
      cy.get('[data-cy="conversion-rates"]')
        .should("contain", "SEPA: Taux élevé")
        .should("contain", "iDEAL: Conversion optimale")
        .should("contain", "Bancontact: Performance stable");
    });

    it("devrait optimiser les taux de change en temps réel", () => {
      const currencyTests = [
        { from: "USD", to: "EUR", amount: 1000 },
        { from: "GBP", to: "EUR", amount: 850 },
        { from: "CAD", to: "EUR", amount: 1200 },
        { from: "CHF", to: "EUR", amount: 950 }
      ];

      // Configurer les taux de change de test
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/set-exchange-rates`,
        body: {
          rates: {
            "USD_EUR": 0.85,
            "GBP_EUR": 1.15,
            "CAD_EUR": 0.70,  
            "CHF_EUR": 0.92
          },
          provider: "fixer.io",
          lastUpdate: new Date().toISOString()
        }
      });

      currencyTests.forEach((currencyTest, index) => {
        cy.task("log", `💱 Test conversion ${currencyTest.from} → ${currencyTest.to}`);

        // Créer un projet dans la devise d'origine
        cy.loginAsUser();
        cy.visit("/commander");
        
        cy.get('[data-cy="project-title"]').type(`Projet ${currencyTest.from} ${index}`);
        cy.get('[data-cy="project-pages"]').type("200");
        cy.get('[data-cy="billing-currency"]').select(currencyTest.from);
        
        cy.get('[data-cy="validate-order"]').click();

        // Vérifier l'affichage du montant dans la devise d'origine
        cy.get('[data-cy="order-amount"]', { timeout: 10000 })
          .should("contain", currencyTest.from)
          .should("contain", currencyTest.amount);

        // Vérifier la conversion automatique
        cy.get('[data-cy="currency-conversion"]')
          .should("be.visible")
          .should("contain", "Converti en EUR")
          .should("contain", "Taux appliqué:");

        // Calculer le montant attendu en EUR
        const rateKey = `${currencyTest.from}_EUR`;
        const rates = {
          "USD_EUR": 0.85,
          "GBP_EUR": 1.15, 
          "CAD_EUR": 0.70,
          "CHF_EUR": 0.92
        };
        const expectedEurAmount = Math.round(currencyTest.amount * rates[rateKey]);

        cy.get('[data-cy="converted-amount"]')
          .should("contain", `${expectedEurAmount}€`);

        // Procéder au paiement
        cy.get('[data-cy="proceed-payment"]').click();

        // Vérifier que Stripe reçoit le montant en EUR
        cy.intercept("POST", "**/stripe/payment-intents", (req) => {
          expect(req.body.amount).to.eq(expectedEurAmount * 100); // Centimes
          expect(req.body.currency).to.eq("eur");
          req.reply({ statusCode: 200, body: { id: "pi_currency_test", status: "requires_payment_method" } });
        }).as("stripePaymentIntent");

        cy.wait("@stripePaymentIntent");

        // Simuler le paiement réussi
        cy.simulateStripePayment();

        cy.get('[data-cy="payment-success"]', { timeout: 20000 })
          .should("be.visible");

        cy.logout();
      });

      // Analyser l'impact des conversions
      cy.loginAsAdmin();
      cy.visit("/admin/currency-analytics");

      cy.get('[data-cy="currency-conversion-stats"]', { timeout: 15000 })
        .should("be.visible");

      // Vérifier les métriques de conversion
      cy.get('[data-cy="conversion-volume"]')
        .should("contain", "Total converti:");

      cy.get('[data-cy="exchange-rate-optimization"]')
        .should("contain", "Économies réalisées:")
        .should("contain", "Taux compétitifs appliqués");

      // Vérifier les alertes de fluctuation
      cy.get('[data-cy="rate-fluctuation-alerts"]')
        .should("contain", "Surveillance des taux active")
        .should("contain", "Seuils d'alerte configurés");
    });

    it("devrait gérer la fiscalité internationale automatiquement", () => {
      const taxScenarios = [
        {
          country: "FR",
          vatRate: 20,
          clientType: "individual",
          expectedTax: "TVA française"
        },
        {
          country: "DE", 
          vatRate: 19,
          clientType: "business_with_vat",
          expectedTax: "Reverse charge"
        },
        {
          country: "US",
          vatRate: 0,
          clientType: "individual",
          expectedTax: "Hors UE - Pas de TVA"
        },
        {
          country: "CH",
          vatRate: 0,
          clientType: "business",
          expectedTax: "Hors UE - Pas de TVA"
        }
      ];

      taxScenarios.forEach((scenario, index) => {
        cy.task("log", `🏛️ Test fiscalité ${scenario.country} (${scenario.clientType})`);

        cy.loginAsUser();
        cy.visit("/commander");
        
        // Configuration du client selon le scénario
        cy.get('[data-cy="billing-country"]').select(scenario.country);
        cy.get('[data-cy="client-type"]').select(scenario.clientType);
        
        if (scenario.clientType === "business_with_vat") {
          cy.get('[data-cy="vat-number"]').type(`${scenario.country}123456789`);
        }

        cy.get('[data-cy="project-title"]').type(`Test fiscal ${scenario.country} ${index}`);
        cy.get('[data-cy="project-pages"]').type("100");
        
        // Montant de base pour le calcul fiscal
        const baseAmount = 200; // 200€ HT
        
        cy.get('[data-cy="validate-order"]').click();

        // Vérifier le calcul fiscal automatique
        cy.get('[data-cy="tax-calculation"]', { timeout: 15000 })
          .should("be.visible");

        if (scenario.country === "FR" && scenario.clientType === "individual") {
          // TVA française normale
          const expectedTax = Math.round(baseAmount * scenario.vatRate / 100);
          const totalAmount = baseAmount + expectedTax;
          
          cy.get('[data-cy="base-amount"]').should("contain", `${baseAmount}€`);
          cy.get('[data-cy="tax-amount"]').should("contain", `${expectedTax}€`);
          cy.get('[data-cy="total-amount"]').should("contain", `${totalAmount}€`);
          cy.get('[data-cy="tax-label"]').should("contain", "TVA 20%");
          
        } else if (scenario.clientType === "business_with_vat") {
          // Reverse charge UE
          cy.get('[data-cy="tax-note"]')
            .should("contain", "Reverse charge")
            .should("contain", "Autoliquidation");
          cy.get('[data-cy="total-amount"]').should("contain", `${baseAmount}€`);
          
        } else if (scenario.country === "US" || scenario.country === "CH") {
          // Hors UE - pas de TVA
          cy.get('[data-cy="tax-note"]')
            .should("contain", "Hors Union Européenne")
            .should("contain", "Pas de TVA applicable");
          cy.get('[data-cy="total-amount"]').should("contain", `${baseAmount}€`);
        }

        // Vérifier la conformité réglementaire
        cy.get('[data-cy="compliance-info"]')
          .should("be.visible")
          .should("contain", "Calcul conforme")
          .should("contain", scenario.expectedTax);

        // Procéder au paiement pour valider
        cy.get('[data-cy="proceed-payment"]').click();
        cy.simulateStripePayment();

        cy.get('[data-cy="payment-success"]', { timeout: 20000 })
          .should("be.visible");

        // Vérifier la facture générée
        cy.get('[data-cy="view-invoice"]').click();

        cy.get('[data-cy="invoice-tax-details"]', { timeout: 10000 })
          .should("be.visible")
          .should("contain", scenario.country)
          .should("contain", scenario.expectedTax);

        cy.logout();
      });

      // Vérifier les rapports fiscaux globaux
      cy.loginAsAdmin();
      cy.visit("/admin/tax-reporting");

      cy.get('[data-cy="tax-summary"]', { timeout: 15000 })
        .should("be.visible");

      // Rapport par pays
      taxScenarios.forEach((scenario) => {
        cy.get('[data-cy="tax-by-country"]')
          .should("contain", scenario.country);
      });

      // Vérifier la génération automatique des déclarations
      cy.get('[data-cy="auto-tax-declarations"]')
        .should("contain", "Déclarations TVA automatiques")
        .should("contain", "Export comptable disponible")
        .should("contain", "Conformité réglementaire: ✓");
    });
  });

  context("🤖 Intelligence Artificielle et Prédictions", () => {
    it("devrait prédire et prévenir les fraudes avec IA", () => {
      // Créer des patterns de données pour l'IA anti-fraude
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/seed-fraud-patterns`,
        body: {
          legitimatePatterns: [
            { userAgent: "Mozilla/5.0", timePatterns: "business-hours", velocity: "normal" },
            { geoLocation: "consistent", deviceFingerprint: "stable", behaviorScore: 85 }
          ],
          fraudPatterns: [
            { userAgent: "Bot/1.0", timePatterns: "night-bulk", velocity: "extreme" },
            { geoLocation: "inconsistent", deviceFingerprint: "changing", behaviorScore: 15 }
          ]
        }
      });

      // Simuler des tentatives de paiement suspectes
      const suspiciousAttempts = [
        {
          pattern: "velocity-fraud",
          data: {
            email: "fraud.velocity@test.com",
            attempts: 10,
            timespan: "5-minutes",
            amounts: [999, 998, 997, 996, 995] // Juste sous les limites
          }
        },
        {
          pattern: "geo-inconsistent",
          data: {
            email: "fraud.geo@test.com", 
            locations: ["France", "Nigeria", "Russia", "France"],
            timeGaps: [30, 45, 20] // Minutes entre les tentatives
          }
        },
        {
          pattern: "card-testing",
          data: {
            email: "fraud.cards@test.com",
            cards: ["4000000000000002", "4000000000000069", "4000000000000119"],
            smallAmounts: [1, 2, 5] // Tests avec petits montants
          }
        }
      ];

      suspiciousAttempts.forEach((attempt, index) => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/dev/simulate-fraud-pattern`,
          body: {
            patternType: attempt.pattern,
            data: attempt.data,
            sequenceId: index
          }
        });
      });

      // Vérifier la détection IA
      cy.loginAsAdmin();
      cy.visit("/admin/ai-fraud-detection");

      cy.get('[data-cy="ai-fraud-alerts"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "3 patterns frauduleux détectés");

      // Analyser chaque pattern détecté
      suspiciousAttempts.forEach((attempt, index) => {
        cy.get(`[data-cy="fraud-pattern-${index}"]`).within(() => {
          cy.should("contain", attempt.pattern);
          cy.should("contain", "Score de risque:");
          cy.should("contain", "Actions automatiques:");
          
          if (attempt.pattern === "velocity-fraud") {
            cy.should("contain", "Vitesse anormale détectée");
            cy.should("contain", "Rate limiting appliqué");
          }
          
          if (attempt.pattern === "geo-inconsistent") {
            cy.should("contain", "Géolocalisation incohérente");
            cy.should("contain", "Vérification supplémentaire requise");
          }
          
          if (attempt.pattern === "card-testing") {
            cy.should("contain", "Test de cartes détecté");
            cy.should("contain", "Blocage automatique activé");
          }
        });
      });

      // Vérifier l'apprentissage continu
      cy.get('[data-cy="ai-learning-metrics"]')
        .should("contain", "Modèle mis à jour:")
        .should("contain", "Précision actuelle:")
        .should("contain", "Faux positifs: < 2%");

      // Test de la liste blanche automatique
      cy.get('[data-cy="auto-whitelist"]')
        .should("contain", "Clients fiables identifiés")
        .should("contain", "Processus accéléré pour clients VIP");

      // Simuler une amélioration du modèle
      cy.get('[data-cy="retrain-model"]').click();
      
      cy.get('[data-cy="retraining-progress"]', { timeout: 30000 })
        .should("be.visible");

      cy.get('[data-cy="model-improved"]', { timeout: 60000 })
        .should("be.visible")
        .should("contain", "Modèle amélioré")
        .should("contain", "Nouvelle précision:");
    });

    it("devrait optimiser les tarifs dynamiquement avec IA", () => {
      // Créer des données historiques pour l'IA de pricing
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/create-pricing-history`,
        body: {
          timeRange: "12-months",
          includeSeasonality: true,
          includeCompetitorData: true,
          includeDemandPatterns: true,
          includeCustomerSegments: true
        }
      });

      // Simuler différents scénarios de marché
      const marketScenarios = [
        {
          condition: "high-demand",
          factors: {
            competitorPrices: "increased",
            demandVolume: 150, // 150% de la normale
            customerWillingness: "high",
            seasonality: "peak"
          }
        },
        {
          condition: "low-demand", 
          factors: {
            competitorPrices: "decreased",
            demandVolume: 60, // 60% de la normale
            customerWillingness: "low",
            seasonality: "off-peak"
          }
        },
        {
          condition: "market-disruption",
          factors: {
            competitorPrices: "volatile",
            demandVolume: 200, // Pic soudain
            customerWillingness: "urgent",
            seasonality: "neutral"
          }
        }
      ];

      marketScenarios.forEach((scenario, index) => {
        cy.task("log", `🎯 Test pricing IA: ${scenario.condition}`);

        // Appliquer les conditions de marché
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/dev/set-market-conditions`,
          body: {
            scenario: scenario.condition,
            factors: scenario.factors,
            duration: 300 // 5 minutes
          }
        });

        // Déclencher l'optimisation IA
        cy.loginAsAdmin();
        cy.visit("/admin/dynamic-pricing-ai");

        cy.get('[data-cy="trigger-ai-optimization"]').click();

        // Analyser les recommandations IA
        cy.get('[data-cy="ai-pricing-analysis"]', { timeout: 30000 })
          .should("be.visible");

        cy.get('[data-cy="market-analysis"]')
          .should("contain", scenario.condition.replace("-", " "))
          .should("contain", `Demande: ${scenario.factors.demandVolume}%`);

        if (scenario.condition === "high-demand") {
          cy.get('[data-cy="pricing-recommendations"]')
            .should("contain", "Augmentation recommandée")
            .should("contain", "+15% à +25%")
            .should("contain", "Justification: Forte demande");

          cy.get('[data-cy="revenue-projection"]')
            .should("contain", "Revenus prédits: +35%")
            .should("contain", "Impact satisfaction: Faible");

        } else if (scenario.condition === "low-demand") {
          cy.get('[data-cy="pricing-recommendations"]')
            .should("contain", "Promotion recommandée")
            .should("contain", "-10% à -20%")
            .should("contain", "Stimuler la demande");

          cy.get('[data-cy="customer-acquisition"]')
            .should("contain", "Nouveaux clients prédits: +40%")
            .should("contain", "Rétention améliorée");

        } else if (scenario.condition === "market-disruption") {
          cy.get('[data-cy="pricing-recommendations"]')
            .should("contain", "Stratégie adaptative")
            .should("contain", "Prix flexibles")
            .should("contain", "Surveillance continue");
        }

        // Appliquer les recommandations
        cy.get('[data-cy="apply-ai-recommendations"]').click();
        
        cy.get('[data-cy="confirmation-modal"]', { timeout: 10000 })
          .should("be.visible");

        cy.get('[data-cy="impact-preview"]')
          .should("contain", "Impact estimé sur les ventes")
          .should("contain", "Durée d'application");

        cy.get('[data-cy="confirm-pricing-change"]').click();

        // Vérifier l'application côté client
        cy.logout();
        cy.loginAsUser();
        cy.visit("/tarifs");

        cy.get('[data-cy="current-pricing"]', { timeout: 15000 })
          .should("be.visible");

        if (scenario.condition === "high-demand") {
          cy.get('[data-cy="pricing-notice"]')
            .should("contain", "Période de forte demande")
            .should("contain", "Tarifs ajustés temporairement");
            
        } else if (scenario.condition === "low-demand") {
          cy.get('[data-cy="promotion-banner"]')
            .should("contain", "Offre spéciale")
            .should("contain", "Réduction limitée dans le temps");
        }

        cy.logout();

        // Analyser les résultats après 1 heure simulée
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/dev/fast-forward-time`,
          body: { hours: 1 }
        });

        cy.loginAsAdmin();
        cy.visit("/admin/pricing-performance");

        cy.get('[data-cy="real-performance"]', { timeout: 15000 })
          .should("be.visible");

        // Comparer prédictions vs réalité
        cy.get('[data-cy="prediction-accuracy"]')
          .should("contain", "Précision IA:")
          .should("contain", "%");

        cy.get('[data-cy="performance-vs-prediction"]')
          .should("contain", "Ventes réelles vs prédites")
          .should("contain", "Écart:");

        // L'IA apprend des résultats
        cy.get('[data-cy="ai-learning"]')
          .should("contain", "Modèle mis à jour avec résultats réels")
          .should("contain", "Précision améliorée pour futures prédictions");
      });

      // Analyser l'évolution globale de l'IA
      cy.visit("/admin/ai-pricing-evolution");

      cy.get('[data-cy="ai-evolution-metrics"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Amélioration continue détectée")
        .should("contain", "ROI pricing IA: +")
        .should("contain", "Temps de réaction optimisé");
    });

    it("devrait personnaliser l'expérience paiement par client", () => {
      // Créer des profils clients variés
      const clientProfiles = [
        {
          segment: "premium",
          characteristics: {
            avgOrderValue: 1500,
            frequency: "monthly",
            paymentHistory: "perfect",
            preferredMethod: "card",
            riskScore: "low"
          }
        },
        {
          segment: "price-sensitive",
          characteristics: {
            avgOrderValue: 300,
            frequency: "quarterly", 
            paymentHistory: "good",
            preferredMethod: "bank_transfer",
            riskScore: "medium"
          }
        },
        {
          segment: "new-customer",
          characteristics: {
            avgOrderValue: 0,
            frequency: "none",
            paymentHistory: "unknown",
            preferredMethod: "unknown",
            riskScore: "unknown"
          }
        }
      ];

      clientProfiles.forEach((profile, index) => {
        // Créer le profil client avec historique
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/dev/create-client-profile-advanced`,
          body: {
            email: `personalization.${profile.segment}@test.com`,
            segment: profile.segment,
            characteristics: profile.characteristics,
            transactionHistory: profile.segment !== "new-customer" ? 10 : 0
          }
        });

        // Test de personnalisation
        cy.loginAsUser();
        cy.visit("/commander");

        cy.get('[data-cy="project-title"]').type(`Test Personnalisation ${profile.segment}`);
        cy.get('[data-cy="project-pages"]').type("200");
        cy.get('[data-cy="validate-order"]').click();

        // L'IA devrait personnaliser l'expérience
        cy.get('[data-cy="personalized-experience"]', { timeout: 20000 })
          .should("be.visible");

        if (profile.segment === "premium") {
          // Expérience VIP
          cy.get('[data-cy="vip-treatment"]')
            .should("contain", "Client Premium")
            .should("contain", "Conditions préférentielles");

          cy.get('[data-cy="payment-options"]')
            .should("contain", "Paiement différé disponible")
            .should("contain", "Crédit instantané")
            .should("contain", "Remise fidélité automatique");

          cy.get('[data-cy="premium-support"]')
            .should("contain", "Support prioritaire")
            .should("contain", "Délais raccourcis");

        } else if (profile.segment === "price-sensitive") {
          // Focus sur les économies
          cy.get('[data-cy="value-proposition"]')
            .should("contain", "Meilleures offres pour vous")
            .should("contain", "Économies possibles");

          cy.get('[data-cy="payment-suggestions"]')
            .should("contain", "Paiement échelonné sans frais")
            .should("contain", "Virement bancaire: -3%")
            .should("contain", "Paiement groupé: -5%");

          cy.get('[data-cy="cost-optimization"]')
            .should("contain", "Optimisation automatique appliquée")
            .should("contain", "Prix le plus avantageux sélectionné");

        } else if (profile.segment === "new-customer") {
          // Onboarding et confiance
          cy.get('[data-cy="trust-building"]')
            .should("contain", "Bienvenue chez Staka Livres")
            .should("contain", "Première commande sécurisée");

          cy.get('[data-cy="onboarding-help"]')
            .should("contain", "Guide du processus")
            .should("contain", "Garantie satisfaction")
            .should("contain", "Exemple de travail gratuit");

          cy.get('[data-cy="simplified-flow"]')
            .should("contain", "Processus simplifié")
            .should("contain", "Étapes guidées")
            .should("contain", "Chat support disponible");
        }

        // Vérifier la mémorisation des préférences
        cy.get('[data-cy="preference-learning"]')
          .should("contain", "Préférences enregistrées")
          .should("contain", "Expérience améliorée lors de la prochaine visite");

        cy.logout();
      });

      // Analyser l'efficacité de la personnalisation
      cy.loginAsAdmin();
      cy.visit("/admin/personalization-analytics");

      cy.get('[data-cy="personalization-performance"]', { timeout: 15000 })
        .should("be.visible");

      // Métriques par segment
      clientProfiles.forEach((profile) => {
        cy.get(`[data-cy="segment-${profile.segment}"]`)
          .should("contain", "Taux de conversion:")
          .should("contain", "Satisfaction:")
          .should("contain", "Valeur moyenne commande:");
      });

      // Impact global de la personnalisation
      cy.get('[data-cy="personalization-impact"]')
        .should("contain", "Conversion globale: +")
        .should("contain", "Satisfaction client: +")
        .should("contain", "Valeur vie client: +");

      // A/B testing automatique
      cy.get('[data-cy="auto-ab-testing"]')
        .should("contain", "Tests A/B en cours")
        .should("contain", "Optimisation continue")
        .should("contain", "Nouveaux segments détectés");
    });
  });

  after(() => {
    // Nettoyage complet des tests enterprise
    cy.task("log", "🧹 Nettoyage final des tests paiements enterprise");
    
    // Nettoyer les données de test
    cy.request({
      method: "DELETE", 
      url: `${Cypress.env("API_BASE_URL")}/dev/cleanup-payment-test-data`,
      failOnStatusCode: false
    });

    // Réinitialiser les paramètres de paiement
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_BASE_URL")}/dev/reset-payment-settings`,
      failOnStatusCode: false
    });

    // Désactiver les optimisations de test
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_BASE_URL")}/dev/disable-ai-test-mode`,
      failOnStatusCode: false
    });
  });
});