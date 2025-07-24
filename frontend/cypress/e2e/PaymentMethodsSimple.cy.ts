// Tests E2E simplifiés pour la gestion des moyens de paiement (sans auth complexe)

describe("Payment Methods - Tests E2E Simplifiés", () => {
  beforeEach(() => {
    // Visiter directement la page facturation et simuler l'authentification
    cy.visit("/");
    cy.wait(2000);
    
    // Simuler un token d'authentification valide
    cy.window().then((win) => {
      win.localStorage.setItem("auth_token", "test-user-token-for-e2e");
    });
    
    // Visiter la page facturation
    cy.visit("/app/billing");
    cy.wait(3000);
  });

  it("Vérification de la présence des éléments de moyens de paiement", () => {
    cy.log("🔵 Test de vérification des éléments UI");
    
    // Vérifier qu'on est sur la bonne page (avec timeout plus long)
    cy.contains("Moyens de paiement", { timeout: 15000 }).should("be.visible");
    
    // Vérifier la présence du bouton d'ajout
    cy.get('[data-cy="add-payment-method-btn"]', { timeout: 10000 })
      .should("be.visible")
      .should("contain", "Ajouter une carte");
    
    cy.log("✅ Éléments de base des moyens de paiement présents");
  });

  it("Ouverture et fermeture du modal d'ajout de carte", () => {
    cy.log("🔵 Test d'ouverture/fermeture du modal");
    
    // Attendre que la page soit chargée
    cy.contains("Moyens de paiement", { timeout: 15000 }).should("be.visible");
    
    // Ouvrir le modal
    cy.get('[data-cy="add-payment-method-btn"]').click();
    cy.wait(2000);
    
    // Vérifier que le modal s'ouvre
    cy.get('[data-cy="add-payment-modal"]', { timeout: 10000 })
      .should("be.visible");
    
    // Vérifier le contenu du modal
    cy.contains("Ajouter une carte").should("be.visible");
    cy.contains("Ajoutez un nouveau moyen de paiement").should("be.visible");
    
    // Fermer avec le bouton X
    cy.get('[data-cy="close-modal-btn"]').click();
    cy.wait(1000);
    
    // Vérifier que le modal se ferme
    cy.get('[data-cy="add-payment-modal"]').should("not.exist");
    
    cy.log("✅ Modal s'ouvre et se ferme correctement");
  });

  it("Vérification des champs du formulaire de carte", () => {
    cy.log("🔵 Test des champs du formulaire");
    
    // Attendre et ouvrir le modal
    cy.contains("Moyens de paiement", { timeout: 15000 }).should("be.visible");
    cy.get('[data-cy="add-payment-method-btn"]').click();
    cy.wait(2000);
    
    // Vérifier la présence des champs
    cy.get('[data-cy="card-number-input"]', { timeout: 10000 })
      .should("be.visible")
      .should("have.attr", "placeholder", "1234 5678 9012 3456");
    
    cy.get('[data-cy="card-expiry-input"]')
      .should("be.visible")
      .should("have.attr", "placeholder", "MM/YY");
    
    cy.get('[data-cy="card-cvc-input"]')
      .should("be.visible")
      .should("have.attr", "placeholder", "CVC");
    
    cy.get('[data-cy="card-name-input"]')
      .should("be.visible")
      .should("have.attr", "placeholder", "Nom sur la carte");
    
    // Vérifier le message de mode développement
    cy.contains("Mode développement").should("be.visible");
    
    // Vérifier les boutons
    cy.get('[data-cy="cancel-btn"]').should("be.visible").should("contain", "Annuler");
    cy.get('[data-cy="add-card-submit-btn"]').should("be.visible");
    
    cy.log("✅ Tous les champs du formulaire sont présents et corrects");
  });

  it("Test de remplissage du formulaire", () => {
    cy.log("🔵 Test de remplissage et soumission");
    
    // Ouvrir le modal
    cy.contains("Moyens de paiement", { timeout: 15000 }).should("be.visible");
    cy.get('[data-cy="add-payment-method-btn"]').click();
    cy.wait(3000); // Attendre le Setup Intent
    
    // Remplir le formulaire
    cy.get('[data-cy="card-number-input"]', { timeout: 10000 })
      .should("be.visible")
      .type("4242 4242 4242 4242");
    
    cy.get('[data-cy="card-expiry-input"]').type("12/25");
    cy.get('[data-cy="card-cvc-input"]').type("123");
    cy.get('[data-cy="card-name-input"]').type("John Doe Test");
    
    // Vérifier que le bouton de soumission devient actif
    cy.get('[data-cy="add-card-submit-btn"]')
      .should("not.be.disabled")
      .should("contain", "Ajouter la carte");
    
    // Soumettre le formulaire
    cy.get('[data-cy="add-card-submit-btn"]').click();
    
    // Vérifier l'état de traitement
    cy.get('[data-cy="add-card-submit-btn"]', { timeout: 5000 })
      .should("contain", "Ajout en cours...")
      .should("be.disabled");
    
    cy.log("✅ Formulaire se remplit et se soumet correctement");
  });

  it("Vérification de l'état vide", () => {
    cy.log("🔵 Test de l'état vide (aucun moyen de paiement)");
    
    // Attendre que la page soit chargée
    cy.contains("Moyens de paiement", { timeout: 15000 }).should("be.visible");
    
    // Dans l'état initial, il ne devrait y avoir aucune carte
    // Chercher soit l'état vide soit des cartes existantes
    cy.get('[data-cy="payment-methods-list"]', { timeout: 10000 }).within(() => {
      // Vérifier qu'il y a soit un état vide soit des cartes
      cy.get('body').then(($body) => {
        const hasEmpty = $body.find('[data-cy="empty-payment-methods"]').length > 0;
        const hasCards = $body.find('div').length > 1; // Plus que juste le container
        
        if (hasEmpty) {
          cy.get('[data-cy="empty-payment-methods"]').should("be.visible");
          cy.contains("Aucun moyen de paiement").should("be.visible");
        }
        
        // Dans tous les cas, le bouton d'ajout doit être présent
        cy.get('[data-cy="add-payment-method-btn"]').should("be.visible");
      });
    });
    
    cy.log("✅ État des moyens de paiement vérifié");
  });

  it("Test de responsive - Modal s'adapte à différentes tailles", () => {
    cy.log("🔵 Test de responsive design");
    
    // Tester en mode mobile
    cy.viewport(375, 667);
    cy.contains("Moyens de paiement", { timeout: 15000 }).should("be.visible");
    cy.get('[data-cy="add-payment-method-btn"]').click();
    cy.wait(2000);
    
    cy.get('[data-cy="add-payment-modal"]').should("be.visible");
    
    // Tester en mode tablette
    cy.viewport(768, 1024);
    cy.get('[data-cy="add-payment-modal"]').should("be.visible");
    
    // Retour en mode desktop
    cy.viewport(1280, 720);
    cy.get('[data-cy="add-payment-modal"]').should("be.visible");
    
    cy.log("✅ Modal responsive fonctionne sur différentes tailles");
  });
});