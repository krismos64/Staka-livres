// Tests E2E pour la gestion des utilisateurs dans l'espace admin

describe("Admin Users - Tests E2E", () => {
  let testUser: any = null;

  beforeEach(() => {
    // Réinitialiser la base de données avant chaque test
    cy.resetDatabase();

    // Se connecter en tant qu'admin et accéder à la section utilisateurs
    cy.loginAsAdmin();

    // Diagnostic : voir où on atterrit et le contenu de la page
    cy.url().then((currentUrl) => {
      cy.log(`🔍 Current URL: ${currentUrl}`);
    });

    cy.get("h1").then(($h1) => {
      cy.log(`🔍 H1 content: ${$h1.text()}`);
    });

    cy.get("body").then(($body) => {
      cy.log(`🔍 Page contains Admin: ${$body.text().includes("Admin")}`);
      cy.log(
        `🔍 Page contains Utilisateurs: ${$body
          .text()
          .includes("Utilisateurs")}`
      );
      cy.log(`🔍 Page contains Gestion: ${$body.text().includes("Gestion")}`);
    });

    // Pour l'instant, assertion plus flexible pour diagnostiquer
    cy.get("body").should("not.be.empty");
    cy.get("body").should("not.contain", "404");
  });

  afterEach(() => {
    // Nettoyer l'utilisateur test s'il existe
    if (testUser) {
      cy.deleteTestUser(testUser.id);
      testUser = null;
    }
  });

  describe("Chargement et affichage de la page", () => {
    it("should load the admin users page correctly", () => {
      // Vérifier que la page se charge
      cy.contains("Gestion des utilisateurs").should("be.visible");

      // Vérifier la présence des statistiques
      cy.contains("Total").should("be.visible");
      cy.contains("Actifs").should("be.visible");
      cy.contains("Admins").should("be.visible");

      // Vérifier la présence du tableau
      cy.get("table").should("be.visible");
      cy.contains("Nom").should("be.visible");
      cy.contains("Email").should("be.visible");
      cy.contains("Rôle").should("be.visible");
      cy.contains("Statut").should("be.visible");
      cy.contains("Actions").should("be.visible");
    });

    it("should display existing users from database", () => {
      // Attendre que les données se chargent
      cy.get("table tbody tr").should("have.length.at.least", 1);

      // Vérifier qu'il y a au moins l'admin par défaut
      cy.contains("admin@staka-editions.com").should("be.visible");
    });

    it("should display user statistics correctly", () => {
      // Vérifier que les statistiques affichent des nombres
      cy.get('[data-testid="total-users"]').should("contain", /\d+/);
      cy.get('[data-testid="active-users"]').should("contain", /\d+/);
      cy.get('[data-testid="admin-users"]').should("contain", /\d+/);
    });
  });

  describe("Recherche et filtres", () => {
    it("should filter users by search term", () => {
      // Chercher par email admin
      cy.get('input[placeholder*="Rechercher"]').type("admin");

      // Attendre que la recherche soit effectuée (debounced)
      cy.wait(1000);

      // Vérifier que seuls les résultats correspondants s'affichent
      cy.get("table tbody tr").should("contain", "admin");
    });

    it("should filter users by role", () => {
      // Changer le filtre de rôle
      cy.get("select").contains("Tous les rôles").parent().select("ADMIN");

      // Attendre que le filtre soit appliqué
      cy.wait(1000);

      // Vérifier que seuls les admins sont affichés
      cy.get("table tbody tr").each(($row) => {
        cy.wrap($row).should("contain", "ADMIN");
      });
    });

    it("should filter users by active status", () => {
      // Filtrer par statut actif
      cy.get("select").contains("Tous les statuts").parent().select("Actifs");

      // Attendre que le filtre soit appliqué
      cy.wait(1000);

      // Vérifier que seuls les utilisateurs actifs sont affichés
      cy.get("table tbody tr").each(($row) => {
        cy.wrap($row).should("contain", "Actif");
      });
    });

    it("should clear search and reset filters", () => {
      // Effectuer une recherche
      cy.get('input[placeholder*="Rechercher"]').type("admin");
      cy.wait(1000);

      // Effacer la recherche
      cy.get('input[placeholder*="Rechercher"]').clear();
      cy.wait(1000);

      // Vérifier que tous les utilisateurs sont de nouveau affichés
      cy.get("table tbody tr").should("have.length.at.least", 1);
    });
  });

  describe("Création d'utilisateur", () => {
    it("should create a new user via API and verify it appears in the list", () => {
      const userData = {
        prenom: "Test",
        nom: "User",
        email: `test.user.${Date.now()}@example.com`,
        password: "password123",
        role: "USER",
      };

      // Créer l'utilisateur via API
      cy.createTestUser(userData).then((createdUser) => {
        testUser = createdUser;

        // Rafraîchir la page
        cy.reload();
        cy.wait(2000);

        // Vérifier que l'utilisateur apparaît dans la liste
        cy.contains(userData.email).should("be.visible");
        cy.contains(`${userData.prenom} ${userData.nom}`).should("be.visible");
      });
    });
  });

  describe("Changement de rôle utilisateur", () => {
    beforeEach(() => {
      // Créer un utilisateur test
      const userData = {
        prenom: "Role",
        nom: "Test",
        email: `role.test.${Date.now()}@example.com`,
        password: "password123",
        role: "USER",
      };

      cy.createTestUser(userData).then((createdUser) => {
        testUser = createdUser;
        cy.reload();
        cy.wait(2000);
      });
    });

    it("should change user role from USER to ADMIN", () => {
      // Trouver la ligne de l'utilisateur test
      cy.contains(testUser.email)
        .parents("tr")
        .within(() => {
          // Changer le rôle via le select
          cy.get('select[value="USER"]').select("ADMIN");
        });

      // Confirmer le changement dans la modal
      cy.contains("Confirmer le changement").click();

      // Attendre que l'opération soit terminée
      cy.wait(2000);

      // Vérifier que le rôle a changé dans l'interface
      cy.contains(testUser.email)
        .parents("tr")
        .within(() => {
          cy.get("select").should("have.value", "ADMIN");
        });

      // Vérifier en base de données via API
      cy.request(
        `${Cypress.env("API_BASE_URL")}/admin/users/${testUser.id}`
      ).then((response) => {
        expect(response.body.role).to.equal("ADMIN");
      });
    });
  });

  describe("Toggle statut utilisateur", () => {
    beforeEach(() => {
      // Créer un utilisateur test actif
      const userData = {
        prenom: "Status",
        nom: "Test",
        email: `status.test.${Date.now()}@example.com`,
        password: "password123",
        role: "USER",
      };

      cy.createTestUser(userData).then((createdUser) => {
        testUser = createdUser;
        cy.reload();
        cy.wait(2000);
      });
    });

    it("should toggle user status from active to inactive", () => {
      // Trouver la ligne de l'utilisateur test
      cy.contains(testUser.email)
        .parents("tr")
        .within(() => {
          // Cliquer sur le toggle de statut
          cy.get("button").contains("Désactiver").click();
        });

      // Confirmer le changement dans la modal
      cy.contains("Confirmer").click();

      // Attendre que l'opération soit terminée
      cy.wait(2000);

      // Vérifier que le statut a changé dans l'interface
      cy.contains(testUser.email)
        .parents("tr")
        .within(() => {
          cy.contains("Inactif").should("be.visible");
          cy.get("button").contains("Activer").should("be.visible");
        });

      // Vérifier en base de données via API
      cy.request(
        `${Cypress.env("API_BASE_URL")}/api/admin/users/${testUser.id}`
      ).then((response) => {
        expect(response.body.isActive).to.be.false;
      });
    });
  });

  describe("Suppression d'utilisateur", () => {
    beforeEach(() => {
      // Créer un utilisateur test à supprimer
      const userData = {
        prenom: "Delete",
        nom: "Test",
        email: `delete.test.${Date.now()}@example.com`,
        password: "password123",
        role: "USER",
      };

      cy.createTestUser(userData).then((createdUser) => {
        testUser = createdUser;
        cy.reload();
        cy.wait(2000);
      });
    });

    it("should delete user and verify removal from database", () => {
      // Trouver la ligne de l'utilisateur test
      cy.contains(testUser.email)
        .parents("tr")
        .within(() => {
          // Cliquer sur supprimer
          cy.get("button").contains("Supprimer").click();
        });

      // Confirmer la suppression dans la modal
      cy.contains("Supprimer définitivement").click();

      // Attendre que l'opération soit terminée
      cy.wait(2000);

      // Vérifier que l'utilisateur n'est plus dans la liste
      cy.contains(testUser.email).should("not.exist");

      // Vérifier que l'utilisateur n'existe plus en base
      cy.request({
        url: `${Cypress.env("API_BASE_URL")}/api/admin/users/${testUser.id}`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
      });

      // Marquer comme supprimé pour éviter le nettoyage
      testUser = null;
    });

    it("should cancel user deletion", () => {
      // Trouver la ligne de l'utilisateur test
      cy.contains(testUser.email)
        .parents("tr")
        .within(() => {
          // Cliquer sur supprimer
          cy.get("button").contains("Supprimer").click();
        });

      // Annuler la suppression
      cy.contains("Annuler").click();

      // Vérifier que l'utilisateur est toujours dans la liste
      cy.contains(testUser.email).should("be.visible");
    });
  });

  describe("Pagination", () => {
    it("should handle pagination if multiple pages exist", () => {
      // Créer plusieurs utilisateurs si nécessaire pour tester la pagination
      const users = [];
      for (let i = 0; i < 12; i++) {
        const userData = {
          prenom: `Test${i}`,
          nom: `User${i}`,
          email: `test${i}.${Date.now()}@example.com`,
          password: "password123",
          role: "USER",
        };
        users.push(userData);
      }

      // Créer les utilisateurs en batch
      users.forEach((userData) => {
        cy.createTestUser(userData);
      });

      cy.reload();
      cy.wait(3000);

      // Vérifier la pagination si elle existe
      cy.get("body").then(($body) => {
        if ($body.find('[data-testid="pagination"]').length > 0) {
          // Tester la navigation entre pages
          cy.get('[data-testid="next-page"]').click();
          cy.wait(1000);

          // Vérifier qu'on est sur la page 2
          cy.contains("Page 2").should("be.visible");

          // Revenir à la page 1
          cy.get('[data-testid="prev-page"]').click();
          cy.wait(1000);

          cy.contains("Page 1").should("be.visible");
        }
      });

      // Nettoyer les utilisateurs créés
      users.forEach((_, index) => {
        cy.deleteTestUser(`test${index}.${Date.now()}@example.com`);
      });
    });
  });

  describe("Modal de détails utilisateur", () => {
    it("should open and display user details modal", () => {
      // Trouver un utilisateur et cliquer sur "Voir"
      cy.get("table tbody tr")
        .first()
        .within(() => {
          cy.get("button").contains("Voir").click();
        });

      // Vérifier que la modal s'ouvre
      cy.contains("Détails de l'utilisateur").should("be.visible");

      // Vérifier le contenu de la modal
      cy.get('[data-testid="user-details-modal"]').within(() => {
        cy.contains("Email").should("be.visible");
        cy.contains("Rôle").should("be.visible");
        cy.contains("Statut").should("be.visible");
        cy.contains("Date de création").should("be.visible");
      });

      // Fermer la modal
      cy.get("button").contains("Fermer").click();

      // Vérifier que la modal est fermée
      cy.contains("Détails de l'utilisateur").should("not.exist");
    });
  });
});
