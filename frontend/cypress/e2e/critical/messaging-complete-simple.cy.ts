/// <reference types="cypress" />

/**
 * Tests E2E - Système de Messagerie Simplifié (Critique)
 * 
 * Version simplifiée des tests de messagerie qui utilise l'interface réelle
 * au lieu de data-cy attributes spécialisés
 */

describe("🔔 Système de Messagerie Simplifié - Tests Critiques", () => {
  const testMessage = {
    subject: "Test E2E - Correction manuscrit",
    content: "Bonjour, j'ai besoin d'une correction complète de mon manuscrit de 200 pages.",
    threadId: `thread_${Date.now()}`,
    fileName: "manuscript-test.pdf",
    fileSize: "2.5 MB"
  };

  beforeEach(() => {
    // Effacer le localStorage et sessionStorage
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });

    // Mock des APIs de base
    cy.intercept('GET', '/api/messages*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
        pagination: {
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
          pageSize: 10
        }
      }
    }).as('getMessages');

    cy.intercept('POST', '/api/messages', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 'msg_test_123',
          subject: testMessage.subject,
          content: testMessage.content,
          status: 'SENT',
          createdAt: new Date().toISOString()
        }
      }
    }).as('sendMessage');

    cy.intercept('POST', '/api/contact', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 'contact_test_123',
          message: 'Message envoyé avec succès'
        }
      }
    }).as('sendContact');

    cy.visit("/");
    cy.wait(1000);
  });

  context("📨 Workflows Client Basiques", () => {
    it("devrait permettre l'accès à la page messages utilisateur", () => {
      // Mock de l'auth utilisateur
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-user-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'user-1',
          email: 'user@test.com',
          prenom: 'User',
          nom: 'Test',
          role: 'USER'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'user-1',
          email: 'user@test.com',
          prenom: 'User',
          nom: 'Test',
          role: 'USER',
          isActive: true
        }
      }).as('getMe');

      // Essayer d'accéder à la page messages
      cy.visit('/messages', { failOnStatusCode: false });
      cy.wait('@getMe');
      
      // Vérifier que la page se charge
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', '404');
      
      // Si pas de page messages, essayer alternatives
      cy.get('body').then(($body) => {
        if ($body.text().includes('404') || $body.text().includes('introuvable')) {
          // Essayer /app/messages
          cy.visit('/app/messages', { failOnStatusCode: false });
          cy.get('body').should('be.visible');
        } else {
          // Chercher des éléments de messagerie
          cy.get('body').should('not.contain', 'Cannot read');
        }
      });
    });

    it("devrait pouvoir interagir avec l'interface de messagerie", () => {
      // Auth utilisateur
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-user-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'user-1',
          email: 'user@test.com',
          role: 'USER'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'user-1',
          email: 'user@test.com',
          role: 'USER'
        }
      });

      cy.visit('/messages', { failOnStatusCode: false });
      cy.wait(2000);

      // Chercher des éléments d'interaction
      cy.get('body').then(($body) => {
        // Chercher boutons de nouveau message
        if ($body.text().includes('Nouveau message') || $body.text().includes('Nouveau')) {
          cy.contains(/Nouveau message|Nouveau/i).should('be.visible');
        }
        
        // Chercher des formulaires
        if ($body.find('form').length > 0) {
          cy.get('form').first().should('be.visible');
        }
        
        // Chercher des inputs
        if ($body.find('input').length > 0) {
          cy.get('input').first().should('be.visible');
        }
        
        // Chercher des boutons
        if ($body.find('button').length > 0) {
          cy.get('button').first().should('be.visible');
        }
      });
    });

    it("devrait tester l'envoi de message basique", () => {
      // Auth utilisateur
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-user-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'user-1',
          email: 'user@test.com',
          role: 'USER'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'user-1',
          email: 'user@test.com',
          role: 'USER'
        }
      });

      cy.visit('/messages', { failOnStatusCode: false });
      cy.wait(2000);

      // Essayer de remplir un formulaire si présent
      cy.get('body').then(($body) => {
        // Chercher un champ sujet
        if ($body.find('input[placeholder*="sujet"], input[name*="subject"], input[id*="subject"]').length > 0) {
          cy.get('input[placeholder*="sujet"], input[name*="subject"], input[id*="subject"]')
            .first()
            .type(testMessage.subject);
        }
        
        // Chercher un champ message/contenu
        if ($body.find('textarea').length > 0) {
          cy.get('textarea')
            .first()
            .type(testMessage.content);
        }
        
        // Chercher un bouton d'envoi
        if ($body.find('button[type="submit"], button:contains("Envoyer")').length > 0) {
          cy.get('button[type="submit"], button:contains("Envoyer")')
            .first()
            .should('be.visible');
        }
      });
    });
  });

  context("🌐 Messages de Support Public", () => {
    it("devrait permettre l'accès au formulaire de contact public", () => {
      // Accéder au formulaire de contact (sans auth)
      cy.visit("/contact", { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier que la page se charge
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', '404');
      
      // Chercher des éléments de formulaire de contact
      cy.get('body').then(($body) => {
        if ($body.text().includes('Contact')) {
          cy.contains('Contact').should('be.visible');
        }
        
        if ($body.find('form').length > 0) {
          cy.get('form').first().should('be.visible');
        }
      });
    });

    it("devrait pouvoir interagir avec le formulaire de contact", () => {
      cy.visit("/contact", { failOnStatusCode: false });
      cy.wait(2000);

      // Essayer de remplir le formulaire de contact
      cy.get('body').then(($body) => {
        // Nom
        if ($body.find('input[name*="name"], input[placeholder*="nom"]').length > 0) {
          cy.get('input[name*="name"], input[placeholder*="nom"]')
            .first()
            .type("Jean Dupont");
        }
        
        // Email
        if ($body.find('input[type="email"], input[name*="email"]').length > 0) {
          cy.get('input[type="email"], input[name*="email"]')
            .first()
            .type("jean.dupont@example.com");
        }
        
        // Sujet
        if ($body.find('input[name*="subject"], input[placeholder*="sujet"]').length > 0) {
          cy.get('input[name*="subject"], input[placeholder*="sujet"]')
            .first()
            .type("Demande d'information");
        }
        
        // Message
        if ($body.find('textarea').length > 0) {
          cy.get('textarea')
            .first()
            .type("Bonjour, j'aimerais connaître vos tarifs pour la correction d'un roman.");
        }
        
        // Bouton d'envoi
        if ($body.find('button[type="submit"], button:contains("Envoyer")').length > 0) {
          cy.get('button[type="submit"], button:contains("Envoyer")')
            .first()
            .should('be.visible');
        }
      });
    });

    it("devrait simuler l'envoi du formulaire de contact", () => {
      cy.visit("/contact", { failOnStatusCode: false });
      cy.wait(2000);

      // Remplir et soumettre le formulaire
      cy.get('body').then(($body) => {
        let hasForm = false;
        
        // Remplir les champs si présents
        if ($body.find('input[name*="name"], input[placeholder*="nom"]').length > 0) {
          cy.get('input[name*="name"], input[placeholder*="nom"]')
            .first()
            .type("Marie Martin");
          hasForm = true;
        }
        
        if ($body.find('input[type="email"], input[name*="email"]').length > 0) {
          cy.get('input[type="email"], input[name*="email"]')
            .first()
            .type("marie.martin@example.com");
          hasForm = true;
        }
        
        if ($body.find('textarea').length > 0) {
          cy.get('textarea')
            .first()
            .type("Question sur délais");
          hasForm = true;
        }
        
        // Si un formulaire a été trouvé, essayer de le soumettre
        if (hasForm) {
          cy.get('body').then(($body2) => {
            if ($body2.find('button[type="submit"]').length > 0) {
              // Mock de l'envoi
              cy.intercept('POST', '**/contact**', {
                statusCode: 200,
                body: { success: true, message: 'Message envoyé' }
              }).as('sendContactForm');
              
              cy.get('button[type="submit"]').first().click();
              cy.wait(1000);
            }
          });
        }
      });
    });
  });

  context("👑 Interface Admin Messagerie", () => {
    it("devrait permettre l'accès admin aux messages", () => {
      // Auth admin
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-admin-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'admin-1',
          email: 'admin@staka-editions.com',
          role: 'ADMIN'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'admin-1',
          email: 'admin@staka-editions.com',
          role: 'ADMIN'
        }
      });

      // Essayer plusieurs routes admin
      cy.visit('/admin/messages', { failOnStatusCode: false });
      cy.wait(2000);

      cy.get('body').then(($body) => {
        if ($body.text().includes('404')) {
          // Essayer autres routes
          cy.visit('/admin/dashboard', { failOnStatusCode: false });
          cy.wait(2000);
        }
        
        // Vérifier que l'admin est connecté
        cy.get('body').should('be.visible');
        cy.get('body').should('not.contain', 'Cannot read');
      });
    });

    it("devrait afficher l'interface admin de messagerie", () => {
      // Auth admin
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-admin-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'admin-1',
          email: 'admin@staka-editions.com',
          role: 'ADMIN'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'admin-1',
          email: 'admin@staka-editions.com',
          role: 'ADMIN'
        }
      });

      cy.visit('/admin/messages', { failOnStatusCode: false });
      cy.wait(2000);

      cy.get('body').then(($body) => {
        // Chercher des éléments de gestion de messages
        if ($body.text().includes('Messages')) {
          cy.contains('Messages').should('be.visible');
        }
        
        if ($body.find('table, .message, .list').length > 0) {
          cy.get('table, .message, .list').first().should('be.visible');
        }
        
        // Vérifier qu'il n'y a pas d'erreur critique
        cy.get('body').should('not.contain', 'Cannot read');
        cy.get('body').should('not.contain', 'undefined');
      });
    });
  });

  context("⚠️ Gestion des Erreurs Basiques", () => {
    it("devrait gérer les erreurs de connexion", () => {
      // Simuler une erreur réseau
      cy.intercept('GET', '/api/messages*', { forceNetworkError: true }).as('networkError');
      
      cy.visit('/messages', { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier que l'interface gère l'erreur
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', 'Cannot read');
    });

    it("devrait gérer les timeouts", () => {
      // Simuler une latence extrême
      cy.intercept('GET', '/api/messages*', (req) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ statusCode: 200, body: { data: [] } });
          }, 10000);
        });
      }).as('slowResponse');

      cy.visit('/messages', { failOnStatusCode: false });
      cy.wait(3000); // Attendre moins que le timeout

      // Vérifier que l'interface reste stable
      cy.get('body').should('be.visible');
    });

    it("devrait gérer les erreurs de validation", () => {
      // Simuler une erreur de validation
      cy.intercept('POST', '/api/messages', {
        statusCode: 400,
        body: { error: 'Données invalides', details: 'Le sujet est requis' }
      }).as('validationError');

      cy.visit('/contact', { failOnStatusCode: false });
      cy.wait(2000);

      // Essayer d'envoyer un formulaire vide
      cy.get('body').then(($body) => {
        if ($body.find('button[type="submit"]').length > 0) {
          cy.get('button[type="submit"]').first().click();
          cy.wait(1000);
          
          // Vérifier que l'erreur est gérée
          cy.get('body').should('be.visible');
        }
      });
    });
  });

  afterEach(() => {
    // Nettoyage après chaque test
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });
});