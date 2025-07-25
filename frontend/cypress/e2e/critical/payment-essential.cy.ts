/**
 * Tests critiques paiement Stripe - Exécution CI/CD
 * Valide les flux essentiels de paiement en mode test
 */

describe('Payment Essential - Tests Critiques Stripe', () => {
  beforeEach(() => {
    // Configuration utilisateur authentifié
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'test-user-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 'user-payment-critical',
        email: 'payment-critical@staka.com',
        prenom: 'Payment',
        nom: 'Critical',
        role: 'USER'
      }));
    });

    // Mock des tarifs
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
            stripeProductId: 'prod_test_correction',
            stripePriceId: 'price_test_correction_50'
          }
        ]
      }
    }).as('getTarifs');

    // Mock session Stripe checkout
    cy.intercept('POST', '**/api/payments/create-checkout-session', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          sessionId: 'cs_test_critical_session',
          url: 'http://localhost:3000/payment/success?session_id=cs_test_critical_session&mock=true'
        }
      }
    }).as('createCheckoutSession');

    // Mock vérification session
    cy.intercept('GET', '**/api/payments/verify-session/cs_test_critical_session', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          paymentStatus: 'paid',
          projectId: 'project-critical-123',
          amount: 5000, // 50€ en centimes
          currency: 'eur',
          paymentIntentId: 'pi_test_critical'
        }
      }
    }).as('verifySession');
  });

  describe('Interface de sélection de service', () => {
    it('should display pricing options correctly', () => {
      cy.visit('/app/projects');
      
      // Nouveau projet
      cy.get('button:contains("Nouveau projet"), [data-testid="new-project"], .btn-new-project')
        .should('be.visible')
        .click();
      
      cy.wait('@getTarifs');
      
      // Vérifier l'affichage des tarifs
      cy.contains('Correction Standard').should('be.visible');
      cy.contains('50').should('be.visible'); // Prix
      cy.contains('€').should('be.visible');
    });

    it('should validate project form before payment', () => {
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      // Essayer de procéder sans données
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Procéder au paiement"), .btn-payment').length > 0) {
          cy.get('button:contains("Procéder au paiement"), .btn-payment').click();
          
          // Devrait afficher une validation
          cy.get('body').should('contain.text', /requis|obligatoire|remplir/i);
        }
      });
    });

    it('should calculate total price dynamically', () => {
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      // Sélectionner un service
      cy.contains('Correction Standard').click();
      
      // Vérifier le calcul
      cy.get('body').should('contain.text', '50');
      cy.get('body').should('contain.text', 'Total');
    });
  });

  describe('Initiation du paiement', () => {
    it('should create checkout session successfully', () => {
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      // Remplir le formulaire
      cy.get('input[name="titre"], input[placeholder*="titre"]').type('Test Paiement Critical');
      cy.get('textarea[name="description"], textarea[placeholder*="description"]').type('Description test paiement critique');
      
      // Sélectionner service
      cy.contains('Correction Standard').click();
      
      // Upload fichier (mock)
      cy.get('body').then(($body) => {
        if ($body.find('input[type="file"]').length > 0) {
          cy.get('input[type="file"]').selectFile({
            contents: Cypress.Buffer.from('Test file content'),
            fileName: 'test-manuscript.txt',
            mimeType: 'text/plain'
          }, { force: true });
        }
      });
      
      // Procéder au paiement
      cy.get('button:contains("Procéder au paiement"), .btn-payment').click();
      
      cy.wait('@createCheckoutSession');
      
      // Vérifier la redirection simulée
      cy.url().should('include', '/payment/success');
    });

    it('should handle payment session creation error', () => {
      // Override avec une erreur
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Erreur de création de session de paiement'
        }
      }).as('createCheckoutSessionError');
      
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      // Remplir et soumettre
      cy.get('input[name="titre"]').type('Test Error');
      cy.contains('Correction Standard').click();
      cy.get('button:contains("Procéder au paiement")').click();
      
      cy.wait('@createCheckoutSessionError');
      
      // Vérifier la gestion d'erreur
      cy.contains(/erreur|échec/i).should('be.visible');
    });
  });

  describe('Pages de retour paiement', () => {
    it('should handle payment success correctly', () => {
      cy.visit('/payment/success?session_id=cs_test_critical_session&mock=true');
      
      cy.wait('@verifySession');
      
      // Vérifier la page de succès
      cy.contains(/succès|réussi|confirmé/i).should('be.visible');
      cy.contains(/projet|commande/i).should('be.visible');
      
      // Bouton retour
      cy.get('button:contains("Voir"), a:contains("Voir"), .btn-view-project').should('be.visible');
    });

    it('should handle payment cancellation', () => {
      cy.visit('/payment/cancel');
      
      // Vérifier la page d'annulation
      cy.contains(/annulé|cancel/i).should('be.visible');
      cy.contains(/reprendre|continuer/i).should('be.visible');
      
      // Navigation retour
      cy.get('button:contains("Retour"), a:contains("Retour")').should('be.visible');
    });

    it('should handle payment verification failure', () => {
      // Mock d'une vérification échouée
      cy.intercept('GET', '**/api/payments/verify-session/cs_test_failed', {
        statusCode: 200,
        body: {
          success: false,
          data: {
            paymentStatus: 'failed',
            error: 'Paiement refusé par la banque'
          }
        }
      }).as('verifyFailedSession');
      
      cy.visit('/payment/success?session_id=cs_test_failed');
      cy.wait('@verifyFailedSession');
      
      // Vérifier la gestion d'échec
      cy.contains(/échec|refusé|erreur/i).should('be.visible');
    });
  });

  describe('Sécurité et validation', () => {
    it('should require authentication for payment', () => {
      // Supprimer l'authentification
      cy.window().then((win) => {
        win.localStorage.removeItem('auth_token');
        win.localStorage.removeItem('user');
      });
      
      cy.visit('/app/projects', { failOnStatusCode: false });
      
      // Devrait rediriger vers login
      cy.url().should('not.include', '/app/projects');
    });

    it('should validate project ownership', () => {
      // Mock d'une erreur d'autorisation
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 403,
        body: {
          success: false,
          message: 'Projet non autorisé'
        }
      }).as('unauthorizedProject');
      
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Unauthorized');
      cy.contains('Correction Standard').click();
      cy.get('button:contains("Procéder au paiement")').click();
      
      cy.wait('@unauthorizedProject');
      cy.contains(/autorisé|permission/i).should('be.visible');
    });

    it('should not expose Stripe secrets', () => {
      cy.visit('/app/projects');
      
      // Vérifier qu'aucune clé secrète n'est exposée
      cy.get('body').should('not.contain', 'sk_live_');
      cy.get('body').should('not.contain', 'sk_test_');
      cy.get('body').should('not.contain', 'rk_live_');
      
      // Vérifier les scripts
      cy.get('script').each(($script) => {
        if ($script.text()) {
          expect($script.text()).to.not.include('sk_live_');
          expect($script.text()).to.not.include('sk_test_');
        }
      });
    });
  });

  describe('UX et performance', () => {
    it('should show loading states during payment', () => {
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Loading');
      cy.contains('Correction Standard').click();
      
      // Cliquer et vérifier l'état loading
      cy.get('button:contains("Procéder au paiement")').click();
      
      // Le bouton devrait être désactivé pendant le traitement
      cy.get('button:contains("Procéder au paiement")').should('be.disabled');
    });

    it('should handle network timeout gracefully', () => {
      // Simuler un timeout réseau
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        delay: 30000, // 30 secondes
        statusCode: 200,
        body: { success: true }
      }).as('slowPayment');
      
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Timeout');
      cy.contains('Correction Standard').click();
      cy.get('button:contains("Procéder au paiement")').click();
      
      // Attendre un peu puis vérifier qu'il y a un indicateur
      cy.wait(2000);
      cy.get('body').should('contain.text', /chargement|traitement/i);
    });

    it('should maintain form data on error', () => {
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 500,
        body: { success: false, message: 'Erreur serveur' }
      });
      
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      const titre = 'Mon Projet Test Persistance';
      cy.get('input[name="titre"]').type(titre);
      cy.contains('Correction Standard').click();
      cy.get('button:contains("Procéder au paiement")').click();
      
      // Après l'erreur, les données devraient être conservées
      cy.get('input[name="titre"]').should('have.value', titre);
    });
  });

  describe('Responsiveness mobile', () => {
    it('should work on mobile viewport', () => {
      cy.viewport(375, 667); // iPhone SE
      
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      // Interface responsive
      cy.get('input[name="titre"]').should('be.visible');
      cy.contains('Correction Standard').should('be.visible');
      cy.get('button:contains("Procéder au paiement")').should('be.visible');
    });

    it('should maintain functionality on tablet', () => {
      cy.viewport(768, 1024); // iPad
      
      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      // Flux complet sur tablet
      cy.get('input[name="titre"]').type('Test Tablet');
      cy.contains('Correction Standard').click();
      cy.get('button:contains("Procéder au paiement")').should('be.visible');
    });
  });
});