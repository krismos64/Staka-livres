// Tests E2E pour la gestion des moyens de paiement

describe("Payment Methods - Tests E2E", () => {
  beforeEach(() => {
    // Réinitialiser la base de données avant chaque test
    cy.resetDatabase();
  });

  it("Ajout d'un nouveau moyen de paiement - Workflow complet", () => {
    cy.log("🔵 Test d'ajout d'un nouveau moyen de paiement");
    
    // ===== ÉTAPE 1: CONNEXION UTILISATEUR =====
    cy.loginAsUser();
    cy.visit("/app/billing");
    cy.wait(2000);
    
    // Vérifier qu'on est bien sur la page facturation
    cy.contains("Facturation", { timeout: 10000 }).should("be.visible");
    cy.log("✅ Utilisateur connecté sur la page facturation");

    // ===== ÉTAPE 2: ACCÈS À LA SECTION MOYENS DE PAIEMENT =====
    cy.log("🔵 ÉTAPE 2: Accès à la section moyens de paiement");
    
    // Vérifier la présence de la section moyens de paiement
    cy.contains("Moyens de paiement", { timeout: 10000 }).should("be.visible");
    
    // Vérifier la présence du bouton "Ajouter une carte"
    cy.get('[data-cy="add-payment-method-btn"]', { timeout: 10000 })
      .should("be.visible")
      .should("contain", "Ajouter une carte");
    
    cy.log("✅ Section moyens de paiement accessible");

    // ===== ÉTAPE 3: OUVERTURE DU MODAL D'AJOUT =====
    cy.log("🔵 ÉTAPE 3: Ouverture du modal d'ajout de carte");
    
    // Cliquer sur le bouton "Ajouter une carte"
    cy.get('[data-cy="add-payment-method-btn"]').click();
    cy.wait(1000);
    
    // Vérifier que le modal s'ouvre
    cy.get('[data-cy="add-payment-modal"]', { timeout: 10000 })
      .should("be.visible");
    
    // Vérifier le titre du modal
    cy.contains("Ajouter une carte").should("be.visible");
    cy.contains("Ajoutez un nouveau moyen de paiement").should("be.visible");
    
    cy.log("✅ Modal d'ajout de carte ouvert");

    // ===== ÉTAPE 4: VÉRIFICATION DES ÉLÉMENTS DU FORMULAIRE =====
    cy.log("🔵 ÉTAPE 4: Vérification des éléments du formulaire");
    
    // Vérifier la présence des champs de carte (mode mock)
    cy.get('[data-cy="card-number-input"]', { timeout: 5000 })
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
    cy.contains("Les données ne sont pas traitées").should("be.visible");
    
    // Vérifier le message de sécurité
    cy.contains("Vos données sont sécurisées").should("be.visible");
    cy.contains("chiffrement SSL 256-bit").should("be.visible");
    
    cy.log("✅ Tous les éléments du formulaire sont présents");

    // ===== ÉTAPE 5: REMPLISSAGE DU FORMULAIRE =====
    cy.log("🔵 ÉTAPE 5: Remplissage du formulaire de carte");
    
    // Remplir les informations de carte (mode mock)
    cy.get('[data-cy="card-number-input"]').type("4242 4242 4242 4242");
    cy.get('[data-cy="card-expiry-input"]').type("12/25");
    cy.get('[data-cy="card-cvc-input"]').type("123");
    cy.get('[data-cy="card-name-input"]').type("John Doe Test");
    
    cy.log("✅ Formulaire de carte rempli");

    // ===== ÉTAPE 6: SOUMISSION DU FORMULAIRE =====
    cy.log("🔵 ÉTAPE 6: Soumission du formulaire");
    
    // Vérifier que le bouton de soumission est actif
    cy.get('[data-cy="add-card-submit-btn"]')
      .should("be.visible")
      .should("not.be.disabled")
      .should("contain", "Ajouter la carte");
    
    // Soumettre le formulaire
    cy.get('[data-cy="add-card-submit-btn"]').click();
    
    // Vérifier l'état de traitement
    cy.get('[data-cy="add-card-submit-btn"]', { timeout: 2000 })
      .should("contain", "Ajout en cours...")
      .should("be.disabled");
    
    cy.log("✅ Formulaire soumis, traitement en cours");

    // ===== ÉTAPE 7: VÉRIFICATION DU SUCCÈS =====
    cy.log("🔵 ÉTAPE 7: Vérification du succès de l'ajout");
    
    // Attendre la confirmation de succès (toast)
    cy.contains("Carte ajoutée", { timeout: 15000 }).should("be.visible");
    cy.contains("Votre carte de paiement a été ajoutée avec succès", { timeout: 5000 })
      .should("be.visible");
    
    // Vérifier que le modal se ferme
    cy.get('[data-cy="add-payment-modal"]', { timeout: 5000 })
      .should("not.exist");
    
    cy.log("✅ Ajout de carte réussi, modal fermé");

    // ===== ÉTAPE 8: VÉRIFICATION DE LA LISTE MISE À JOUR =====
    cy.log("🔵 ÉTAPE 8: Vérification de la liste des moyens de paiement");
    
    // Attendre le rechargement de la liste
    cy.wait(2000);
    
    // Vérifier qu'une nouvelle carte apparaît dans la liste
    cy.get('[data-cy="payment-methods-list"]', { timeout: 10000 })
      .should("be.visible");
    
    // Vérifier la présence de la carte ajoutée (mode mock - derniers 4 chiffres: 4242)
    cy.contains("•••• 4242", { timeout: 10000 }).should("be.visible");
    cy.contains("Visa").should("be.visible");
    cy.contains("12/25").should("be.visible");
    
    cy.log("✅ Nouvelle carte visible dans la liste");

    // ===== ÉTAPE 9: TEST DES ACTIONS SUR LA CARTE =====
    cy.log("🔵 ÉTAPE 9: Test des actions sur la nouvelle carte");
    
    // Vérifier les boutons d'action (par défaut, supprimer)
    cy.get('[data-cy="payment-methods-list"]').within(() => {
      cy.contains("•••• 4242")
        .parent()
        .parent()
        .within(() => {
          // Bouton pour définir par défaut
          cy.get('[data-cy="set-default-btn"]', { timeout: 5000 })
            .should("be.visible");
          
          // Bouton de suppression
          cy.get('[data-cy="delete-payment-method-btn"]')
            .should("be.visible");
        });
    });
    
    cy.log("✅ Actions disponibles sur la nouvelle carte");

    // ===== VALIDATION FINALE =====
    cy.log("🟢 AJOUT DE MOYEN DE PAIEMENT VALIDÉ AVEC SUCCÈS !");
    cy.log("✅ Modal ouvert → Formulaire rempli → Carte ajoutée → Liste mise à jour");
  });

  it("Définir une carte comme moyen de paiement par défaut", () => {
    cy.log("🔵 Test de définition d'une carte par défaut");
    
    // Pre-créer une carte via API pour gagner du temps
    cy.createTestPaymentMethod().then(() => {
      cy.loginAsUser();
      cy.visit("/app/billing");
      cy.wait(2000);
      
      // Cliquer sur "Définir par défaut"
      cy.get('[data-cy="set-default-btn"]').first().click();
      
      // Vérifier la confirmation
      cy.contains("Moyen de paiement mis à jour", { timeout: 10000 })
        .should("be.visible");
      
      // Vérifier l'indicateur "Par défaut"
      cy.contains("Par défaut", { timeout: 5000 }).should("be.visible");
      
      cy.log("✅ Carte définie comme moyen de paiement par défaut");
    });
  });

  it("Suppression d'un moyen de paiement", () => {
    cy.log("🔵 Test de suppression d'un moyen de paiement");
    
    // Pre-créer une carte via API
    cy.createTestPaymentMethod().then(() => {
      cy.loginAsUser();
      cy.visit("/app/billing");
      cy.wait(2000);
      
      // Cliquer sur supprimer
      cy.get('[data-cy="delete-payment-method-btn"]').first().click();
      
      // Confirmer la suppression dans la boîte de dialogue
      cy.on('window:confirm', () => true);
      
      // Vérifier la confirmation
      cy.contains("Moyen de paiement supprimé", { timeout: 10000 })
        .should("be.visible");
      
      // Vérifier que la carte a disparu de la liste
      cy.get('[data-cy="payment-methods-list"]').within(() => {
        cy.contains("•••• 4242").should("not.exist");
      });
      
      cy.log("✅ Moyen de paiement supprimé avec succès");
    });
  });

  it("Gestion des erreurs - Setup Intent échoue", () => {
    cy.log("🔵 Test de gestion d'erreur lors de la création du Setup Intent");
    
    // Simuler une erreur de Setup Intent via interception
    cy.intercept('POST', '**/payment-methods/setup-intent', {
      statusCode: 500,
      body: { error: 'Erreur serveur lors de la création du Setup Intent' }
    }).as('setupIntentError');
    
    cy.loginAsUser();
    cy.visit("/app/billing");
    
    // Tenter d'ouvrir le modal d'ajout
    cy.get('[data-cy="add-payment-method-btn"]').click();
    cy.wait('@setupIntentError');
    
    // Vérifier que l'erreur est affichée
    cy.contains("Erreur d'initialisation", { timeout: 10000 })
      .should("be.visible");
    
    // Vérifier que le modal se ferme
    cy.get('[data-cy="add-payment-modal"]').should("not.exist");
    
    cy.log("✅ Erreur Setup Intent gérée correctement");
  });

  it("Fermeture du modal avec échap et bouton fermer", () => {
    cy.log("🔵 Test de fermeture du modal");
    
    cy.loginAsUser();
    cy.visit("/app/billing");
    
    // Ouvrir le modal
    cy.get('[data-cy="add-payment-method-btn"]').click();
    cy.get('[data-cy="add-payment-modal"]').should("be.visible");
    
    // Test fermeture avec bouton X
    cy.get('[data-cy="close-modal-btn"]').click();
    cy.get('[data-cy="add-payment-modal"]').should("not.exist");
    
    // Rouvrir le modal
    cy.get('[data-cy="add-payment-method-btn"]').click();
    cy.get('[data-cy="add-payment-modal"]').should("be.visible");
    
    // Test fermeture avec Échap
    cy.get('body').type('{esc}');
    cy.get('[data-cy="add-payment-modal"]').should("not.exist");
    
    // Test fermeture avec bouton Annuler
    cy.get('[data-cy="add-payment-method-btn"]').click();
    cy.get('[data-cy="cancel-btn"]').click();
    cy.get('[data-cy="add-payment-modal"]').should("not.exist");
    
    cy.log("✅ Toutes les méthodes de fermeture fonctionnent");
  });

  it("Validation du formulaire - Champs requis", () => {
    cy.log("🔵 Test de validation du formulaire");
    
    cy.loginAsUser();
    cy.visit("/app/billing");
    
    // Ouvrir le modal
    cy.get('[data-cy="add-payment-method-btn"]').click();
    
    // Essayer de soumettre sans remplir
    cy.get('[data-cy="add-card-submit-btn"]').should("be.disabled");
    
    // Remplir partiellement
    cy.get('[data-cy="card-number-input"]').type("4242");
    cy.get('[data-cy="add-card-submit-btn"]').should("be.disabled");
    
    // Remplir complètement
    cy.get('[data-cy="card-number-input"]').clear().type("4242 4242 4242 4242");
    cy.get('[data-cy="card-expiry-input"]').type("12/25");
    cy.get('[data-cy="card-cvc-input"]').type("123");
    cy.get('[data-cy="card-name-input"]').type("John Doe");
    
    // Le bouton devrait maintenant être actif
    cy.get('[data-cy="add-card-submit-btn"]').should("not.be.disabled");
    
    cy.log("✅ Validation du formulaire fonctionne");
  });

  it("États vides - Aucun moyen de paiement", () => {
    cy.log("🔵 Test de l'état vide (aucun moyen de paiement)");
    
    cy.loginAsUser();
    cy.visit("/app/billing");
    cy.wait(2000);
    
    // Vérifier l'état vide
    cy.contains("Aucun moyen de paiement", { timeout: 10000 })
      .should("be.visible");
    
    cy.contains("Vous n'avez pas encore ajouté de moyen de paiement")
      .should("be.visible");
    
    // Le bouton d'ajout devrait toujours être présent
    cy.get('[data-cy="add-payment-method-btn"]').should("be.visible");
    
    cy.log("✅ État vide affiché correctement");
  });
});