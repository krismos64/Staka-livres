/// <reference types="cypress" />

/**
 * Tests E2E - Workflows Métier End-to-End (Critique)
 * 
 * Tests complets des cycles de vie métier de la plateforme Staka-Livres.
 * Couvre les workflows essentiels depuis la commande client jusqu'à la livraison finale.
 * 
 * Workflows testés :
 * - Cycle complet correction : Commande → Paiement → Assignation → Correction → Livraison
 * - Workflow révision : Client demande modifications → Correcteur répond → Validation
 * - Processus escalade : Admin intervient → Résolution → Notification
 * - Système de notation et feedback post-livraison
 */

describe("🔄 Workflows Métier End-to-End - Tests Critiques", () => {
  const projectData = {
    client: {
      email: "client.test@example.com",
      password: "password123",
      prenom: "Marie",
      nom: "Dubois"
    },
    corrector: {
      email: "corrector.test@example.com",
      password: "password123",
      prenom: "Jean",
      nom: "Correcteur"
    },
    project: {
      title: "Roman Fantasy - Les Terres Oubliées",
      type: "Roman",
      pages: 250,
      pack: "integral",
      description: "Roman fantasy épique de 250 pages nécessitant une correction complète",
      deadline: "2025-08-15"
    },
    payment: {
      amount: 500, // 250 pages × 2€
      currency: "EUR"
    }
  };

  beforeEach(() => {
    // Réinitialiser l'état pour chaque test
    cy.resetDatabase();
    cy.visit("/");
    cy.wait(2000);
  });

  context("📋 Cycle Complet de Correction", () => {
    it("devrait exécuter le workflow complet : Commande → Paiement → Assignation → Correction → Livraison", () => {
      // === ÉTAPE 1 : CRÉATION DE COMMANDE CLIENT ===
      cy.task("log", "🔹 ÉTAPE 1: Création de commande client");
      
      cy.loginAsUser();
      cy.visit("/commander");
      cy.wait(2000);

      // Remplir les détails du projet
      cy.get('[data-cy="project-title"]').type(projectData.project.title);
      cy.get('[data-cy="project-type"]').select(projectData.project.type);
      cy.get('[data-cy="project-pages"]').type(projectData.project.pages.toString());
      cy.get('[data-cy="project-pack"]').select(projectData.project.pack);
      cy.get('[data-cy="project-description"]').type(projectData.project.description);
      cy.get('[data-cy="project-deadline"]').type(projectData.project.deadline);

      // Upload du manuscrit
      cy.get('[data-cy="manuscript-upload"]')
        .selectFile("cypress/fixtures/manuscript-test.pdf", { force: true });

      cy.get('[data-cy="file-uploaded"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "manuscript-test.pdf");

      // Valider la commande
      cy.get('[data-cy="validate-order"]').click();
      
      cy.get('[data-cy="order-summary"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", projectData.project.title)
        .should("contain", `${projectData.payment.amount}€`);

      cy.get('[data-cy="proceed-payment"]').click();

      // === ÉTAPE 2 : PROCESSUS DE PAIEMENT ===
      cy.task("log", "🔹 ÉTAPE 2: Processus de paiement Stripe");
      
      cy.url({ timeout: 15000 }).should("include", "/paiement");
      
      // Vérifier les détails de paiement
      cy.get('[data-cy="payment-amount"]')
        .should("contain", `${projectData.payment.amount}€`);

      // Simuler le paiement Stripe
      cy.simulateStripePayment();

      // Vérifier la confirmation de paiement
      cy.get('[data-cy="payment-success"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "Paiement réussi");

      cy.get('[data-cy="order-confirmed"]')
        .should("contain", "Votre commande a été confirmée")
        .should("contain", projectData.project.title);

      // Sauvegarder l'ID du projet pour les étapes suivantes
      let projectId: string;
      cy.get('[data-cy="project-id"]')
        .invoke("text")
        .then((id) => {
          projectId = id.trim();
          cy.wrap(projectId).as("projectId");
        });

      // === ÉTAPE 3 : ASSIGNATION CORRECTEUR (CÔTÉ ADMIN) ===
      cy.task("log", "🔹 ÉTAPE 3: Assignation correcteur par admin");
      
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/projets");
      cy.wait(3000);

      // Trouver le nouveau projet
      cy.get('[data-cy="project-list"]')
        .should("contain", projectData.project.title)
        .should("contain", "En attente d'assignation");

      cy.get('[data-cy="project-list"]')
        .contains(projectData.project.title)
        .closest('[data-cy="project-row"]')
        .within(() => {
          cy.get('[data-cy="assign-corrector"]').click();
        });

      // Sélectionner un correcteur disponible
      cy.get('[data-cy="corrector-modal"]', { timeout: 10000 }).should("be.visible");
      
      cy.get('[data-cy="available-correctors"]')
        .first()
        .click();

      cy.get('[data-cy="assign-deadline"]').type("2025-08-10");
      cy.get('[data-cy="assign-priority"]').select("NORMALE");
      cy.get('[data-cy="confirm-assignment"]').click();

      // Vérifier l'assignation
      cy.get('[data-cy="assignment-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Correcteur assigné avec succès");

      cy.get('[data-cy="project-list"]')
        .contains(projectData.project.title)
        .closest('[data-cy="project-row"]')
        .should("contain", "En cours de correction");

      // === ÉTAPE 4 : TRAVAIL DU CORRECTEUR ===
      cy.task("log", "🔹 ÉTAPE 4: Travail du correcteur");
      
      cy.logout();
      cy.visit("/login");
      
      // Login en tant que correcteur
      cy.get('[data-cy="email"]').type(projectData.corrector.email);
      cy.get('[data-cy="password"]').type(projectData.corrector.password);
      cy.get('[data-cy="login-submit"]').click();
      cy.wait(3000);

      cy.visit("/correcteur/projets");
      cy.wait(2000);

      // Vérifier que le projet est dans la liste du correcteur
      cy.get('[data-cy="assigned-projects"]')
        .should("contain", projectData.project.title)
        .should("contain", "À corriger");

      // Ouvrir le projet pour correction
      cy.get('[data-cy="assigned-projects"]')
        .contains(projectData.project.title)
        .click();

      cy.get('[data-cy="correction-workspace"]', { timeout: 10000 })
        .should("be.visible");

      // Télécharger le manuscrit original
      cy.get('[data-cy="download-original"]').click();
      cy.wait(2000);

      // Simuler le travail de correction
      cy.get('[data-cy="correction-notes"]')
        .type("Corrections effectuées :\n- Structure narrative améliorée\n- Cohérence des personnages vérifiée\n- Style et syntaxe corrigés\n- Orthographe et grammaire révisées");

      // Upload du manuscrit corrigé
      cy.get('[data-cy="corrected-upload"]')
        .selectFile("cypress/fixtures/manuscript-corrected.pdf", { force: true });

      cy.get('[data-cy="correction-file-uploaded"]', { timeout: 15000 })
        .should("be.visible");

      // Marquer la correction comme terminée
      cy.get('[data-cy="correction-progress"]').type("100");
      cy.get('[data-cy="mark-completed"]').click();

      cy.get('[data-cy="completion-modal"]', { timeout: 10000 }).should("be.visible");
      
      cy.get('[data-cy="completion-summary"]')
        .type("Correction complète terminée. Toutes les incohérences ont été corrigées, le style a été uniformisé.");

      cy.get('[data-cy="submit-completion"]').click();

      // Vérifier la soumission
      cy.get('[data-cy="correction-submitted"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Correction soumise avec succès");

      // === ÉTAPE 5 : VALIDATION ADMIN ET LIVRAISON ===
      cy.task("log", "🔹 ÉTAPE 5: Validation admin et livraison");
      
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/corrections-terminees");
      cy.wait(3000);

      // Vérifier la correction soumise
      cy.get('[data-cy="completed-corrections"]')
        .should("contain", projectData.project.title)
        .should("contain", "À valider");

      cy.get('[data-cy="completed-corrections"]')
        .contains(projectData.project.title)
        .closest('[data-cy="correction-row"]')
        .within(() => {
          cy.get('[data-cy="review-correction"]').click();
        });

      // Interface de validation
      cy.get('[data-cy="validation-workspace"]', { timeout: 10000 })
        .should("be.visible");

      // Vérifier les fichiers
      cy.get('[data-cy="original-file"]')
        .should("contain", "manuscript-test.pdf");
      
      cy.get('[data-cy="corrected-file"]')
        .should("contain", "manuscript-corrected.pdf");

      // Valider la qualité de la correction
      cy.get('[data-cy="quality-score"]').select("Excellent");
      cy.get('[data-cy="admin-notes"]')
        .type("Correction de haute qualité. Prêt pour livraison au client.");

      cy.get('[data-cy="approve-correction"]').click();

      // Confirmer la livraison
      cy.get('[data-cy="delivery-modal"]', { timeout: 10000 }).should("be.visible");
      
      cy.get('[data-cy="delivery-method"]').select("email-and-platform");
      cy.get('[data-cy="delivery-message"]')
        .type("Bonjour, votre manuscrit corrigé est prêt. Vous pouvez le télécharger depuis votre espace client.");

      cy.get('[data-cy="confirm-delivery"]').click();

      // Vérifier la livraison
      cy.get('[data-cy="delivery-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Projet livré avec succès");

      // === ÉTAPE 6 : RÉCEPTION CLIENT ===
      cy.task("log", "🔹 ÉTAPE 6: Réception côté client");
      
      cy.logout();
      cy.loginAsUser();
      cy.visit("/mes-projets");
      cy.wait(3000);

      // Vérifier que le projet est marqué comme livré
      cy.get('[data-cy="client-projects"]')
        .should("contain", projectData.project.title)
        .should("contain", "Livré");

      cy.get('[data-cy="client-projects"]')
        .contains(projectData.project.title)
        .closest('[data-cy="project-card"]')
        .within(() => {
          cy.get('[data-cy="download-corrected"]')
            .should("be.visible")
            .should("contain", "Télécharger le manuscrit corrigé");
          
          cy.get('[data-cy="view-corrections"]').click();
        });

      // Interface de visualisation des corrections
      cy.get('[data-cy="correction-details"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Corrections effectuées")
        .should("contain", "Structure narrative améliorée");

      // Test du téléchargement
      cy.get('[data-cy="download-corrected"]').click();
      cy.wait(2000);

      // Vérifier qu'aucune erreur de téléchargement
      cy.get('[data-cy="download-error"]').should("not.exist");

      // === ÉTAPE 7 : NOTATION ET FEEDBACK ===
      cy.task("log", "🔹 ÉTAPE 7: Notation et feedback client");
      
      // Système de notation
      cy.get('[data-cy="rate-correction"]', { timeout: 10000 }).should("be.visible");
      
      cy.get('[data-cy="quality-rating"]')
        .find('[data-value="5"]')
        .click();

      cy.get('[data-cy="speed-rating"]')
        .find('[data-value="4"]')
        .click();

      cy.get('[data-cy="communication-rating"]')
        .find('[data-value="5"]')
        .click();

      cy.get('[data-cy="feedback-text"]')
        .type("Excellent travail ! La correction est très professionnelle et les améliorations apportées sont pertinentes. Je recommande vivement ce service.");

      cy.get('[data-cy="submit-feedback"]').click();

      // Vérifier la soumission du feedback
      cy.get('[data-cy="feedback-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Merci pour votre retour");

      // === VÉRIFICATION FINALE DES MÉTRIQUES ===
      cy.task("log", "🔹 VÉRIFICATION: Métriques et statistiques finales");
      
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/dashboard");
      cy.wait(3000);

      // Vérifier que les statistiques sont mises à jour
      cy.get('[data-cy="completed-projects"]')
        .should("contain", "1"); // Au moins 1 projet terminé

      cy.get('[data-cy="revenue-today"]')
        .should("contain", "500€"); // Revenus du jour

      cy.get('[data-cy="avg-rating"]')
        .should("contain", "4.7"); // Note moyenne mise à jour

      // Vérifier les métriques détaillées
      cy.visit("/admin/analytics");
      cy.wait(2000);

      cy.get('[data-cy="workflow-metrics"]')
        .should("contain", "Temps moyen de correction")
        .should("contain", "Taux de satisfaction")
        .should("contain", "Délais respectés");

      cy.task("log", "✅ Workflow complet exécuté avec succès!");
    });

    it("devrait gérer les délais et alertes automatiques", () => {
      // Créer un projet avec délai court
      cy.loginAsUser();
      cy.visit("/commander");

      cy.get('[data-cy="project-title"]').type("Projet Urgence");
      cy.get('[data-cy="project-type"]').select("Nouvelle");
      cy.get('[data-cy="project-pages"]').type("50");
      cy.get('[data-cy="project-deadline"]').type("2025-07-26"); // Demain
      cy.get('[data-cy="urgency-level"]').select("URGENT");

      cy.get('[data-cy="manuscript-upload"]')
        .selectFile("cypress/fixtures/short-story.pdf", { force: true });

      cy.get('[data-cy="validate-order"]').click();
      cy.simulateStripePayment();
      cy.wait(5000);

      // Vérifier les alertes côté admin
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/dashboard");

      cy.get('[data-cy="urgent-alerts"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "1 projet urgent")
        .should("contain", "Délai: 1 jour");

      // Vérifier les notifications automatiques
      cy.get('[data-cy="notification-bell"]').click();
      
      cy.get('[data-cy="notifications-panel"]')
        .should("contain", "Nouveau projet urgent")
        .should("contain", "Projet Urgence")
        .should("contain", "Délai très court");
    });

    it("devrait automatiser l'assignation basée sur la charge de travail", () => {
      // Créer plusieurs correcteurs avec différentes charges
      cy.loginAsAdmin();
      cy.visit("/admin/correcteurs");

      // Vérifier les charges de travail actuelles
      cy.get('[data-cy="corrector-workload"]', { timeout: 10000 })
        .should("be.visible");

      // Créer un nouveau projet
      cy.loginAsUser();
      cy.visit("/commander");

      cy.get('[data-cy="project-title"]').type("Auto-Assignation Test");
      cy.get('[data-cy="project-type"]').select("Roman");
      cy.get('[data-cy="project-pages"]').type("100");
      cy.get('[data-cy="auto-assign"]').check(); // Option d'assignation automatique

      cy.get('[data-cy="validate-order"]').click();
      cy.simulateStripePayment();
      cy.wait(5000);

      // Vérifier l'assignation automatique
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/projets");

      cy.get('[data-cy="project-list"]')
        .contains("Auto-Assignation Test")
        .closest('[data-cy="project-row"]')
        .should("contain", "Assigné automatiquement")
        .should("contain", "En cours"); // Statut mis à jour

      // Vérifier l'algorithme d'assignation
      cy.get('[data-cy="assignment-details"]').click();
      
      cy.get('[data-cy="assignment-reason"]')
        .should("contain", "Charge de travail la plus faible")
        .should("contain", "Spécialité: Roman");
    });
  });

  context("🔄 Workflow de Révision", () => {
    it("devrait gérer les demandes de révision client avec cycle complet", () => {
      // 1. Créer et livrer un projet initial
      cy.createPaidProject("Projet à Réviser").then((projectId) => {
        // Simuler la livraison
        cy.loginAsAdmin();
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/admin/projects/${projectId}/deliver`,
          headers: {
            Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
          },
          body: {
            deliveryNotes: "Première livraison complète",
            correctedFileUrl: "/files/corrected-v1.pdf"
          }
        });

        // 2. Client demande une révision
        cy.loginAsUser();
        cy.visit("/mes-projets");

        cy.get('[data-cy="client-projects"]')
          .contains("Projet à Réviser")
          .closest('[data-cy="project-card"]')
          .within(() => {
            cy.get('[data-cy="request-revision"]').click();
          });

        cy.get('[data-cy="revision-modal"]', { timeout: 10000 }).should("be.visible");

        cy.get('[data-cy="revision-reason"]').select("modifications-style");
        cy.get('[data-cy="revision-details"]')
          .type("Bonjour, j'aimerais que vous modifiiez le ton du chapitre 3 pour le rendre plus dynamique. Également, quelques dialogues semblent répétitifs.");

        cy.get('[data-cy="revision-urgency"]').select("normal");
        cy.get('[data-cy="submit-revision"]').click();

        // 3. Vérifier la demande côté admin
        cy.logout();
        cy.loginAsAdmin();
        cy.visit("/admin/revisions");

        cy.get('[data-cy="revision-requests"]', { timeout: 10000 })
          .should("contain", "Projet à Réviser")
          .should("contain", "modifications-style")
          .should("contain", "Normal");

        // 4. Assigner la révision au correcteur original
        cy.get('[data-cy="revision-requests"]')
          .contains("Projet à Réviser")
          .closest('[data-cy="revision-row"]')
          .within(() => {
            cy.get('[data-cy="assign-revision"]').click();
          });

        cy.get('[data-cy="assign-to-original"]').click();
        cy.get('[data-cy="revision-deadline"]').type("2025-07-30");
        cy.get('[data-cy="confirm-revision-assignment"]').click();

        // 5. Correcteur traite la révision
        cy.logout();
        cy.visit("/login");
        cy.get('[data-cy="email"]').type(projectData.corrector.email);
        cy.get('[data-cy="password"]').type(projectData.corrector.password);
        cy.get('[data-cy="login-submit"]').click();

        cy.visit("/correcteur/revisions");

        cy.get('[data-cy="revision-tasks"]', { timeout: 10000 })
          .should("contain", "Projet à Réviser")
          .should("contain", "modifications-style");

        cy.get('[data-cy="revision-tasks"]')
          .contains("Projet à Réviser")
          .click();

        // Interface de révision
        cy.get('[data-cy="revision-workspace"]', { timeout: 10000 })
          .should("be.visible");

        cy.get('[data-cy="original-feedback"]')
          .should("contain", "chapitre 3")
          .should("contain", "dialogues répétitifs");

        // Effectuer les révisions
        cy.get('[data-cy="revision-notes"]')
          .type("Révisions effectuées :\n- Chapitre 3 : ton rendu plus dynamique avec phrases plus courtes\n- Dialogues répétitifs supprimés et variés\n- Ajout de quelques expressions pour enrichir le style");

        cy.get('[data-cy="revised-upload"]')
          .selectFile("cypress/fixtures/manuscript-revised.pdf", { force: true });

        cy.get('[data-cy="submit-revision"]').click();

        // 6. Validation et livraison de la révision
        cy.logout();
        cy.loginAsAdmin();
        cy.visit("/admin/revisions");

        cy.get('[data-cy="completed-revisions"]')
          .contains("Projet à Réviser")
          .closest('[data-cy="revision-row"]')
          .within(() => {
            cy.get('[data-cy="validate-revision"]').click();
          });

        cy.get('[data-cy="approve-revision"]').click();
        cy.get('[data-cy="deliver-revision"]').click();

        // 7. Vérification côté client
        cy.logout();
        cy.loginAsUser();
        cy.visit("/mes-projets");

        cy.get('[data-cy="client-projects"]')
          .contains("Projet à Réviser")
          .closest('[data-cy="project-card"]')
          .should("contain", "Révision livrée")
          .within(() => {
            cy.get('[data-cy="download-revision"]').should("be.visible");
            cy.get('[data-cy="view-revision-notes"]').click();
          });

        cy.get('[data-cy="revision-details"]', { timeout: 10000 })
          .should("contain", "Chapitre 3 : ton rendu plus dynamique")
          .should("contain", "Dialogues répétitifs supprimés");
      });
    });

    it("devrait limiter le nombre de révisions gratuites", () => {
      cy.createPaidProject("Projet Multi-Révisions").then((projectId) => {
        // Simuler plusieurs demandes de révision
        for (let i = 1; i <= 4; i++) {
          cy.loginAsUser();
          cy.visit("/mes-projets");

          cy.get('[data-cy="client-projects"]')
            .contains("Projet Multi-Révisions")
            .closest('[data-cy="project-card"]')
            .within(() => {
              cy.get('[data-cy="request-revision"]').click();
            });

          if (i <= 2) {
            // Révisions gratuites (1-2)
            cy.get('[data-cy="revision-cost"]')
              .should("contain", "Gratuit");
            
            cy.get('[data-cy="revision-details"]')
              .type(`Révision gratuite ${i}`);
            
            cy.get('[data-cy="submit-revision"]').click();
            
            cy.get('[data-cy="revision-submitted"]', { timeout: 10000 })
              .should("be.visible");

          } else {
            // Révisions payantes (3+)
            cy.get('[data-cy="revision-cost"]')
              .should("contain", "50€")
              .should("contain", "Révision payante");

            if (i === 4) {
              // Quatrième révision - refuser le paiement
              cy.get('[data-cy="cancel-revision"]').click();
              
              cy.get('[data-cy="revision-cancelled"]')
                .should("be.visible")
                .should("contain", "Révision annulée");

            } else {
              // Troisième révision - accepter le paiement
              cy.get('[data-cy="revision-details"]')
                .type(`Révision payante ${i}`);
              
              cy.get('[data-cy="proceed-payment"]').click();
              cy.simulateStripePayment();
              
              cy.get('[data-cy="revision-paid"]', { timeout: 15000 })
                .should("be.visible");
            }
          }

          cy.wait(2000);
        }

        // Vérifier les métriques des révisions
        cy.loginAsAdmin();
        cy.visit(`/admin/projects/${projectId}/revisions`);

        cy.get('[data-cy="revision-history"]', { timeout: 10000 })
          .should("contain", "2 révisions gratuites")
          .should("contain", "1 révision payante")
          .should("contain", "1 révision annulée");
      });
    });
  });

  context("🚨 Processus d'Escalade", () => {
    it("devrait déclencher l'escalade automatique pour projets en retard", () => {
      // Créer un projet avec délai dépassé
      cy.loginAsAdmin();
      cy.visit("/admin/projets");

      // Simuler un projet en retard via API
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/create-overdue-project`,
        body: {
          title: "Projet en Retard",
          daysOverdue: 3,
          correctorId: "corrector_123"
        }
      });

      cy.reload();
      cy.wait(3000);

      // Vérifier l'escalade automatique
      cy.get('[data-cy="escalated-projects"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Projet en Retard")
        .should("contain", "3 jours de retard")
        .should("contain", "Escalade automatique");

      // Vérifier les notifications d'escalade
      cy.get('[data-cy="escalation-alerts"]')
        .should("contain", "1 projet escaladé")
        .should("contain", "Action requise");

      // Actions d'escalade disponibles
      cy.get('[data-cy="escalated-projects"]')
        .contains("Projet en Retard")
        .closest('[data-cy="escalation-row"]')
        .within(() => {
          cy.get('[data-cy="escalation-options"]').should("be.visible");
          cy.get('[data-cy="reassign-corrector"]').should("be.visible");
          cy.get('[data-cy="extend-deadline"]').should("be.visible");
          cy.get('[data-cy="contact-client"]').should("be.visible");
        });
    });

    it("devrait permettre la réassignation urgente avec compensation", () => {
      // Créer un projet problématique
      cy.createPaidProject("Projet Problématique").then((projectId) => {
        // Signaler un problème
        cy.loginAsAdmin();
        cy.visit(`/admin/projects/${projectId}`);

        cy.get('[data-cy="report-issue"]').click();
        cy.get('[data-cy="issue-type"]').select("corrector-unavailable");
        cy.get('[data-cy="issue-severity"]').select("urgent");
        cy.get('[data-cy="issue-description"]')
          .type("Le correcteur est indisponible pour raisons médicales. Réassignation urgente nécessaire.");

        cy.get('[data-cy="submit-issue"]').click();

        // Interface de réassignation urgente
        cy.get('[data-cy="urgent-reassignment"]', { timeout: 10000 })
          .should("be.visible");

        // Trouver un correcteur de remplacement
        cy.get('[data-cy="find-replacement"]').click();

        cy.get('[data-cy="available-correctors"]')
          .should("be.visible")
          .first()
          .within(() => {
            cy.get('[data-cy="corrector-availability"]')
              .should("contain", "Disponible");
            
            cy.get('[data-cy="select-corrector"]').click();
          });

        // Configuration de la compensation
        cy.get('[data-cy="compensation-modal"]', { timeout: 10000 })
          .should("be.visible");

        cy.get('[data-cy="original-corrector-compensation"]')
          .should("contain", "50%"); // Compensation partielle

        cy.get('[data-cy="replacement-corrector-bonus"]')
          .type("20"); // Bonus de 20% pour urgence

        cy.get('[data-cy="client-discount"]')
          .type("10"); // Réduction de 10% pour le client

        cy.get('[data-cy="confirm-reassignment"]').click();

        // Vérifications
        cy.get('[data-cy="reassignment-success"]', { timeout: 15000 })
          .should("be.visible")
          .should("contain", "Projet réassigné avec succès");

        // Vérifier les notifications automatiques
        cy.get('[data-cy="notifications-sent"]')
          .should("contain", "Client notifié")
          .should("contain", "Correcteur original notifié")
          .should("contain", "Nouveau correcteur notifié");

        // Vérifier le nouveau délai
        cy.get('[data-cy="updated-deadline"]')
          .should("be.visible")
          .should("contain", "Délai ajusté automatiquement");
      });
    });

    it("devrait gérer les litiges client avec processus de médiation", () => {
      cy.createPaidProject("Projet en Litige").then((projectId) => {
        // Simuler une livraison
        cy.loginAsAdmin();
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/admin/projects/${projectId}/deliver`,
          body: { deliveryNotes: "Livraison initiale" }
        });

        // Client ouvre un litige
        cy.loginAsUser();
        cy.visit("/mes-projets");

        cy.get('[data-cy="client-projects"]')
          .contains("Projet en Litige")
          .closest('[data-cy="project-card"]')
          .within(() => {
            cy.get('[data-cy="open-dispute"]').click();
          });

        cy.get('[data-cy="dispute-modal"]', { timeout: 10000 }).should("be.visible");

        cy.get('[data-cy="dispute-reason"]').select("quality-issues");
        cy.get('[data-cy="dispute-severity"]').select("major");
        cy.get('[data-cy="dispute-description"]')
          .type("La correction n'a pas respecté les consignes initiales. Plusieurs erreurs subsistent et le style demandé n'a pas été appliqué.");

        // Joindre des preuves
        cy.get('[data-cy="dispute-evidence"]')
          .selectFile("cypress/fixtures/dispute-evidence.pdf", { force: true });

        cy.get('[data-cy="requested-resolution"]').select("full-revision");
        cy.get('[data-cy="submit-dispute"]').click();

        // Processus de médiation côté admin
        cy.logout();
        cy.loginAsAdmin();
        cy.visit("/admin/litiges");

        cy.get('[data-cy="active-disputes"]', { timeout: 10000 })
          .should("contain", "Projet en Litige")
          .should("contain", "quality-issues")
          .should("contain", "Majeur");

        cy.get('[data-cy="active-disputes"]')
          .contains("Projet en Litige")
          .closest('[data-cy="dispute-row"]')
          .within(() => {
            cy.get('[data-cy="mediate-dispute"]').click();
          });

        // Interface de médiation
        cy.get('[data-cy="mediation-workspace"]', { timeout: 10000 })
          .should("be.visible");

        // Examiner les preuves
        cy.get('[data-cy="client-evidence"]')
          .should("contain", "dispute-evidence.pdf");

        cy.get('[data-cy="original-requirements"]')
          .should("be.visible");

        // Contacter le correcteur pour explications
        cy.get('[data-cy="request-corrector-response"]').click();

        cy.get('[data-cy="corrector-message"]')
          .type("Pouvez-vous nous expliquer votre approche de correction et répondre aux points soulevés par le client ?");

        cy.get('[data-cy="send-to-corrector"]').click();

        // Proposer une résolution
        cy.get('[data-cy="propose-resolution"]').click();

        cy.get('[data-cy="resolution-type"]').select("partial-revision");
        cy.get('[data-cy="resolution-details"]')
          .type("Nous proposons une révision ciblée des points soulevés par le client, sans frais supplémentaires. Délai: 5 jours ouvrés.");

        cy.get('[data-cy="corrector-compensation"]').type("75"); // 75% du tarif original
        cy.get('[data-cy="client-discount"]').type("0"); // Pas de réduction

        cy.get('[data-cy="submit-resolution"]').click();

        // Vérifier les notifications
        cy.get('[data-cy="resolution-sent"]', { timeout: 15000 })
          .should("be.visible")
          .should("contain", "Résolution proposée aux deux parties");

        // Simuler l'acceptation côté client
        cy.logout();
        cy.loginAsUser();
        cy.visit("/mes-projets");

        cy.get('[data-cy="pending-resolutions"]', { timeout: 10000 })
          .should("be.visible")
          .should("contain", "Résolution proposée");

        cy.get('[data-cy="accept-resolution"]').click();

        cy.get('[data-cy="resolution-accepted"]', { timeout: 10000 })
          .should("be.visible")
          .should("contain", "Résolution acceptée");
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