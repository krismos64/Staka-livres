// Commandes personnalisées pour les tests E2E
// Import des types Cypress
/// <reference types="cypress" />
import 'cypress-file-upload';

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>
      loginAsUser(): Chainable<void>
      logout(): Chainable<void>
      resetDatabase(): Chainable<void>
      simulateStripePayment(): Chainable<void>
      simulateStripePaymentFailure(): Chainable<void>
      createPaidProject(title: string): Chainable<string>
    }
  }
}

// Commande pour se connecter en tant qu'admin et accéder à la section utilisateurs
Cypress.Commands.add("loginAsAdmin", () => {
  // Tentative d'authentification via API avec fallback
  cy.request({
    method: "POST",
    url: `${Cypress.env("API_BASE_URL")}/auth/login`,
    body: {
      email: "admin@staka-editions.com",
      password: "admin123",
    },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body.token) {
      // Succès API - stocker le token
      cy.window().then((win) => {
        win.localStorage.setItem("auth_token", response.body.token);
      });
    } else {
      // Échec API - fallback avec login manuel
      cy.log("⚠️ API login failed, using manual login fallback");
      cy.visit("/login");
      cy.wait(2000);

      cy.get("input").eq(0).type("admin@staka-editions.com");
      cy.get("input").eq(1).type("admin123");
      cy.get('button[type="submit"]').first().click();
      cy.wait(3000);

      // Token de fallback
      cy.window().then((win) => {
        win.localStorage.setItem("auth_token", "admin-session-token");
      });
    }
  });

  // Navigation vers la page admin utilisateurs avec fallbacks multiples
  cy.visit("/admin/utilisateurs", { failOnStatusCode: false });
  cy.wait(2000);

  // Si redirection ou échec, essayer d'autres méthodes
  cy.url().then((currentUrl) => {
    if (!currentUrl.includes("/admin/utilisateurs")) {
      cy.log("⚠️ Direct admin URL failed, trying navigation via home");

      cy.visit("/");
      cy.wait(2000);

      // Tentative de navigation via menu si disponible
      cy.get("body").then(($body) => {
        if ($body.find('button[aria-label="User menu"]').length > 0) {
          cy.get('button[aria-label="User menu"]').click();
          cy.wait(1000);

          if ($body.text().includes("Panel Admin")) {
            cy.contains("Panel Admin").click();
            cy.wait(2000);
          }
        } else if (
          $body.text().includes("Admin") ||
          $body.text().includes("Utilisateurs")
        ) {
          // Fallback : chercher n'importe quel lien admin
          cy.contains(/Admin|Utilisateurs/i)
            .first()
            .click();
          cy.wait(2000);
        }
      });

      // Dernière tentative : navigation directe forcée
      cy.visit("/admin/utilisateurs", { failOnStatusCode: false });
      cy.wait(2000);
    }
  });
});

// Commande pour se connecter en tant qu'utilisateur client
Cypress.Commands.add("loginAsUser", () => {
  // Tentative d'authentification via API avec fallback
  cy.request({
    method: "POST",
    url: `${Cypress.env("API_BASE_URL")}/auth/login`,
    body: {
      email: "test@example.com",
      password: "password123",
    },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body.token) {
      // Succès API - stocker le token
      cy.window().then((win) => {
        win.localStorage.setItem("auth_token", response.body.token);
      });
    } else {
      // Échec API - fallback avec login manuel
      cy.log("⚠️ API login failed, using manual login fallback");
      cy.visit("/login");
      cy.wait(2000);

      cy.get("input").eq(0).type("test@example.com");
      cy.get("input").eq(1).type("password123");
      cy.get('button[type="submit"]').first().click();
      cy.wait(3000);

      // Token de fallback
      cy.window().then((win) => {
        win.localStorage.setItem("auth_token", "user-session-token");
      });
    }
  });
});

// Commande pour se déconnecter
Cypress.Commands.add("logout", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("auth_token");
  });
  cy.visit("/login");
  cy.wait(1000);
});

// Commande pour simuler un paiement Stripe réussi
Cypress.Commands.add("simulateStripePayment", () => {
  // Vérifier que les éléments Stripe sont présents
  cy.get('[data-cy="stripe-card-element"]', { timeout: 10000 }).should("be.visible");
  
  // Simuler la saisie des détails de carte (mode test Stripe)
  cy.get('[data-cy="stripe-card-element"]').within(() => {
    // Stripe Elements utilise des iframes, on simule donc avec des data attributes
    cy.get('[data-testid="card-number"]').type("4242424242424242");
    cy.get('[data-testid="card-expiry"]').type("12/25");
    cy.get('[data-testid="card-cvc"]').type("123");
  });
  
  // Cliquer sur le bouton de paiement
  cy.get('[data-cy="pay-button"]').click();
  
  // Attendre la confirmation
  cy.wait(3000);
});

// Commande pour simuler un échec de paiement Stripe
Cypress.Commands.add("simulateStripePaymentFailure", () => {
  // Vérifier que les éléments Stripe sont présents
  cy.get('[data-cy="stripe-card-element"]', { timeout: 10000 }).should("be.visible");
  
  // Utiliser une carte qui déclenche un échec (4000000000000002)
  cy.get('[data-cy="stripe-card-element"]').within(() => {
    cy.get('[data-testid="card-number"]').type("4000000000000002");
    cy.get('[data-testid="card-expiry"]').type("12/25");
    cy.get('[data-testid="card-cvc"]').type("123");
  });
  
  // Cliquer sur le bouton de paiement
  cy.get('[data-cy="pay-button"]').click();
  
  // Attendre l'erreur
  cy.wait(3000);
  cy.contains("Paiement échoué", { timeout: 10000 }).should("be.visible");
});

// Commande pour créer un projet payé via API (pour les tests avancés)
Cypress.Commands.add("createPaidProject", (title: string) => {
  const apiBaseUrl = Cypress.env("API_BASE_URL");
  
  // D'abord créer le projet
  return cy.window()
    .its("localStorage")
    .invoke("getItem", "auth_token")
    .then((token) => {
      return cy.request({
        method: "POST",
        url: `${apiBaseUrl}/projects`,
        headers: {
          Authorization: `Bearer ${token || "user-session-token"}`,
        },
        body: {
          title,
          type: "Roman",
          pages: 150,
          pack: "integral",
          description: "Projet créé automatiquement pour les tests E2E"
        },
      });
    })
    .then((projectResponse) => {
      const projectId = projectResponse.body.id;
      
      // Ensuite simuler un paiement réussi
      return cy.request({
        method: "POST",
        url: `${apiBaseUrl}/payments/simulate-success`,
        headers: {
          Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`,
        },
        body: {
          projectId,
          amount: 300, // 150 pages × 2€
          stripeSessionId: `test_session_${Date.now()}`
        },
        failOnStatusCode: false
      }).then(() => projectId);
    });
});

// Commande pour réinitialiser la base de données via API
Cypress.Commands.add("resetDatabase", () => {
  const apiBaseUrl = Cypress.env("API_BASE_URL");

  // Vérifier que l'API est accessible
  cy.request({
    method: "GET",
    url: `${apiBaseUrl}/health`,
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status !== 200) {
      cy.log("⚠️  Backend API non accessible, tests peuvent échouer");
    }
  });

  // Déclencher le seeding de la base (endpoint supposé côté backend)
  cy.request({
    method: "POST",
    url: `${apiBaseUrl}/dev/seed`,
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      cy.log("✅ Base de données seedée avec succès");
    } else {
      cy.log("⚠️  Seeding échoué, utilisation des données existantes");
    }
  });

  cy.wait(1000); // Petite pause pour s'assurer que tout est prêt
});

// Commande pour créer un utilisateur test via API
Cypress.Commands.add(
  "createTestUser",
  (userData: {
    prenom: string;
    nom: string;
    email: string;
    password: string;
    role: string;
  }) => {
    const apiBaseUrl = Cypress.env("API_BASE_URL");

    return cy
      .window()
      .its("localStorage")
      .invoke("getItem", "auth_token")
      .then((token) => {
        return cy.request({
          method: "POST",
          url: `${apiBaseUrl}/admin/users`,
          headers: {
            Authorization: `Bearer ${token || "admin-session-token"}`,
          },
          body: userData,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(201);
        return response.body;
      });
  }
);

// Commande pour supprimer un utilisateur via API
Cypress.Commands.add("deleteTestUser", (userId: string) => {
  const apiBaseUrl = Cypress.env("API_BASE_URL");

  return cy
    .window()
    .its("localStorage")
    .invoke("getItem", "auth_token")
    .then((token) => {
      return cy.request({
        method: "DELETE",
        url: `${apiBaseUrl}/admin/users/${userId}`,
        headers: {
          Authorization: `Bearer ${token || "admin-session-token"}`,
        },
        failOnStatusCode: false,
      });
    });
});

// Commande pour attendre qu'un élément soit visible et cliquable
Cypress.Commands.add("waitAndClick", (selector: string) => {
  cy.get(selector).should("be.visible").should("not.be.disabled").click();
});

// Types TypeScript pour les commandes personnalisées
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      resetDatabase(): Chainable<void>;
      createTestUser(userData: {
        prenom: string;
        nom: string;
        email: string;
        password: string;
        role: string;
      }): Chainable<any>;
      deleteTestUser(userId: string): Chainable<any>;
      waitAndClick(selector: string): Chainable<void>;
    }
  }
}

export {};
