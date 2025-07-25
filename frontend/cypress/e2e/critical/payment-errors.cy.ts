/**
 * Tests critiques des erreurs de paiement - CI/CD
 * Validation robuste des cas d'erreur Stripe
 */

describe('Payment Errors - Tests Critiques', () => {
  beforeEach(() => {
    // Configuration utilisateur authentifié
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'test-error-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 'user-error-test',
        email: 'error-test@staka.com',
        prenom: 'Error',
        nom: 'Test',
        role: 'USER'
      }));
    });

    // Mock tarifs de base
    cy.intercept('GET', '**/api/tarifs*', {
      statusCode: 200,
      body: {
        success: true,
        data: [{
          id: 'tarif-test',
          nom: 'Service Test',
          prix: 50,
          stripePriceId: 'price_test'
        }]
      }
    }).as('getTarifs');
  });

  describe('Erreurs de création de session', () => {
    it('should handle Stripe API unavailable', () => {
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        forceNetworkError: true
      }).as('stripeUnavailable');

      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Stripe Down');
      cy.contains('Service Test').click();
      cy.get('button:contains("Procéder au paiement")').click();

      cy.wait('@stripeUnavailable');

      // Vérifier la gestion d'erreur réseau
      cy.contains(/service.*indisponible|erreur.*réseau/i).should('be.visible');
      cy.get('button:contains("Réessayer")').should('be.visible');
    });

    it('should handle invalid payment data', () => {
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Données de paiement invalides',
          code: 'INVALID_PAYMENT_DATA'
        }
      }).as('invalidPaymentData');

      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Invalid Data');
      cy.contains('Service Test').click();
      cy.get('button:contains("Procéder au paiement")').click();

      cy.wait('@invalidPaymentData');

      cy.contains('Données de paiement invalides').should('be.visible');
      cy.get('form').should('be.visible'); // Formulaire reste accessible
    });

    it('should handle insufficient permissions', () => {
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 403,
        body: {
          success: false,
          message: 'Permission refusée',
          code: 'FORBIDDEN'
        }
      }).as('forbidden');

      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Permission');
      cy.contains('Service Test').click();
      cy.get('button:contains("Procéder au paiement")').click();

      cy.wait('@forbidden');

      cy.contains('Permission refusée').should('be.visible');
    });

    it('should handle rate limiting', () => {
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 429,
        body: {
          success: false,
          message: 'Trop de tentatives, veuillez patienter',
          retryAfter: 60
        }
      }).as('rateLimited');

      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Rate Limit');
      cy.contains('Service Test').click();
      cy.get('button:contains("Procéder au paiement")').click();

      cy.wait('@rateLimited');

      cy.contains('Trop de tentatives').should('be.visible');
      cy.contains('patienter').should('be.visible');
    });
  });

  describe('Erreurs de vérification de paiement', () => {
    it('should handle payment verification timeout', () => {
      cy.intercept('GET', '**/api/payments/verify-session/cs_timeout', {
        delay: 30000, // 30 secondes
        statusCode: 200,
        body: { success: true }
      }).as('verifyTimeout');

      cy.visit('/payment/success?session_id=cs_timeout');

      // Vérifier l'indicateur de chargement
      cy.contains(/vérification|chargement/i).should('be.visible');
      
      // Après délai, devrait afficher erreur de timeout
      cy.contains(/timeout|délai/i, { timeout: 35000 }).should('be.visible');
    });

    it('should handle payment declined by bank', () => {
      cy.intercept('GET', '**/api/payments/verify-session/cs_declined', {
        statusCode: 200,
        body: {
          success: false,
          data: {
            paymentStatus: 'failed',
            error: 'Your card was declined.',
            errorCode: 'card_declined',
            canRetry: true
          }
        }
      }).as('verifyDeclined');

      cy.visit('/payment/success?session_id=cs_declined');
      cy.wait('@verifyDeclined');

      cy.contains('carte.*refusée|card.*declined', { matchCase: false }).should('be.visible');
      cy.get('button:contains("Réessayer")').should('be.visible');
    });

    it('should handle insufficient funds', () => {
      cy.intercept('GET', '**/api/payments/verify-session/cs_insufficient', {
        statusCode: 200,
        body: {
          success: false,
          data: {
            paymentStatus: 'failed',
            error: 'Insufficient funds',
            errorCode: 'insufficient_funds',
            canRetry: false
          }
        }
      }).as('verifyInsufficientFunds');

      cy.visit('/payment/success?session_id=cs_insufficient');
      cy.wait('@verifyInsufficientFunds');

      cy.contains(/fonds.*insuffisants|insufficient.*funds/i).should('be.visible');
      cy.contains('contactez.*banque|contact.*bank', { matchCase: false }).should('be.visible');
    });

    it('should handle expired session', () => {
      cy.intercept('GET', '**/api/payments/verify-session/cs_expired', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Session de paiement expirée',
          code: 'SESSION_EXPIRED'
        }
      }).as('verifyExpired');

      cy.visit('/payment/success?session_id=cs_expired');
      cy.wait('@verifyExpired');

      cy.contains('Session.*expirée|session.*expired', { matchCase: false }).should('be.visible');
      cy.get('button:contains("Nouveau paiement")').should('be.visible');
    });
  });

  describe('Erreurs d\'authentification', () => {
    it('should handle expired authentication during payment', () => {
      // Simuler une session expirée
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 401,
        body: {
          success: false,
          message: 'Session expirée',
          code: 'TOKEN_EXPIRED'
        }
      }).as('tokenExpired');

      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Token Expired');
      cy.contains('Service Test').click();
      cy.get('button:contains("Procéder au paiement")').click();

      cy.wait('@tokenExpired');

      // Devrait rediriger vers login ou afficher modal de reconnexion
      cy.contains(/connexion.*expirée|session.*expirée/i).should('be.visible');
    });

    it('should handle unauthorized access to payment', () => {
      // Supprimer l'auth
      cy.window().then((win) => {
        win.localStorage.removeItem('auth_token');
        win.localStorage.removeItem('user');
      });

      cy.visit('/payment/success?session_id=cs_test', { failOnStatusCode: false });

      // Devrait rediriger vers login
      cy.url().should('not.include', '/payment/success');
      cy.url().should('include', '/login');
    });
  });

  describe('Erreurs de données et validation', () => {
    it('should handle corrupted session data', () => {
      cy.intercept('GET', '**/api/payments/verify-session/cs_corrupted', {
        statusCode: 422,
        body: {
          success: false,
          message: 'Données de session corrompues',
          code: 'CORRUPTED_DATA'
        }
      }).as('verifyCorrupted');

      cy.visit('/payment/success?session_id=cs_corrupted');
      cy.wait('@verifyCorrupted');

      cy.contains('Données.*corrompues|corrupted.*data', { matchCase: false }).should('be.visible');
      cy.get('button:contains("Retour")').should('be.visible');
    });

    it('should handle missing project data', () => {
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 404,
        body: {
          success: false,
          message: 'Projet non trouvé',
          code: 'PROJECT_NOT_FOUND'
        }
      }).as('projectNotFound');

      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Project Not Found');
      cy.contains('Service Test').click();
      cy.get('button:contains("Procéder au paiement")').click();

      cy.wait('@projectNotFound');

      cy.contains('Projet non trouvé').should('be.visible');
    });
  });

  describe('Gestion des erreurs multiples', () => {
    it('should handle consecutive payment failures', () => {
      let attemptCount = 0;

      cy.intercept('POST', '**/api/payments/create-checkout-session', (req) => {
        attemptCount++;
        if (attemptCount <= 2) {
          req.reply({
            statusCode: 500,
            body: { success: false, message: 'Erreur temporaire' }
          });
        } else {
          req.reply({
            statusCode: 200,
            body: { success: true, data: { sessionId: 'cs_success', url: '/payment/success' } }
          });
        }
      }).as('retriableError');

      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Retry Success');
      cy.contains('Service Test').click();

      // Premier échec
      cy.get('button:contains("Procéder au paiement")').click();
      cy.wait('@retriableError');
      cy.contains('Erreur temporaire').should('be.visible');

      // Deuxième échec
      cy.get('button:contains("Réessayer")').click();
      cy.wait('@retriableError');
      cy.contains('Erreur temporaire').should('be.visible');

      // Troisième tentative réussie
      cy.get('button:contains("Réessayer")').click();
      cy.wait('@retriableError');
      cy.url().should('include', '/payment/success');
    });

    it('should limit retry attempts', () => {
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 500,
        body: { success: false, message: 'Erreur persistante' }
      }).as('persistentError');

      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Max Retries');
      cy.contains('Service Test').click();

      // Plusieurs tentatives
      for (let i = 0; i < 3; i++) {
        cy.get('button:contains("Procéder au paiement"), button:contains("Réessayer")').click();
        cy.wait('@persistentError');
        cy.contains('Erreur persistante').should('be.visible');
      }

      // Après 3 échecs, devrait suggérer contact support
      cy.contains(/support|aide/i).should('be.visible');
    });
  });

  describe('UX des erreurs', () => {
    it('should maintain form state after error', () => {
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        statusCode: 500,
        body: { success: false, message: 'Erreur temporaire' }
      });

      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      const titre = 'Mon Projet Test UX Error';
      const description = 'Description qui devrait être conservée';
      
      cy.get('input[name="titre"]').type(titre);
      cy.get('textarea[name="description"]').type(description);
      cy.contains('Service Test').click();
      cy.get('button:contains("Procéder au paiement")').click();

      // Après l'erreur, les données devraient être conservées
      cy.get('input[name="titre"]').should('have.value', titre);
      cy.get('textarea[name="description"]').should('have.value', description);
      cy.contains('Service Test').should('have.class', 'selected');
    });

    it('should provide helpful error messages', () => {
      const errorCases = [
        {
          status: 400,
          message: 'Montant invalide',
          expectedText: /montant|amount/i
        },
        {
          status: 403,
          message: 'Compte suspendu',
          expectedText: /compte.*suspendu|account.*suspended/i
        },
        {
          status: 500,
          message: 'Erreur serveur',
          expectedText: /serveur|server|technique/i
        }
      ];

      errorCases.forEach((errorCase, index) => {
        cy.intercept('POST', '**/api/payments/create-checkout-session', {
          statusCode: errorCase.status,
          body: { success: false, message: errorCase.message }
        }).as(`error${index}`);

        cy.visit('/app/projects');
        cy.get('button:contains("Nouveau projet")').click();
        
        cy.get('input[name="titre"]').type(`Test Error ${index}`);
        cy.contains('Service Test').click();
        cy.get('button:contains("Procéder au paiement")').click();

        cy.wait(`@error${index}`);
        cy.get('body').should('match', errorCase.expectedText);
      });
    });

    it('should show loading states during error recovery', () => {
      cy.intercept('POST', '**/api/payments/create-checkout-session', {
        delay: 2000,
        statusCode: 500,
        body: { success: false }
      }).as('slowError');

      cy.visit('/app/projects');
      cy.get('button:contains("Nouveau projet")').click();
      
      cy.get('input[name="titre"]').type('Test Loading Error');
      cy.contains('Service Test').click();
      cy.get('button:contains("Procéder au paiement")').click();

      // Vérifier l'état de chargement
      cy.get('button:contains("Procéder au paiement")').should('be.disabled');
      cy.contains(/traitement|chargement/i).should('be.visible');

      cy.wait('@slowError');
      
      // Après l'erreur, bouton redevient actif
      cy.get('button:contains("Réessayer")').should('not.be.disabled');
    });
  });
});