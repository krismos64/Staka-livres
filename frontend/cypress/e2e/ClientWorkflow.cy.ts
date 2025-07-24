// Tests E2E pour le workflow complet client : Projet → Paiement → Admin

describe("Client Workflow - Tests E2E Complet", () => {
  let testProjectId: string;
  let testProjectTitle: string;

  beforeEach(() => {
    // Réinitialiser la base de données avant chaque test
    cy.resetDatabase();
    
    // Générer un titre de projet unique pour ce test
    testProjectTitle = `Manuscrit E2E Test ${Date.now()}`;
  });

  it("Workflow complet : Utilisateur créé projet → Paiement → Admin traite → Livraison", () => {
    
    // ===== ÉTAPE 1: CONNEXION UTILISATEUR =====
    cy.log("🔵 ÉTAPE 1: Connexion utilisateur client");
    
    cy.loginAsUser();
    cy.visit("/app/projects");
    cy.wait(2000);
    
    // Vérifier qu'on est bien sur la page projets
    cy.contains("Mes Projets", { timeout: 10000 }).should("be.visible");
    cy.log("✅ Utilisateur connecté et sur la page projets");

    // ===== ÉTAPE 2: CRÉATION DU PROJET =====
    cy.log("🔵 ÉTAPE 2: Création d'un nouveau projet");
    
    // Cliquer sur "Nouveau projet"
    cy.contains("Nouveau projet", { timeout: 10000 }).click();
    cy.wait(1000);
    
    // Remplir le formulaire de création de projet
    cy.get('[data-cy="project-title"]', { timeout: 10000 })
      .should("be.visible")
      .type(testProjectTitle);
    
    // Sélectionner le type de manuscrit
    cy.get('[data-cy="project-type"]').select("Roman");
    
    // Saisir le nombre de pages
    cy.get('[data-cy="project-pages"]').type("150");
    
    // Sélectionner un pack (Pack Intégral)
    cy.get('[data-cy="pack-integral"]').click();
    
    // Ajouter une description
    cy.get('[data-cy="project-description"]')
      .type("Test E2E - Roman de 150 pages pour validation du workflow complet");
    
    // Simuler l'upload d'un fichier (optionnel selon l'implémentation)
    cy.get('[data-cy="file-upload"]', { timeout: 5000 }).then(($input) => {
      if ($input.length > 0) {
        // Créer un fichier fictif pour le test
        const fileName = 'test-manuscript.docx';
        cy.fixture('test-manuscript.docx', 'base64').then(fileContent => {
          cy.get('[data-cy="file-upload"]').attachFile({
            fileContent,
            fileName,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
        });
      }
    });
    
    // Soumettre le formulaire de création
    cy.get('[data-cy="create-project-submit"]').click();
    cy.wait(2000);
    
    // Vérifier que le projet a été créé
    cy.contains(testProjectTitle, { timeout: 10000 }).should("be.visible");
    cy.contains("EN_ATTENTE", { timeout: 5000 }).should("be.visible");
    cy.log("✅ Projet créé avec succès - Statut: EN_ATTENTE");

    // ===== ÉTAPE 3: PROCESSUS DE PAIEMENT =====
    cy.log("🔵 ÉTAPE 3: Processus de paiement");
    
    // Cliquer sur "Payer" ou accéder au paiement
    cy.contains("Payer", { timeout: 10000 }).click();
    cy.wait(2000);
    
    // Vérifier que le modal de paiement s'ouvre
    cy.get('[data-cy="payment-modal"]', { timeout: 10000 })
      .should("be.visible");
    
    // Vérifier les détails du paiement
    cy.contains("Pack Intégral").should("be.visible");
    cy.contains("300€").should("be.visible"); // 150 pages × 2€
    
    // Simuler le paiement Stripe (mode test)
    cy.simulateStripePayment();
    
    // Attendre la confirmation de paiement
    cy.contains("Paiement confirmé", { timeout: 15000 }).should("be.visible");
    cy.log("✅ Paiement traité avec succès");
    
    // Vérifier que le statut du projet a changé
    cy.visit("/app/projects");
    cy.wait(2000);
    cy.contains(testProjectTitle).should("be.visible");
    cy.contains("EN_COURS", { timeout: 10000 }).should("be.visible");
    cy.log("✅ Statut projet mis à jour: EN_COURS");

    // ===== ÉTAPE 4: VÉRIFICATION CÔTÉ ADMIN =====
    cy.log("🔵 ÉTAPE 4: Vérification côté administrateur");
    
    // Déconnexion utilisateur et connexion admin
    cy.logout();
    cy.loginAsAdmin();
    
    // Naviguer vers la gestion des commandes
    cy.visit("/admin/commandes");
    cy.wait(3000);
    
    // Vérifier que le projet apparaît dans la liste admin
    cy.contains(testProjectTitle, { timeout: 10000 }).should("be.visible");
    cy.contains("EN_COURS").should("be.visible");
    cy.log("✅ Projet visible côté admin avec statut EN_COURS");
    
    // Traiter le projet (changer le statut vers TERMINE)
    cy.contains(testProjectTitle)
      .parent()
      .within(() => {
        // Cliquer sur le sélecteur de statut
        cy.get('[data-cy="status-select"]', { timeout: 5000 }).select("TERMINE");
      });
    
    // Confirmer le changement de statut
    cy.contains("Statut mis à jour", { timeout: 10000 }).should("be.visible");
    cy.log("✅ Statut projet mis à jour par admin: TERMINÉ");
    
    // Ajouter une note de correction (optionnel)
    cy.contains(testProjectTitle)
      .parent()
      .within(() => {
        cy.get('[data-cy="corrector-notes"]', { timeout: 5000 }).then(($notes) => {
          if ($notes.length > 0) {
            cy.get('[data-cy="corrector-notes"]')
              .type("Correction terminée. Manuscrit relu et corrigé selon les standards.");
          }
        });
      });

    // ===== ÉTAPE 5: VÉRIFICATION CÔTÉ CLIENT =====
    cy.log("🔵 ÉTAPE 5: Vérification livraison côté client");
    
    // Déconnexion admin et reconnexion utilisateur
    cy.logout();
    cy.loginAsUser();
    
    // Retourner sur les projets
    cy.visit("/app/projects");
    cy.wait(2000);
    
    // Vérifier que le projet est maintenant terminé
    cy.contains(testProjectTitle, { timeout: 10000 }).should("be.visible");
    cy.contains("TERMINE", { timeout: 10000 }).should("be.visible");
    cy.log("✅ Statut final visible côté client: TERMINÉ");
    
    // Vérifier que le téléchargement est disponible
    cy.contains(testProjectTitle)
      .parent()
      .within(() => {
        cy.get('[data-cy="download-button"]', { timeout: 5000 }).should("be.visible");
        cy.get('[data-cy="download-button"]').should("not.be.disabled");
      });
    
    cy.log("✅ Bouton de téléchargement disponible");

    // ===== ÉTAPE 6: VÉRIFICATION FACTURE =====
    cy.log("🔵 ÉTAPE 6: Vérification facture générée");
    
    // Aller sur la page facturation
    cy.visit("/app/billing");
    cy.wait(2000);
    
    // Vérifier qu'une facture a été générée pour ce projet
    cy.contains("Facture", { timeout: 10000 }).should("be.visible");
    cy.contains("300€").should("be.visible");
    cy.contains("Pack Intégral").should("be.visible");
    
    // Vérifier les détails de facturation spécifiques au projet
    cy.get('[data-cy="invoice-list"]').within(() => {
      cy.contains(testProjectTitle).should("be.visible");
      cy.contains("Payée").should("be.visible");
    });
    
    cy.log("✅ Facture générée et visible avec détails du projet");

    // ===== VALIDATION FINALE =====
    cy.log("🟢 WORKFLOW COMPLET VALIDÉ AVEC SUCCÈS !");
    cy.log("✅ Projet créé → Paiement traité → Admin a traité → Client peut télécharger");
  });

  it("Workflow avec échec de paiement", () => {
    cy.log("🔵 Test du workflow avec échec de paiement");
    
    // Connexion et création de projet
    cy.loginAsUser();
    cy.visit("/app/projects");
    cy.contains("Nouveau projet").click();
    
    // Création rapide d'un projet
    cy.get('[data-cy="project-title"]').type(`Projet Échec Paiement ${Date.now()}`);
    cy.get('[data-cy="project-type"]').select("Nouvelle");
    cy.get('[data-cy="project-pages"]').type("50");
    cy.get('[data-cy="pack-correction"]').click();
    cy.get('[data-cy="create-project-submit"]').click();
    
    // Simuler un échec de paiement
    cy.contains("Payer").click();
    cy.simulateStripePaymentFailure();
    
    // Vérifier que le projet reste en attente
    cy.visit("/app/projects");
    cy.contains("EN_ATTENTE").should("be.visible");
    cy.log("✅ Échec paiement géré - Projet reste EN_ATTENTE");
  });

  it("Workflow admin : Modification de statut et notifications", () => {
    cy.log("🔵 Test des fonctionnalités avancées admin");
    
    // Pre-créer un projet payé via API pour gagner du temps
    cy.createPaidProject(testProjectTitle).then((projectId) => {
      testProjectId = projectId;
      
      // Se connecter en admin
      cy.loginAsAdmin();
      cy.visit("/admin/commandes");
      
      // Tester plusieurs changements de statut
      const statuses = ["SUSPENDUE", "EN_COURS", "TERMINE"];
      
      statuses.forEach((status, index) => {
        cy.contains(testProjectTitle)
          .parent()
          .within(() => {
            cy.get('[data-cy="status-select"]').select(status);
          });
        
        cy.wait(1000);
        cy.log(`✅ Statut changé vers: ${status}`);
      });
      
      // Vérifier les notifications admin
      cy.visit("/admin/notifications");
      cy.contains("Nouveau paiement", { timeout: 5000 }).should("be.visible");
    });
  });
});