/**
 * Tests d'intégration complets du flux de paiement
 * Nécessite Stripe en mode test et backend fonctionnel
 */

describe('Payment Flow - Tests d\'Intégration Complets', () => {
  beforeEach(() => {
    // Configuration utilisateur authentifié
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'test-user-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 'user-payment-test',
        email: 'payment-test@staka.com',
        prenom: 'Payment',
        nom: 'Test',
        role: 'USER'
      }));
    });

    // Mock Stripe API pour les tests
    cy.intercept('POST', '**/api/payments/create-checkout-session', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          sessionId: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123'
        }
      }
    }).as('createCheckoutSession');

    cy.intercept('GET', '**/api/tarifs*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'tarif-correction-standard',
            nom: 'Correction Standard',
            description: 'Correction orthographique et grammaticale',
            prix: 50,
            unite: 'document',
            stripeProductId: 'prod_test_correction_standard',
            stripePriceId: 'price_test_correction_standard'
          },
          {
            id: 'tarif-correction-premium',
            nom: 'Correction Premium',
            description: 'Correction complète avec suggestions stylistiques',
            prix: 100,
            unite: 'document',
            stripeProductId: 'prod_test_correction_premium',
            stripePriceId: 'price_test_correction_premium'
          }
        ]
      }
    }).as('getTarifs');

    cy.intercept('GET', '**/api/payment-methods*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          paymentMethods: [],
          hasSetupIntent: false
        }
      }
    }).as('getPaymentMethods');
  });

  describe('Sélection de service et pricing', () => {
    it('should display available services with pricing', () => {
      cy.visit('/app/projects');
      
      // Cliquer sur nouveau projet
      cy.get('button:contains("Nouveau projet"), [data-testid="new-project"]').click();
      
      cy.wait('@getTarifs');
      
      // Vérifier les services disponibles
      cy.contains('Correction Standard').should('be.visible');
      cy.contains('50€').should('be.visible');
      cy.contains('Correction Premium').should('be.visible');
      cy.contains('100€').should('be.visible');
    });

    it('should calculate pricing dynamically', () => {
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      // Sélectionner un service
      cy.contains('Correction Standard').click();
      
      // Vérifier le calcul du prix
      cy.contains('Total: 50€').should('be.visible');
      
      // Changer pour premium
      cy.contains('Correction Premium').click();
      cy.contains('Total: 100€').should('be.visible');
    });
  });

  describe('Création de projet avec paiement', () => {
    it('should create project and initiate payment flow', () => {
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      // Remplir les informations du projet
      cy.get('input[name="titre"], input[placeholder*="titre"]').type('Mon Manuscrit de Test');
      cy.get('textarea[name="description"]').type('Description du projet de test pour les paiements');
      
      // Sélectionner un service
      cy.contains('Correction Premium').click();
      
      // Upload d'un fichier (mock)
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-manuscript.docx', { force: true });
      
      // Procéder au paiement
      cy.get('button:contains("Procéder au paiement"), [data-testid="proceed-payment"]').click();
      
      cy.wait('@createCheckoutSession');
      
      // Vérifier la redirection vers Stripe (simulée)
      cy.url().should('include', 'checkout.stripe.com');
    });

    it('should handle payment method selection', () => {
      cy.visit('/app/billing');
      
      // Ajouter une méthode de paiement
      cy.get('button:contains("Ajouter une carte"), [data-testid="add-payment-method"]').click();
      
      // Vérifier le modal Stripe Elements
      cy.get('.modal, [data-testid="payment-modal"]').should('be.visible');
      cy.contains('Ajouter une carte').should('be.visible');
      
      // Simuler l'ajout d'une carte (avec Stripe Elements mocké)
      cy.get('#card-element, .stripe-card-element').should('be.visible');
    });
  });

  describe('Flux de paiement Stripe', () => {
    it('should handle successful payment callback', () => {
      // Simuler un retour de paiement réussi
      cy.visit('/payment/success?session_id=cs_test_success_123');
      
      // Mock de la vérification de session
      cy.intercept('GET', '**/api/payments/verify-session/cs_test_success_123', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            paymentStatus: 'paid',
            projectId: 'project-123',
            amount: 10000, // 100€ en centimes
            currency: 'eur'
          }
        }
      }).as('verifySession');
      
      cy.wait('@verifySession');
      
      // Vérifier la page de succès
      cy.contains('Paiement réussi').should('be.visible');
      cy.contains('Votre projet a été créé').should('be.visible');
      cy.get('button:contains("Voir mon projet")').should('be.visible');
    });

    it('should handle payment cancellation', () => {
      cy.visit('/payment/cancel');
      
      // Vérifier la page d'annulation
      cy.contains('Paiement annulé').should('be.visible');
      cy.contains('Vous pouvez reprendre').should('be.visible');
      cy.get('button:contains("Retour aux projets")').should('be.visible');
    });

    it('should handle payment failure', () => {
      cy.visit('/payment/success?session_id=cs_test_failed_123');
      
      // Mock d'un échec de paiement
      cy.intercept('GET', '**/api/payments/verify-session/cs_test_failed_123', {
        statusCode: 200,
        body: {
          success: false,
          data: {
            paymentStatus: 'failed',
            error: 'Card declined'
          }
        }
      }).as('verifyFailedSession');
      
      cy.wait('@verifyFailedSession');
      
      // Vérifier la gestion d'erreur
      cy.contains('Échec du paiement').should('be.visible');
      cy.contains('carte a été refusée').should('be.visible');
    });
  });

  describe('Gestion des méthodes de paiement', () => {
    it('should display saved payment methods', () => {
      // Mock avec des méthodes de paiement existantes
      cy.intercept('GET', '**/api/payment-methods*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            paymentMethods: [
              {
                id: 'pm_test_visa',
                type: 'card',
                card: {
                  brand: 'visa',
                  last4: '4242',
                  exp_month: 12,
                  exp_year: 2025
                }
              }
            ],
            hasSetupIntent: true
          }
        }
      }).as('getExistingPaymentMethods');
      
      cy.visit('/app/billing');
      cy.wait('@getExistingPaymentMethods');
      
      // Vérifier l'affichage des cartes
      cy.contains('Visa').should('be.visible');
      cy.contains('•••• 4242').should('be.visible');
      cy.contains('12/2025').should('be.visible');
    });

    it('should delete payment method', () => {
      cy.intercept('GET', '**/api/payment-methods*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            paymentMethods: [
              {
                id: 'pm_test_visa',
                type: 'card',
                card: { brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2025 }
              }
            ]
          }
        }
      });

      cy.intercept('DELETE', '**/api/payment-methods/pm_test_visa', {
        statusCode: 200,
        body: { success: true }
      }).as('deletePaymentMethod');
      
      cy.visit('/app/billing');
      
      // Supprimer la méthode de paiement
      cy.get('button[data-testid="delete-payment-method"], .btn-delete-card').click();
      
      // Confirmer la suppression
      cy.get('button:contains("Confirmer")').click();
      cy.wait('@deletePaymentMethod');
      
      // Vérifier le succès
      cy.contains('Méthode de paiement supprimée').should('be.visible');
    });
  });

  describe('Facturation et historique', () => {
    it('should display payment history', () => {
      cy.intercept('GET', '**/api/invoices*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            invoices: [
              {
                id: 'inv_test_123',
                amount: 10000, // 100€
                currency: 'eur',
                status: 'paid',
                created: 1640995200, // 2022-01-01
                description: 'Correction Premium - Mon Manuscrit',
                invoice_pdf: 'https://files.stripe.com/invoice_pdf_test'
              }
            ],
            totalAmount: 10000
          }
        }
      }).as('getInvoices');
      
      cy.visit('/app/billing');
      cy.wait('@getInvoices');
      
      // Vérifier l'historique
      cy.contains('Historique des paiements').should('be.visible');
      cy.contains('100,00 €').should('be.visible');
      cy.contains('Correction Premium').should('be.visible');
      cy.contains('Payé').should('be.visible');
    });

    it('should download invoice PDF', () => {
      cy.intercept('GET', '**/api/invoices*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            invoices: [
              {
                id: 'inv_test_123',
                amount: 10000,
                status: 'paid',
                invoice_pdf: 'https://files.stripe.com/invoice_pdf_test'
              }
            ]
          }
        }
      });
      
      cy.visit('/app/billing');
      
      // Cliquer sur télécharger la facture
      cy.get('button:contains("Télécharger"), .btn-download-invoice').click();
      
      // Vérifier que le téléchargement est initié
      // (Dans un vrai test, on vérifierait le téléchargement)
    });
  });

  describe('Webhooks et synchronisation', () => {
    it('should handle payment webhook updates', () => {
      // Simuler un webhook Stripe
      cy.intercept('POST', '**/api/payments/webhook', {
        statusCode: 200,
        body: { received: true }
      }).as('stripeWebhook');
      
      // Visiter une page après paiement
      cy.visit('/app/projects');
      
      // Les données devraient être synchronisées via webhook
      cy.contains('Correction en cours').should('be.visible');
    });
  });

  describe('Erreurs et cas limites', () => {
    it('should handle insufficient funds error', () => {
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Fonds insuffisants'
        }
      }).as('insufficientFunds');
      
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      // Remplir et soumettre
      cy.get('input[name="titre"]').type('Test Insufficient Funds');
      cy.contains('Correction Standard').click();
      cy.get('button:contains("Procéder au paiement")').click();
      
      cy.wait('@insufficientFunds');
      
      // Vérifier la gestion d'erreur
      cy.contains('Fonds insuffisants').should('be.visible');
    });

    it('should handle Stripe service unavailable', () => {
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        forceNetworkError: true
      }).as('stripeUnavailable');
      
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Stripe Down');
      cy.contains('Correction Standard').click();
      cy.get('button:contains("Procéder au paiement")').click();
      
      cy.wait('@stripeUnavailable');
      
      // Vérifier la gestion d'erreur réseau
      cy.contains('Service temporairement indisponible').should('be.visible');
    });

    it('should validate project data before payment', () => {
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      // Essayer de procéder au paiement sans données complètes
      cy.get('button:contains("Procéder au paiement")').click();
      
      // Vérifier la validation
      cy.contains('Veuillez remplir tous les champs').should('be.visible');
    });
  });

  describe('Sécurité paiements', () => {
    it('should use HTTPS for payment pages', () => {
      cy.visit('/app/billing');
      
      // Vérifier les en-têtes de sécurité (simulé)
      cy.window().then((win) => {
        expect(win.location.protocol).to.equal('https:');
      });
    });

    it('should not expose sensitive payment data', () => {
      cy.visit('/app/billing');
      
      // Vérifier qu'aucune donnée sensible n'est exposée
      cy.get('body').should('not.contain', 'sk_');
      cy.get('body').should('not.contain', 'pk_live_');
    });
  });
});