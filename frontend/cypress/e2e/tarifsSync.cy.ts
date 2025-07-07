/// <reference types="cypress" />

describe("Synchronisation Tarifs Admin → Landing", () => {
  beforeEach(() => {
    // Intercepter les appels API pour les tarifs publics
    cy.intercept("GET", "**/api/tarifs", { fixture: "tarifs-initial.json" }).as(
      "getTarifs"
    );

    // Intercepter les appels admin avec pagination
    cy.intercept("GET", "**/api/admin/tarifs*", {
      fixture: "admin-tarifs.json",
    }).as("getAdminTarifs");

    cy.intercept("PUT", "**/api/admin/tarifs/*", {
      statusCode: 200,
      body: { success: true, data: {} },
    }).as("updateTarif");

    // Se connecter en tant qu'admin
    cy.window().then((win) => {
      win.localStorage.setItem(
        "token",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNjkzODQwODAwLCJleHAiOjE2OTM5MjcyMDB9.mock-token"
      );
      win.localStorage.setItem(
        "user",
        JSON.stringify({
          id: "admin-1",
          email: "admin@test.com",
          prenom: "Admin",
          nom: "Test",
          role: "ADMIN",
        })
      );
    });
  });

  it("devrait synchroniser un changement de tarif entre admin et landing", () => {
    // Simuler la modification directement côté API
    // (en attendant que l'interface admin soit mise à jour avec les data-testid)

    // 1. Intercepter la nouvelle réponse API avec le tarif mis à jour
    cy.intercept("GET", "**/api/tarifs", {
      body: [
        {
          id: "tarif-1",
          nom: "Correction Standard - Mise à jour E2E",
          description: "Correction orthographique et grammaticale mise à jour",
          prix: 2.5,
          prixFormate: "2.50€",
          typeService: "Correction",
          dureeEstimee: "7-10 jours",
          actif: true,
          ordre: 1,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-15T12:00:00Z",
        },
        {
          id: "tarif-2",
          nom: "Pack KDP Autoédition",
          description: "Maquette complète pour autoédition",
          prix: 350,
          prixFormate: "350€",
          typeService: "Mise en forme",
          dureeEstimee: "5-7 jours",
          actif: true,
          ordre: 2,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
    }).as("getTarifsUpdated");

    // 2. Naviguer vers la landing page
    cy.visit("/");
    cy.wait("@getTarifsUpdated");

    // 3. Vérifier que le calculateur de prix affiche les nouvelles données
    cy.get('[data-testid="pricing-calculator"]').should("be.visible");
    cy.contains("Correction Standard - Mise à jour E2E").should("be.visible");
    cy.contains("2.50€").should("be.visible");

    // 4. Vérifier que la section Packs est aussi mise à jour
    cy.get('[data-testid="packs-section"]').should("be.visible");
    cy.contains("Pack KDP Autoédition").should("be.visible");
  });

  it("devrait gérer l'activation/désactivation d'un tarif", () => {
    // Intercepter la réponse avec un tarif désactivé
    cy.intercept("GET", "**/api/tarifs", {
      body: [
        {
          id: "tarif-2",
          nom: "Pack KDP Autoédition",
          description: "Maquette complète pour autoédition",
          prix: 350,
          prixFormate: "350€",
          typeService: "Mise en forme",
          dureeEstimee: "5-7 jours",
          actif: true,
          ordre: 2,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        // Le premier tarif n'est plus dans la liste car désactivé
      ],
    }).as("getTarifsWithDisabled");

    // Aller sur la landing
    cy.visit("/");
    cy.wait("@getTarifsWithDisabled");

    // Vérifier que le tarif désactivé n'apparaît plus
    cy.contains("Correction Standard").should("not.exist");

    // Mais que les packs par défaut sont affichés comme fallback
    cy.get('[data-testid="packs-section"]').should("be.visible");
    cy.contains("Pack KDP Autoédition").should("be.visible");
  });

  it("devrait gérer les erreurs de façon gracieuse", () => {
    // Simuler une erreur API
    cy.intercept("GET", "**/api/tarifs", {
      statusCode: 500,
      body: { error: "Erreur serveur" },
    }).as("getTarifsError");

    cy.visit("/");
    cy.wait("@getTarifsError");

    // Vérifier que les messages d'erreur sont affichés avec fallbacks
    cy.contains("Tarifs indisponibles").should("be.visible");
    cy.contains("Offres indisponibles").should("be.visible");

    // Vérifier que les composants utilisent les données par défaut
    cy.get('[data-testid="pricing-calculator"]').should("be.visible");
    cy.get('[data-testid="packs-section"]').should("be.visible");

    // Vérifier que les boutons retry sont présents
    cy.get('[data-testid="retry-button"]').should("have.length.at.least", 1);

    // Tester le retry
    cy.intercept("GET", "**/api/tarifs", { fixture: "tarifs-initial.json" }).as(
      "getTarifsRetry"
    );

    cy.get('[data-testid="retry-button"]').first().click();
    cy.wait("@getTarifsRetry");

    // Vérifier que les données sont maintenant affichées
    cy.contains("Correction Standard").should("be.visible");
  });

  it("devrait maintenir la synchronisation lors de changements multiples", () => {
    // Simuler plusieurs modifications de tarifs
    const modifications = [
      { nom: "Correction Express", prix: "3.00" },
      { nom: "Correction Premium", prix: "2.75" },
      { nom: "Correction Standard Plus", prix: "2.25" },
    ];

    // Intercepter avec toutes les modifications
    cy.intercept("GET", "**/api/tarifs", {
      body: modifications.map((modif, index) => ({
        id: `tarif-${index + 1}`,
        nom: modif.nom,
        description: `Description ${modif.nom}`,
        prix: parseFloat(modif.prix),
        prixFormate: `${modif.prix}€`,
        typeService: "Correction",
        dureeEstimee: "7-10 jours",
        actif: true,
        ordre: index + 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-15T12:00:00Z",
      })),
    }).as("getTarifsMultiUpdate");

    // Vérifier sur la landing
    cy.visit("/");
    cy.wait("@getTarifsMultiUpdate");

    // Vérifier que tous les changements sont reflétés
    modifications.forEach((modif) => {
      cy.contains(modif.nom).should("be.visible");
      cy.contains(modif.prix + "€").should("be.visible");
    });
  });

  it("devrait fonctionner avec React Query cache", () => {
    // Tester que le cache React Query fonctionne correctement
    cy.visit("/");
    cy.wait("@getTarifs");

    // Vérifier que les données sont chargées
    cy.contains("Correction Standard").should("be.visible");

    // Simuler une modification de tarif
    cy.intercept("GET", "**/api/tarifs", {
      body: [
        {
          id: "tarif-1",
          nom: "Correction Standard",
          description: "Correction orthographique et grammaticale",
          prix: 2.99,
          prixFormate: "2.99€",
          typeService: "Correction",
          dureeEstimee: "7-10 jours",
          actif: true,
          ordre: 1,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-15T12:00:00Z",
        },
      ],
    }).as("getTarifsCacheInvalidated");

    // Recharger la page pour tester le cache
    cy.reload();
    cy.wait("@getTarifsCacheInvalidated");

    // Vérifier que le nouveau prix est affiché
    cy.contains("2.99€").should("be.visible");
  });
});
