/// <reference types="cypress" />

/**
 * Tests E2E - Système de Messagerie Complète
 * 
 * Tests du système de messagerie temps réel avec workflows client ↔ admin,
 * gestion des fichiers, notifications email et threading avancé.
 * 
 * Couverture :
 * - Envoi/réception messages client ↔ admin
 * - Upload/téléchargement fichiers dans messages
 * - Notifications email automatiques
 * - Threading des conversations
 * - Messages de support depuis formulaires publics
 * - Gestion des erreurs (échec upload, email bounce, timeout)
 */

describe("🔔 Système de Messagerie Complète - Tests E2E", () => {
  const testMessage = {
    subject: "Test E2E - Correction manuscrit",
    content: "Bonjour, j'ai besoin d'une correction complète de mon manuscrit de 200 pages.",
    threadId: `thread_${Date.now()}`,
    fileName: "manuscript-test.pdf",
    fileSize: "2.5 MB"
  };

  const testFiles = {
    validPdf: "cypress/fixtures/test-manuscript.pdf",
    validDoc: "cypress/fixtures/test-document.docx", 
    invalidFile: "cypress/fixtures/test-image.jpg",
    largeFile: "cypress/fixtures/large-document.pdf"
  };

  beforeEach(() => {
    // Réinitialiser l'état des tests
    cy.resetDatabase();
    cy.visit("/");
    cy.wait(1000);
  });

  context("📨 Workflows Client ↔ Admin", () => {
    it("devrait permettre l'envoi de message client → admin avec accusé réception", () => {
      // 1. Connexion en tant que client
      cy.loginAsUser();
      cy.visit("/messages");
      cy.wait(2000);

      // 2. Créer un nouveau message
      cy.get('[data-cy="new-message-btn"]', { timeout: 10000 })
        .should("be.visible")
        .click();

      cy.get('[data-cy="message-subject"]')
        .type(testMessage.subject);

      cy.get('[data-cy="message-content"]')
        .type(testMessage.content);

      // 3. Attacher un fichier
      cy.get('[data-cy="file-upload"]')
        .selectFile(testFiles.validPdf, { force: true });

      // Vérifier l'aperçu du fichier
      cy.get('[data-cy="file-preview"]')
        .should("contain", "test-manuscript.pdf")
        .should("contain", "PDF");

      // 4. Envoyer le message
      cy.get('[data-cy="send-message-btn"]').click();

      // 5. Vérifications côté client
      cy.get('[data-cy="message-sent-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Message envoyé avec succès");

      // Vérifier que le message apparaît dans la liste
      cy.get('[data-cy="message-list"]')
        .should("contain", testMessage.subject)
        .should("contain", "En attente de réponse");

      // 6. Vérifier la notification email (mock)
      cy.request({
        method: "GET",
        url: `${Cypress.env("API_BASE_URL")}/dev/last-email`,
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          expect(response.body).to.have.property("to");
          expect(response.body.subject).to.contain("Nouveau message client");
          expect(response.body.html).to.contain(testMessage.subject);
        }
      });
    });

    it("devrait permettre la réponse admin → client avec threading", () => {
      // 1. Créer un message initial côté client
      cy.loginAsUser();
      cy.visit("/messages");
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type(testMessage.subject);
      cy.get('[data-cy="message-content"]').type(testMessage.content);
      cy.get('[data-cy="send-message-btn"]').click();
      cy.wait(3000);

      // 2. Basculer côté admin
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/messages");
      cy.wait(2000);

      // 3. Ouvrir le message client
      cy.get('[data-cy="message-list"]')
        .contains(testMessage.subject)
        .click();

      cy.get('[data-cy="message-thread"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", testMessage.content);

      // 4. Répondre au message
      const adminReply = "Bonjour, nous avons bien reçu votre demande. Nous vous recontacterons sous 24h.";
      
      cy.get('[data-cy="reply-content"]')
        .type(adminReply);

      // Attacher un fichier de devis
      cy.get('[data-cy="reply-file-upload"]')
        .selectFile(testFiles.validDoc, { force: true });

      cy.get('[data-cy="send-reply-btn"]').click();

      // 5. Vérifications côté admin
      cy.get('[data-cy="reply-sent-success"]', { timeout: 15000 })
        .should("be.visible");

      // Vérifier le threading
      cy.get('[data-cy="message-thread"]')
        .should("contain", testMessage.content) // Message original
        .should("contain", adminReply); // Réponse admin

      // 6. Vérifier côté client
      cy.logout();
      cy.loginAsUser();
      cy.visit("/messages");

      cy.get('[data-cy="message-list"]')
        .contains(testMessage.subject)
        .should("contain", "Nouvelle réponse") // Indicateur de nouvelle réponse
        .click();

      cy.get('[data-cy="message-thread"]')
        .should("contain", adminReply)
        .should("contain", "test-document.docx"); // Fichier joint
    });

    it("devrait gérer les conversations multiples avec états corrects", () => {
      const messages = [
        { subject: "Correction Roman", content: "Roman de 300 pages", priority: "HAUTE" },
        { subject: "Relecture Essai", content: "Essai de 150 pages", priority: "NORMALE" },
        { subject: "Coaching Écriture", content: "Séances de coaching", priority: "BASSE" }
      ];

      cy.loginAsUser();
      cy.visit("/messages");

      // Créer plusieurs messages
      messages.forEach((message, index) => {
        cy.get('[data-cy="new-message-btn"]').click();
        cy.get('[data-cy="message-subject"]').type(message.subject);
        cy.get('[data-cy="message-content"]').type(message.content);
        
        if (index === 0) {
          // Premier message avec fichier
          cy.get('[data-cy="file-upload"]')
            .selectFile(testFiles.validPdf, { force: true });
        }
        
        cy.get('[data-cy="send-message-btn"]').click();
        cy.wait(2000);
        
        // Fermer le modal/form si ouvert
        cy.get('body').then(($body) => {
          if ($body.find('[data-cy="close-message-form"]').length > 0) {
            cy.get('[data-cy="close-message-form"]').click();
          }
        });
      });

      // Vérifier la liste des messages
      cy.get('[data-cy="message-list"]')
        .should("contain", "Correction Roman")
        .should("contain", "Relecture Essai")
        .should("contain", "Coaching Écriture");

      // Vérifier les filtres
      cy.get('[data-cy="filter-priority"]').select("HAUTE");
      cy.get('[data-cy="message-list"]')
        .should("contain", "Correction Roman")
        .should("not.contain", "Relecture Essai");

      // Vérifier la recherche
      cy.get('[data-cy="message-search"]').type("Roman");
      cy.get('[data-cy="message-list"]')
        .should("contain", "Correction Roman")
        .should("not.contain", "Coaching Écriture");
    });
  });

  context("📎 Gestion des Fichiers", () => {
    it("devrait permettre l'upload de fichiers multiples avec validation", () => {
      cy.loginAsUser();
      cy.visit("/messages");
      cy.get('[data-cy="new-message-btn"]').click();

      // Test des formats acceptés
      const validFiles = [testFiles.validPdf, testFiles.validDoc];
      
      validFiles.forEach((file, index) => {
        cy.get('[data-cy="file-upload"]')
          .selectFile(file, { action: 'select', force: true });
        
        cy.get(`[data-cy="file-preview-${index}"]`, { timeout: 10000 })
          .should("be.visible");
      });

      // Vérifier la liste des fichiers
      cy.get('[data-cy="files-list"]')
        .should("contain", "test-manuscript.pdf")
        .should("contain", "test-document.docx");

      // Test de suppression de fichier
      cy.get('[data-cy="remove-file-0"]').click();
      cy.get('[data-cy="files-list"]')
        .should("not.contain", "test-manuscript.pdf")
        .should("contain", "test-document.docx");
    });

    it("devrait rejeter les fichiers invalides avec messages d'erreur", () => {
      cy.loginAsUser();
      cy.visit("/messages");
      cy.get('[data-cy="new-message-btn"]').click();

      // Test fichier non autorisé (image)
      cy.get('[data-cy="file-upload"]')
        .selectFile(testFiles.invalidFile, { force: true });

      cy.get('[data-cy="file-error"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Format de fichier non autorisé");

      // Test fichier trop volumineux
      cy.get('[data-cy="file-upload"]')
        .selectFile(testFiles.largeFile, { force: true });

      cy.get('[data-cy="file-error"]')
        .should("contain", "Fichier trop volumineux");
    });

    it("devrait permettre le téléchargement sécurisé des fichiers joints", () => {
      // 1. Créer un message avec fichier
      cy.loginAsUser();
      cy.visit("/messages");
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type("Test téléchargement");
      cy.get('[data-cy="file-upload"]')
        .selectFile(testFiles.validPdf, { force: true });
      cy.get('[data-cy="send-message-btn"]').click();
      cy.wait(3000);

      // 2. Ouvrir le message et tester le téléchargement
      cy.get('[data-cy="message-list"]')
        .contains("Test téléchargement")
        .click();

      cy.get('[data-cy="file-download"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "test-manuscript.pdf");

      // Vérifier l'URL de téléchargement sécurisée
      cy.get('[data-cy="file-download"]')
        .should("have.attr", "href")
        .and("include", "/api/files/download/")
        .and("include", "token=");

      // Test du téléchargement (simulation)
      cy.get('[data-cy="file-download"]').click();
      cy.wait(2000);

      // Vérifier qu'aucune erreur n'est survenue
      cy.get('[data-cy="download-error"]').should("not.exist");
    });

    it("devrait gérer les erreurs d'upload avec retry automatique", () => {
      cy.loginAsUser();
      cy.visit("/messages");
      cy.get('[data-cy="new-message-btn"]').click();

      // Simuler une erreur réseau lors de l'upload
      cy.intercept("POST", "**/files/upload", {
        statusCode: 500,
        body: { error: "Erreur serveur" }
      }).as("uploadError");

      cy.get('[data-cy="file-upload"]')
        .selectFile(testFiles.validPdf, { force: true });

      cy.wait("@uploadError");

      // Vérifier l'affichage de l'erreur
      cy.get('[data-cy="upload-error"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Échec de l'upload");

      // Vérifier le bouton de retry
      cy.get('[data-cy="retry-upload"]')
        .should("be.visible")
        .click();

      // Simuler le succès au retry
      cy.intercept("POST", "**/files/upload", {
        statusCode: 200,
        body: { 
          fileId: "file_123",
          fileName: "test-manuscript.pdf",
          fileUrl: "/files/file_123"
        }
      }).as("uploadSuccess");

      cy.wait("@uploadSuccess");

      cy.get('[data-cy="file-preview"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "test-manuscript.pdf");
    });
  });

  context("📧 Notifications Email Automatiques", () => {
    it("devrait envoyer des notifications email pour nouveaux messages", () => {
      // Mock du service email
      cy.intercept("POST", "**/emails/send", {
        statusCode: 200,
        body: { messageId: "email_123", status: "sent" }
      }).as("emailSent");

      cy.loginAsUser();
      cy.visit("/messages");
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type("Test notification email");
      cy.get('[data-cy="message-content"]').type("Test du système de notifications");
      cy.get('[data-cy="send-message-btn"]').click();

      cy.wait("@emailSent");

      // Vérifier que l'email a été envoyé
      cy.get('@emailSent').should((interception) => {
        expect(interception.request.body).to.have.property('to');
        expect(interception.request.body).to.have.property('template', 'admin-message');
        expect(interception.request.body.data).to.have.property('messageSubject', 'Test notification email');
      });
    });

    it("devrait gérer les bounces et échecs d'email", () => {
      // Simuler un échec d'envoi d'email
      cy.intercept("POST", "**/emails/send", {
        statusCode: 422,
        body: { error: "Email bounce", details: "Invalid email address" }
      }).as("emailBounce");

      cy.loginAsUser();
      cy.visit("/messages");
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type("Test email bounce");
      cy.get('[data-cy="send-message-btn"]').click();

      cy.wait("@emailBounce");

      // Vérifier la gestion de l'erreur
      cy.get('[data-cy="email-warning"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "La notification email n'a pas pu être envoyée");

      // Le message doit quand même être sauvegardé
      cy.get('[data-cy="message-sent-success"]')
        .should("be.visible");
    });

    it("devrait envoyer des notifications de suivi pour réponses", () => {
      // 1. Message initial
      cy.loginAsUser();
      cy.visit("/messages");
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type("Test suivi");
      cy.get('[data-cy="send-message-btn"]').click();
      cy.wait(2000);

      // 2. Réponse admin
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/messages");

      cy.intercept("POST", "**/emails/send", {
        statusCode: 200,
        body: { messageId: "email_reply_123", status: "sent" }
      }).as("replyEmailSent");

      cy.get('[data-cy="message-list"]')
        .contains("Test suivi")
        .click();

      cy.get('[data-cy="reply-content"]')
        .type("Réponse de l'équipe admin");
      cy.get('[data-cy="send-reply-btn"]').click();

      cy.wait("@replyEmailSent");

      // Vérifier l'email de notification au client
      cy.get('@replyEmailSent').should((interception) => {
        expect(interception.request.body.template).to.eq('client-message-reply');
        expect(interception.request.body.data).to.have.property('replyContent');
      });
    });
  });

  context("🌐 Messages de Support Public", () => {
    it("devrait permettre l'envoi de messages depuis le formulaire public", () => {
      // Accéder au formulaire de contact public (sans auth)
      cy.visit("/contact");
      cy.wait(2000);

      // Remplir le formulaire
      cy.get('[data-cy="contact-name"]').type("Jean Dupont");
      cy.get('[data-cy="contact-email"]').type("jean.dupont@example.com");
      cy.get('[data-cy="contact-subject"]').type("Demande d'information");
      cy.get('[data-cy="contact-message"]').type("Bonjour, j'aimerais connaître vos tarifs pour la correction d'un roman de 250 pages.");
      
      // Joindre un échantillon
      cy.get('[data-cy="contact-file"]')
        .selectFile(testFiles.validPdf, { force: true });

      cy.get('[data-cy="submit-contact"]').click();

      // Vérifications
      cy.get('[data-cy="contact-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Votre message a été envoyé");

      // Vérifier que le message apparaît côté admin
      cy.loginAsAdmin();
      cy.visit("/admin/messages");

      cy.get('[data-cy="message-list"]')
        .should("contain", "Demande d'information")
        .should("contain", "jean.dupont@example.com")
        .should("contain", "Nouveau"); // Statut
    });

    it("devrait créer automatiquement un thread de support", () => {
      // 1. Message public
      cy.visit("/contact");
      cy.get('[data-cy="contact-name"]').type("Marie Martin");
      cy.get('[data-cy="contact-email"]').type("marie.martin@example.com");
      cy.get('[data-cy="contact-subject"]').type("Question sur délais");
      cy.get('[data-cy="contact-message"]').type("Quels sont vos délais pour une correction de 100 pages ?");
      cy.get('[data-cy="submit-contact"]').click();
      cy.wait(3000);

      // 2. Réponse admin
      cy.loginAsAdmin();
      cy.visit("/admin/messages");
      cy.get('[data-cy="message-list"]')
        .contains("Question sur délais")
        .click();

      cy.get('[data-cy="reply-content"]')
        .type("Bonjour Marie, nos délais sont généralement de 7 à 10 jours ouvrés pour 100 pages.");
      cy.get('[data-cy="send-reply-btn"]').click();
      cy.wait(2000);

      // 3. Vérifier le thread complet
      cy.get('[data-cy="message-thread"]')
        .should("contain", "marie.martin@example.com") // Expéditeur original
        .should("contain", "Quels sont vos délais") // Message original
        .should("contain", "7 à 10 jours ouvrés") // Réponse admin
        .should("contain", "Thread ID:"); // Identifiant de thread

      // 4. Vérifier l'historique des interactions
      cy.get('[data-cy="thread-history"]')
        .should("contain", "Message initial reçu")
        .should("contain", "Réponse envoyée");
    });
  });

  context("⚠️ Gestion des Erreurs et Edge Cases", () => {
    it("devrait gérer les timeouts de connexion", () => {
      // Simuler une latence extrême
      cy.intercept("POST", "**/messages", (req) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ statusCode: 200, body: { messageId: "msg_123" } });
          }, 20000); // 20 secondes (plus que le timeout)
        });
      }).as("slowMessage");

      cy.loginAsUser();
      cy.visit("/messages");
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type("Test timeout");
      cy.get('[data-cy="send-message-btn"]').click();

      // Vérifier la gestion du timeout
      cy.get('[data-cy="message-timeout-error"]', { timeout: 25000 })
        .should("be.visible")
        .should("contain", "La connexion a pris trop de temps");

      // Vérifier les options de récupération
      cy.get('[data-cy="retry-send"]')
        .should("be.visible");
      
      cy.get('[data-cy="save-draft"]')
        .should("be.visible");
    });

    it("devrait permettre la récupération automatique des brouillons", () => {
      cy.loginAsUser();
      cy.visit("/messages");
      cy.get('[data-cy="new-message-btn"]').click();

      // Commencer à écrire un message
      const draftContent = "Ceci est un brouillon de message...";
      cy.get('[data-cy="message-subject"]').type("Brouillon test");
      cy.get('[data-cy="message-content"]').type(draftContent);

      // Simuler une fermeture accidentelle
      cy.reload();
      cy.wait(2000);

      // Vérifier la récupération du brouillon
      cy.get('[data-cy="draft-recovered"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Brouillon récupéré");

      cy.get('[data-cy="restore-draft"]').click();

      // Vérifier que le contenu est restauré
      cy.get('[data-cy="message-subject"]')
        .should("have.value", "Brouillon test");
      
      cy.get('[data-cy="message-content"]')
        .should("contain", draftContent);
    });

    it("devrait gérer la perte de connexion réseau", () => {
      cy.loginAsUser();
      cy.visit("/messages");

      // Simuler une perte de connexion
      cy.intercept("GET", "**/messages**", { forceNetworkError: true }).as("networkError");
      
      cy.get('[data-cy="refresh-messages"]').click();
      cy.wait("@networkError");

      // Vérifier l'indicateur de connexion
      cy.get('[data-cy="connection-status"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Connexion perdue");

      // Vérifier le mode dégradé
      cy.get('[data-cy="offline-mode"]')
        .should("be.visible")
        .should("contain", "Mode hors ligne activé");

      // Simuler le retour de la connexion
      cy.intercept("GET", "**/messages**", {
        statusCode: 200,
        body: { messages: [], total: 0 }
      }).as("connectionRestored");

      cy.get('[data-cy="retry-connection"]').click();
      cy.wait("@connectionRestored");

      cy.get('[data-cy="connection-status"]')
        .should("contain", "Connexion rétablie");
    });

    it("devrait limiter le spam et les messages abusifs", () => {
      cy.loginAsUser();
      cy.visit("/messages");

      // Envoyer plusieurs messages rapidement
      for (let i = 0; i < 6; i++) {
        cy.get('[data-cy="new-message-btn"]').click();
        cy.get('[data-cy="message-subject"]').type(`Message spam ${i}`);
        cy.get('[data-cy="send-message-btn"]').click();
        cy.wait(500);

        // Fermer le modal si ouvert
        cy.get('body').then(($body) => {
          if ($body.find('[data-cy="close-message-form"]').length > 0) {
            cy.get('[data-cy="close-message-form"]').click();
          }
        });
      }

      // Vérifier la limitation de débit
      cy.get('[data-cy="rate-limit-warning"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Trop de messages envoyés");

      // Vérifier le blocage temporaire
      cy.get('[data-cy="new-message-btn"]')
        .should("be.disabled");

      cy.get('[data-cy="cooldown-timer"]')
        .should("be.visible")
        .should("contain", "Veuillez patienter");
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