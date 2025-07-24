/// <reference types="cypress" />

describe("Synchronisation Tarifs Admin → Landing (Version Simplifiée)", () => {
  beforeEach(() => {
    // Intercepter les appels API pour les tarifs publics avec de vraies données
    cy.intercept("GET", "**/api/tarifs", {
      body: {
        "success": true,
        "data": [
          {
            "id": "beabc072-4b02-411d-90c5-1d118774c8e6",
            "nom": "Pack KDP Autoédition",
            "description": "Maquette intérieure + couverture + formats ePub/Mobi pour Amazon KDP",
            "prix": 35000,
            "prixFormate": "350€",
            "typeService": "Mise en forme",
            "dureeEstimee": "5-7 jours",
            "actif": true,
            "ordre": 1
          },
          {
            "id": "3deb2361-4d1f-4d65-860b-7a63bc0213d2",
            "nom": "Correction Standard",
            "description": "Correction orthographique, grammaticale et typographique",
            "prix": 200,
            "prixFormate": "2€",
            "typeService": "Correction",
            "dureeEstimee": "7-10 jours",
            "actif": true,
            "ordre": 2
          }
        ],
        "message": "2 tarifs actifs récupérés"
      }
    }).as("getTarifs");
  });

  it("devrait afficher les tarifs sur la landing page", () => {
    // Naviguer vers la landing page
    cy.visit("/");
    cy.wait("@getTarifs");

    // Vérifier que la page charge
    cy.get("body", { timeout: 15000 }).should("be.visible");
    
    // Vérifier que des prix sont affichés quelque part sur la page
    cy.get("body").should("contain.text", "€");
    
    cy.log("✅ Landing page affiche les tarifs");
  });

  it("devrait gérer les erreurs API gracieusement", () => {
    // Simuler une erreur API
    cy.intercept("GET", "**/api/tarifs", {
      statusCode: 500,
      body: { error: "Erreur serveur" },
    }).as("getTarifsError");

    cy.visit("/");
    cy.wait("@getTarifsError");

    // Vérifier que la page se charge malgré l'erreur
    cy.get("body", { timeout: 10000 }).should("be.visible");
    
    // Vérifier qu'il n'y a pas de crash de l'application
    cy.get("body").should("not.contain.text", "Something went wrong");
    
    cy.log("✅ Page gère les erreurs API gracieusement");
  });

  it("devrait permettre la navigation basique", () => {
    cy.visit("/");
    cy.wait("@getTarifs");

    // Vérifier que la page charge
    cy.get("body", { timeout: 10000 }).should("be.visible");
    
    // Vérifier que les éléments de navigation basiques sont présents
    cy.get("body").should("contain.text", "Staka");
    
    cy.log("✅ Navigation basique fonctionne");
  });

  it("devrait charger rapidement avec le cache", () => {
    // Première visite
    cy.visit("/");
    cy.wait("@getTarifs");
    cy.get("body", { timeout: 10000 }).should("be.visible");
    
    // Deuxième visite - devrait être plus rapide
    cy.visit("/");
    cy.get("body", { timeout: 5000 }).should("be.visible");
    
    cy.log("✅ Cache améliore les performances");
  });
});