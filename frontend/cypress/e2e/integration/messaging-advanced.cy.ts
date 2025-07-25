/// <reference types="cypress" />

/**
 * Tests E2E - Messagerie Avancée (Intégration)
 * 
 * Tests d'intégration approfondis du système de messagerie avec backend complet.
 * Ces tests nécessitent un backend en fonctionnement et testent les intégrations
 * complètes avec la base de données, les services externes et les APIs.
 * 
 * Couverture avancée :
 * - Performance avec grandes conversations
 * - Intégrations email réelles (SendGrid)
 * - Stockage S3 pour fichiers volumineux
 * - Notifications push temps réel
 * - Modération automatique de contenu
 */

describe("📬 Messagerie Avancée - Tests Intégration", () => {
  const testData = {
    largeConversation: {
      messageCount: 50,
      subject: "Grande conversation de test",
      userCount: 5
    },
    bulkFiles: [
      "cypress/fixtures/document1.pdf",
      "cypress/fixtures/document2.docx", 
      "cypress/fixtures/document3.txt",
      "cypress/fixtures/presentation.pptx",
      "cypress/fixtures/spreadsheet.xlsx"
    ],
    spamContent: [
      "PROMO SPÉCIAL CLIQUEZ ICI !!!",
      "Gagnez de l'argent rapidement",
      "OFFRE LIMITÉE ACHETEZ MAINTENANT"
    ]
  };

  before(() => {
    // Configuration pour les tests d'intégration
    cy.task("log", "🚀 Démarrage des tests d'intégration messagerie avancée");
    cy.resetDatabase();
    
    // Vérifier que le backend est accessible
    cy.request({
      method: "GET",
      url: `${Cypress.env("API_BASE_URL")}/health`,
      timeout: 30000
    }).then((response) => {
      expect(response.status).to.eq(200);
      cy.task("log", "✅ Backend accessible pour tests d'intégration");
    });
  });

  context("🚀 Performance et Scalabilité", () => {
    it("devrait gérer efficacement les grandes conversations (50+ messages)", () => {
      cy.loginAsUser();
      cy.visit("/messages");

      // Créer une conversation initiale
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type(testData.largeConversation.subject);
      cy.get('[data-cy="message-content"]').type("Début d'une longue conversation...");
      cy.get('[data-cy="send-message-btn"]').click();
      cy.wait(2000);

      // Mesurer le temps de chargement initial
      const startTime = Date.now();

      // Simuler des échanges multiples via API pour rapidité
      cy.window()
        .its("localStorage")
        .invoke("getItem", "auth_token")
        .then((token) => {
          const promises = [];
          
          for (let i = 0; i < testData.largeConversation.messageCount; i++) {
            const isAdminReply = i % 2 === 1;
            const endpoint = isAdminReply ? "/admin/messages/reply" : "/messages";
            
            promises.push(
              cy.request({
                method: "POST",
                url: `${Cypress.env("API_BASE_URL")}${endpoint}`,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: {
                  content: `Message automatisé #${i + 1} pour test de performance`,
                  threadId: `thread_${testData.largeConversation.subject}`,
                  isTest: true
                },
                timeout: 30000
              })
            );
          }

          // Attendre que tous les messages soient créés
          return Cypress.Promise.all(promises);
        });

      // Recharger et mesurer la performance
      cy.reload();
      cy.wait(3000);

      cy.get('[data-cy="message-list"]')
        .contains(testData.largeConversation.subject)
        .click();

      // Vérifier que la conversation se charge rapidement
      cy.get('[data-cy="message-thread"]', { timeout: 15000 })
        .should("be.visible");

      // Mesurer le temps de chargement
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(10000); // Moins de 10 secondes
        cy.task("log", `⚡ Conversation de ${testData.largeConversation.messageCount} messages chargée en ${loadTime}ms`);
      });

      // Vérifier la pagination ou le lazy loading
      cy.get('[data-cy="message-count"]')
        .should("contain", testData.largeConversation.messageCount);

      // Tester le scroll infini
      cy.get('[data-cy="message-thread"]').scrollTo("bottom");
      cy.wait(2000);
      
      cy.get('[data-cy="load-more-messages"]').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn).click();
          cy.get('[data-cy="loading-messages"]')
            .should("be.visible");
        }
      });
    });

    it("devrait optimiser le chargement avec mise en cache intelligente", () => {
      cy.loginAsUser();
      cy.visit("/messages");

      // Premier chargement - mesurer le temps
      const startTime1 = Date.now();
      
      cy.get('[data-cy="message-list"]', { timeout: 15000 })
        .should("be.visible");

      cy.then(() => {
        const firstLoadTime = Date.now() - startTime1;
        cy.task("log", `📊 Premier chargement: ${firstLoadTime}ms`);

        // Deuxième chargement - devrait être plus rapide grâce au cache
        const startTime2 = Date.now();
        cy.reload();
        
        cy.get('[data-cy="message-list"]', { timeout: 10000 })
          .should("be.visible");

        cy.then(() => {
          const secondLoadTime = Date.now() - startTime2;
          cy.task("log", `🚀 Second chargement (avec cache): ${secondLoadTime}ms`);
          
          // Le second chargement devrait être au moins 30% plus rapide
          expect(secondLoadTime).to.be.lessThan(firstLoadTime * 0.7);
        });
      });

      // Vérifier les headers de cache
      cy.intercept("GET", "**/messages**").as("messagesAPI");
      cy.get('[data-cy="refresh-messages"]').click();
      cy.wait("@messagesAPI");

      cy.get("@messagesAPI").should((interception) => {
        expect(interception.response.headers).to.have.property("cache-control");
        expect(interception.response.headers).to.have.property("etag");
      });
    });

    it("devrait supporter les uploads simultanés multiples sans dégradation", () => {
      cy.loginAsUser();
      cy.visit("/messages");
      
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type("Test uploads simultanés");

      // Simuler l'upload de 5 fichiers simultanément
      testData.bulkFiles.forEach((file, index) => {
        cy.get('[data-cy="file-upload"]')
          .selectFile(file, { action: 'select', force: true });
        
        // Vérifier que chaque fichier commence l'upload
        cy.get(`[data-cy="upload-progress-${index}"]`, { timeout: 10000 })
          .should("be.visible");
      });

      // Vérifier que tous les uploads se terminent avec succès
      testData.bulkFiles.forEach((_, index) => {
        cy.get(`[data-cy="upload-success-${index}"]`, { timeout: 30000 })
          .should("be.visible");
      });

      // Vérifier la liste finale
      cy.get('[data-cy="files-list"]')
        .children()
        .should("have.length", testData.bulkFiles.length);

      // Envoyer le message avec tous les fichiers
      cy.get('[data-cy="send-message-btn"]').click();

      cy.get('[data-cy="message-sent-success"]', { timeout: 20000 })
        .should("be.visible");

      // Vérifier côté destinataire
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/messages");

      cy.get('[data-cy="message-list"]')
        .contains("Test uploads simultanés")
        .click();

      // Tous les fichiers doivent être téléchargeables
      testData.bulkFiles.forEach((_, index) => {
        cy.get(`[data-cy="file-download-${index}"]`)
          .should("be.visible")
          .should("have.attr", "href");
      });
    });
  });

  context("📧 Intégrations Email Réelles", () => {
    it("devrait envoyer des emails via SendGrid avec templates avancés", () => {
      // Intercepter les appels SendGrid réels
      cy.intercept("POST", "https://api.sendgrid.com/v3/mail/send", {
        statusCode: 202,
        body: { message_id: "sendgrid_123" }
      }).as("sendGridAPI");

      cy.loginAsUser();
      cy.visit("/messages");
      
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type("Test intégration SendGrid");
      cy.get('[data-cy="message-content"]').type("Message avec template personnalisé");
      
      // Sélectionner le type de service pour template spécifique
      cy.get('[data-cy="message-category"]').select("correction-urgente");
      
      cy.get('[data-cy="send-message-btn"]').click();
      cy.wait("@sendGridAPI");

      // Vérifier que SendGrid a été appelé avec les bons paramètres
      cy.get("@sendGridAPI").should((interception) => {
        const body = interception.request.body;
        expect(body).to.have.property("from");
        expect(body).to.have.property("template_id");
        expect(body.personalizations[0].dynamic_template_data)
          .to.have.property("messageSubject", "Test intégration SendGrid");
        expect(body.personalizations[0].dynamic_template_data)
          .to.have.property("category", "correction-urgente");
      });

      // Vérifier la confirmation d'envoi
      cy.get('[data-cy="email-sent-confirmation"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Email envoyé via SendGrid");
    });

    it("devrait gérer les webhooks SendGrid pour tracking avancé", () => {
      // Simuler des événements webhook SendGrid
      const webhookEvents = [
        { event: "delivered", message_id: "sendgrid_123", timestamp: Date.now() },
        { event: "open", message_id: "sendgrid_123", timestamp: Date.now() + 1000 },
        { event: "click", message_id: "sendgrid_123", url: "https://staka-livres.fr/reply", timestamp: Date.now() + 2000 }
      ];

      // Envoyer un message d'abord
      cy.loginAsUser();
      cy.visit("/messages");
      
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type("Test tracking email");
      cy.get('[data-cy="send-message-btn"]').click();
      cy.wait(3000);

      // Simuler les webhooks SendGrid
      webhookEvents.forEach((event) => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/webhooks/sendgrid`,
          body: event,
          headers: {
            "Content-Type": "application/json",
            "X-Twilio-Email-Event-Webhook-Signature": "test-signature"
          }
        });
      });

      // Vérifier le tracking côté admin
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/messages");

      cy.get('[data-cy="message-list"]')
        .contains("Test tracking email")
        .click();

      cy.get('[data-cy="email-tracking"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "✅ Délivré")
        .should("contain", "👁️ Ouvert")
        .should("contain", "🔗 Lien cliqué");

      // Vérifier les statistiques détaillées
      cy.get('[data-cy="tracking-timeline"]')
        .should("contain", "Email envoyé")
        .should("contain", "Email délivré")
        .should("contain", "Email ouvert")
        .should("contain", "Lien cliqué");
    });

    it("devrait gérer les bounces et plaintes automatiquement", () => {
      // Simuler des événements de bounce et spam
      const problemEvents = [
        { 
          event: "bounce", 
          message_id: "sendgrid_bounce_123", 
          reason: "550 5.1.1 User unknown",
          type: "bounce"
        },
        { 
          event: "spamreport", 
          message_id: "sendgrid_spam_123",
          type: "spamreport"
        }
      ];

      problemEvents.forEach((event) => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/webhooks/sendgrid`,
          body: event,
          headers: {
            "Content-Type": "application/json"
          }
        });
      });

      // Vérifier la gestion automatique côté admin
      cy.loginAsAdmin();
      cy.visit("/admin/email-health");

      cy.get('[data-cy="bounce-alerts"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "1 bounce détecté");

      cy.get('[data-cy="spam-alerts"]')
        .should("contain", "1 plainte spam");

      // Vérifier les actions automatiques
      cy.get('[data-cy="auto-suppression-list"]')
        .should("contain", "Adresses supprimées automatiquement");

      // Vérifier les alertes admin
      cy.get('[data-cy="admin-notifications"]')
        .should("contain", "Problèmes de délivrabilité détectés");
    });
  });

  context("☁️ Intégration Stockage S3", () => {
    it("devrait gérer les fichiers volumineux via S3 avec URLs signées", () => {
      // Simuler un fichier de 50MB (trop gros pour upload direct)
      const largeFileData = {
        name: "large-manuscript.pdf",
        size: 52428800, // 50MB
        type: "application/pdf"
      };

      cy.loginAsUser();
      cy.visit("/messages");
      
      cy.get('[data-cy="new-message-btn"]').click();

      // Intercepter les appels S3
      cy.intercept("POST", "**/files/presigned-url", {
        statusCode: 200,
        body: {
          uploadUrl: "https://staka-bucket.s3.amazonaws.com/uploads/large-file-123",
          fileId: "file_large_123",
          expiresIn: 3600
        }
      }).as("presignedUrl");

      cy.intercept("PUT", "https://staka-bucket.s3.amazonaws.com/**", {
        statusCode: 200,
        body: ""
      }).as("s3Upload");

      // Simuler l'upload d'un gros fichier
      cy.get('[data-cy="file-upload"]')
        .selectFile({
          contents: new Uint8Array(1000000), // 1MB simulé
          fileName: largeFileData.name,
          mimeType: largeFileData.type
        }, { force: true });

      cy.wait("@presignedUrl");
      cy.wait("@s3Upload");

      // Vérifier l'upload S3
      cy.get('[data-cy="s3-upload-success"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "Fichier uploadé sur S3");

      // Vérifier l'aperçu avec URL signée
      cy.get('[data-cy="file-preview"]')
        .should("contain", largeFileData.name)
        .should("contain", "50 MB");

      cy.get('[data-cy="file-download-url"]')
        .should("contain", "s3.amazonaws.com")
        .should("contain", "X-Amz-Signature");
    });

    it("devrait implémenter la sécurité S3 avec permissions granulaires", () => {
      cy.loginAsUser();
      cy.visit("/messages");

      // Tenter d'accéder à un fichier d'un autre utilisateur
      cy.request({
        method: "GET",
        url: `${Cypress.env("API_BASE_URL")}/files/download/other-user-file-123`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.error).to.contain("Access denied");
      });

      // Vérifier les permissions admin
      cy.logout();
      cy.loginAsAdmin();

      cy.request({
        method: "GET",
        url: `${Cypress.env("API_BASE_URL")}/admin/files/all`,
        headers: {
          Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("files");
      });
    });

    it("devrait nettoyer automatiquement les fichiers orphelins S3", () => {
      // Créer des fichiers temporaires qui ne sont pas associés à des messages
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/create-orphan-files`,
        body: {
          count: 5,
          type: "temp-upload"
        }
      });

      // Déclencher le nettoyage automatique
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/admin/cleanup/orphan-files`
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.deletedCount).to.be.greaterThan(0);
      });

      // Vérifier les métriques de nettoyage
      cy.loginAsAdmin();
      cy.visit("/admin/storage-health");

      cy.get('[data-cy="cleanup-stats"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Fichiers orphelins supprimés");

      cy.get('[data-cy="storage-savings"]')
        .should("be.visible")
        .should("contain", "MB économisés");
    });
  });

  context("🔍 Modération et Sécurité Avancée", () => {
    it("devrait détecter automatiquement le contenu inapproprié", () => {
      cy.loginAsUser();
      cy.visit("/messages");

      testData.spamContent.forEach((spamText, index) => {
        cy.get('[data-cy="new-message-btn"]').click();
        cy.get('[data-cy="message-subject"]').type(`Test spam ${index + 1}`);
        cy.get('[data-cy="message-content"]').type(spamText);
        cy.get('[data-cy="send-message-btn"]').click();

        // Vérifier la détection automatique
        cy.get('[data-cy="moderation-warning"]', { timeout: 10000 })
          .should("be.visible")
          .should("contain", "Message marqué pour modération");

        // Fermer le modal
        cy.get('[data-cy="close-message-form"]').click({ force: true });
        cy.wait(1000);
      });

      // Vérifier côté admin
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/moderation");

      cy.get('[data-cy="pending-moderation"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "3 messages en attente");

      // Approuver/rejeter les messages
      testData.spamContent.forEach((_, index) => {
        cy.get(`[data-cy="moderate-message-${index}"]`).within(() => {
          if (index === 0) {
            cy.get('[data-cy="approve-btn"]').click();
          } else {
            cy.get('[data-cy="reject-btn"]').click();
          }
        });
      });

      // Vérifier les statistiques de modération
      cy.get('[data-cy="moderation-stats"]')
        .should("contain", "1 approuvé")
        .should("contain", "2 rejetés");
    });

    it("devrait implémenter la quarantaine pour contenus suspects", () => {
      const suspiciousContent = {
        subject: "Fichier suspect avec liens externes",
        content: "Cliquez sur ce lien: http://suspicious-site.com/malware.exe",
        file: "cypress/fixtures/suspicious-file.pdf"
      };

      cy.loginAsUser();
      cy.visit("/messages");
      
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type(suspiciousContent.subject);
      cy.get('[data-cy="message-content"]').type(suspiciousContent.content);
      
      // Simuler l'upload d'un fichier suspect
      cy.get('[data-cy="file-upload"]')
        .selectFile(suspiciousContent.file, { force: true });

      cy.get('[data-cy="send-message-btn"]').click();

      // Vérifier la mise en quarantaine
      cy.get('[data-cy="quarantine-notice"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Message mis en quarantaine");

      // Vérifier que le message n'apparaît pas dans la liste normale
      cy.get('[data-cy="message-list"]')
        .should("not.contain", suspiciousContent.subject);

      // Vérifier côté admin - quarantaine
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/security/quarantine");

      cy.get('[data-cy="quarantine-list"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", suspiciousContent.subject)
        .should("contain", "Lien externe détecté")
        .should("contain", "Fichier suspect");

      // Analyser le contenu en quarantaine
      cy.get('[data-cy="analyze-quarantine"]').first().click();

      cy.get('[data-cy="security-analysis"]')
        .should("contain", "URLs externes: 1")
        .should("contain", "Fichiers joints: 1")
        .should("contain", "Score de risque:");
    });

    it("devrait bloquer les adresses IP suspectes automatiquement", () => {
      // Simuler plusieurs tentatives d'envoi depuis la même IP
      const suspiciousIP = "192.168.100.50";
      
      for (let i = 0; i < 10; i++) {
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/public/contact`,
          body: {
            name: `Spam Bot ${i}`,
            email: `spam${i}@fake-domain.com`,
            message: "Spam message content",
            userAgent: "Bot/1.0"
          },
          headers: {
            "X-Forwarded-For": suspiciousIP,
            "X-Real-IP": suspiciousIP
          },
          failOnStatusCode: false
        });
      }

      // Vérifier le blocage automatique
      cy.request({
        method: "POST", 
        url: `${Cypress.env("API_BASE_URL")}/public/contact`,
        body: {
          name: "Legitimate User",
          email: "real@user.com",
          message: "Real message"
        },
        headers: {
          "X-Forwarded-For": suspiciousIP
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(429);
        expect(response.body.error).to.contain("IP blocked");
      });

      // Vérifier les logs de sécurité côté admin
      cy.loginAsAdmin();
      cy.visit("/admin/security/blocked-ips");

      cy.get('[data-cy="blocked-ip-list"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", suspiciousIP)
        .should("contain", "Auto-blocked")
        .should("contain", "10 tentatives");
    });
  });

  after(() => {
    // Nettoyage final
    cy.task("log", "🧹 Nettoyage des tests d'intégration messagerie");
    
    // Nettoyer les fichiers de test
    cy.request({
      method: "DELETE",
      url: `${Cypress.env("API_BASE_URL")}/dev/cleanup-test-files`,
      failOnStatusCode: false
    });

    // Réinitialiser les paramètres de sécurité
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_BASE_URL")}/dev/reset-security-settings`,
      failOnStatusCode: false
    });
  });
});