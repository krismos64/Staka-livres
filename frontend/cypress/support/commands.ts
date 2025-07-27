/// <reference types="cypress" />

// ***********************************************
// Commandes Cypress personnalisées pour Staka-Livres
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      resetDatabase(): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      loginAsUser(): Chainable<void>;
      simulateStripePayment(): Chainable<void>;
    }
  }
}

/**
 * Réinitialise la base de données pour les tests
 * Note: En mode test, utilise des mocks et ne fait pas d'appel réel
 */
Cypress.Commands.add('resetDatabase', () => {
  // En mode test E2E, on se contente de simuler la réinitialisation
  cy.log('🔄 Simulation de réinitialisation de la base de données');
  
  // Effacer le localStorage et sessionStorage
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
  
  // Simuler un appel API de reset (qui sera mocké dans les tests)
  cy.request({
    method: 'POST',
    url: '/api/dev/reset-test-data',
    failOnStatusCode: false,
    body: { resetType: 'e2e-test' }
  }).then(() => {
    cy.log('✅ Base de données simulée réinitialisée');
  });
});

/**
 * Connexion en tant qu'administrateur
 */
Cypress.Commands.add('loginAsAdmin', () => {
  cy.log('🔑 Connexion en tant qu\'administrateur');
  
  // Configurer le localStorage avec un token admin
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'mock-admin-token-e2e');
    win.localStorage.setItem('user', JSON.stringify({
      id: 'admin-e2e',
      email: 'admin@staka-editions.com',
      prenom: 'Admin',
      nom: 'E2E',
      role: 'ADMIN',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }));
  });
  
  // Mock de l'API d'authentification admin
  cy.intercept('GET', '/api/auth/me', {
    statusCode: 200,
    body: {
      id: 'admin-e2e',
      email: 'admin@staka-editions.com',
      prenom: 'Admin',
      nom: 'E2E',
      role: 'ADMIN',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  }).as('adminAuth');
  
  cy.log('✅ Administrateur connecté');
});

/**
 * Connexion en tant qu'utilisateur standard
 */
Cypress.Commands.add('loginAsUser', () => {
  cy.log('🔑 Connexion en tant qu\'utilisateur');
  
  // Configurer le localStorage avec un token utilisateur
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'mock-user-token-e2e');
    win.localStorage.setItem('user', JSON.stringify({
      id: 'user-e2e',
      email: 'user@test.com',
      prenom: 'User',
      nom: 'E2E',
      role: 'USER',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }));
  });
  
  // Mock de l'API d'authentification utilisateur
  cy.intercept('GET', '/api/auth/me', {
    statusCode: 200,
    body: {
      id: 'user-e2e',
      email: 'user@test.com',
      prenom: 'User',
      nom: 'E2E',
      role: 'USER',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  }).as('userAuth');
  
  cy.log('✅ Utilisateur connecté');
});

/**
 * Simule un paiement Stripe pour les tests E2E
 */
Cypress.Commands.add('simulateStripePayment', () => {
  cy.log('💳 Simulation de paiement Stripe');
  
  // Mock de la session de paiement Stripe
  cy.intercept('POST', '/api/payments/create-checkout-session', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        sessionId: 'cs_test_e2e_simulation',
        url: '/payment/success?session_id=cs_test_e2e_simulation&mock=true'
      }
    }
  }).as('createPaymentSession');
  
  // Mock de la vérification de paiement
  cy.intercept('GET', '/api/payments/verify-session/cs_test_e2e_simulation', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        paymentStatus: 'paid',
        projectId: 'project-e2e-test',
        amount: 5000, // 50€ en centimes
        currency: 'eur',
        paymentIntentId: 'pi_test_e2e'
      }
    }
  }).as('verifyPayment');
  
  // Simuler la redirection vers la page de succès
  cy.visit('/payment/success?session_id=cs_test_e2e_simulation&mock=true');
  
  cy.log('✅ Paiement Stripe simulé avec succès');
});

export {};