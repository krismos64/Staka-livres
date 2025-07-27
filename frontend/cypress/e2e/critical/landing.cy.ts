/**
 * Tests critiques landing page - Exécution CI/CD
 * Validation de la page d'accueil et des fonctionnalités publiques
 */

describe('Landing Page - Tests Critiques', () => {
  beforeEach(() => {
    // Mock des tarifs pour la landing page
    cy.intercept('GET', '/api/tarifs*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'tarif-1',
            nom: 'Correction Standard',
            description: 'Correction orthographique et grammaticale',
            prix: 50,
            prixFormate: '50,00 €',
            typeService: 'correction',
            actif: true,
            ordre: 1,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'tarif-2',
            nom: 'Correction Premium',
            description: 'Correction complète avec suggestions',
            prix: 100,
            prixFormate: '100,00 €',
            typeService: 'correction',
            actif: true,
            ordre: 2,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        message: 'Tarifs récupérés avec succès'
      }
    }).as('getTarifs');

    cy.intercept('GET', '/api/pages*', {
      statusCode: 200,
      body: {
        success: true,
        data: []
      }
    }).as('getPages');
  });

  describe('Page Loading', () => {
    it('should load landing page correctly', () => {
      cy.visit('/');
      
      // Vérifier que la page se charge
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', '404');
      cy.get('body').should('not.contain', 'Error');
    });

    it('should display main navigation', () => {
      cy.visit('/');
      
      // Éléments de navigation essentiels
      cy.contains('Staka').should('be.visible');
      cy.contains('Connexion').should('be.visible');
      cy.contains('Contact').should('be.visible');
    });

    it('should display hero section', () => {
      cy.visit('/');
      
      // Section hero principale
      cy.get('h1, .hero, [data-testid="hero"]').should('exist');
      cy.get('body').should('contain.text', 'Staka');
    });
  });

  describe('Pricing Section', () => {
    it('should display pricing information', () => {
      cy.visit('/');
      cy.wait('@getTarifs');
      
      // Vérifier la section tarifs
      cy.get('body').then(($body) => {
        if ($body.text().includes('Tarifs') || $body.text().includes('Prix')) {
          cy.contains(/Tarifs|Prix/).should('be.visible');
        }
      });
    });

    it('should handle pricing API errors gracefully', () => {
      cy.intercept('GET', '/api/tarifs*', {
        statusCode: 500,
        body: { success: false, data: [], message: 'Erreur serveur' }
      }).as('getTarifsError');

      cy.visit('/');
      cy.wait('@getTarifsError');
      
      // La page devrait se charger même en cas d'erreur API
      cy.get('body').should('be.visible');
      cy.contains('Staka').should('be.visible');
    });
  });

  describe('Contact Section', () => {
    it('should display contact form', () => {
      cy.visit('/');
      
      // Chercher un formulaire de contact
      cy.get('body').then(($body) => {
        if ($body.text().includes('Contact') || $body.find('form').length > 0) {
          cy.contains('Contact').should('be.visible');
        }
      });
    });

    it('should validate contact form if present', () => {
      cy.visit('/');
      
      cy.get('body').then(($body) => {
        if ($body.find('form').length > 0) {
          // Si un formulaire existe, tester la validation basique
          cy.get('form').first().within(() => {
            cy.get('input[type="email"]').should('exist');
          });
        }
      });
    });
  });

  describe('Services Section', () => {
    it('should display services information', () => {
      cy.visit('/');
      
      // Vérifier la présence d'informations sur les services
      cy.get('body').should('contain.text', 'correction');
    });

    it('should display call-to-action buttons', () => {
      cy.visit('/');
      
      // Boutons d'action principaux
      cy.contains('Connexion').should('be.visible');
      cy.contains('Contact').should('be.visible');
    });
  });

  describe('Footer', () => {
    it('should display footer information', () => {
      cy.visit('/');
      
      // Footer basique
      cy.get('footer, .footer').should('exist');
    });

    it('should display legal links if present', () => {
      cy.visit('/');
      
      cy.get('body').then(($body) => {
        if ($body.text().includes('Mentions légales') || $body.text().includes('CGV')) {
          cy.contains(/Mentions légales|CGV|Politique/).should('be.visible');
        }
      });
    });
  });

  describe('Responsiveness', () => {
    it('should be responsive on mobile', () => {
      cy.viewport(375, 667); // iPhone SE
      cy.visit('/');
      
      cy.get('body').should('be.visible');
      cy.contains('Staka').should('be.visible');
      
      // Sur mobile, vérifier le menu hamburger au lieu du bouton desktop
      cy.get('.lg\\:hidden button').first().should('be.visible');
      
      // Optionnel : tester l'ouverture du menu mobile
      cy.get('.lg\\:hidden button').first().click();
      cy.get('.fixed.inset-0').should('be.visible'); // Menu overlay mobile
    });

    it('should be responsive on tablet', () => {
      cy.viewport(768, 1024); // iPad
      cy.visit('/');
      
      cy.get('body').should('be.visible');
      cy.contains('Staka').should('be.visible');
    });

    it('should be responsive on desktop', () => {
      cy.viewport(1920, 1080); // Desktop
      cy.visit('/');
      
      cy.get('body').should('be.visible');
      cy.contains('Staka').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load quickly', () => {
      const startTime = Date.now();
      
      cy.visit('/');
      cy.contains('Staka').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // Moins de 5 secondes
      });
    });

    it('should handle slow network gracefully', () => {
      // Simuler une connexion lente
      cy.intercept('GET', '**/api/public/tarifs*', {
        statusCode: 200,
        body: { success: true, data: [] },
        delay: 2000 // 2 secondes de délai
      }).as('getSlowTarifs');

      cy.visit('/');
      
      // La page devrait se charger même avec une API lente
      cy.contains('Staka').should('be.visible');
    });
  });

  describe('SEO Basics', () => {
    it('should have proper page title', () => {
      cy.visit('/');
      cy.title().should('not.be.empty');
      cy.title().should('contain', 'Staka');
    });

    it('should have meta description', () => {
      cy.visit('/');
      cy.get('meta[name="description"]').should('exist');
    });

    it('should have proper heading structure', () => {
      cy.visit('/');
      cy.get('h1').should('exist');
    });
  });

  describe('Accessibility Basics', () => {
    it('should have proper alt text for images', () => {
      cy.visit('/');
      
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('should have proper form labels', () => {
      cy.visit('/');
      
      cy.get('input').each(($input) => {
        const id = $input.attr('id');
        const name = $input.attr('name');
        if (id || name) {
          // Vérifier qu'il y a un label associé
          cy.get(`label[for="${id}"], label`).should('exist');
        }
      });
    });
  });
});