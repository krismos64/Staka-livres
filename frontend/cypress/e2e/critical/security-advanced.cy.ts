/// <reference types="cypress" />

/**
 * Tests E2E - Sécurité Approfondie (Critique)
 * 
 * Tests critiques de sécurité couvrant l'authentification avancée, 
 * les protections contre les attaques, la conformité RGPD et les
 * mécanismes de sécurité essentiels pour la production.
 * 
 * Couverture critique :
 * - Expiration et refresh des tokens JWT
 * - Protection contre les attaques (brute force, injection, XSS)
 * - Rate limiting intelligent
 * - Conformité RGPD complète (export, suppression, consentement)
 * - Validation sécurisée côté serveur
 * - Audit logs et traçabilité
 */

describe("🔐 Sécurité Approfondie - Tests Critiques", () => {
  const securityTestData = {
    users: {
      legitimate: {
        email: "security.test@example.com",
        password: "SecurePass123!",
        role: "USER"
      },
      admin: {
        email: "admin.security@example.com", 
        password: "AdminSecure456!",
        role: "ADMIN"
      },
      attacker: {
        email: "attacker@malicious.com",
        attempts: 10,
        patterns: ["bruteforce", "injection", "xss"]
      }
    },
    attacks: {
      sqlInjection: [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "UNION SELECT password FROM users",
        "'; INSERT INTO users VALUES ('hacker', 'admin'); --"
      ],
      xssPayloads: [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "javascript:alert('XSS')",
        "<svg onload=alert('XSS')>"
      ],
      csrfAttacks: [
        "fake-csrf-token-123",
        "expired-csrf-token-456",
        "malformed-csrf-token-789"
      ]
    },
    gdprScenarios: [
      {
        type: "data-export",
        user: "gdpr.export@test.com",
        expectedData: ["profile", "projects", "payments", "messages"]
      },
      {
        type: "data-deletion",
        user: "gdpr.delete@test.com",
        cascadeTypes: ["projects", "files", "audit_logs", "sessions"]
      },
      {
        type: "consent-management",
        user: "gdpr.consent@test.com",
        consentTypes: ["analytics", "marketing", "functional"]
      }
    ]
  };

  beforeEach(() => {
    // Configuration sécurisée pour les tests
    cy.resetDatabase();
    cy.visit("/");
    cy.wait(2000);

    // Vérifier que les headers de sécurité sont présents
    cy.request("/").then((response) => {
      expect(response.headers).to.have.property("x-frame-options");
      expect(response.headers).to.have.property("x-content-type-options");
      expect(response.headers).to.have.property("x-xss-protection");
    });
  });

  context("🔑 Authentification et Tokens JWT", () => {
    it("devrait gérer l'expiration et le refresh des tokens JWT", () => {
      cy.task("log", "🔹 Test expiration JWT et refresh automatique");

      // Login initial
      cy.loginAsUser();
      cy.visit("/dashboard");

      // Vérifier que le token est valide
      cy.window().then((win) => {
        const token = win.localStorage.getItem("auth_token");
        expect(token).to.exist;
        
        // Décoder le token pour vérifier l'expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        expect(payload.exp).to.be.greaterThan(Math.floor(Date.now() / 1000));
      });

      // Simuler l'expiration du token via API
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/expire-token`,
        headers: {
          Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
        }
      });

      // Effectuer une action qui nécessite l'authentification
      cy.get('[data-cy="user-menu"]').click();
      cy.get('[data-cy="profile-link"]').click();

      // Vérifier que l'app détecte l'expiration et tente un refresh
      cy.get('[data-cy="token-refresh-indicator"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Renouvellement de session...");

      // Vérifier que le nouveau token est valide
      cy.window().then((win) => {
        const newToken = win.localStorage.getItem("auth_token");
        expect(newToken).to.exist;
        expect(newToken).to.not.equal(cy.window().its("localStorage").invoke("getItem", "auth_token"));
      });

      // Vérifier que l'utilisateur reste connecté
      cy.get('[data-cy="profile-page"]', { timeout: 15000 })
        .should("be.visible");

      cy.get('[data-cy="session-renewed"]')
        .should("contain", "Session renouvelée automatiquement");
    });

    it("devrait déconnecter automatiquement après expiration définitive", () => {
      cy.task("log", "🔹 Test déconnexion automatique expiration définitive");

      cy.loginAsUser();
      cy.visit("/dashboard");

      // Simuler l'expiration du refresh token également
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/expire-all-tokens`,
        headers: {
          Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
        }
      });

      // Tenter une action authentifiée
      cy.get('[data-cy="create-project"]').click();

      // Vérifier la déconnexion automatique
      cy.get('[data-cy="session-expired-notification"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Session expirée")
        .should("contain", "Veuillez vous reconnecter");

      // Vérifier la redirection vers login
      cy.url({ timeout: 10000 }).should("include", "/login");

      // Vérifier que les tokens sont supprimés
      cy.window().then((win) => {
        expect(win.localStorage.getItem("auth_token")).to.be.null;
        expect(win.localStorage.getItem("refresh_token")).to.be.null;
      });

      // Vérifier que l'accès aux pages protégées est bloqué
      cy.visit("/dashboard");
      cy.url().should("include", "/login");
    });

    it("devrait invalider les sessions sur changement de mot de passe", () => {
      cy.task("log", "🔹 Test invalidation sessions changement mot de passe");

      // Créer plusieurs sessions actives
      const sessions = [];
      
      for (let i = 0; i < 3; i++) {
        cy.loginAsUser();
        
        // Simuler différents appareils/navigateurs
        cy.window().then((win) => {
          const token = win.localStorage.getItem("auth_token");
          sessions.push(token);
          
          // Ajouter des métadonnées de session
          cy.request({
            method: "POST",
            url: `${Cypress.env("API_BASE_URL")}/sessions/metadata`,
            headers: { Authorization: `Bearer ${token}` },
            body: {
              device: `Device ${i + 1}`,
              browser: `Browser ${i + 1}`,
              ip: `192.168.1.${100 + i}`
            }
          });
        });

        if (i < 2) cy.logout();
      }

      // Vérifier les sessions actives côté admin
      cy.loginAsAdmin();
      cy.visit("/admin/active-sessions");

      cy.get('[data-cy="active-sessions-list"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="session-count"]')
        .should("contain", "3 sessions actives");

      // L'utilisateur change son mot de passe
      cy.logout();
      cy.loginAsUser();
      cy.visit("/profile/security");

      cy.get('[data-cy="change-password"]').click();
      cy.get('[data-cy="current-password"]').type(securityTestData.users.legitimate.password);
      cy.get('[data-cy="new-password"]').type("NewSecurePass789!");
      cy.get('[data-cy="confirm-password"]').type("NewSecurePass789!");
      cy.get('[data-cy="submit-password-change"]').click();

      // Vérifier l'invalidation de toutes les sessions
      cy.get('[data-cy="password-changed-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Mot de passe modifié")
        .should("contain", "Toutes les sessions ont été invalidées");

      // Vérifier la déconnexion automatique
      cy.get('[data-cy="session-invalidated"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Reconnexion requise");

      cy.url().should("include", "/login");

      // Vérifier côté admin que les sessions sont supprimées
      cy.loginAsAdmin();
      cy.visit("/admin/active-sessions");

      cy.get('[data-cy="session-count"]', { timeout: 10000 })
        .should("contain", "1 session active"); // Seulement la session admin

      // Vérifier les logs de sécurité
      cy.visit("/admin/security-logs");

      cy.get('[data-cy="security-events"]')
        .should("contain", "PASSWORD_CHANGED")
        .should("contain", "ALL_SESSIONS_INVALIDATED")
        .should("contain", "3 sessions terminées");
    });

    it("devrait détecter et bloquer les tentatives de session hijacking", () => {
      cy.task("log", "🔹 Test détection session hijacking");

      // Session légitime
      cy.loginAsUser();
      cy.visit("/dashboard");

      let legitimateToken: string;
      cy.window().then((win) => {
        legitimateToken = win.localStorage.getItem("auth_token");
      });

      // Simuler une tentative de hijacking (IP différente, User-Agent différent)
      cy.request({
        method: "GET",
        url: `${Cypress.env("API_BASE_URL")}/user/profile`,
        headers: {
          Authorization: `Bearer ${legitimateToken}`,
          "X-Forwarded-For": "1.2.3.4", // IP suspecte
          "User-Agent": "SuspiciousBot/1.0" // User-Agent différent
        },
        failOnStatusCode: false
      }).then((response) => {
        // La requête devrait être bloquée
        expect(response.status).to.eq(403);
        expect(response.body.error).to.contain("Session anomaly detected");
      });

      // Vérifier les alertes de sécurité
      cy.loginAsAdmin();
      cy.visit("/admin/security-alerts");

      cy.get('[data-cy="hijacking-alerts"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Tentative de hijacking détectée")
        .should("contain", "IP suspecte: 1.2.3.4")
        .should("contain", "User-Agent anormal");

      // Vérifier que la session légitime est préservée
      cy.logout();
      cy.loginAsUser();
      cy.visit("/dashboard");

      cy.get('[data-cy="security-warning"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Activité suspecte détectée")
        .should("contain", "Vérifiez vos connexions actives");

      // Interface de gestion des sessions suspectes
      cy.get('[data-cy="review-sessions"]').click();

      cy.get('[data-cy="suspicious-sessions"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "1 tentative bloquée")
        .should("contain", "Votre session actuelle est sécurisée");
    });
  });

  context("🛡️ Protection contre les Attaques", () => {
    it("devrait bloquer les attaques par injection SQL", () => {
      cy.task("log", "🔹 Test protection injection SQL");

      securityTestData.attacks.sqlInjection.forEach((injection, index) => {
        cy.task("log", `   Testing SQL injection: ${injection}`);

        // Test sur différents points d'entrée
        const endpoints = [
          { url: "/auth/login", field: "email", payload: injection },
          { url: "/projects/search", field: "query", payload: injection },
          { url: "/user/update", field: "name", payload: injection }
        ];

        endpoints.forEach((endpoint) => {
          cy.request({
            method: "POST",
            url: `${Cypress.env("API_BASE_URL")}${endpoint.url}`,
            body: {
              [endpoint.field]: endpoint.payload,
              password: "test123" // Si nécessaire
            },
            failOnStatusCode: false
          }).then((response) => {
            // L'injection devrait être bloquée
            expect(response.status).to.be.oneOf([400, 403, 422]);
            
            if (response.body.error) {
              expect(response.body.error).to.not.contain("SQL");
              expect(response.body.error).to.not.contain("database");
              expect(response.body.error).to.contain("Invalid input");
            }
          });
        });
      });

      // Vérifier les logs de sécurité
      cy.loginAsAdmin();
      cy.visit("/admin/security-logs");

      cy.get('[data-cy="injection-attempts"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", `${securityTestData.attacks.sqlInjection.length * 3} tentatives d'injection`)
        .should("contain", "Toutes bloquées");

      // Vérifier les détails des tentatives
      cy.get('[data-cy="injection-details"]').within(() => {
        cy.should("contain", "SQL injection détectée");
        cy.should("contain", "IP source enregistrée");
        cy.should("contain", "Payload bloqué");
        cy.should("not.contain", "DROP TABLE"); // Payload ne doit pas être loggé en clair
      });

      // Vérifier que la base de données est intacte
      cy.request({
        method: "GET",
        url: `${Cypress.env("API_BASE_URL")}/admin/system-integrity`,
        headers: {
          Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.databaseIntegrity).to.eq("intact");
        expect(response.body.tablesCount).to.be.greaterThan(0);
      });
    });

    it("devrait neutraliser les attaques XSS", () => {
      cy.task("log", "🔹 Test protection XSS");

      cy.loginAsUser();
      cy.visit("/messages");

      securityTestData.attacks.xssPayloads.forEach((xssPayload, index) => {
        cy.task("log", `   Testing XSS payload: ${xssPayload}`);

        // Test d'injection XSS dans un message
        cy.get('[data-cy="new-message-btn"]').click();
        cy.get('[data-cy="message-subject"]').type(`XSS Test ${index}`);
        cy.get('[data-cy="message-content"]').type(xssPayload);
        cy.get('[data-cy="send-message-btn"]').click();

        // Vérifier que le contenu est échappé/nettoyé
        cy.get('[data-cy="message-sent-success"]', { timeout: 10000 })
          .should("be.visible");

        cy.get('[data-cy="message-list"]')
          .contains(`XSS Test ${index}`)
          .click();

        // Vérifier que le script ne s'exécute pas
        cy.window().then((win) => {
          // Aucune alerte JavaScript ne devrait apparaître
          const originalAlert = win.alert;
          let alertCalled = false;
          
          win.alert = () => {
            alertCalled = true;
            return true;
          };

          cy.get('[data-cy="message-content"]', { timeout: 5000 })
            .should("be.visible")
            .should("not.contain", "<script>")
            .should("not.contain", "javascript:");

          // Vérifier que le contenu est échappé
          cy.get('[data-cy="message-content"]')
            .should("contain", "&lt;script&gt;") // Échappé HTML
            .or("contain", "[SCRIPT REMOVED]") // Ou filtré
            .or("contain", xssPayload.replace(/</g, "&lt;")); // Ou échappé

          expect(alertCalled).to.be.false;
          win.alert = originalAlert;
        });

        // Fermer le message
        cy.get('[data-cy="close-message"]').click();
      });

      // Vérifier les logs XSS
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/security-logs");

      cy.get('[data-cy="xss-attempts"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", `${securityTestData.attacks.xssPayloads.length} tentatives XSS`)
        .should("contain", "Payloads neutralisés");

      // Vérifier la configuration Content Security Policy
      cy.request("/").then((response) => {
        expect(response.headers).to.have.property("content-security-policy");
        const csp = response.headers["content-security-policy"];
        expect(csp).to.contain("script-src 'self'");
        expect(csp).to.contain("object-src 'none'");
      });
    });

    it("devrait implémenter une protection CSRF robuste", () => {
      cy.task("log", "🔹 Test protection CSRF");

      cy.loginAsUser();
      cy.visit("/profile");

      // Récupérer le token CSRF légitime
      let csrfToken: string;
      cy.get('[name="csrf-token"]')
        .invoke("attr", "content")
        .then((token) => {
          csrfToken = token;
        });

      // Test avec token CSRF valide (devrait réussir)
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/user/update-profile`,
        headers: {
          Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`,
          "X-CSRF-Token": csrfToken
        },
        body: {
          firstName: "Test",
          lastName: "User"
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
      });

      // Tests avec tokens CSRF invalides
      securityTestData.attacks.csrfAttacks.forEach((fakeToken, index) => {
        cy.task("log", `   Testing CSRF with fake token: ${fakeToken}`);

        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/user/update-profile`,
          headers: {
            Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`,
            "X-CSRF-Token": fakeToken
          },
          body: {
            firstName: "Hacker",
            lastName: "Attack"
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(403);
          expect(response.body.error).to.contain("CSRF token");
        });
      });

      // Test sans token CSRF
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/user/update-profile`,
        headers: {
          Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
          // Pas de X-CSRF-Token
        },
        body: {
          firstName: "No",
          lastName: "CSRF"
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.error).to.contain("CSRF token required");
      });

      // Vérifier les logs CSRF
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/security-logs");

      cy.get('[data-cy="csrf-violations"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "4 violations CSRF") // 3 faux tokens + 1 sans token
        .should("contain", "Toutes les attaques bloquées");
    });

    it("devrait résister aux attaques de force brute", () => {
      cy.task("log", "🔹 Test protection force brute");

      const attackEmail = securityTestData.users.attacker.email;
      const attempts = [];

      // Simuler 10 tentatives de connexion échouées
      for (let i = 0; i < 10; i++) {
        attempts.push(
          cy.request({
            method: "POST",
            url: `${Cypress.env("API_BASE_URL")}/auth/login`,
            body: {
              email: attackEmail,
              password: `wrong-password-${i}`
            },
            failOnStatusCode: false
          })
        );
      }

      // Attendre toutes les tentatives
      cy.wrap(Promise.all(attempts)).then((responses) => {
        // Les premières tentatives devraient retourner 401
        responses.slice(0, 5).forEach((response) => {
          expect(response.status).to.eq(401);
          expect(response.body.error).to.contain("Invalid credentials");
        });

        // Les tentatives suivantes devraient être limitées
        responses.slice(5).forEach((response, index) => {
          expect(response.status).to.eq(429);
          expect(response.body.error).to.contain("Too many attempts");
          expect(response.body.retryAfter).to.be.greaterThan(0);
          expect(response.body.retryAfter).to.be.lessThan(300); // Moins de 5 minutes
        });
      });

      // Vérifier que même avec le bon mot de passe, l'accès est bloqué
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/auth/login`,
        body: {
          email: attackEmail,
          password: "correct-password" // Supposons que ce soit le bon
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(429);
        expect(response.body.error).to.contain("Account temporarily locked");
      });

      // Vérifier les alertes de sécurité
      cy.loginAsAdmin();
      cy.visit("/admin/security-alerts");

      cy.get('[data-cy="brute-force-alerts"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Attaque force brute détectée")
        .should("contain", attackEmail)
        .should("contain", "10 tentatives")
        .should("contain", "Compte verrouillé");

      // Vérifier la gestion du déblocage
      cy.get('[data-cy="blocked-accounts"]')
        .contains(attackEmail)
        .closest('[data-cy="blocked-account-row"]')
        .within(() => {
          cy.get('[data-cy="unblock-account"]').click();
        });

      cy.get('[data-cy="unblock-confirmation"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="unblock-reason"]').type("Test de sécurité terminé");
      cy.get('[data-cy="confirm-unblock"]').click();

      cy.get('[data-cy="account-unblocked"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Compte débloqué");

      // Vérifier que l'accès est restauré
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/auth/login`,
        body: { 
          email: attackEmail,
          password: "correct-password"
        },
        failOnStatusCode: false
      }).then((response) => {
        // Le compte devrait être accessible à nouveau
        expect(response.status).to.not.eq(429);
      });
    });
  });

  context("📊 Rate Limiting Intelligent", () => {
    it("devrait appliquer un rate limiting adaptatif par utilisateur", () => {
      cy.task("log", "🔹 Test rate limiting adaptatif");

      // Test utilisateur normal
      cy.loginAsUser();

      // Faire plusieurs requêtes normales
      for (let i = 0; i < 20; i++) {
        cy.request({
          method: "GET",
          url: `${Cypress.env("API_BASE_URL")}/user/dashboard`,
          headers: {
            Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
          }
        }).then((response) => {
          if (i < 15) {
            expect(response.status).to.eq(200);
          } else {
            // Rate limiting devrait s'activer
            expect(response.status).to.be.oneOf([200, 429]);
          }
        });
      }

      // Test utilisateur premium (limites plus élevées)
      cy.logout();
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/create-premium-user`,
        body: {
          email: "premium.user@test.com",
          subscription: "premium"
        }
      });

      cy.visit("/login");
      cy.get('[data-cy="email"]').type("premium.user@test.com");
      cy.get('[data-cy="password"]').type("password123");
      cy.get('[data-cy="login-submit"]').click();

      // L'utilisateur premium devrait avoir des limites plus élevées
      for (let i = 0; i < 50; i++) {
        cy.request({
          method: "GET",
          url: `${Cypress.env("API_BASE_URL")}/user/dashboard`,
          headers: {
            Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
          }
        }).then((response) => {
          if (i < 45) {
            expect(response.status).to.eq(200);
          }
        });
      }

      // Vérifier les métriques de rate limiting
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/rate-limiting");

      cy.get('[data-cy="rate-limit-stats"]', { timeout: 15000 })
        .should("be.visible");

      cy.get('[data-cy="user-limits"]')
        .should("contain", "Utilisateur standard: 15 req/min")
        .should("contain", "Utilisateur premium: 45 req/min");

      cy.get('[data-cy="adaptive-adjustments"]')
        .should("contain", "Ajustements adaptatifs actifs")
        .should("contain", "Limites personnalisées par profil");
    });

    it("devrait ajuster automatiquement les limites selon la charge", () => {
      cy.task("log", "🔹 Test ajustement automatique rate limiting");

      // Simuler une charge élevée
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/simulate-high-load`,
        body: {
          concurrentUsers: 100,
          requestsPerSecond: 200,
          duration: 300 // 5 minutes
        }
      });

      cy.loginAsAdmin();
      cy.visit("/admin/system-load");

      // Vérifier la détection de charge
      cy.get('[data-cy="high-load-detected"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "Charge élevée détectée")
        .should("contain", "200 req/s");

      // Vérifier les ajustements automatiques
      cy.get('[data-cy="auto-adjustments"]')
        .should("contain", "Rate limits réduits automatiquement")
        .should("contain", "Mode conservation activé")
        .should("contain", "Utilisateurs prioritaires préservés");

      // Vérifier les nouvelles limites
      cy.visit("/admin/rate-limiting");

      cy.get('[data-cy="current-limits"]', { timeout: 10000 })
        .should("contain", "Limites ajustées pour haute charge")
        .should("contain", "Utilisateur standard: 8 req/min") // Réduit de ~50%
        .should("contain", "Utilisateur premium: 25 req/min"); // Moins réduit

      // Simuler le retour à la normale
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/simulate-normal-load`
      });

      // Vérifier la restauration des limites
      cy.get('[data-cy="load-normalized"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "Charge revenue à la normale")
        .should("contain", "Limites restaurées");

      cy.get('[data-cy="current-limits"]')
        .should("contain", "Utilisateur standard: 15 req/min") // Restauré
        .should("contain", "Utilisateur premium: 45 req/min");
    });

    it("devrait implémenter des quotas API sophistiqués", () => {
      cy.task("log", "🔹 Test quotas API sophistiqués");

      // Créer différents types d'utilisateurs API
      const apiUsers = [
        { type: "basic", dailyLimit: 1000, burstLimit: 10 },
        { type: "professional", dailyLimit: 10000, burstLimit: 50 },
        { type: "enterprise", dailyLimit: 100000, burstLimit: 200 }
      ];

      apiUsers.forEach((userType, index) => {
        // Créer l'utilisateur API
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/dev/create-api-user`,
          body: {
            email: `api.${userType.type}@test.com`,
            plan: userType.type,
            limits: {
              daily: userType.dailyLimit,
              burst: userType.burstLimit
            }
          }
        }).then((response) => {
          const apiKey = response.body.apiKey;

          // Test des limites de burst
          const burstRequests = [];
          for (let i = 0; i < userType.burstLimit + 5; i++) {
            burstRequests.push(
              cy.request({
                method: "GET",
                url: `${Cypress.env("API_BASE_URL")}/api/v1/projects`,
                headers: {
                  "X-API-Key": apiKey
                },
                failOnStatusCode: false
              })
            );
          }

          cy.wrap(Promise.all(burstRequests)).then((responses) => {
            // Les premières requêtes devraient passer
            responses.slice(0, userType.burstLimit).forEach((response) => {
              expect(response.status).to.eq(200);
            });

            // Les suivantes devraient être limitées
            responses.slice(userType.burstLimit).forEach((response) => {
              expect(response.status).to.eq(429);
              expect(response.headers).to.have.property("x-ratelimit-remaining");
              expect(response.headers).to.have.property("x-ratelimit-reset");
            });
          });
        });
      });

      // Vérifier les statistiques d'utilisation API
      cy.loginAsAdmin();
      cy.visit("/admin/api-usage");

      cy.get('[data-cy="api-usage-stats"]', { timeout: 15000 })
        .should("be.visible");

      apiUsers.forEach((userType) => {
        cy.get(`[data-cy="plan-${userType.type}"]`)
          .should("contain", `Limite quotidienne: ${userType.dailyLimit.toLocaleString()}`)
          .should("contain", `Limite burst: ${userType.burstLimit}`)
          .should("contain", "Quota utilisé:");
      });

      // Vérifier les alertes de dépassement
      cy.get('[data-cy="quota-alerts"]')
        .should("contain", "Dépassements détectés")
        .should("contain", "Utilisateurs notifiés");

      // Test de récupération progressive des quotas
      cy.get('[data-cy="quota-recovery"]')
        .should("contain", "Récupération automatique active")
        .should("contain", "Fenêtres glissantes configurées");
    });
  });

  context("🏛️ Conformité RGPD Complète", () => {
    it("devrait permettre l'export complet des données utilisateur", () => {
      cy.task("log", "🔹 Test export données RGPD");

      const testUser = securityTestData.gdprScenarios[0];
      
      // Créer un utilisateur avec données riches
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/create-rich-user`,
        body: {
          email: testUser.user,
          profile: { firstName: "GDPR", lastName: "TestUser" },
          projects: 3,
          payments: 2,
          messages: 5,
          files: 4
        }
      });

      // L'utilisateur demande ses données
      cy.visit("/login");
      cy.get('[data-cy="email"]').type(testUser.user);
      cy.get('[data-cy="password"]').type("password123");
      cy.get('[data-cy="login-submit"]').click();

      cy.visit("/profile/privacy");

      cy.get('[data-cy="gdpr-section"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="export-my-data"]').click();

      cy.get('[data-cy="export-confirmation"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Export de toutes vos données")
        .should("contain", "Conforme RGPD");

      cy.get('[data-cy="export-details"]').within(() => {
        testUser.expectedData.forEach((dataType) => {
          cy.should("contain", dataType);
        });
      });

      cy.get('[data-cy="confirm-export"]').click();

      // Vérifier le traitement de la demande
      cy.get('[data-cy="export-processing"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Préparation de vos données en cours");

      // Simuler la génération du fichier d'export
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/complete-data-export`,
        body: { userEmail: testUser.user }
      });

      // Vérifier la notification d'export prêt
      cy.get('[data-cy="export-ready"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "Vos données sont prêtes")
        .should("contain", "Lien de téléchargement envoyé par email");

      // Vérifier le contenu de l'export
      cy.get('[data-cy="download-export"]').click();

      // Simuler la vérification du contenu
      cy.request({
        method: "GET",
        url: `${Cypress.env("API_BASE_URL")}/user/data-export/verify`,
        headers: {
          Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        
        const exportData = response.body;
        expect(exportData).to.have.property("profile");
        expect(exportData).to.have.property("projects");
        expect(exportData).to.have.property("payments");
        expect(exportData).to.have.property("messages");
        expect(exportData).to.have.property("files");
        
        // Vérifier que les données sensibles sont anonymisées pour les tiers
        expect(exportData.payments[0]).to.not.have.property("fullCardNumber");
        expect(exportData.messages[0]).to.have.property("content");
      });

      // Vérifier les logs RGPD
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/gdpr-logs");

      cy.get('[data-cy="gdpr-activities"]', { timeout: 15000 })
        .should("contain", "DATA_EXPORT_REQUESTED")
        .should("contain", "DATA_EXPORT_COMPLETED")
        .should("contain", testUser.user);
    });

    it("devrait effectuer la suppression complète du compte et des données", () => {
      cy.task("log", "🔹 Test suppression complète RGPD");

      const testUser = securityTestData.gdprScenarios[1];

      // Créer un utilisateur avec données complexes et relations
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/create-complex-user`,
        body: {
          email: testUser.user,
          cascadeTypes: testUser.cascadeTypes,
          relations: {
            sharedProjects: 2,
            messagesWithOthers: 3,
            paymentHistory: 4
          }
        }
      });

      // L'utilisateur demande la suppression
      cy.visit("/login");
      cy.get('[data-cy="email"]').type(testUser.user);
      cy.get('[data-cy="password"]').type("password123");
      cy.get('[data-cy="login-submit"]').click();

      cy.visit("/profile/privacy");

      cy.get('[data-cy="delete-account-section"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="delete-my-account"]').click();

      // Interface de suppression RGPD
      cy.get('[data-cy="deletion-modal"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Suppression définitive de votre compte")
        .should("contain", "Conforme au RGPD");

      // Affichage des données qui seront supprimées
      cy.get('[data-cy="deletion-impact"]').within(() => {
        testUser.cascadeTypes.forEach((dataType) => {
          cy.should("contain", dataType);
        });
      });

      // Gestion des données partagées
      cy.get('[data-cy="shared-data-options"]')
        .should("be.visible")
        .should("contain", "Données partagées avec d'autres utilisateurs");

      cy.get('[data-cy="anonymize-shared"]').check(); // Anonymiser au lieu de supprimer
      cy.get('[data-cy="delete-personal"]').check(); // Supprimer les données personnelles

      // Période de grâce
      cy.get('[data-cy="grace-period"]')
        .should("contain", "Période de grâce: 30 jours")
        .should("contain", "Possibilité d'annuler avant suppression définitive");

      // Confirmation avec mot de passe
      cy.get('[data-cy="confirm-password"]').type("password123");
      cy.get('[data-cy="deletion-reason"]').select("privacy-concerns");
      cy.get('[data-cy="final-confirmation"]').check();

      cy.get('[data-cy="confirm-deletion"]').click();

      // Vérifier la confirmation
      cy.get('[data-cy="deletion-initiated"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Demande de suppression enregistrée")
        .should("contain", "Email de confirmation envoyé")
        .should("contain", "30 jours pour annuler");

      // Simuler la période de grâce
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/fast-forward-grace-period`,
        body: { userEmail: testUser.user, days: 30 }
      });

      // Vérifier la suppression automatique
      cy.loginAsAdmin();
      cy.visit("/admin/gdpr-deletions");

      cy.get('[data-cy="completed-deletions"]', { timeout: 20000 })
        .should("contain", testUser.user)
        .should("contain", "Suppression complétée automatiquement")
        .should("contain", "Toutes les données personnelles supprimées");

      // Vérifier l'anonymisation des données partagées
      cy.get('[data-cy="anonymized-data"]')
        .should("contain", "Messages anonymisés")
        .should("contain", "Projets partagés préservés")
        .should("contain", "Références utilisateur supprimées");

      // Vérifier que l'utilisateur ne peut plus se connecter
      cy.logout();
      cy.visit("/login");
      cy.get('[data-cy="email"]').type(testUser.user);
      cy.get('[data-cy="password"]').type("password123");
      cy.get('[data-cy="login-submit"]').click();

      cy.get('[data-cy="login-error"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Compte introuvable");

      // Vérifier l'intégrité de la base après suppression
      cy.loginAsAdmin();
      cy.visit("/admin/data-integrity");

      cy.get('[data-cy="integrity-check"]', { timeout: 15000 })
        .should("contain", "Intégrité référentielle: OK")
        .should("contain", "Aucune donnée orpheline")
        .should("contain", "Contraintes respectées");
    });

    it("devrait gérer le consentement granulaire et sa révocation", () => {
      cy.task("log", "🔹 Test gestion consentement RGPD");

      const testUser = securityTestData.gdprScenarios[2];

      // Créer un utilisateur pour les tests de consentement
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/create-user-simple`,
        body: { email: testUser.user }
      });

      cy.visit("/login");
      cy.get('[data-cy="email"]').type(testUser.user);
      cy.get('[data-cy="password"]').type("password123");
      cy.get('[data-cy="login-submit"]').click();

      cy.visit("/profile/privacy");

      // Interface de gestion des consentements
      cy.get('[data-cy="consent-management"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Gestion de vos consentements");

      testUser.consentTypes.forEach((consentType) => {
        cy.get(`[data-cy="consent-${consentType}"]`).within(() => {
          // Vérifier la description claire
          cy.get('[data-cy="consent-description"]')
            .should("be.visible")
            .should("contain", "Finalité:")
            .should("contain", "Données concernées:")
            .should("contain", "Durée de conservation:");

          // Donner le consentement
          cy.get('[data-cy="grant-consent"]').check();
          
          // Vérifier la confirmation
          cy.get('[data-cy="consent-granted"]', { timeout: 5000 })
            .should("be.visible")
            .should("contain", "Consentement accordé");
        });
      });

      // Vérifier l'historique des consentements
      cy.get('[data-cy="consent-history"]').click();

      cy.get('[data-cy="consent-timeline"]', { timeout: 10000 })
        .should("be.visible");

      testUser.consentTypes.forEach((consentType) => {
        cy.get('[data-cy="consent-timeline"]')
          .should("contain", `${consentType}: Accordé`)
          .should("contain", new Date().toLocaleDateString());
      });

      // Test de révocation granulaire
      cy.get('[data-cy="manage-consents"]').click();

      // Révoquer le consentement marketing
      cy.get('[data-cy="consent-marketing"]').within(() => {
        cy.get('[data-cy="revoke-consent"]').click();
      });

      cy.get('[data-cy="revocation-confirmation"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Révoquer le consentement marketing");

      cy.get('[data-cy="revocation-impact"]')
        .should("contain", "Vous ne recevrez plus d'emails promotionnels")
        .should("contain", "Vos données marketing seront anonymisées")
        .should("contain", "Les autres services restent actifs");

      cy.get('[data-cy="confirm-revocation"]').click();

      cy.get('[data-cy="consent-revoked"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Consentement marketing révoqué");

      // Vérifier l'impact immédiat côté admin
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/consent-management");

      cy.get('[data-cy="consent-changes"]', { timeout: 15000 })
        .should("contain", testUser.user)
        .should("contain", "Marketing: Révoqué")
        .should("contain", "Données anonymisées automatiquement");

      // Vérifier que les autres consentements restent actifs
      cy.get(`[data-cy="user-${testUser.user}"]`).within(() => {
        cy.should("contain", "Analytics: Actif");
        cy.should("contain", "Functional: Actif");
        cy.should("contain", "Marketing: Révoqué");
      });

      // Vérifier les preuves de consentement
      cy.get('[data-cy="consent-proofs"]').click();

      cy.get(`[data-cy="proof-${testUser.user}"]`, { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Preuves horodatées")
        .should("contain", "IP d'origine enregistrée")
        .should("contain", "Méthode de collecte documentée");
    });
  });

  afterEach(() => {
    // Nettoyage sécurisé après chaque test
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });

    // Réinitialiser les paramètres de sécurité de test
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_BASE_URL")}/dev/reset-security-test-state`,
      failOnStatusCode: false
    });
  });
});