/**
 * Tests E2E complets - Flux client → paiement → livraison
 * Validation du parcours utilisateur complet avec Stripe
 */

describe('End-to-End Workflow - Client → Paiement → Livraison', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(() => {
    // Utilisateur test unique
    testUser = {
      id: `user-e2e-${Date.now()}`,
      email: `e2e-test-${Date.now()}@staka.com`,
      prenom: 'E2E',
      nom: 'TestUser',
      role: 'USER'
    };

    testProject = {
      id: `project-e2e-${Date.now()}`,
      titre: 'Mon Manuscrit E2E Test',
      description: 'Test complet du workflow de correction'
    };

    // Configuration initiale
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'e2e-test-token');
      win.localStorage.setItem('user', JSON.stringify(testUser));
    });

    // Mock des APIs essentielles
    cy.intercept('GET', '**/api/tarifs*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'tarif-correction-premium',
            nom: 'Correction Premium',
            description: 'Correction complète avec suggestions stylistiques',
            prix: 100,
            unite: 'document',
            stripeProductId: 'prod_premium_correction',
            stripePriceId: 'price_premium_100',
            delaiLivraison: '5-7 jours ouvrés'
          }
        ]
      }
    }).as('getTarifs');

    cy.intercept('GET', '**/api/commandes*', {
      statusCode: 200,
      body: {
        success: true,
        data: { commandes: [] }
      }
    }).as('getCommandes');
  });

  describe('Étape 1: Création de projet et sélection service', () => {
    it('should complete project creation with service selection', () => {
      cy.visit('/app/projects');
      cy.wait('@getCommandes');

      // Vérifier l'état initial
      cy.contains('Nouveau projet').should('be.visible');
      
      // Créer un nouveau projet
      cy.get('button:contains("Nouveau projet"), [data-testid="new-project"]').click();
      cy.wait('@getTarifs');

      // Remplir les informations du projet
      cy.get('input[name="titre"], input[placeholder*="titre"]')
        .should('be.visible')
        .type(testProject.titre);

      cy.get('textarea[name="description"], textarea[placeholder*="description"]')
        .should('be.visible')
        .type(testProject.description);

      // Sélectionner le service Premium
      cy.contains('Correction Premium').should('be.visible').click();
      cy.contains('100€').should('be.visible');
      cy.contains('5-7 jours').should('be.visible');

      // Upload d'un fichier (simulation)
      cy.get('body').then(($body) => {
        if ($body.find('input[type="file"]').length > 0) {
          cy.get('input[type="file"]').selectFile({
            contents: Cypress.Buffer.from('Contenu du manuscrit de test pour la correction E2E'),
            fileName: 'manuscrit-e2e-test.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          }, { force: true });

          // Vérifier l'upload
          cy.contains('manuscrit-e2e-test.docx').should('be.visible');
        }
      });

      // Vérifier le récapitulatif
      cy.contains('Total: 100€').should('be.visible');
      cy.contains('Correction Premium').should('be.visible');

      // Valider le formulaire
      cy.get('button:contains("Procéder au paiement"), .btn-proceed-payment')
        .should('be.visible')
        .should('not.be.disabled');
    });

    it('should validate all required fields', () => {
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();

      // Essayer de procéder sans remplir
      cy.get('button:contains("Procéder au paiement")').click();

      // Vérifier les validations
      cy.get('body').should('contain.text', /requis|obligatoire|remplir/i);

      // Remplir progressivement et vérifier
      cy.get('input[name="titre"]').type('Test Validation');
      cy.get('button:contains("Procéder au paiement")').click();
      cy.get('body').should('contain.text', /description|service/i);

      // Service requis
      cy.get('textarea[name="description"]').type('Description test');
      cy.get('button:contains("Procéder au paiement")').click();
      cy.get('body').should('contain.text', /service|tarif/i);

      // Compléter
      cy.contains('Correction Premium').click();
      cy.get('button:contains("Procéder au paiement")').should('not.be.disabled');
    });
  });

  describe('Étape 2: Processus de paiement Stripe', () => {
    beforeEach(() => {
      // Mock création commande
      cy.intercept('POST', '**/api/commandes/create', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            commande: {
              id: testProject.id,
              titre: testProject.titre,
              statut: 'EN_ATTENTE',
              paiementStatut: 'PENDING'
            }
          }
        }
      }).as('createCommande');

      // Mock session Stripe
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            sessionId: 'cs_test_e2e_workflow',
            url: 'http://localhost:3000/payment/success?session_id=cs_test_e2e_workflow&mock=true'
          }
        }
      }).as('createCheckoutSession');
    });

    it('should initiate payment successfully', () => {
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();

      // Remplir le projet
      cy.get('input[name="titre"]').type(testProject.titre);
      cy.get('textarea[name="description"]').type(testProject.description);
      cy.contains('Correction Premium').click();

      // Procéder au paiement
      cy.get('button:contains("Procéder au paiement")').click();

      // Vérifier la création de commande
      cy.wait('@createCommande');
      cy.wait('@createCheckoutSession');

      // Vérifier la redirection vers Stripe
      cy.url().should('include', '/payment/success');
      cy.url().should('include', 'session_id=cs_test_e2e_workflow');
    });

    it('should handle payment processing errors', () => {
      // Override avec erreur Stripe
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Erreur de traitement du paiement',
          error: 'STRIPE_ERROR'
        }
      }).as('paymentError');

      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();

      cy.get('input[name="titre"]').type('Test Payment Error');
      cy.get('textarea[name="description"]').type('Test erreur paiement');
      cy.contains('Correction Premium').click();
      cy.get('button:contains("Procéder au paiement")').click();

      cy.wait('@paymentError');

      // Vérifier la gestion d'erreur
      cy.contains('Erreur de traitement').should('be.visible');
      cy.get('button:contains("Réessayer")').should('be.visible');
    });
  });

  describe('Étape 3: Confirmation de paiement et mise à jour', () => {
    beforeEach(() => {
      // Mock vérification session réussie
      cy.intercept('GET', '**/api/payments/verify-session/cs_test_e2e_workflow', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            paymentStatus: 'paid',
            projectId: testProject.id,
            amount: 10000, // 100€ en centimes
            currency: 'eur',
            paymentIntentId: 'pi_test_e2e_workflow',
            invoiceId: 'inv_test_e2e_workflow'
          }
        }
      }).as('verifyPaymentSuccess');

      // Mock commande mise à jour après paiement
      cy.intercept('GET', '**/api/commandes*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            commandes: [
              {
                id: testProject.id,
                titre: testProject.titre,
                description: testProject.description,
                statut: 'EN_ATTENTE', // Statut business
                paiementStatut: 'PAID', // Paiement confirmé
                dateCreation: new Date().toISOString(),
                tarifsAppliques: 'Correction Premium - 100€',
                userId: testUser.id
              }
            ]
          }
        }
      }).as('getCommandesPaid');
    });

    it('should confirm payment and update project status', () => {
      cy.visit('/payment/success?session_id=cs_test_e2e_workflow&mock=true');
      cy.wait('@verifyPaymentSuccess');

      // Vérifier la page de succès
      cy.contains('Paiement confirmé').should('be.visible');
      cy.contains(testProject.titre).should('be.visible');
      cy.contains('100,00 €').should('be.visible');

      // Navigation vers les projets
      cy.get('button:contains("Voir mes projets"), a:contains("Projets")').click();
      cy.wait('@getCommandesPaid');

      // Vérifier l'affichage mis à jour
      cy.contains(testProject.titre).should('be.visible');
      cy.contains('Payé').should('be.visible');
      cy.contains('En attente de traitement').should('be.visible');
    });

    it('should generate invoice after payment', () => {
      // Mock facture générée
      cy.intercept('GET', '**/api/invoices*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            invoices: [
              {
                id: 'inv_test_e2e_workflow',
                commandeId: testProject.id,
                amount: 10000,
                currency: 'eur',
                status: 'paid',
                description: `${testProject.titre} - Correction Premium`,
                pdfUrl: 'https://test.s3.amazonaws.com/invoice-e2e.pdf',
                createdAt: new Date().toISOString()
              }
            ],
            totalAmount: 10000
          }
        }
      }).as('getInvoices');

      cy.visit('/payment/success?session_id=cs_test_e2e_workflow');
      cy.wait('@verifyPaymentSuccess');

      // Aller à la facturation
      cy.visit('/app/billing');
      cy.wait('@getInvoices');

      // Vérifier la facture
      cy.contains('inv_test_e2e_workflow').should('be.visible');
      cy.contains('100,00 €').should('be.visible');
      cy.contains(testProject.titre).should('be.visible');
      cy.contains('Payé').should('be.visible');

      // Téléchargement facture
      cy.get('button:contains("Télécharger"), .btn-download').should('be.visible');
    });

    it('should send confirmation notifications', () => {
      // Mock notifications utilisateur
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            notifications: [
              {
                id: 'notif_payment_e2e',
                type: 'PAYMENT_SUCCESS',
                title: 'Paiement confirmé',
                message: `Votre paiement de 100€ pour "${testProject.titre}" a été confirmé. Votre projet sera traité sous 5-7 jours ouvrés.`,
                isRead: false,
                createdAt: new Date().toISOString()
              }
            ]
          }
        }
      }).as('getNotifications');

      cy.visit('/payment/success?session_id=cs_test_e2e_workflow');
      cy.wait('@verifyPaymentSuccess');

      // Vérifier les notifications
      cy.visit('/app/notifications');
      cy.wait('@getNotifications');

      cy.contains('Paiement confirmé').should('be.visible');
      cy.contains(testProject.titre).should('be.visible');
      cy.contains('100€').should('be.visible');
      cy.contains('5-7 jours').should('be.visible');
    });
  });

  describe('Étape 4: Suivi et livraison', () => {
    beforeEach(() => {
      // Mock commande en cours de traitement
      cy.intercept('GET', '**/api/commandes*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            commandes: [
              {
                id: testProject.id,
                titre: testProject.titre,
                statut: 'EN_COURS',
                paiementStatut: 'PAID',
                assignedTo: 'Correcteur Expert',
                progressEstimation: 60,
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // +3 jours
              }
            ]
          }
        }
      }).as('getCommandesInProgress');
    });

    it('should show project progress tracking', () => {
      cy.visit('/app/projects');
      cy.wait('@getCommandesInProgress');

      // Vérifier le suivi
      cy.contains(testProject.titre).should('be.visible');
      cy.contains('En cours').should('be.visible');
      cy.contains('Correcteur Expert').should('be.visible');
      cy.contains('60%').should('be.visible');

      // Estimation de livraison
      cy.contains('3 jours').should('be.visible');
    });

    it('should handle project completion and delivery', () => {
      // Mock commande terminée
      cy.intercept('GET', '**/api/commandes*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            commandes: [
              {
                id: testProject.id,
                titre: testProject.titre,
                statut: 'TERMINE',
                paiementStatut: 'PAID',
                deliveredAt: new Date().toISOString(),
                correcteurNotes: 'Correction terminée avec 15 suggestions d\'amélioration.',
                rating: null // Pas encore noté
              }
            ]
          }
        }
      }).as('getCommandesCompleted');

      // Mock fichiers livrés
      cy.intercept('GET', `**/api/projects/${testProject.id}/files`, {
        statusCode: 200,
        body: {
          success: true,
          data: {
            files: [
              {
                id: 'file_corrected_e2e',
                name: 'manuscrit-e2e-test-corrigé.docx',
                type: 'CORRECTED_DOCUMENT',
                url: 'https://test.s3.amazonaws.com/corrected-doc.docx',
                size: 156789,
                createdAt: new Date().toISOString()
              },
              {
                id: 'file_rapport_e2e',
                name: 'rapport-correction.pdf',
                type: 'CORRECTION_REPORT',
                url: 'https://test.s3.amazonaws.com/rapport.pdf',
                size: 45678,
                createdAt: new Date().toISOString()
              }
            ]
          }
        }
      }).as('getProjectFiles');

      cy.visit('/app/projects');
      cy.wait('@getCommandesCompleted');

      // Vérifier l'état terminé
      cy.contains(testProject.titre).should('be.visible');
      cy.contains('Terminé').should('be.visible');
      cy.contains('15 suggestions').should('be.visible');

      // Accéder aux fichiers
      cy.contains(testProject.titre).click();
      cy.wait('@getProjectFiles');

      // Vérifier les livrables
      cy.contains('manuscrit-e2e-test-corrigé.docx').should('be.visible');
      cy.contains('rapport-correction.pdf').should('be.visible');
      cy.get('button:contains("Télécharger"), .btn-download').should('have.length', 2);

      // Interface de notation
      cy.contains('Noter ce projet').should('be.visible');
      cy.get('.rating-stars, [data-testid="rating"]').should('be.visible');
    });

    it('should complete the full workflow with rating', () => {
      // Mock après notation
      cy.intercept('POST', `**/api/projects/${testProject.id}/rate`, {
        statusCode: 200,
        body: { success: true }
      }).as('rateProject');

      cy.intercept('GET', '**/api/commandes*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            commandes: [{
              id: testProject.id,
              titre: testProject.titre,
              statut: 'TERMINE',
              rating: 5,
              userFeedback: 'Excellent travail, très satisfait !'
            }]
          }
        }
      }).as('getCommandesRated');

      cy.visit('/app/projects');
      cy.wait('@getCommandesRated');

      // Vérifier le workflow complet
      cy.contains(testProject.titre).should('be.visible');
      cy.contains('Terminé').should('be.visible');
      cy.contains('★★★★★').should('be.visible'); // 5 étoiles
      cy.contains('Excellent travail').should('be.visible');

      // Possibilité de nouveau projet
      cy.get('button:contains("Nouveau projet")').should('be.visible');
    });
  });

  describe('Gestion des erreurs dans le workflow complet', () => {
    it('should handle payment failure and allow retry', () => {
      // Mock échec initial
      cy.intercept('GET', '**/api/payments/verify-session/cs_test_failed', {
        statusCode: 200,
        body: {
          success: false,
          data: {
            paymentStatus: 'failed',
            error: 'Payment declined',
            canRetry: true
          }
        }
      }).as('verifyPaymentFailed');

      cy.visit('/payment/success?session_id=cs_test_failed');
      cy.wait('@verifyPaymentFailed');

      // Vérifier la gestion d'échec
      cy.contains('Échec du paiement').should('be.visible');
      cy.contains('Payment declined').should('be.visible');
      cy.get('button:contains("Réessayer le paiement")').should('be.visible');

      // Test du retry
      cy.intercept('POST', '**/api/payments/retry', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            sessionId: 'cs_test_retry_success',
            url: '/payment/success?session_id=cs_test_retry_success'
          }
        }
      }).as('retryPayment');

      cy.get('button:contains("Réessayer le paiement")').click();
      cy.wait('@retryPayment');

      cy.url().should('include', 'cs_test_retry_success');
    });

    it('should handle service interruption gracefully', () => {
      // Simuler une panne de service
      cy.intercept('GET', '**/api/commandes*', {
        forceNetworkError: true
      }).as('serviceDown');

      cy.visit('/app/projects');
      cy.wait('@serviceDown');

      // Vérifier la gestion gracieuse
      cy.contains('Service temporairement indisponible').should('be.visible');
      cy.get('button:contains("Réessayer"), .btn-retry').should('be.visible');
    });
  });
});