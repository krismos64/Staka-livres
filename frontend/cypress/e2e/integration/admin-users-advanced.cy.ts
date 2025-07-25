/**
 * Tests d'intégration admin users - Version avancée avec backend
 * Nécessite un backend fonctionnel et des données de test
 */

describe('Admin Users - Tests d\'Intégration Avancés', () => {
  let testUser: any = null;

  beforeEach(() => {
    // Configuration pour l'environnement d'intégration
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'real-admin-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 'admin-integration',
        email: 'admin@staka-editions.com',
        prenom: 'Admin',
        nom: 'Integration',
        role: 'ADMIN'
      }));
    });

    // Navigation vers la page admin users
    cy.visit('/admin/users');
    
    // Attendre que la page se charge
    cy.get('body').should('not.contain', 'Chargement...');
  });

  afterEach(() => {
    // Nettoyer l'utilisateur test s'il existe
    if (testUser) {
      cy.deleteTestUser(testUser.id);
      testUser = null;
    }
  });

  describe('Interface utilisateur avancée', () => {
    it('should display comprehensive user management interface', () => {
      // Vérifier la structure de la page
      cy.get('[data-testid="page-title"], h1').should('contain', /Utilisateurs|Gestion/);
      
      // Statistiques utilisateurs
      cy.get('[data-testid="user-stats"], .stats-container').should('be.visible');
      cy.get('[data-testid="total-users"], .stat-total').should('contain', /\d+/);
      
      // Table des utilisateurs
      cy.get('table, [data-testid="users-table"]').should('be.visible');
      
      // Colonnes essentielles
      cy.get('th, .table-header').should('contain', 'Email');
      cy.get('th, .table-header').should('contain', 'Rôle');
      cy.get('th, .table-header').should('contain', 'Statut');
    });

    it('should have functional search and filters', () => {
      // Champ de recherche
      cy.get('input[placeholder*="recherche"], input[placeholder*="Rechercher"], [data-testid="search-input"]')
        .should('be.visible')
        .type('admin');

      // Attendre le résultat de la recherche
      cy.wait(1000);
      
      // Vérifier que la recherche fonctionne
      cy.get('tbody tr, .user-row').should('contain', 'admin');

      // Filtres par rôle
      cy.get('select[name*="role"], select#role, [data-testid="role-filter"]').should('be.visible');
      
      // Filtres par statut
      cy.get('select[name*="status"], select#status, [data-testid="status-filter"]').should('be.visible');
    });
  });

  describe('Opérations CRUD utilisateurs', () => {
    it('should create a new user successfully', () => {
      // Cliquer sur le bouton d'ajout
      cy.get('button[data-testid="add-user"], button:contains("Ajouter"), .btn-add-user')
        .should('be.visible')
        .click();

      // Remplir le formulaire
      cy.get('input[name="prenom"], input[placeholder*="Prénom"]').type('Test');
      cy.get('input[name="nom"], input[placeholder*="Nom"]').type('Integration');
      cy.get('input[name="email"], input[type="email"]').type(`test-${Date.now()}@integration.test`);
      cy.get('input[name="password"], input[type="password"]').type('TestPassword123!');
      
      // Sélectionner le rôle
      cy.get('select[name="role"], select#role').select('USER');

      // Soumettre
      cy.get('button[type="submit"], .btn-submit').click();

      // Vérifier le succès
      cy.contains('Utilisateur créé', { timeout: 10000 }).should('be.visible');
      
      // Vérifier que l'utilisateur apparaît dans la liste
      cy.get('table tbody, .users-list').should('contain', 'test-');
    });

    it('should modify user role successfully', () => {
      // Trouver un utilisateur USER
      cy.get('tbody tr, .user-row').contains('USER').parent('tr, .user-row').within(() => {
        // Cliquer sur le menu d'actions
        cy.get('button[data-testid="user-actions"], .actions-menu, button:contains("Actions")').click();
      });

      // Sélectionner "Changer le rôle"
      cy.contains('Changer le rôle', 'Modifier le rôle', 'Role').click();

      // Sélectionner nouveau rôle
      cy.get('select[name="role"], .role-select').select('ADMIN');
      
      // Confirmer
      cy.get('button:contains("Confirmer"), .btn-confirm').click();

      // Vérifier le succès
      cy.contains('Rôle modifié', { timeout: 10000 }).should('be.visible');
    });

    it('should deactivate/activate user successfully', () => {
      // Trouver un utilisateur actif
      cy.get('tbody tr, .user-row').contains('Actif').parent('tr, .user-row').within(() => {
        cy.get('button[data-testid="toggle-status"], .status-toggle').click();
      });

      // Confirmer la désactivation
      cy.get('button:contains("Confirmer"), .btn-confirm').click();

      // Vérifier le changement de statut
      cy.contains('Statut modifié', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Pagination et tri', () => {
    it('should handle pagination correctly', () => {
      // Vérifier la présence de la pagination
      cy.get('body').then(($body) => {
        if ($body.find('.pagination, [data-testid="pagination"]').length > 0) {
          cy.get('.pagination, [data-testid="pagination"]').should('be.visible');
          
          // Tester la navigation entre pages
          cy.get('.pagination button:contains("2"), .page-2').first().click();
          cy.url().should('include', 'page=2');
        }
      });
    });

    it('should sort users by different criteria', () => {
      // Tri par nom
      cy.get('th:contains("Nom"), .sort-nom').click();
      cy.wait(1000);
      
      // Vérifier que l'URL ou l'état change
      cy.get('tbody tr:first, .user-row:first').should('be.visible');

      // Tri par email
      cy.get('th:contains("Email"), .sort-email').click();
      cy.wait(1000);
    });
  });

  describe('Export et fonctionnalités avancées', () => {
    it('should export users data', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Export"), .btn-export').length > 0) {
          cy.get('button:contains("Export"), .btn-export').click();
          
          // Vérifier qu'un téléchargement est initié
          cy.contains('Export en cours', 'Téléchargement').should('be.visible');
        }
      });
    });

    it('should display user details modal', () => {
      // Cliquer sur un utilisateur pour voir les détails
      cy.get('tbody tr:first .user-name, .user-row:first .user-info').click();

      // Vérifier que le modal s'ouvre
      cy.get('.modal, [data-testid="user-modal"]').should('be.visible');
      cy.contains('Détails de l\'utilisateur', 'Informations').should('be.visible');

      // Fermer le modal
      cy.get('button:contains("Fermer"), .modal-close').click();
      cy.get('.modal, [data-testid="user-modal"]').should('not.exist');
    });
  });

  describe('Validation et gestion d\'erreurs', () => {
    it('should validate email format when creating user', () => {
      cy.get('button[data-testid="add-user"], button:contains("Ajouter")').click();
      
      // Email invalide
      cy.get('input[name="email"], input[type="email"]').type('email-invalide');
      cy.get('button[type="submit"]').click();
      
      // Vérifier la validation
      cy.get('input[name="email"]:invalid, .error-message').should('exist');
    });

    it('should handle API errors gracefully', () => {
      // Simuler une erreur réseau lors de la création
      cy.intercept('POST', '**/api/admin/users', {
        statusCode: 500,
        body: { success: false, message: 'Erreur serveur' }
      }).as('createUserError');

      cy.get('button[data-testid="add-user"], button:contains("Ajouter")').click();
      
      // Remplir le formulaire
      cy.get('input[name="prenom"]').type('Test');
      cy.get('input[name="nom"]').type('Error');
      cy.get('input[name="email"]').type('test-error@test.com');
      cy.get('input[name="password"]').type('Password123!');
      
      cy.get('button[type="submit"]').click();
      cy.wait('@createUserError');

      // Vérifier la gestion d'erreur
      cy.contains('Erreur', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Sécurité et permissions', () => {
    it('should prevent unauthorized actions', () => {
      // Simuler un utilisateur non-admin
      cy.window().then((win) => {
        win.localStorage.setItem('user', JSON.stringify({
          id: 'user-1',
          email: 'user@test.com',
          role: 'USER'
        }));
      });

      cy.visit('/admin/users', { failOnStatusCode: false });
      
      // Devrait être redirigé ou voir un message d'erreur
      cy.get('body').should('not.contain', 'Gestion des utilisateurs');
    });

    it('should require confirmation for destructive actions', () => {
      // Tentative de suppression
      cy.get('tbody tr:first, .user-row:first').within(() => {
        cy.get('button[data-testid="delete-user"], .btn-delete').click();
      });

      // Vérifier le modal de confirmation
      cy.contains('Êtes-vous sûr', 'Confirmer la suppression').should('be.visible');
      
      // Annuler
      cy.get('button:contains("Annuler"), .btn-cancel').click();
    });
  });

  describe('Performance et UX', () => {
    it('should load large user lists efficiently', () => {
      // Vérifier que la liste se charge en moins de 5 secondes
      const startTime = Date.now();
      
      cy.visit('/admin/users');
      cy.get('table tbody tr:first, .user-row:first').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000);
      });
    });

    it('should provide loading states for async operations', () => {
      cy.get('button[data-testid="add-user"]').click();
      
      // Remplir et soumettre rapidement
      cy.get('input[name="prenom"]').type('Loading');
      cy.get('input[name="nom"]').type('Test');
      cy.get('input[name="email"]').type(`loading-${Date.now()}@test.com`);
      cy.get('input[name="password"]').type('Password123!');
      
      cy.get('button[type="submit"]').click();
      
      // Vérifier l'état de chargement
      cy.get('button[type="submit"]:disabled, .loading').should('exist');
    });
  });
});