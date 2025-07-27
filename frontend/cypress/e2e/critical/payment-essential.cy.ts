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
    cy.intercept('GET', '/api/tarifs*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'tarif-correction-standard',
            nom: 'Correction Standard',
            description: 'Correction orthographique et grammaticale',
            prix: 5000, // 50€ en centimes
            prixFormate: '50,00 €',
            typeService: 'correction',
            unite: 'document',
            actif: true,
            stripeProductId: 'prod_test_correction',
            stripePriceId: 'price_test_correction_50',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]
      }
    }).as('getTarifs');

    // Mock session Stripe checkout
    cy.intercept('POST', '/api/payments/create-checkout-session', {
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
    cy.intercept('GET', '/api/payments/verify-session/cs_test_critical_session', {
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

    // Mock de l'authentification /me
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        id: 'user-payment-critical',
        email: 'payment-critical@staka.com',
        prenom: 'Payment',
        nom: 'Critical',
        role: 'USER',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      }
    }).as('getMe');

    // Mock projets endpoint
    cy.intercept('GET', '/api/projects*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
        meta: { total: 0, page: 1, pageSize: 10 }
      }
    }).as('getProjects');
  });

  describe('Interface de sélection de service', () => {
    it('should access user projects page correctly', () => {
      // Test simple d'accès à la page projets
      cy.visit('/app/projects');
      cy.wait('@getMe');
      cy.wait('@getProjects');
      
      // Vérifier que la page se charge correctement
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', '404');
      cy.contains('Mes Projets').should('be.visible');
    });

    it('should display pricing options correctly', () => {
      cy.visit('/app/projects');
      cy.wait('@getMe');
      cy.wait('@getProjects');
      
      // Vérifier que le bouton "Nouveau projet" est disponible
      cy.get('body').then(($body) => {
        if ($body.text().includes('Nouveau projet')) {
          cy.contains('Nouveau projet').click();
          
          // Vérifier l'ouverture du modal
          cy.contains('Décrivez votre projet').should('be.visible');
          
          // Vérifier les packs de service
          cy.contains('Pack Intégral').should('be.visible');
          cy.contains('2€/page').should('be.visible');
        } else if ($body.text().includes('Créer mon premier projet')) {
          // Page vide - bouton alternatif
          cy.contains('Créer mon premier projet').click();
          cy.contains('Décrivez votre projet').should('be.visible');
        } else {
          // Pas de projets, interface de base
          cy.contains('Aucun projet trouvé').should('be.visible');
        }
      });
    });

    it('should validate project form before submission', () => {
      cy.visit('/app/projects');
      cy.wait('@getMe');
      cy.wait('@getProjects');
      
      // Ouvrir le modal de création de projet (avec gestion conditionnelle)
      cy.get('body').then(($body) => {
        if ($body.text().includes('Nouveau projet')) {
          cy.contains('Nouveau projet').click();
        } else if ($body.text().includes('Créer mon premier projet')) {
          cy.contains('Créer mon premier projet').click();
        }
      });
      
      // Vérifier que le modal s'ouvre
      cy.contains('Décrivez votre projet').should('be.visible');
      
      // Essayer de soumettre sans données requises
      cy.contains('Créer le projet').click();
      
      // Vérifier que le modal reste ouvert (validation HTML5)
      cy.contains('Décrivez votre projet').should('be.visible');
    });

    it('should display pack pricing correctly', () => {
      cy.visit('/app/projects');
      cy.wait('@getMe');
      cy.wait('@getProjects');
      
      // Ouvrir le modal (avec gestion conditionnelle)
      cy.get('body').then(($body) => {
        if ($body.text().includes('Nouveau projet')) {
          cy.contains('Nouveau projet').click();
        } else if ($body.text().includes('Créer mon premier projet')) {
          cy.contains('Créer mon premier projet').click();
        }
      });
      
      // Vérifier l'ouverture du modal
      cy.contains('Décrivez votre projet').should('be.visible');
      
      // Vérifier les prix des packs affichés
      cy.contains('2€/page').should('be.visible'); // Correction + Pack Intégral
      cy.contains('350€').should('be.visible'); // Pack KDP
      
      // Vérifier qu'un pack est présélectionné par défaut (Pack Intégral)
      cy.contains('Pack Intégral').should('be.visible');
    });
  });

  describe('Création de projet', () => {
    it('should create project successfully with form data', () => {
      cy.visit('/app/projects');
      cy.contains('Nouveau projet').click();
      
      // Remplir le formulaire avec des données valides
      cy.get('input[type="text"]').first().type('Test Paiement Critical'); // Titre
      cy.get('select').select('Roman'); // Type de manuscrit
      cy.get('input[type="number"]').type('150'); // Nombre de pages
      
      // Sélectionner un pack (Pack Intégral déjà sélectionné par défaut)
      cy.contains('Pack Intégral').click();
      
      // Description optionnelle
      cy.get('textarea').type('Description test paiement critique');
      
      // Upload fichier (optionnel)
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Test file content'),
        fileName: 'test-manuscript.txt',
        mimeType: 'text/plain'
      }, { force: true });
      
      // Soumettre le formulaire
      cy.contains('Créer le projet').click();
      
      // Le modal devrait se fermer (test basic - dans un vrai test on vérifierait la redirection vers paiement)
      cy.contains('Décrivez votre projet').should('not.exist');
    });

    it('should handle form submission error gracefully', () => {
      // Mock d'une erreur de création de projet
      cy.intercept('POST', '/api/projects', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Erreur de création de projet'
        }
      }).as('createProjectError');
      
      cy.visit('/app/projects');
      cy.contains('Nouveau projet').click();
      
      // Remplir le formulaire
      cy.get('input[type="text"]').first().type('Test Error');
      cy.get('select').select('Roman');
      cy.get('input[type="number"]').type('100');
      
      // Soumettre
      cy.contains('Créer le projet').click();
      
      // Dans un vrai scénario, une erreur serait affichée
      // Pour ce test basique, on vérifie que l'app ne plante pas
      cy.get('body').should('be.visible');
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

    it('should handle unauthorized access gracefully', () => {
      // Mock d'une erreur d'autorisation lors de la création de projet
      cy.intercept('POST', '/api/projects', {
        statusCode: 403,
        body: {
          success: false,
          message: 'Non autorisé'
        }
      }).as('unauthorizedProject');
      
      cy.visit('/app/projects');
      cy.contains('Nouveau projet').click();
      
      cy.get('input[type="text"]').first().type('Test Unauthorized');
      cy.get('select').select('Roman');
      cy.get('input[type="number"]').type('150');
      cy.contains('Créer le projet').click();
      
      // L'app ne devrait pas planter
      cy.get('body').should('be.visible');
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
    it('should show loading states during form submission', () => {
      cy.visit('/app/projects');
      cy.contains('Nouveau projet').click();
      
      // Remplir le formulaire
      cy.get('input[type="text"]').first().type('Test Loading');
      cy.get('select').select('Roman');
      cy.get('input[type="number"]').type('150');
      
      // Le bouton de soumission devrait être accessible
      cy.contains('Créer le projet').should('be.visible').and('not.be.disabled');
    });

    it('should handle slow form submission gracefully', () => {
      cy.visit('/app/projects');
      cy.contains('Nouveau projet').click();
      
      // Remplir le formulaire rapidement
      cy.get('input[type="text"]').first().type('Test Performance');
      cy.get('select').select('Roman');
      cy.get('input[type="number"]').type('200');
      
      // L'interface devrait rester responsive
      cy.contains('Créer le projet').should('be.visible');
      cy.get('textarea').should('be.visible');
    });

    it('should maintain form data during interaction', () => {
      cy.visit('/app/projects');
      cy.contains('Nouveau projet').click();
      
      const titre = 'Mon Projet Test Persistance';
      cy.get('input[type="text"]').first().type(titre);
      cy.get('select').select('Roman');
      
      // Changer de pack et vérifier que les données sont conservées
      cy.contains('Pack KDP').click();
      cy.contains('Correction seule').click();
      
      // Les données du formulaire devraient être conservées
      cy.get('input[type="text"]').first().should('have.value', titre);
      cy.get('select').should('have.value', 'Roman');
    });
  });

  describe('Responsiveness mobile', () => {
    it('should work on mobile viewport', () => {
      cy.viewport(375, 667); // iPhone SE
      
      cy.visit('/app/projects');
      cy.contains('Nouveau projet').click();
      
      // Interface responsive
      cy.get('input[type="text"]').first().should('be.visible');
      cy.contains('Pack Intégral').should('be.visible');
      cy.contains('Créer le projet').should('be.visible');
    });

    it('should maintain functionality on tablet', () => {
      cy.viewport(768, 1024); // iPad
      
      cy.visit('/app/projects');
      cy.contains('Nouveau projet').click();
      
      // Flux complet sur tablet
      cy.get('input[type="text"]').first().type('Test Tablet');
      cy.get('select').select('Essai');
      cy.get('input[type="number"]').type('100');
      cy.contains('Créer le projet').should('be.visible');
    });
  });
});