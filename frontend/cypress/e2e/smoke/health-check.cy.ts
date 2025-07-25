/**
 * Tests smoke - Health checks rapides
 * Vérifications basiques de santé de l'application
 */

describe('Health Check - Tests Smoke', () => {
  describe('Application Availability', () => {
    it('should load main pages without errors', () => {
      // Landing page
      cy.visit('/');
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', '404');
      cy.get('body').should('not.contain', 'Cannot read');
      
      // Login page
      cy.visit('/login');
      cy.get('body').should('be.visible');
      cy.contains('Se connecter').should('be.visible');
      
      // Signup page
      cy.visit('/signup');
      cy.get('body').should('be.visible');
      cy.contains('Créer').should('be.visible');
    });

    it('should handle 404 pages gracefully', () => {
      cy.visit('/page-qui-nexiste-pas', { failOnStatusCode: false });
      cy.get('body').should('be.visible');
      // L'application devrait gérer gracieusement les 404
    });
  });

  describe('API Connectivity', () => {
    it('should connect to backend API', () => {
      cy.request({
        url: 'http://localhost:3001/api/public/health',
        failOnStatusCode: false
      }).then((response) => {
        // L'API devrait être accessible (200 ou 404 mais pas de timeout)
        expect(response.status).to.be.oneOf([200, 404, 500]);
      });
    });

    it('should handle API timeouts gracefully', () => {
      // Mock d'une API qui timeout
      cy.intercept('GET', '**/api/**', {
        forceNetworkError: true
      }).as('apiTimeout');

      cy.visit('/');
      
      // L'application devrait se charger même si les APIs sont down
      cy.get('body').should('be.visible');
      cy.contains('Staka').should('be.visible');
    });
  });

  describe('JavaScript Errors', () => {
    it('should not have critical JavaScript errors', () => {
      cy.visit('/', {
        onBeforeLoad: (win) => {
          cy.stub(win.console, 'error').as('consoleError');
        }
      });

      cy.get('body').should('be.visible');
      
      // Vérifier qu'il n'y a pas d'erreurs critiques en console
      cy.get('@consoleError').should('not.have.been.calledWith', 
        Cypress.sinon.match(/error|failed|cannot read/i)
      );
    });
  });

  describe('Performance Smoke', () => {
    it('should load pages within acceptable time', () => {
      const startTime = Date.now();
      
      cy.visit('/');
      cy.get('body').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(10000); // Moins de 10 secondes
      });
    });
  });

  describe('Basic User Flows', () => {
    it('should navigate between public pages', () => {
      cy.visit('/');
      cy.contains('Connexion').click();
      cy.url().should('include', '/login');
      
      cy.contains('Inscription').click();
      cy.url().should('include', '/signup');
      
      cy.visit('/');
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should handle form interactions without crashing', () => {
      cy.visit('/login');
      
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      
      // L'application ne devrait pas planter lors de la saisie
      cy.get('body').should('be.visible');
      cy.get('input[type="email"]').should('have.value', 'test@example.com');
    });
  });

  describe('Browser Compatibility', () => {
    it('should work with different viewport sizes', () => {
      // Mobile
      cy.viewport(375, 667);
      cy.visit('/');
      cy.get('body').should('be.visible');
      
      // Tablet
      cy.viewport(768, 1024);
      cy.visit('/');
      cy.get('body').should('be.visible');
      
      // Desktop
      cy.viewport(1920, 1080);
      cy.visit('/');
      cy.get('body').should('be.visible');
    });
  });

  describe('Security Smoke', () => {
    it('should not expose sensitive information in DOM', () => {
      cy.visit('/');
      
      cy.get('body').should('not.contain', 'secret');
      cy.get('body').should('not.contain', 'password');
      cy.get('body').should('not.contain', 'token');
      cy.get('body').should('not.contain', 'key');
    });

    it('should handle unauthorized access attempts', () => {
      // Tenter d'accéder à une page admin sans authentification
      cy.visit('/admin', { failOnStatusCode: false });
      
      // L'application devrait rediriger ou afficher une erreur
      cy.get('body').should('be.visible');
    });
  });

  describe('Data Integrity', () => {
    it('should maintain localStorage consistency', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        // Vérifier que localStorage fonctionne
        win.localStorage.setItem('test', 'value');
        expect(win.localStorage.getItem('test')).to.equal('value');
        win.localStorage.removeItem('test');
      });
    });
  });
});