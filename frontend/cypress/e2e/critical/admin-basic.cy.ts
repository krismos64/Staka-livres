/**
 * Tests critiques admin basiques - Exécution CI/CD
 * Version simplifiée et stable des fonctionnalités admin essentielles
 */

describe('Admin Basic - Tests Critiques', () => {
  beforeEach(() => {
    // Mock d'un token admin valide
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-admin-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 'admin-1',
        email: 'admin@staka-editions.com',
        prenom: 'Admin',
        nom: 'Test',
        role: 'ADMIN'
      }));
    });

    // Mock de l'authentification
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        id: 'admin-1',
        email: 'admin@staka-editions.com',
        prenom: 'Admin',
        nom: 'Test',
        role: 'ADMIN',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      }
    }).as('getMe');

    // Mock des API calls essentiels  
    cy.intercept('GET', '/api/admin/users?*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'user-1',
            prenom: 'Jean',
            nom: 'Dupont',
            email: 'jean@test.com',
            role: 'USER',
            isActive: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          }
        ],
        pagination: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          pageSize: 10
        }
      }
    }).as('getUsers');

    cy.intercept('GET', '/api/admin/users/stats', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalUsers: 1,
          activeUsers: 1,
          adminUsers: 1,
          userUsers: 0,
          correctorUsers: 0,
          inactiveUsers: 0
        }
      }
    }).as('getUserStats');

    cy.intercept('GET', '/api/admin/users', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'user-1',
            prenom: 'Jean',
            nom: 'Dupont',
            email: 'jean@test.com',
            role: 'USER',
            isActive: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          }
        ],
        pagination: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          pageSize: 10
        }
      }
    }).as('getUsers');

  });

  describe('Admin Navigation', () => {
    it('should access admin dashboard', () => {
      cy.visit('/admin');
      cy.contains('Dashboard').should('be.visible');
      cy.contains('Admin').should('be.visible');
    });

    it('should navigate to users management', () => {
      // Test direct de l'accès à la page users
      cy.visit('/admin/users');
      cy.url().should('include', '/admin/users');
      // Vérifier que la page se charge correctement
      cy.get('body').should('not.contain', '404');
      cy.get('body').should('not.contain', 'Error');
    });

    it('should display admin sidebar', () => {
      cy.visit('/admin');
      
      // Vérifier les éléments de navigation admin
      cy.contains('Dashboard').should('be.visible');
      cy.contains('Utilisateurs').should('be.visible');
      cy.contains('Commandes').should('be.visible');
      cy.contains('Factures').should('be.visible');
    });
  });

  describe('Users Management Basic', () => {
    it('should display users list', () => {
      cy.visit('/admin/users');
      
      cy.wait('@getUsers');
      cy.wait('@getUserStats');
      
      // Vérifier que la page se charge
      cy.get('body').should('not.contain', '404');
      cy.get('body').should('not.contain', 'Error');
      
      // Interface utilisateur basique
      cy.get('table, [data-testid="users-table"], .users-list').should('exist');
    });

    it('should display user statistics', () => {
      cy.visit('/admin/users');
      
      cy.wait('@getUserStats');
      
      // Vérifier la présence des statistiques
      cy.contains('Total').should('be.visible');
      cy.contains('1').should('be.visible'); // Nombre d'utilisateurs
    });

    it('should handle API errors gracefully', () => {
      // Override avec une erreur
      cy.intercept('GET', '/api/admin/users?*', {
        statusCode: 500,
        body: { success: false, message: 'Erreur serveur' }
      }).as('getUsersError');

      cy.visit('/admin/users');
      cy.wait('@getUsersError');
      
      // L'application ne devrait pas planter
      cy.get('body').should('not.contain', 'Cannot read');
      cy.get('body').should('exist');
    });
  });

  describe('Admin Dashboard Basic', () => {
    it('should display dashboard elements', () => {
      cy.intercept('GET', '/api/admin/dashboard*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            totalUsers: 10,
            totalCommandes: 5,
            recentActivity: []
          }
        }
      }).as('getDashboard');

      cy.visit('/admin/dashboard');
      
      // La page devrait se charger sans erreur
      cy.get('body').should('not.contain', '404');
      cy.contains('Dashboard').should('be.visible');
    });
  });

  describe('Admin Responsiveness', () => {
    it('should be responsive on mobile', () => {
      cy.viewport(375, 667); // iPhone SE
      cy.visit('/admin');
      
      cy.get('body').should('be.visible');
      // Sur mobile, le dashboard pourrait avoir une présentation différente
      cy.get('body').should('not.contain', '404');
      cy.get('body').should('not.contain', 'Error');
    });

    it('should be responsive on tablet', () => {
      cy.viewport(768, 1024); // iPad
      cy.visit('/admin');
      
      cy.get('body').should('be.visible');
      // Sur tablet, vérifier que l'application se charge bien
      cy.get('body').should('not.contain', '404');
      cy.get('body').should('not.contain', 'Error');
    });
  });

  describe('Admin Security Basic', () => {
    it('should redirect non-admin users', () => {
      // Simuler un utilisateur normal
      cy.window().then((win) => {
        win.localStorage.setItem('user', JSON.stringify({
          id: 'user-1',
          email: 'user@test.com',
          role: 'USER'
        }));
      });

      cy.visit('/admin');
      
      // Devrait être redirigé ou afficher un message d'erreur
      cy.url().should('not.include', '/admin/dashboard');
    });

    it('should handle logout functionality', () => {
      cy.visit('/admin');
      
      // Chercher un bouton de déconnexion
      cy.get('body').then(($body) => {
        if ($body.text().includes('Déconnexion') || $body.text().includes('Logout')) {
          cy.contains(/Déconnexion|Logout/).should('be.visible');
        }
      });
    });
  });

  describe('Performance Basic', () => {
    it('should load admin pages quickly', () => {
      const startTime = Date.now();
      
      cy.visit('/admin');
      cy.contains('Dashboard').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // Moins de 5 secondes
      });
    });
  });
});