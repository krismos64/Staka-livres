/**
 * Tests critiques d'authentification - Exécution CI/CD
 * Rapides, avec mocks, pour valider les flux essentiels
 */

describe('Auth - Tests Critiques', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Landing Page Access', () => {
    it('should display landing page correctly', () => {
      cy.contains('Staka').should('be.visible');
      cy.contains('Connexion').should('be.visible');
      cy.contains('Contact').should('be.visible');
    });

    it('should navigate to login page', () => {
      cy.contains('Connexion').click();
      cy.url().should('include', '/login');
      cy.contains('Se connecter').should('be.visible');
    });

    it('should navigate to signup page via login page', () => {
      // Il n'y a pas de bouton direct "Inscription" sur la landing
      // On passe par login puis "Créer un compte"
      cy.contains('Connexion').click();
      cy.url().should('include', '/login');
      cy.contains('Créer un compte').click();
      cy.url().should('include', '/signup');
      cy.contains('Créer').should('be.visible');
    });
  });

  describe('Login Form Validation', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should display login form elements', () => {
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      cy.contains('Mot de passe oublié').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('button[type="submit"]').click();
      // Le formulaire ne devrait pas soumettre sans données
      cy.url().should('include', '/login');
    });

    it('should validate email format', () => {
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      // Le navigateur devrait valider le format email
      cy.get('input[type="email"]:invalid').should('exist');
    });
  });

  describe('Signup Form Validation', () => {
    beforeEach(() => {
      cy.visit('/signup');
    });

    it('should display signup form elements', () => {
      cy.get('input[name="first_name"]').should('be.visible');
      cy.get('input[name="last_name"]').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/signup');
    });
  });

  describe('Password Reset Flow', () => {
    it('should navigate to forgot password', () => {
      cy.visit('/login');
      cy.contains('Mot de passe oublié').click();
      cy.url().should('include', '/forgot-password');
      cy.contains('Mot de passe oublié').should('be.visible');
    });

    it('should display password reset form', () => {
      cy.visit('/forgot-password');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      cy.contains('Retour à la connexion').should('be.visible');
    });
  });

  describe('Mock Authentication Success', () => {
    it('should handle successful admin login (mocked)', () => {
      // Mock de l'API d'authentification - URL exacte
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: 'admin-1',
            email: 'admin@staka-editions.com',
            prenom: 'Admin',
            nom: 'Test',
            role: 'ADMIN',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          token: 'mock-jwt-token'
        }
      }).as('loginRequest');

      cy.visit('/login');
      cy.get('input[type="email"]').type('admin@staka-editions.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');
      cy.url().should('include', '/admin');
    });

    it('should handle successful user login (mocked)', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            prenom: 'User',
            nom: 'Test',
            role: 'USER',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          token: 'mock-jwt-token'
        }
      }).as('loginRequest');

      cy.visit('/login');
      cy.get('input[type="email"]').type('user@test.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');
      cy.url().should('include', '/app');
    });
  });

  describe('Error Handling', () => {
    it('should handle login error gracefully', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          error: 'Email ou mot de passe incorrect'
        }
      }).as('loginError');

      cy.visit('/login');
      cy.get('input[type="email"]').type('wrong@email.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginError');
      // Vérifier qu'une erreur d'auth apparaît (le message exact peut varier)
      cy.get('body').should('contain.text', 'Email ou mot de passe incorrect');
    });

    it('should handle network error gracefully', () => {
      cy.intercept('POST', '/api/auth/login', {
        forceNetworkError: true
      }).as('networkError');

      cy.visit('/login');
      cy.get('input[type="email"]').type('test@email.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait('@networkError');
      // L'application devrait afficher une erreur réseau
      cy.get('body').should('contain.text', 'Failed to fetch');
    });
  });
});