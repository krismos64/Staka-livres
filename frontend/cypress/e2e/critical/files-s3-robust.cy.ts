/// <reference types="cypress" />

/**
 * Tests E2E - Gestion Fichiers S3 Robuste (Critique)
 * 
 * Tests critiques du système de gestion de fichiers avec AWS S3.
 * Couvre les uploads, téléchargements, sécurité, performance et
 * résilience du stockage de fichiers pour une utilisation production.
 * 
 * Couverture critique :
 * - Upload fichiers volumineux avec progress et retry
 * - Sécurité URLs signées et permissions granulaires
 * - Gestion erreurs S3 et récupération automatique
 * - Performance uploads simultanés et optimisation
 * - Versioning et backup automatique
 * - Nettoyage automatique fichiers orphelins
 */

describe("☁️ Gestion Fichiers S3 Robuste - Tests Critiques", () => {
  const s3TestData = {
    files: {
      small: {
        name: "small-document.pdf",
        size: 50000, // 50KB
        type: "application/pdf"
      },
      medium: {
        name: "medium-manuscript.docx", 
        size: 5000000, // 5MB
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      },
      large: {
        name: "large-manuscript.pdf",
        size: 50000000, // 50MB
        type: "application/pdf"
      },
      invalid: {
        name: "malicious-script.exe",
        size: 1000,
        type: "application/x-msdownload"
      }
    },
    buckets: {
      main: "staka-livres-files-prod",
      backup: "staka-livres-backup",
      temp: "staka-livres-temp"
    },
    regions: ["eu-west-3", "eu-west-1", "us-east-1"],
    securityScenarios: [
      {
        type: "unauthorized-access",
        description: "Tentative d'accès fichier sans autorisation"
      },
      {
        type: "expired-url",
        description: "Utilisation URL signée expirée"
      },
      {
        type: "malformed-signature",
        description: "Tentative de manipulation signature"
      }
    ]
  };

  beforeEach(() => {
    // Configuration pour tests S3 robustes
    cy.resetDatabase();
    cy.visit("/");
    cy.wait(2000);

    // Vérifier la connectivité S3
    cy.request({
      method: "GET",
      url: `${Cypress.env("API_BASE_URL")}/system/s3-health`,
      timeout: 15000
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.s3Status).to.eq("connected");
      expect(response.body.buckets).to.include(s3TestData.buckets.main);
    });
  });

  context("📤 Upload Fichiers Volumineux", () => {
    it("devrait gérer l'upload de fichiers volumineux avec progression", () => {
      cy.task("log", "🔹 Test upload fichiers volumineux avec progression");

      cy.loginAsUser();
      cy.visit("/projects/upload");

      // Simuler un fichier volumineux (50MB)
      const largeFile = new File(
        [new ArrayBuffer(s3TestData.files.large.size)], 
        s3TestData.files.large.name,
        { type: s3TestData.files.large.type }
      );

      // Intercepter les appels S3 pour simulation
      cy.intercept("POST", "**/files/presigned-url", {
        statusCode: 200,
        body: {
          uploadUrl: `https://${s3TestData.buckets.main}.s3.amazonaws.com/uploads/large-file-123`,
          fileId: "file_large_123",
          expiresIn: 3600,
          multipart: true,
          parts: 10 // 10 parties de 5MB chacune
        }
      }).as("presignedUrl");

      // Simuler l'upload multipart
      cy.intercept("PUT", "https://*.s3.amazonaws.com/**", (req) => {
        // Simuler la progression avec délai
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              statusCode: 200,
              headers: {
                "ETag": `"part-etag-${Date.now()}"`,
                "x-amz-version-id": "version-123"
              }
            });
          }, 1000); // 1 seconde par partie
        });
      }).as("s3Upload");

      // Démarrer l'upload
      cy.get('[data-cy="file-upload-zone"]')
        .selectFile({
          contents: largeFile,
          fileName: s3TestData.files.large.name
        }, { force: true });

      cy.wait("@presignedUrl");

      // Vérifier l'initialisation de l'upload multipart
      cy.get('[data-cy="upload-type"]', { timeout: 10000 })
        .should("contain", "Upload multipart")
        .should("contain", "10 parties");

      // Vérifier la barre de progression
      cy.get('[data-cy="upload-progress"]')
        .should("be.visible")
        .should("have.attr", "max", "100");

      // Vérifier la progression en temps réel
      cy.get('[data-cy="upload-status"]')
        .should("contain", "Upload en cours...")
        .should("contain", s3TestData.files.large.name);

      // Simuler la progression partie par partie
      for (let part = 1; part <= 10; part++) {
        cy.get('[data-cy="upload-progress"]', { timeout: 5000 })
          .should("have.attr", "value", (part * 10).toString());

        cy.get('[data-cy="upload-details"]')
          .should("contain", `Partie ${part}/10`)
          .should("contain", `${part * 5}MB / 50MB`);
      }

      // Vérifier la finalisation
      cy.get('[data-cy="upload-complete"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "Upload terminé avec succès")
        .should("contain", s3TestData.files.large.name);

      // Vérifier les métadonnées du fichier
      cy.get('[data-cy="file-metadata"]').within(() => {
        cy.should("contain", "Taille: 50 MB");
        cy.should("contain", "Type: PDF");
        cy.should("contain", "Upload multipart: ✓");
        cy.should("contain", "Versioning: Activé");
        cy.should("contain", "Backup: Programmé");
      });

      // Vérifier l'intégrité du fichier
      cy.get('[data-cy="file-integrity"]')
        .should("contain", "Checksum vérifié")
        .should("contain", "Intégrité: ✓");
    });

    it("devrait retry automatiquement les uploads échoués", () => {
      cy.task("log", "🔹 Test retry automatique uploads échoués");

      cy.loginAsUser();
      cy.visit("/projects/upload");

      // Simuler des échecs intermittents sur S3
      let attemptCount = 0;
      cy.intercept("PUT", "https://*.s3.amazonaws.com/**", (req) => {
        attemptCount++;
        
        if (attemptCount <= 2) {
          // Premiers essais échouent
          return {
            statusCode: 500,
            body: { error: "InternalError", message: "We encountered an internal error. Please try again." }
          };
        } else {
          // Troisième essai réussit
          return {
            statusCode: 200,
            headers: { "ETag": `"success-etag-${attemptCount}"` }
          };
        }
      }).as("s3UploadWithRetry");

      // Démarrer l'upload
      cy.get('[data-cy="file-upload-zone"]')
        .selectFile("cypress/fixtures/test-document.pdf", { force: true });

      // Vérifier la détection d'échec
      cy.get('[data-cy="upload-error"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Échec d'upload détecté");

      // Vérifier le retry automatique
      cy.get('[data-cy="auto-retry"]')
        .should("contain", "Retry automatique en cours...")
        .should("contain", "Tentative 2/3");

      // Vérifier le second échec
      cy.get('[data-cy="retry-attempt"]', { timeout: 10000 })
        .should("contain", "Tentative 3/3")
        .should("contain", "Dernier essai...");

      // Vérifier le succès final
      cy.get('[data-cy="upload-success-after-retry"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Upload réussi après 3 tentatives")
        .should("contain", "Fichier sauvegardé avec succès");

      // Vérifier les logs de retry
      cy.get('[data-cy="retry-log"]')
        .should("contain", "Tentative 1: Échec (500)")
        .should("contain", "Tentative 2: Échec (500)")
        .should("contain", "Tentative 3: Succès (200)");

      // Vérifier les métriques de fiabilité
      cy.get('[data-cy="reliability-metrics"]')
        .should("contain", "Taux de succès après retry: 100%")
        .should("contain", "Temps total: < 30s");
    });

    it("devrait optimiser les uploads simultanés sans conflit", () => {
      cy.task("log", "🔹 Test uploads simultanés optimisés");

      cy.loginAsUser();
      cy.visit("/projects/upload");

      const simultaneousFiles = [
        "cypress/fixtures/document1.pdf",
        "cypress/fixtures/document2.docx", 
        "cypress/fixtures/document3.txt",
        "cypress/fixtures/presentation.pptx",
        "cypress/fixtures/spreadsheet.xlsx"
      ];

      // Intercepter et simuler uploads en parallèle
      cy.intercept("POST", "**/files/presigned-url", (req) => {
        const fileName = req.body.fileName;
        return {
          statusCode: 200,
          body: {
            uploadUrl: `https://${s3TestData.buckets.main}.s3.amazonaws.com/uploads/${fileName}-${Date.now()}`,
            fileId: `file_${fileName}_${Date.now()}`,
            expiresIn: 3600
          }
        };
      }).as("multiplePresignedUrls");

      cy.intercept("PUT", "https://*.s3.amazonaws.com/**", {
        statusCode: 200,
        headers: { "ETag": '"upload-success"' },
        delay: Math.random() * 2000 + 1000 // Délai aléatoire 1-3s
      }).as("multipleS3Uploads");

      // Sélectionner plusieurs fichiers simultanément
      cy.get('[data-cy="file-upload-zone"]')
        .selectFile(simultaneousFiles, { force: true });

      // Vérifier la détection d'uploads multiples
      cy.get('[data-cy="multiple-uploads-detected"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "5 fichiers sélectionnés")
        .should("contain", "Upload simultané optimisé");

      // Vérifier la gestion de la bande passante
      cy.get('[data-cy="bandwidth-management"]')
        .should("contain", "Bande passante répartie intelligemment")
        .should("contain", "3 uploads simultanés max")
        .should("contain", "File d'attente: 2 fichiers");

      // Vérifier les barres de progression individuelles
      simultaneousFiles.forEach((file, index) => {
        const fileName = file.split('/').pop();
        cy.get(`[data-cy="progress-${index}"]`)
          .should("be.visible")
          .should("contain", fileName);
      });

      // Vérifier la progression globale
      cy.get('[data-cy="overall-progress"]')
        .should("be.visible")
        .should("contain", "0/5 complétés");

      // Attendre que tous les uploads se terminent
      cy.get('[data-cy="all-uploads-complete"]', { timeout: 45000 })
        .should("be.visible")
        .should("contain", "5/5 fichiers uploadés avec succès");

      // Vérifier l'absence de conflits
      cy.get('[data-cy="upload-conflicts"]')
        .should("contain", "Aucun conflit détecté")
        .should("contain", "Tous les fichiers intègres");

      // Vérifier les métriques de performance
      cy.get('[data-cy="performance-metrics"]')
        .should("contain", "Temps total: < 45s")
        .should("contain", "Débit moyen:")
        .should("contain", "Efficacité: > 85%");

      // Vérifier la liste finale des fichiers
      cy.get('[data-cy="uploaded-files-list"]').within(() => {
        simultaneousFiles.forEach((file) => {
          const fileName = file.split('/').pop();
          cy.should("contain", fileName);
          cy.should("contain", "✓ Uploadé");
        });
      });
    });
  });

  context("🔒 Sécurité et URLs Signées", () => {
    it("devrait générer des URLs signées sécurisées avec expiration", () => {
      cy.task("log", "🔹 Test URLs signées sécurisées");

      cy.loginAsUser();
      cy.visit("/messages");

      // Créer un message avec fichier joint
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="message-subject"]').type("Test Sécurité Fichiers");
      cy.get('[data-cy="file-upload"]')
        .selectFile("cypress/fixtures/confidential-document.pdf", { force: true });

      cy.get('[data-cy="send-message-btn"]').click();
      cy.wait(5000);

      // Récupérer l'URL de téléchargement
      cy.get('[data-cy="message-list"]')
        .contains("Test Sécurité Fichiers")
        .click();

      let downloadUrl: string;
      cy.get('[data-cy="file-download"]')
        .should("have.attr", "href")
        .then((href) => {
          downloadUrl = href;
          
          // Vérifier la structure de l'URL signée
          expect(downloadUrl).to.include("amazonaws.com");
          expect(downloadUrl).to.include("X-Amz-Algorithm=AWS4-HMAC-SHA256");
          expect(downloadUrl).to.include("X-Amz-Credential=");
          expect(downloadUrl).to.include("X-Amz-Date=");
          expect(downloadUrl).to.include("X-Amz-Expires=");
          expect(downloadUrl).to.include("X-Amz-SignedHeaders=");
          expect(downloadUrl).to.include("X-Amz-Signature=");
          
          cy.task("log", `URL signée générée: ${downloadUrl.substring(0, 100)}...`);
        });

      // Tester l'accès avec URL valide
      cy.request({
        method: "GET",
        url: downloadUrl,
        timeout: 15000
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.headers["content-type"]).to.contain("application/pdf");
      });

      // Simuler l'expiration de l'URL
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/expire-signed-url`,
        body: { url: downloadUrl }
      });

      // Tester l'accès avec URL expirée
      cy.request({
        method: "GET", 
        url: downloadUrl,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.contain("Request has expired");
      });

      // Générer une nouvelle URL
      cy.get('[data-cy="regenerate-download-link"]').click();

      cy.get('[data-cy="new-url-generated"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Nouveau lien de téléchargement généré")
        .should("contain", "Expire dans: 1 heure");

      // Vérifier la nouvelle URL
      cy.get('[data-cy="file-download"]')
        .should("have.attr", "href")
        .and("not.equal", downloadUrl); // Différente de la précédente
    });

    it("devrait bloquer les tentatives d'accès non autorisé", () => {
      cy.task("log", "🔹 Test blocage accès non autorisé");

      // Utilisateur A crée un fichier privé
      cy.loginAsUser();
      cy.visit("/profile/documents");

      cy.get('[data-cy="upload-private-document"]').click();
      cy.get('[data-cy="document-upload"]')
        .selectFile("cypress/fixtures/private-document.pdf", { force: true });
      cy.get('[data-cy="privacy-level"]').select("private");
      cy.get('[data-cy="confirm-upload"]').click();

      let privateFileId: string;
      cy.get('[data-cy="upload-success"]', { timeout: 15000 })
        .should("be.visible");

      cy.get('[data-cy="file-id"]')
        .invoke("text")
        .then((id) => {
          privateFileId = id.trim();
        });

      // Utilisateur B tente d'accéder au fichier de A
      cy.logout();
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/create-second-user`,
        body: { email: "user.b@test.com", password: "password123" }
      });

      cy.visit("/login");
      cy.get('[data-cy="email"]').type("user.b@test.com");
      cy.get('[data-cy="password"]').type("password123");
      cy.get('[data-cy="login-submit"]').click();

      // Tentative d'accès direct via API
      cy.window().then((win) => {
        const userBToken = win.localStorage.getItem("auth_token");
        
        cy.request({
          method: "GET",
          url: `${Cypress.env("API_BASE_URL")}/files/${privateFileId}`,
          headers: { Authorization: `Bearer ${userBToken}` },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(403);
          expect(response.body.error).to.contain("Access denied");
          expect(response.body.error).to.contain("File not owned by user");
        });
      });

      // Tentative de génération d'URL signée non autorisée
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/files/${privateFileId}/signed-url`,
        headers: {
          Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.error).to.contain("Unauthorized file access");
      });

      // Vérifier les logs de sécurité
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/security-logs");

      cy.get('[data-cy="file-access-violations"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "2 tentatives d'accès non autorisé")
        .should("contain", "user.b@test.com")
        .should("contain", privateFileId);

      // Vérifier les détails de sécurité
      cy.get('[data-cy="violation-details"]')
        .should("contain", "Type: Unauthorized file access")
        .should("contain", "Action: Blocked")
        .should("contain", "IP logged")
        .should("contain", "User alerted: No"); // Pas d'alerte pour éviter le spam
    });

    it("devrait détecter et bloquer la manipulation d'URLs", () => {
      cy.task("log", "🔹 Test détection manipulation URLs");

      cy.loginAsUser();
      cy.visit("/messages");

      // Créer un message avec fichier
      cy.get('[data-cy="new-message-btn"]').click();
      cy.get('[data-cy="file-upload"]')
        .selectFile("cypress/fixtures/test-document.pdf", { force: true });
      cy.get('[data-cy="send-message-btn"]').click();
      cy.wait(3000);

      // Récupérer une URL signée valide
      cy.get('[data-cy="message-list"]').first().click();
      
      let originalUrl: string;
      cy.get('[data-cy="file-download"]')
        .should("have.attr", "href")
        .then((href) => {
          originalUrl = href;
        });

      // Test 1: Manipulation de la signature
      cy.then(() => {
        const manipulatedUrl = originalUrl.replace(
          /X-Amz-Signature=[^&]+/,
          "X-Amz-Signature=malicioussignature123456789"
        );

        cy.request({
          method: "GET",
          url: manipulatedUrl,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(403);
          expect(response.body).to.contain("SignatureDoesNotMatch");
        });
      });

      // Test 2: Manipulation de l'expiration
      cy.then(() => {
        const futureExpiry = Math.floor(Date.now() / 1000) + 86400; // +24h
        const manipulatedUrl = originalUrl.replace(
          /X-Amz-Expires=\d+/,
          `X-Amz-Expires=${futureExpiry}`
        );

        cy.request({
          method: "GET",
          url: manipulatedUrl,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(403);
          expect(response.body).to.contain("SignatureDoesNotMatch");
        });
      });

      // Test 3: Manipulation du chemin de fichier
      cy.then(() => {
        const manipulatedUrl = originalUrl.replace(
          /uploads\/[^?]+/,
          "uploads/other-user-file.pdf"
        );

        cy.request({
          method: "GET",
          url: manipulatedUrl,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(403);
          expect(response.body).to.contain("SignatureDoesNotMatch");
        });
      });

      // Vérifier les alertes de sécurité
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/security-alerts");

      cy.get('[data-cy="url-manipulation-alerts"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "3 tentatives de manipulation d'URL")
        .should("contain", "Toutes bloquées");

      cy.get('[data-cy="manipulation-types"]')
        .should("contain", "Signature modifiée")
        .should("contain", "Expiration manipulée")
        .should("contain", "Chemin fichier modifié");

      // Vérifier les contre-mesures automatiques
      cy.get('[data-cy="auto-countermeasures"]')
        .should("contain", "IP source surveillée")
        .should("contain", "Fréquence d'alerts limitée")
        .should("contain", "Logs forensiques créés");
    });
  });

  context("🔄 Gestion d'Erreurs et Récupération", () => {
    it("devrait gérer gracieusement les pannes S3", () => {
      cy.task("log", "🔹 Test gestion pannes S3");

      cy.loginAsUser();
      cy.visit("/projects/upload");

      // Simuler une panne S3 totale
      cy.intercept("POST", "**/files/presigned-url", {
        statusCode: 503,
        body: { error: "ServiceUnavailable", message: "The service is temporarily unavailable" }
      }).as("s3ServiceDown");

      cy.intercept("PUT", "https://*.s3.amazonaws.com/**", {
        forceNetworkError: true
      }).as("s3NetworkError");

      // Tenter un upload
      cy.get('[data-cy="file-upload-zone"]')
        .selectFile("cypress/fixtures/test-document.pdf", { force: true });

      cy.wait("@s3ServiceDown");

      // Vérifier la détection de panne
      cy.get('[data-cy="s3-service-error"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Service S3 temporairement indisponible")
        .should("contain", "Vos fichiers seront uploadés dès que le service sera rétabli");

      // Vérifier la mise en file d'attente
      cy.get('[data-cy="upload-queued"]')
        .should("contain", "Fichier mis en file d'attente")
        .should("contain", "Position: 1")
        .should("contain", "Tentative automatique dans: 2 minutes");

      // Vérifier le mode dégradé
      cy.get('[data-cy="degraded-mode"]')
        .should("contain", "Mode dégradé activé")
        .should("contain", "Stockage temporaire local")
        .should("contain", "Synchronisation différée");

      // Simuler le rétablissement du service
      cy.intercept("POST", "**/files/presigned-url", {
        statusCode: 200,
        body: {
          uploadUrl: "https://restored-bucket.s3.amazonaws.com/uploads/restored-123",
          fileId: "file_restored_123",
          expiresIn: 3600
        }
      }).as("s3ServiceRestored");

      cy.intercept("PUT", "https://*.s3.amazonaws.com/**", {
        statusCode: 200,
        headers: { "ETag": '"service-restored"' }
      }).as("s3UploadRestored");

      // Déclencher la vérification du service
      cy.get('[data-cy="check-service-status"]').click();

      // Vérifier la reprise automatique
      cy.get('[data-cy="service-restored"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "Service S3 rétabli")
        .should("contain", "Reprise des uploads en cours");

      cy.wait("@s3ServiceRestored");
      cy.wait("@s3UploadRestored");

      // Vérifier la finalisation de l'upload
      cy.get('[data-cy="upload-success-after-outage"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Upload réussi après rétablissement du service")
        .should("contain", "Fichier sauvegardé avec succès");

      // Vérifier les métriques de résilience
      cy.get('[data-cy="resilience-metrics"]')
        .should("contain", "Temps d'indisponibilité détecté")
        .should("contain", "Temps de récupération")
        .should("contain", "Aucun fichier perdu");
    });

    it("devrait implémenter un fallback intelligent multi-région", () => {
      cy.task("log", "🔹 Test fallback multi-région");

      cy.loginAsUser();
      cy.visit("/projects/upload");

      // Simuler la panne de la région principale (eu-west-3)
      cy.intercept("PUT", `https://*eu-west-3.amazonaws.com/**`, {
        statusCode: 503,
        body: { error: "ServiceUnavailable" }
      }).as("primaryRegionDown");

      // Région de fallback (eu-west-1) disponible
      cy.intercept("PUT", `https://*eu-west-1.amazonaws.com/**`, {
        statusCode: 200,
        headers: { "ETag": '"fallback-success"' },
        delay: 2000
      }).as("fallbackRegionSuccess");

      // Configuration du fallback automatique
      cy.intercept("POST", "**/files/presigned-url", (req) => {
        return {
          statusCode: 200,
          body: {
            uploadUrl: `https://${s3TestData.buckets.main}.s3.eu-west-1.amazonaws.com/uploads/fallback-${Date.now()}`,
            fileId: `file_fallback_${Date.now()}`,
            expiresIn: 3600,
            region: "eu-west-1",
            fallbackInfo: {
              originalRegion: "eu-west-3",
              reason: "Primary region unavailable"
            }
          }
        };
      }).as("fallbackPresignedUrl");

      // Démarrer l'upload
      cy.get('[data-cy="file-upload-zone"]')
        .selectFile("cypress/fixtures/test-document.pdf", { force: true });

      cy.wait("@fallbackPresignedUrl");

      // Vérifier la détection du fallback
      cy.get('[data-cy="region-fallback-detected"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Région principale indisponible")
        .should("contain", "Basculement vers eu-west-1")
        .should("contain", "Upload redirigé automatiquement");

      cy.wait("@fallbackRegionSuccess");

      // Vérifier le succès via fallback
      cy.get('[data-cy="upload-success-fallback"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Upload réussi via région de secours")
        .should("contain", "Région: eu-west-1");

      // Vérifier la synchronisation cross-région
      cy.get('[data-cy="cross-region-sync"]')
        .should("contain", "Synchronisation programmée")
        .should("contain", "Réplication vers région principale")
        .should("contain", "Cohérence assurée");

      // Vérifier les métriques de fallback
      cy.get('[data-cy="fallback-metrics"]')
        .should("contain", "Temps de basculement: < 5s")
        .should("contain", "Région de secours: Opérationnelle")
        .should("contain", "Latence supplémentaire: ~200ms");

      // Simuler le rétablissement de la région principale
      cy.intercept("PUT", `https://*eu-west-3.amazonaws.com/**`, {
        statusCode: 200,
        headers: { "ETag": '"primary-restored"' }
      }).as("primaryRegionRestored");

      // Vérifier la détection du rétablissement
      cy.get('[data-cy="primary-region-check"]').click();

      cy.get('[data-cy="primary-region-restored"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "Région principale rétablie")
        .should("contain", "Basculement de retour programmé")
        .should("contain", "Trafic sera restauré progressivement");
    });

    it("devrait monitorer et alerter sur la santé du stockage", () => {
      cy.task("log", "🔹 Test monitoring santé stockage");

      // Simuler différents problèmes de stockage
      const storageIssues = [
        {
          type: "high-latency",
          description: "Latence élevée détectée",
          threshold: "5 secondes",
          impact: "Performance dégradée"
        },
        {
          type: "quota-warning",
          description: "Quota stockage proche de la limite", 
          threshold: "85% utilisé",
          impact: "Nouveaux uploads risqués"
        },
        {
          type: "bandwidth-limit",
          description: "Limite de bande passante atteinte",
          threshold: "100 MB/s",
          impact: "Uploads ralentis"
        }
      ];

      cy.loginAsAdmin();
      cy.visit("/admin/storage-health");

      // Simuler les problèmes via API
      storageIssues.forEach((issue, index) => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/dev/simulate-storage-issue`,
          body: {
            type: issue.type,
            severity: index === 1 ? "critical" : "warning",
            duration: 300 // 5 minutes
          }
        });
      });

      // Vérifier la détection des problèmes
      cy.get('[data-cy="storage-alerts"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "3 problèmes de stockage détectés");

      storageIssues.forEach((issue) => {
        cy.get(`[data-cy="alert-${issue.type}"]`)
          .should("be.visible")
          .should("contain", issue.description)
          .should("contain", issue.threshold)
          .should("contain", issue.impact);
      });

      // Vérifier les métriques de santé en temps réel
      cy.get('[data-cy="real-time-metrics"]').within(() => {
        cy.get('[data-cy="storage-usage"]')
          .should("be.visible")
          .should("contain", "%");

        cy.get('[data-cy="average-latency"]')
          .should("be.visible")
          .should("contain", "ms");

        cy.get('[data-cy="bandwidth-usage"]')
          .should("be.visible")
          .should("contain", "MB/s");

        cy.get('[data-cy="error-rate"]')
          .should("be.visible")
          .should("contain", "%");
      });

      // Vérifier les recommandations automatiques
      cy.get('[data-cy="auto-recommendations"]')
        .should("contain", "Optimisation stockage recommandée")
        .should("contain", "Nettoyage fichiers temporaires")
        .should("contain", "Migration vers stockage haute performance");

      // Appliquer les optimisations recommandées
      cy.get('[data-cy="apply-optimizations"]').click();

      cy.get('[data-cy="optimization-progress"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "Optimisations en cours...");

      // Vérifier l'amélioration des métriques
      cy.get('[data-cy="optimization-results"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "Optimisations appliquées avec succès")
        .should("contain", "Latence réduite de")
        .should("contain", "Espace libéré:")
        .should("contain", "Performance améliorée");

      // Vérifier la configuration d'alertes proactives
      cy.get('[data-cy="proactive-alerts"]')
        .should("contain", "Surveillance continue activée")
        .should("contain", "Seuils d'alerte configurés")
        .should("contain", "Notifications automatiques")
        .should("contain", "Escalade selon criticité");
    });
  });

  context("🗂️ Versioning et Backup", () => {
    it("devrait gérer le versioning automatique des fichiers", () => {
      cy.task("log", "🔹 Test versioning automatique");

      cy.loginAsUser();
      cy.visit("/projects/documents");

      const fileName = "document-versionne.pdf";

      // Upload version 1
      cy.get('[data-cy="upload-document"]').click();
      cy.get('[data-cy="document-upload"]')
        .selectFile("cypress/fixtures/document-v1.pdf", { force: true });
      cy.get('[data-cy="document-name"]').type(fileName);
      cy.get('[data-cy="enable-versioning"]').check();
      cy.get('[data-cy="confirm-upload"]').click();

      cy.get('[data-cy="upload-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Version 1.0 créée");

      // Récupérer l'ID du document
      let documentId: string;
      cy.get('[data-cy="document-id"]')
        .invoke("text")
        .then((id) => {
          documentId = id.trim();
        });

      // Upload version 2 (même nom)
      cy.get('[data-cy="upload-document"]').click();
      cy.get('[data-cy="document-upload"]')
        .selectFile("cypress/fixtures/document-v2.pdf", { force: true });
      cy.get('[data-cy="document-name"]').type(fileName);
      cy.get('[data-cy="update-existing"]').check(); // Mettre à jour au lieu de créer nouveau
      cy.get('[data-cy="version-notes"]').type("Corrections chapitre 3 et ajout bibliographie");
      cy.get('[data-cy="confirm-upload"]').click();

      // Vérifier la création de version
      cy.get('[data-cy="version-created"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Version 2.0 créée")
        .should("contain", "Version précédente conservée");

      // Consulter l'historique des versions
      cy.get('[data-cy="document-list"]')
        .contains(fileName)
        .closest('[data-cy="document-row"]')
        .within(() => {
          cy.get('[data-cy="view-versions"]').click();
        });

      // Vérifier l'interface de versions
      cy.get('[data-cy="version-history"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="version-list"]').within(() => {
        // Version 2.0 (actuelle)
        cy.get('[data-cy="version-2.0"]')
          .should("contain", "Version 2.0 (Actuelle)")
          .should("contain", "Corrections chapitre 3")
          .should("contain", new Date().toLocaleDateString());

        // Version 1.0
        cy.get('[data-cy="version-1.0"]')
          .should("contain", "Version 1.0")
          .should("contain", "Version initiale");
      });

      // Télécharger une version spécifique
      cy.get('[data-cy="version-1.0"]').within(() => {
        cy.get('[data-cy="download-version"]').click();
      });

      // Vérifier le téléchargement avec URL signée spécifique à la version
      cy.get('[data-cy="version-download-started"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Téléchargement version 1.0 démarré");

      // Restaurer une version précédente
      cy.get('[data-cy="version-1.0"]').within(() => {
        cy.get('[data-cy="restore-version"]').click();
      });

      cy.get('[data-cy="restore-confirmation"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Restaurer la version 1.0 comme version actuelle");

      cy.get('[data-cy="restore-reason"]')
        .type("Retour à la version stable après problèmes détectés en v2.0");
      
      cy.get('[data-cy="confirm-restore"]').click();

      // Vérifier la restauration
      cy.get('[data-cy="version-restored"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Version 1.0 restaurée comme version 3.0")
        .should("contain", "Historique préservé");

      // Vérifier les métriques de versioning
      cy.get('[data-cy="versioning-stats"]')
        .should("contain", "3 versions total")
        .should("contain", "1 restauration")
        .should("contain", "Espace utilisé:")
        .should("contain", "Déduplication active");
    });

    it("devrait effectuer des backups automatiques et restauration", () => {
      cy.task("log", "🔹 Test backups automatiques et restauration");

      cy.loginAsAdmin();
      cy.visit("/admin/backup-management");

      // Configuration des backups automatiques
      cy.get('[data-cy="backup-config"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="enable-auto-backup"]').check();
      cy.get('[data-cy="backup-frequency"]').select("daily");
      cy.get('[data-cy="backup-retention"]').select("30-days");
      cy.get('[data-cy="backup-compression"]').check();
      cy.get('[data-cy="backup-encryption"]').check();

      cy.get('[data-cy="save-backup-config"]').click();

      // Déclencher un backup manuel pour test
      cy.get('[data-cy="trigger-manual-backup"]').click();

      cy.get('[data-cy="backup-started"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Backup manuel démarré")
        .should("contain", "Tous les fichiers seront sauvegardés");

      // Vérifier la progression du backup
      cy.get('[data-cy="backup-progress"]', { timeout: 5000 })
        .should("be.visible");

      cy.get('[data-cy="backup-details"]')
        .should("contain", "Fichiers traités:")
        .should("contain", "Taille compressée:")
        .should("contain", "Temps estimé:");

      // Simuler la fin du backup
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/complete-backup`,
        body: { backupId: "backup_test_123" }
      });

      cy.get('[data-cy="backup-completed"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "Backup complété avec succès")
        .should("contain", "ID: backup_test_123");

      // Vérifier l'historique des backups
      cy.get('[data-cy="backup-history"]').click();

      cy.get('[data-cy="backup-list"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "backup_test_123")
        .should("contain", "Manuel")
        .should("contain", "Complété")
        .should("contain", new Date().toLocaleDateString());

      // Tester la restauration
      cy.get('[data-cy="backup-list"]')
        .contains("backup_test_123")
        .closest('[data-cy="backup-row"]')
        .within(() => {
          cy.get('[data-cy="restore-backup"]').click();
        });

      cy.get('[data-cy="restore-options"]', { timeout: 10000 })
        .should("be.visible");

      // Options de restauration
      cy.get('[data-cy="restore-type"]').select("selective");
      cy.get('[data-cy="restore-path"]').type("/restored-files/");
      cy.get('[data-cy="preserve-versions"]').check();
      cy.get('[data-cy="verify-integrity"]').check();

      cy.get('[data-cy="preview-restore"]').click();

      // Vérifier l'aperçu de restauration
      cy.get('[data-cy="restore-preview"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Fichiers à restaurer:")
        .should("contain", "Espace requis:")
        .should("contain", "Conflits détectés:");

      cy.get('[data-cy="confirm-restore"]').click();

      // Vérifier la progression de restauration
      cy.get('[data-cy="restore-in-progress"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Restauration en cours");

      // Simuler la fin de restauration
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/complete-restore`,
        body: { restoreId: "restore_test_123" }
      });

      cy.get('[data-cy="restore-completed"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "Restauration terminée avec succès")
        .should("contain", "Fichiers restaurés")
        .should("contain", "Vérification d'intégrité: ✓");

      // Vérifier les métriques de backup
      cy.visit("/admin/backup-analytics");

      cy.get('[data-cy="backup-metrics"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Taux de compression moyen:")
        .should("contain", "Temps de backup moyen:")
        .should("contain", "Fiabilité: 100%")
        .should("contain", "Dernière vérification:");
    });

    it("devrait nettoyer automatiquement les fichiers orphelins", () => {
      cy.task("log", "🔹 Test nettoyage fichiers orphelins");

      // Créer des fichiers orphelins pour le test
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/create-orphan-files`,
        body: {
          count: 15,
          types: ["temp-upload", "deleted-project", "failed-processing", "expired-link"],
          totalSize: "50MB"
        }
      });

      cy.loginAsAdmin();
      cy.visit("/admin/storage-cleanup");

      // Analyser les fichiers orphelins
      cy.get('[data-cy="scan-orphan-files"]').click();

      cy.get('[data-cy="scan-in-progress"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Analyse des fichiers orphelins...");

      cy.get('[data-cy="scan-completed"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "Analyse terminée");

      // Vérifier les résultats de l'analyse
      cy.get('[data-cy="orphan-summary"]').within(() => {
        cy.should("contain", "15 fichiers orphelins détectés");
        cy.should("contain", "Taille totale: ~50 MB");
        cy.should("contain", "Types: 4 catégories");
      });

      // Détails par catégorie
      cy.get('[data-cy="orphan-categories"]').within(() => {
        cy.get('[data-cy="temp-upload"]')
          .should("contain", "Uploads temporaires")
          .should("contain", "Age > 7 jours");

        cy.get('[data-cy="deleted-project"]')
          .should("contain", "Projets supprimés")
          .should("contain", "Références cassées");

        cy.get('[data-cy="failed-processing"]')
          .should("contain", "Traitement échoué")
          .should("contain", "État incohérent");

        cy.get('[data-cy="expired-link"]')
          .should("contain", "Liens expirés")
          .should("contain", "Plus référencés");
      });

      // Configuration du nettoyage
      cy.get('[data-cy="cleanup-config"]').within(() => {
        cy.get('[data-cy="auto-cleanup"]').check();
        cy.get('[data-cy="backup-before-delete"]').check();
        cy.get('[data-cy="safe-mode"]').check(); // Mode sécurisé
      });

      // Prévisualisation du nettoyage
      cy.get('[data-cy="preview-cleanup"]').click();

      cy.get('[data-cy="cleanup-preview"]', { timeout: 15000 })
        .should("be.visible");

      cy.get('[data-cy="files-to-delete"]')
        .should("contain", "12 fichiers seront supprimés")
        .should("contain", "3 fichiers conservés (récents)")
        .should("contain", "Espace libéré: ~40 MB");

      // Exécuter le nettoyage
      cy.get('[data-cy="execute-cleanup"]').click();

      cy.get('[data-cy="cleanup-confirmation"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Cette action supprimera définitivement les fichiers");

      cy.get('[data-cy="confirm-cleanup"]').click();

      // Vérifier la progression
      cy.get('[data-cy="cleanup-progress"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Nettoyage en cours...");

      cy.get('[data-cy="cleanup-steps"]')
        .should("contain", "1. Backup des fichiers")
        .should("contain", "2. Vérification des références")
        .should("contain", "3. Suppression sécurisée")
        .should("contain", "4. Mise à jour index");

      // Vérifier la completion
      cy.get('[data-cy="cleanup-completed"]', { timeout: 45000 })
        .should("be.visible")
        .should("contain", "Nettoyage terminé avec succès");

      // Vérifier les résultats
      cy.get('[data-cy="cleanup-results"]').within(() => {
        cy.should("contain", "12 fichiers supprimés");
        cy.should("contain", "~40 MB libérés");
        cy.should("contain", "3 fichiers préservés");
        cy.should("contain", "0 erreurs");
      });

      // Programmer le nettoyage automatique
      cy.get('[data-cy="schedule-auto-cleanup"]').click();

      cy.get('[data-cy="schedule-config"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="cleanup-frequency"]').select("weekly");
      cy.get('[data-cy="cleanup-day"]').select("sunday");
      cy.get('[data-cy="cleanup-time"]').type("02:00");
      cy.get('[data-cy="min-age-days"]').type("7");

      cy.get('[data-cy="save-schedule"]').click();

      // Vérifier la programmation
      cy.get('[data-cy="schedule-saved"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Nettoyage automatique programmé")
        .should("contain", "Tous les dimanches à 02:00")
        .should("contain", "Fichiers > 7 jours");
    });
  });

  afterEach(() => {
    // Nettoyage après chaque test
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });

    // Nettoyer les fichiers de test S3
    cy.request({
      method: "DELETE",
      url: `${Cypress.env("API_BASE_URL")}/dev/cleanup-s3-test-files`,
      failOnStatusCode: false
    });
  });
});