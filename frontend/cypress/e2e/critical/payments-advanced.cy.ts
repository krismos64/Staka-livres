/// <reference types="cypress" />

/**
 * Tests E2E - Paiements Avancés Stripe (Critique)
 * 
 * Tests critiques des fonctionnalités de paiement avancées avec Stripe.
 * Couvre tous les scénarios de paiement essentiels, webhooks, gestion d'erreurs
 * et cas d'usage complexes pour assurer la fiabilité financière.
 * 
 * Couverture critique :
 * - Webhooks Stripe complets (tous événements)
 * - Remboursements et disputes
 * - Paiements échelonnés et récurrents  
 * - Gestion des erreurs et récupération
 * - Synchronisation tarifs Stripe ↔ BDD
 * - Tests de sécurité paiement
 */

describe("💳 Paiements Avancés Stripe - Tests Critiques", () => {
  const testData = {
    client: {
      email: "client.payment@test.com",
      name: "Client Test Payment",
      stripeCustomerId: "cus_test_payment_123"
    },
    testCards: {
      success: "4242424242424242",
      declined: "4000000000000002", 
      insufficient: "4000000000009995",
      expired: "4000000000000069",
      cvc_fail: "4000000000000127",
      disputed: "4000000000000259"
    },
    projects: {
      simple: { title: "Test Simple", pages: 100, amount: 200 },
      complex: { title: "Test Complexe", pages: 500, amount: 1000 },
      urgent: { title: "Test Urgent", pages: 150, amount: 450, priority: "urgent" }
    },
    webhookEvents: [
      "payment_intent.succeeded",
      "payment_intent.payment_failed", 
      "charge.dispute.created",
      "invoice.payment_succeeded",
      "customer.subscription.updated"
    ]
  };

  beforeEach(() => {
    // Configuration pour tests paiement critiques
    cy.resetDatabase();
    cy.visit("/");
    cy.wait(2000);

    // Vérifier que Stripe est configuré
    cy.window().then((win) => {
      expect(win.Stripe).to.exist;
    });
  });

  context("🔗 Webhooks Stripe Complets", () => {
    it("devrait traiter tous les webhooks Stripe essentiels", () => {
      // Créer un projet pour les tests webhooks
      cy.loginAsUser();
      cy.visit("/commander");
      
      cy.get('[data-cy="project-title"]').type(testData.projects.simple.title);
      cy.get('[data-cy="project-pages"]').type(testData.projects.simple.pages.toString());
      cy.get('[data-cy="validate-order"]').click();

      // Déclencher une session de paiement
      cy.get('[data-cy="proceed-payment"]').click();
      cy.url({ timeout: 15000 }).should("include", "/paiement");

      // Sauvegarder les détails de la session
      let sessionId: string;
      let paymentIntentId: string;

      cy.window().then((win) => {
        // Récupérer les identifiants depuis l'interface Stripe
        cy.get('[data-cy="stripe-session-id"]')
          .invoke("attr", "data-session-id")
          .then((id) => {
            sessionId = id;
            cy.wrap(sessionId).as("sessionId");
          });
      });

      // === TEST WEBHOOK: payment_intent.succeeded ===
      cy.task("log", "🔹 Test webhook: payment_intent.succeeded");
      
      cy.simulateStripePayment();
      
      // Simuler le webhook Stripe
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
        headers: {
          "Stripe-Signature": "test-signature",
          "Content-Type": "application/json"
        },
        body: {
          id: "evt_payment_succeeded_123",
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: "pi_test_success_123",
              amount: testData.projects.simple.amount * 100,
              currency: "eur",
              status: "succeeded",
              metadata: {
                projectId: "project_test_123",
                clientEmail: testData.client.email
              }
            }
          },
          created: Math.floor(Date.now() / 1000)
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.received).to.be.true;
      });

      // Vérifier le traitement du webhook
      cy.get('[data-cy="payment-success"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "Paiement confirmé");

      // === TEST WEBHOOK: charge.dispute.created ===
      cy.task("log", "🔹 Test webhook: charge.dispute.created");

      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
        headers: {
          "Stripe-Signature": "test-signature",
          "Content-Type": "application/json"
        },
        body: {
          id: "evt_dispute_created_123",
          type: "charge.dispute.created",
          data: {
            object: {
              id: "dp_test_dispute_123",
              amount: testData.projects.simple.amount * 100,
              currency: "eur",
              reason: "fraudulent",
              status: "warning_needs_response",
              charge: "ch_test_charge_123",
              metadata: {
                projectId: "project_test_123"
              }
            }
          }
        }
      });

      // Vérifier la gestion de dispute côté admin
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/disputes");

      cy.get('[data-cy="active-disputes"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "1 dispute active")
        .should("contain", "fraudulent")
        .should("contain", testData.projects.simple.title);

      cy.get('[data-cy="dispute-details"]')
        .should("contain", "Réponse requise")
        .should("contain", "dp_test_dispute_123");

      // === TEST WEBHOOK: payment_intent.payment_failed ===
      cy.task("log", "🔹 Test webhook: payment_intent.payment_failed");

      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
        headers: { "Stripe-Signature": "test-signature" },
        body: {
          id: "evt_payment_failed_123",
          type: "payment_intent.payment_failed",
          data: {
            object: {
              id: "pi_test_failed_123",
              amount: 50000,
              currency: "eur",
              status: "requires_payment_method",
              last_payment_error: {
                code: "card_declined",
                decline_code: "insufficient_funds",
                message: "Your card has insufficient funds."
              },
              metadata: {
                projectId: "project_failed_123",
                clientEmail: testData.client.email
              }
            }
          }
        }
      });

      // Vérifier les notifications d'échec
      cy.visit("/admin/payment-failures");

      cy.get('[data-cy="failed-payments"]', { timeout: 10000 })
        .should("contain", "pi_test_failed_123")
        .should("contain", "insufficient_funds")
        .should("contain", "Client notifié automatiquement");
    });

    it("devrait valider les signatures webhook pour la sécurité", () => {
      // Test avec signature invalide
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
        headers: {
          "Stripe-Signature": "invalid-signature",
          "Content-Type": "application/json"
        },
        body: {
          id: "evt_invalid_signature",
          type: "payment_intent.succeeded",
          data: { object: { id: "pi_fake_123" } }
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.contain("Invalid signature");
      });

      // Test avec signature valide (simulée)
      cy.request({
        method: "POST", 
        url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
        headers: {
          "Stripe-Signature": "t=1234567890,v1=valid-test-signature-hash",
          "Content-Type": "application/json"
        },
        body: {
          id: "evt_valid_signature",
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: "pi_valid_signature_123",
              amount: 20000,
              status: "succeeded"
            }
          }
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.received).to.be.true;
      });

      // Vérifier les logs de sécurité
      cy.loginAsAdmin();
      cy.visit("/admin/security-logs");

      cy.get('[data-cy="webhook-security-logs"]', { timeout: 10000 })
        .should("contain", "Signature webhook invalide bloquée")
        .should("contain", "Tentative d'accès non autorisé");
    });

    it("devrait gérer l'idempotence des webhooks (doublons)", () => {
      const duplicateWebhook = {
        id: "evt_duplicate_test_123", // Même ID
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_duplicate_test_123",
            amount: 30000,
            status: "succeeded",
            metadata: { projectId: "project_duplicate_123" }
          }
        }
      };

      // Premier envoi du webhook
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
        headers: { "Stripe-Signature": "test-signature" },
        body: duplicateWebhook
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.processed).to.be.true;
      });

      // Deuxième envoi du même webhook (doublon)
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
        headers: { "Stripe-Signature": "test-signature" },
        body: duplicateWebhook
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.processed).to.be.false;
        expect(response.body.message).to.contain("Already processed");
      });

      // Vérifier qu'une seule transaction a été créée
      cy.loginAsAdmin();
      cy.visit("/admin/transactions");

      cy.get('[data-cy="transaction-list"]')
        .should("contain", "pi_duplicate_test_123");

      cy.get('[data-cy="transaction-list"] [data-transaction-id="pi_duplicate_test_123"]')
        .should("have.length", 1); // Une seule occurrence
    });
  });

  context("💰 Remboursements et Disputes", () => {
    it("devrait traiter les remboursements complets et partiels", () => {
      // Créer un projet payé
      cy.createPaidProject("Projet Remboursement").then((projectId) => {
        cy.loginAsAdmin();
        cy.visit(`/admin/projects/${projectId}`);

        // Interface de remboursement
        cy.get('[data-cy="project-actions"]').click();
        cy.get('[data-cy="process-refund"]').click();

        cy.get('[data-cy="refund-modal"]', { timeout: 10000 })
          .should("be.visible");

        // Test remboursement partiel
        cy.get('[data-cy="refund-type"]').select("partial");
        cy.get('[data-cy="refund-amount"]').type("150"); // Remboursement de 150€
        cy.get('[data-cy="refund-reason"]').select("client-request");
        cy.get('[data-cy="refund-notes"]')
          .type("Client insatisfait de la qualité de correction du chapitre 3");

        cy.get('[data-cy="process-refund-btn"]').click();

        // Simuler la réponse Stripe
        cy.intercept("POST", "**/stripe/refunds", {
          statusCode: 200,
          body: {
            id: "re_test_refund_123",
            amount: 15000, // 150€ en centimes
            currency: "eur",
            status: "succeeded",
            charge: "ch_test_charge_123"
          }
        }).as("stripeRefund");

        cy.wait("@stripeRefund");

        // Vérifier le traitement du remboursement
        cy.get('[data-cy="refund-success"]', { timeout: 15000 })
          .should("be.visible")
          .should("contain", "Remboursement traité avec succès")
          .should("contain", "150€")
          .should("contain", "re_test_refund_123");

        // Vérifier la notification client
        cy.get('[data-cy="client-notification"]')
          .should("contain", "Client notifié automatiquement")
          .should("contain", "Email de confirmation envoyé");

        // Vérifier l'historique des remboursements
        cy.visit("/admin/refunds");

        cy.get('[data-cy="refund-history"]', { timeout: 10000 })
          .should("contain", "Projet Remboursement")
          .should("contain", "150€")
          .should("contain", "Partiel")
          .should("contain", "client-request");

        // Test remboursement complet
        cy.visit(`/admin/projects/${projectId}`);
        cy.get('[data-cy="project-actions"]').click();
        cy.get('[data-cy="process-refund"]').click();

        cy.get('[data-cy="refund-type"]').select("full");
        cy.get('[data-cy="refund-reason"]').select("service-issue");
        cy.get('[data-cy="refund-notes"]')
          .type("Problème technique majeur - remboursement complet accordé");

        cy.get('[data-cy="process-refund-btn"]').click();

        // Vérifier les validations
        cy.get('[data-cy="refund-warning"]')
          .should("contain", "Remboursement complet supprimera le projet")
          .should("contain", "Cette action est irréversible");

        cy.get('[data-cy="confirm-full-refund"]').click();

        cy.get('[data-cy="full-refund-success"]', { timeout: 15000 })
          .should("be.visible")
          .should("contain", "Remboursement complet traité");

        // Vérifier que le projet est archivé
        cy.visit("/admin/projets");
        cy.get('[data-cy="project-list"]')
          .should("not.contain", "Projet Remboursement");

        cy.visit("/admin/archived-projects");
        cy.get('[data-cy="archived-list"]')
          .should("contain", "Projet Remboursement")
          .should("contain", "Remboursé intégralement");
      });
    });

    it("devrait gérer les disputes automatiquement avec preuves", () => {
      cy.createPaidProject("Projet Dispute").then((projectId) => {
        // Simuler une dispute Stripe
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
          headers: { "Stripe-Signature": "test-signature" },
          body: {
            id: "evt_dispute_advanced_123",
            type: "charge.dispute.created",
            data: {
              object: {
                id: "dp_advanced_dispute_123",
                amount: 50000, // 500€
                currency: "eur",
                reason: "unrecognized",
                status: "warning_needs_response",
                evidence_deadline: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 jours
                charge: "ch_dispute_charge_123",
                metadata: {
                  projectId: projectId
                }
              }
            }
          }
        });

        cy.loginAsAdmin();
        cy.visit("/admin/disputes");

        // Interface de gestion des disputes
        cy.get('[data-cy="dispute-list"]', { timeout: 15000 })
          .should("contain", "dp_advanced_dispute_123")
          .should("contain", "unrecognized")
          .should("contain", "7 jours restants");

        cy.get('[data-cy="dispute-list"]')
          .contains("dp_advanced_dispute_123")
          .closest('[data-cy="dispute-row"]')
          .within(() => {
            cy.get('[data-cy="handle-dispute"]').click();
          });

        // Workspace de gestion de dispute
        cy.get('[data-cy="dispute-workspace"]', { timeout: 10000 })
          .should("be.visible");

        // Collecte automatique des preuves
        cy.get('[data-cy="auto-evidence-collection"]').click();

        cy.get('[data-cy="evidence-progress"]', { timeout: 20000 })
          .should("contain", "Collecte des preuves en cours...");

        // Vérifier les preuves collectées
        cy.get('[data-cy="collected-evidence"]', { timeout: 30000 })
          .should("be.visible");

        cy.get('[data-cy="evidence-list"]').within(() => {
          cy.get('[data-cy="evidence-transaction"]')
            .should("contain", "Détails de la transaction")
            .should("contain", "Horodatage");

          cy.get('[data-cy="evidence-communication"]')
            .should("contain", "Historique des communications")
            .should("contain", "Emails échangés");

          cy.get('[data-cy="evidence-delivery"]')
            .should("contain", "Preuve de livraison")
            .should("contain", "Accusé de réception");

          cy.get('[data-cy="evidence-contract"]')
            .should("contain", "Conditions de service")
            .should("contain", "Acceptation client");
        });

        // Ajouter des preuves manuelles
        cy.get('[data-cy="add-manual-evidence"]').click();
        
        cy.get('[data-cy="evidence-type"]').select("additional-documentation");
        cy.get('[data-cy="evidence-description"]')
          .type("Correspondance email supplémentaire prouvant la satisfaction initiale du client");
        
        cy.get('[data-cy="evidence-file"]')
          .selectFile("cypress/fixtures/dispute-evidence.pdf", { force: true });

        cy.get('[data-cy="add-evidence"]').click();

        // Soumettre la défense à Stripe
        cy.get('[data-cy="submit-dispute-response"]').click();

        cy.get('[data-cy="dispute-submission-summary"]', { timeout: 10000 })
          .should("be.visible")
          .should("contain", "4 preuves collectées")
          .should("contain", "1 preuve manuelle")
          .should("contain", "Prêt pour soumission");

        cy.get('[data-cy="confirm-submission"]').click();

        // Simuler la soumission à Stripe
        cy.intercept("POST", "**/stripe/disputes/*/submit", {
          statusCode: 200,
          body: {
            id: "dp_advanced_dispute_123",
            status: "under_review",
            evidence_details: {
              submission_count: 1,
              has_evidence: true
            }
          }
        }).as("disputeSubmission");

        cy.wait("@disputeSubmission");

        cy.get('[data-cy="dispute-submitted"]', { timeout: 15000 })
          .should("be.visible")
          .should("contain", "Défense soumise à Stripe")
          .should("contain", "Statut: En cours d'examen");

        // Suivi de la dispute
        cy.get('[data-cy="dispute-tracking"]')
          .should("contain", "Réponse estimée: 7-10 jours")
          .should("contain", "Notifications automatiques activées");
      });
    });

    it("devrait calculer automatiquement les frais de dispute", () => {
      const disputeData = {
        amount: 75000, // 750€
        disputeFee: 1500, // 15€ frais Stripe
        handlingFee: 2500 // 25€ frais de gestion interne
      };

      // Simuler une dispute avec calcul des frais
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
        headers: { "Stripe-Signature": "test-signature" },
        body: {
          id: "evt_dispute_fees_123",
          type: "charge.dispute.created",
          data: {
            object: {
              id: "dp_fees_calculation_123",
              amount: disputeData.amount,
              currency: "eur",
              reason: "fraudulent",
              status: "warning_needs_response",
              balance_transactions: [{
                amount: -disputeData.disputeFee, // Frais Stripe
                fee: 0,
                net: -disputeData.disputeFee,
                type: "dispute"
              }]
            }
          }
        }
      });

      cy.loginAsAdmin();
      cy.visit("/admin/financial-impact");

      // Analyser l'impact financier
      cy.get('[data-cy="dispute-impact"]', { timeout: 15000 })
        .should("be.visible");

      cy.get('[data-cy="dispute-costs"]').within(() => {
        cy.get('[data-cy="disputed-amount"]')
          .should("contain", "750€");

        cy.get('[data-cy="stripe-fees"]')
          .should("contain", "15€");

        cy.get('[data-cy="handling-fees"]')
          .should("contain", "25€"); // Calculé automatiquement

        cy.get('[data-cy="total-risk"]')
          .should("contain", "790€"); // 750 + 15 + 25
      });

      // Recommandations automatiques
      cy.get('[data-cy="cost-recommendations"]')
        .should("contain", "Dispute recommandée") // Montant élevé
        .should("contain", "Preuves solides collectées")
        .should("contain", "Probabilité de succès: 75%");

      // Impact sur les métriques
      cy.visit("/admin/kpis");

      cy.get('[data-cy="dispute-metrics"]', { timeout: 10000 })
        .should("contain", "Taux de dispute: 1.2%")
        .should("contain", "Coût moyen dispute: 40€")
        .should("contain", "Taux de succès défense: 80%");
    });
  });

  context("📅 Paiements Échelonnés et Récurrents", () => {
    it("devrait gérer les paiements en plusieurs fois", () => {
      const installmentProject = {
        title: "Grand Projet Échelonné",
        totalAmount: 1500, // 1500€
        installments: 3, // 3 fois 500€
        frequency: "monthly"
      };

      cy.loginAsUser();
      cy.visit("/commander");

      // Commander un gros projet
      cy.get('[data-cy="project-title"]').type(installmentProject.title);
      cy.get('[data-cy="project-pages"]').type("750");
      cy.get('[data-cy="project-complexity"]').select("Très élevée");

      // Option paiement échelonné
      cy.get('[data-cy="payment-options"]').click();
      cy.get('[data-cy="installment-payment"]').check();

      cy.get('[data-cy="installment-config"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="installment-count"]').select("3");
      cy.get('[data-cy="installment-frequency"]').select("monthly");

      // Vérifier le calcul automatique
      cy.get('[data-cy="installment-breakdown"]')
        .should("contain", "3 × 500€")
        .should("contain", "Premier paiement: Immédiat")
        .should("contain", "Paiements suivants: Mensuel");

      cy.get('[data-cy="validate-order"]').click();

      // Première échéance (immédiate)
      cy.get('[data-cy="first-installment"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Premier paiement: 500€");

      cy.get('[data-cy="proceed-first-payment"]').click();
      cy.simulateStripePayment();

      // Vérifier la création de la subscription
      cy.get('[data-cy="subscription-created"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "Plan de paiement activé")
        .should("contain", "Prochaine échéance");

      // Vérifier côté admin
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/subscriptions");

      cy.get('[data-cy="active-subscriptions"]', { timeout: 10000 })
        .should("contain", installmentProject.title)
        .should("contain", "2 paiements restants")
        .should("contain", "500€/mois");

      // Simuler le webhook de paiement récurrent
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
        headers: { "Stripe-Signature": "test-signature" },
        body: {
          id: "evt_subscription_payment_123",
          type: "invoice.payment_succeeded",
          data: {
            object: {
              id: "in_installment_payment_123",
              amount_paid: 50000, // 500€
              subscription: "sub_installment_123",
              customer: testData.client.stripeCustomerId,
              status: "paid",
              metadata: {
                projectId: "project_installment_123",
                installmentNumber: "2"
              }
            }
          }
        }
      });

      // Vérifier la mise à jour
      cy.reload();
      cy.wait(3000);

      cy.get('[data-cy="subscription-progress"]')
        .should("contain", "2/3 paiements effectués")
        .should("contain", "Prochaine échéance:");

      // Vérifier les notifications automatiques
      cy.get('[data-cy="automatic-notifications"]')
        .should("contain", "Client notifié du paiement")
        .should("contain", "Rappel programmé pour prochaine échéance");
    });

    it("devrait gérer les échecs de paiements récurrents", () => {
      // Simuler un échec de paiement sur subscription
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
        headers: { "Stripe-Signature": "test-signature" },
        body: {
          id: "evt_subscription_failed_123",
          type: "invoice.payment_failed",
          data: {
            object: {
              id: "in_failed_payment_123",
              amount_due: 50000,
              subscription: "sub_failed_payment_123",
              customer: testData.client.stripeCustomerId,
              status: "open",
              attempt_count: 1,
              next_payment_attempt: Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60), // +3 jours
              last_finalization_error: {
                code: "card_declined",
                decline_code: "insufficient_funds"
              },
              metadata: {
                projectId: "project_failed_installment_123"
              }
            }
          }
        }
      });

      cy.loginAsAdmin();
      cy.visit("/admin/payment-failures");

      // Vérifier la gestion des échecs
      cy.get('[data-cy="failed-recurring-payments"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "in_failed_payment_123")
        .should("contain", "insufficient_funds")
        .should("contain", "Tentative 1/3");

      // Actions de récupération automatiques
      cy.get('[data-cy="recovery-actions"]')
        .should("contain", "Email de relance envoyé")
        .should("contain", "Prochaine tentative: 3 jours")
        .should("contain", "Méthode de paiement à mettre à jour");

      // Simuler plusieurs échecs consécutifs
      [2, 3].forEach((attemptCount) => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
          headers: { "Stripe-Signature": "test-signature" },
          body: {
            id: `evt_subscription_failed_${attemptCount}_123`,
            type: "invoice.payment_failed",
            data: {
              object: {
                id: "in_failed_payment_123",
                attempt_count: attemptCount,
                status: attemptCount === 3 ? "void" : "open",
                metadata: { projectId: "project_failed_installment_123" }
              }
            }
          }
        });
      });

      // Après 3 échecs, suspension automatique
      cy.reload();
      cy.wait(3000);

      cy.get('[data-cy="suspended-subscriptions"]')
        .should("contain", "project_failed_installment_123")
        .should("contain", "Suspendu après 3 échecs")
        .should("contain", "Client contacté pour résolution");

      // Plan de récupération
      cy.get('[data-cy="recovery-plan"]')
        .should("contain", "Contact téléphonique programmé")
        .should("contain", "Proposition de nouveau plan")
        .should("contain", "Remise de récupération: 10%");
    });

    it("devrait optimiser les plans de paiement selon le profil client", () => {
      const clientProfiles = [
        {
          type: "premium",
          creditScore: "excellent",
          paymentHistory: "perfect",
          recommendedPlan: "flexible"
        },
        {
          type: "standard", 
          creditScore: "good",
          paymentHistory: "good",
          recommendedPlan: "standard"
        },
        {
          type: "new",
          creditScore: "unknown",
          paymentHistory: "none",
          recommendedPlan: "secure"
        }
      ];

      clientProfiles.forEach((profile, index) => {
        // Créer un profil client spécifique
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/dev/create-client-profile`,
          body: {
            email: `client.${profile.type}@test.com`,
            profile: profile
          }
        });

        // Login avec ce profil
        cy.loginAsUser();
        cy.visit("/commander");

        cy.get('[data-cy="project-title"]').type(`Projet ${profile.type} ${index}`);
        cy.get('[data-cy="project-pages"]').type("300");
        cy.get('[data-cy="payment-options"]').click();

        // L'IA devrait proposer le plan adapté
        cy.get('[data-cy="ai-payment-recommendations"]', { timeout: 15000 })
          .should("be.visible")
          .should("contain", `Plan recommandé: ${profile.recommendedPlan}`);

        if (profile.type === "premium") {
          cy.get('[data-cy="premium-options"]')
            .should("contain", "Paiement différé disponible")
            .should("contain", "Conditions préférentielles")
            .should("contain", "Remise fidélité: 5%");
        
        } else if (profile.type === "new") {
          cy.get('[data-cy="security-requirements"]')
            .should("contain", "Premier paiement requis")
            .should("contain", "Vérification renforcée")
            .should("contain", "Limite initiale: 500€");
        }

        // Vérifier les conditions proposées
        cy.get('[data-cy="payment-conditions"]').within(() => {
          if (profile.recommendedPlan === "flexible") {
            cy.should("contain", "Jusqu'à 6 mensualités");
            cy.should("contain", "Aucun frais");
          } else if (profile.recommendedPlan === "secure") {
            cy.should("contain", "Maximum 2 mensualités");
            cy.should("contain", "Caution: 50€");
          }
        });

        cy.logout();
      });

      // Analyser l'efficacité des recommandations IA
      cy.loginAsAdmin();
      cy.visit("/admin/payment-ai-analytics");

      cy.get('[data-cy="ai-recommendations-performance"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Taux d'acceptation: 94%")
        .should("contain", "Réduction des impayés: 67%")
        .should("contain", "Satisfaction client: 4.8/5");
    });
  });

  context("🛡️ Sécurité et Récupération", () => {
    it("devrait détecter et bloquer les tentatives frauduleuses", () => {
      const fraudPatterns = [
        {
          type: "multiple-cards-same-ip",
          cards: [testData.testCards.success, testData.testCards.declined, testData.testCards.expired],
          ip: "192.168.1.100"
        },
        {
          type: "velocity-fraud",
          rapidPayments: 5,
          timeWindow: "5-minutes"
        },
        {
          type: "suspicious-amounts",
          amounts: [99999, 99998, 99997] // Juste sous la limite
        }
      ];

      // Simuler des patterns frauduleux
      fraudPatterns[0].cards.forEach((cardNumber, index) => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/payments/attempt`,
          headers: {
            "X-Forwarded-For": fraudPatterns[0].ip,
            "User-Agent": "Same-Bot/1.0"
          },
          body: {
            amount: 20000,
            cardNumber: cardNumber,
            projectId: `fraud_test_${index}`
          },
          failOnStatusCode: false
        });
      });

      // Vérifier la détection de fraude
      cy.loginAsAdmin();
      cy.visit("/admin/fraud-detection");

      cy.get('[data-cy="fraud-alerts"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Pattern frauduleux détecté")
        .should("contain", "Multiples cartes même IP")
        .should("contain", "IP bloquée: 192.168.1.100");

      // Vérifier les actions automatiques
      cy.get('[data-cy="auto-fraud-actions"]')
        .should("contain", "IP ajoutée à la liste noire")
        .should("contain", "Transactions suspendues")
        .should("contain", "Équipe sécurité notifiée");

      // Test de déblocage manuel
      cy.get('[data-cy="blocked-ips"]')
        .contains("192.168.1.100")
        .closest('[data-cy="blocked-ip-row"]')
        .within(() => {
          cy.get('[data-cy="review-block"]').click();
        });

      cy.get('[data-cy="block-review-modal"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="block-reason"]')
        .should("contain", "Multiple payment attempts")
        .should("contain", "Risk score: 95/100");

      // Débloquer après vérification
      cy.get('[data-cy="unblock-ip"]').click();
      cy.get('[data-cy="unblock-reason"]')
        .type("Vérification manuelle effectuée - client légitime confirmé");
      
      cy.get('[data-cy="confirm-unblock"]').click();

      cy.get('[data-cy="ip-unblocked"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "IP débloquée avec succès");
    });

    it("devrait implémenter la récupération automatique des paiements échoués", () => {
      const recoveryScenarios = [
        {
          failureType: "insufficient_funds",
          retryDelay: "3-days",
          retryCount: 3,
          recovery: "smart-retry"
        },
        {
          failureType: "expired_card",
          retryDelay: "immediate", 
          retryCount: 0,
          recovery: "update-payment-method"
        },
        {
          failureType: "network_error",
          retryDelay: "1-hour",
          retryCount: 5,
          recovery: "automatic-retry"
        }
      ];

      recoveryScenarios.forEach((scenario, index) => {
        // Simuler l'échec de paiement
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/webhooks/stripe`,
          headers: { "Stripe-Signature": "test-signature" },
          body: {
            id: `evt_recovery_${index}_123`,
            type: "payment_intent.payment_failed",
            data: {
              object: {
                id: `pi_recovery_${index}_123`,
                amount: 30000,
                status: "requires_payment_method",
                last_payment_error: {
                  code: "card_declined",
                  decline_code: scenario.failureType
                },
                metadata: {
                  projectId: `project_recovery_${index}`,
                  clientEmail: `client.recovery.${index}@test.com`
                }
              }
            }
          }
        });
      });

      // Vérifier les stratégies de récupération
      cy.loginAsAdmin();
      cy.visit("/admin/payment-recovery");

      cy.get('[data-cy="recovery-strategies"]', { timeout: 15000 })
        .should("be.visible");

      // Vérifier les différentes approches
      recoveryScenarios.forEach((scenario, index) => {
        cy.get(`[data-cy="recovery-${index}"]`).within(() => {
          cy.should("contain", scenario.failureType);
          cy.should("contain", scenario.recovery);
          
          if (scenario.recovery === "smart-retry") {
            cy.should("contain", `Retry dans ${scenario.retryDelay}`);
            cy.should("contain", `${scenario.retryCount} tentatives max`);
          }
          
          if (scenario.recovery === "update-payment-method") {
            cy.should("contain", "Email envoyé pour mise à jour");
            cy.should("contain", "Lien sécurisé généré");
          }
          
          if (scenario.recovery === "automatic-retry") {
            cy.should("contain", "Retry automatique activé");
            cy.should("contain", "Monitoring continu");
          }
        });
      });

      // Simuler une récupération réussie
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/payments/recovery-success`,
        body: {
          originalPaymentId: "pi_recovery_0_123",
          newPaymentId: "pi_recovered_success_123",
          recoveryMethod: "smart-retry",
          attemptNumber: 2
        }
      });

      // Vérifier les métriques de récupération
      cy.visit("/admin/recovery-analytics");

      cy.get('[data-cy="recovery-stats"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Taux de récupération: 78%")
        .should("contain", "Temps moyen de récupération: 2.3 jours")
        .should("contain", "Revenus récupérés ce mois:");

      cy.get('[data-cy="recovery-breakdown"]')
        .should("contain", "Smart retry: 45%")
        .should("contain", "Payment update: 28%")
        .should("contain", "Manual contact: 5%");
    });

    it("devrait chiffrer et sécuriser toutes les données de paiement", () => {
      // Test de sécurité des données sensibles
      cy.loginAsAdmin();
      cy.visit("/admin/security-compliance");

      // Vérifier le chiffrement des données
      cy.get('[data-cy="encryption-status"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Toutes les données chiffrées")
        .should("contain", "AES-256 actif")
        .should("contain", "Clés rotées régulièrement");

      // Vérifier la conformité PCI DSS
      cy.get('[data-cy="pci-compliance"]')
        .should("contain", "PCI DSS Level 1 compliant")
        .should("contain", "Aucune donnée de carte stockée")
        .should("contain", "Tokens Stripe uniquement");

      // Test d'audit des accès
      cy.get('[data-cy="run-security-audit"]').click();

      cy.get('[data-cy="audit-progress"]', { timeout: 20000 })
        .should("be.visible");

      cy.get('[data-cy="audit-results"]', { timeout: 30000 })
        .should("be.visible");

      cy.get('[data-cy="security-score"]')
        .should("contain", "Score sécurité: A+")
        .should("contain", "Aucune vulnérabilité critique");

      // Vérifier les logs d'accès sécurisés
      cy.get('[data-cy="access-logs"]')
        .should("contain", "Tous les accès loggés")
        .should("contain", "Intégrité vérifiée")
        .should("contain", "Rétention: 7 ans");

      // Test de simulation d'intrusion
      cy.get('[data-cy="penetration-test"]').click();
      
      cy.get('[data-cy="pentest-warning"]', { timeout: 10000 })
        .should("contain", "Test d'intrusion simulé")
        .should("contain", "Environnement isolé");

      cy.get('[data-cy="confirm-pentest"]').click();

      cy.get('[data-cy="pentest-results"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "Aucune faille détectée")
        .should("contain", "Défenses efficaces")
        .should("contain", "Recommandations: 0");
    });
  });

  afterEach(() => {
    // Nettoyage après chaque test
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });
});