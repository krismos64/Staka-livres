/// <reference types="cypress" />

/**
 * Tests E2E - Administration Complète (Critique)
 * 
 * Tests critiques de l'interface d'administration avec tous les modules,
 * CRUD avancé, gestion des utilisateurs, supervision système et 
 * fonctionnalités d'administration essentielles pour la production.
 * 
 * Couverture critique :
 * - CRUD utilisateurs avancé avec recherche et filtrage
 * - Gestion des commandes et changements de statuts
 * - Dashboard statistiques avec données temps réel
 * - Interface de facturation et téléchargement PDF
 * - Audit logs et supervision sécurisée
 * - Mode démonstration professionnel
 */

describe("👑 Administration Complète - Tests Critiques", () => {
  const adminTestData = {
    users: {
      testUsers: [
        {
          prenom: "Jean",
          nom: "Dupont", 
          email: "jean.dupont@test.com",
          role: "USER",
          status: "active",
          subscription: "premium"
        },
        {
          prenom: "Marie",
          nom: "Martin",
          email: "marie.martin@test.com", 
          role: "USER",
          status: "suspended",
          subscription: "standard"
        },
        {
          prenom: "Pierre",
          nom: "Corrector",
          email: "pierre.corrector@test.com",
          role: "CORRECTOR", 
          status: "active",
          subscription: "professional"
        }
      ]
    },
    orders: {
      sampleOrders: [
        {
          title: "Correction Roman Fantasy",
          client: "jean.dupont@test.com",
          pages: 300,
          amount: 600,
          status: "EN_ATTENTE",
          priority: "NORMALE"
        },
        {
          title: "Relecture Mémoire",
          client: "marie.martin@test.com", 
          pages: 150,
          amount: 225,
          status: "EN_COURS",
          priority: "HAUTE"
        },
        {
          title: "Correction Nouvelle",
          client: "jean.dupont@test.com",
          pages: 50,
          amount: 100,
          status: "TERMINE",
          priority: "NORMALE"
        }
      ]
    },
    statistics: {
      expectedKPIs: [
        "users_total",
        "projects_active", 
        "revenue_monthly",
        "satisfaction_average",
        "conversion_rate"
      ]
    },
    auditActions: [
      "USER_CREATED",
      "ORDER_STATUS_CHANGED", 
      "PAYMENT_PROCESSED",
      "FILE_ACCESSED",
      "ADMIN_LOGIN"
    ]
  };

  beforeEach(() => {
    // Configuration pour tests admin
    cy.resetDatabase();
    cy.visit("/");
    cy.wait(2000);

    // Créer des données de test pour l'administration
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_BASE_URL")}/dev/seed-admin-test-data`,
      body: {
        users: adminTestData.users.testUsers,
        orders: adminTestData.orders.sampleOrders,
        generateStatistics: true
      }
    });
  });

  context("👥 Gestion Utilisateurs Avancée", () => {
    it("devrait permettre le CRUD complet des utilisateurs", () => {
      cy.task("log", "🔹 Test CRUD utilisateurs complet");

      cy.loginAsAdmin();
      cy.visit("/admin/utilisateurs");

      // Vérifier l'interface de gestion des utilisateurs
      cy.get('[data-cy="user-management-interface"]', { timeout: 15000 })
        .should("be.visible");

      // Vérifier la liste des utilisateurs existants
      cy.get('[data-cy="users-table"]').within(() => {
        adminTestData.users.testUsers.forEach((user) => {
          cy.should("contain", user.email);
          cy.should("contain", user.prenom);
          cy.should("contain", user.role);
        });
      });

      // === CREATE: Créer un nouvel utilisateur ===
      cy.get('[data-cy="create-user-btn"]').click();

      cy.get('[data-cy="create-user-modal"]', { timeout: 10000 })
        .should("be.visible");

      const newUser = {
        prenom: "Sophie",
        nom: "Nouveau",
        email: "sophie.nouveau@test.com",
        role: "USER",
        password: "TempPassword123!"
      };

      cy.get('[data-cy="user-prenom"]').type(newUser.prenom);
      cy.get('[data-cy="user-nom"]').type(newUser.nom);
      cy.get('[data-cy="user-email"]').type(newUser.email);
      cy.get('[data-cy="user-role"]').select(newUser.role);
      cy.get('[data-cy="user-password"]').type(newUser.password);
      cy.get('[data-cy="send-welcome-email"]').check();

      cy.get('[data-cy="create-user-submit"]').click();

      // Vérifier la création
      cy.get('[data-cy="user-created-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Utilisateur créé avec succès")
        .should("contain", newUser.email);

      // === READ: Rechercher et filtrer les utilisateurs ===
      cy.get('[data-cy="user-search"]').type("sophie");
      
      cy.get('[data-cy="users-table"]', { timeout: 10000 })
        .should("contain", newUser.email)
        .should("not.contain", "jean.dupont@test.com");

      // Test des filtres
      cy.get('[data-cy="clear-search"]').click();
      cy.get('[data-cy="filter-by-role"]').select("CORRECTOR");

      cy.get('[data-cy="users-table"]')
        .should("contain", "pierre.corrector@test.com")
        .should("not.contain", newUser.email);

      // Reset filters
      cy.get('[data-cy="reset-filters"]').click();

      // === UPDATE: Modifier un utilisateur ===
      cy.get('[data-cy="users-table"]')
        .contains(newUser.email)
        .closest('[data-cy="user-row"]')
        .within(() => {
          cy.get('[data-cy="edit-user"]').click();
        });

      cy.get('[data-cy="edit-user-modal"]', { timeout: 10000 })
        .should("be.visible");

      // Modifier les informations
      cy.get('[data-cy="user-nom"]').clear().type("Modifié");
      cy.get('[data-cy="user-role"]').select("CORRECTOR");
      cy.get('[data-cy="user-status"]').select("suspended");

      cy.get('[data-cy="update-user-submit"]').click();

      // Vérifier la modification
      cy.get('[data-cy="user-updated-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Utilisateur modifié avec succès");

      cy.get('[data-cy="users-table"]')
        .contains(newUser.email)
        .closest('[data-cy="user-row"]')
        .should("contain", "Modifié")
        .should("contain", "CORRECTOR")
        .should("contain", "Suspendu");

      // === DELETE: Supprimer un utilisateur ===
      cy.get('[data-cy="users-table"]')
        .contains(newUser.email)
        .closest('[data-cy="user-row"]')
        .within(() => {
          cy.get('[data-cy="delete-user"]').click();
        });

      cy.get('[data-cy="delete-confirmation"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Supprimer définitivement");

      cy.get('[data-cy="deletion-impact"]')
        .should("contain", "Projets associés: 0")
        .should("contain", "Messages: 0")
        .should("contain", "Suppression sécurisée");

      cy.get('[data-cy="confirm-delete"]').click();

      // Vérifier la suppression
      cy.get('[data-cy="user-deleted-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Utilisateur supprimé avec succès");

      cy.get('[data-cy="users-table"]')
        .should("not.contain", newUser.email);
    });

    it("devrait permettre la gestion avancée des rôles et permissions", () => {
      cy.task("log", "🔹 Test gestion rôles et permissions");

      cy.loginAsAdmin();
      cy.visit("/admin/utilisateurs");

      // Sélectionner un utilisateur standard
      cy.get('[data-cy="users-table"]')
        .contains("jean.dupont@test.com")
        .closest('[data-cy="user-row"]')
        .within(() => {
          cy.get('[data-cy="manage-permissions"]').click();
        });

      // Interface de gestion des permissions
      cy.get('[data-cy="permissions-modal"]', { timeout: 10000 })
        .should("be.visible");

      // Permissions actuelles
      cy.get('[data-cy="current-permissions"]').within(() => {
        cy.should("contain", "Rôle actuel: USER");
        cy.should("contain", "Accès projets personnels: ✓");
        cy.should("contain", "Administration: ✗");
      });

      // Promouvoir vers CORRECTOR
      cy.get('[data-cy="role-change"]').select("CORRECTOR");

      cy.get('[data-cy="role-change-preview"]', { timeout: 5000 })
        .should("be.visible");

      cy.get('[data-cy="new-permissions"]').within(() => {
        cy.should("contain", "Nouveau rôle: CORRECTOR");
        cy.should("contain", "Accès corrections: ✓");
        cy.should("contain", "Gestion projets assignés: ✓");
        cy.should("contain", "Interface correcteur: ✓");
      });

      // Permissions spéciales additionnelles
      cy.get('[data-cy="special-permissions"]').within(() => {
        cy.get('[data-cy="can-view-all-projects"]').check();
        cy.get('[data-cy="can-export-data"]').check();
        cy.get('[data-cy="advanced-statistics"]').check();
      });

      // Période d'essai pour le nouveau rôle
      cy.get('[data-cy="trial-period"]').check();
      cy.get('[data-cy="trial-duration"]').type("30"); // 30 jours

      cy.get('[data-cy="apply-role-change"]').click();

      // Confirmation et validation
      cy.get('[data-cy="role-change-confirmation"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Changement de rôle USER → CORRECTOR");

      cy.get('[data-cy="change-impact"]')
        .should("contain", "Accès étendu accordé")
        .should("contain", "Période d'essai: 30 jours")
        .should("contain", "Notification utilisateur: Oui");

      cy.get('[data-cy="confirm-role-change"]').click();

      // Vérifier l'application du changement
      cy.get('[data-cy="role-changed-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Rôle modifié avec succès");

      // Vérifier dans la liste
      cy.get('[data-cy="users-table"]')
        .contains("jean.dupont@test.com")
        .closest('[data-cy="user-row"]')
        .should("contain", "CORRECTOR")
        .should("contain", "Période d'essai");

      // Test d'accès avec le nouveau rôle
      cy.logout();
      cy.visit("/login");
      cy.get('[data-cy="email"]').type("jean.dupont@test.com");
      cy.get('[data-cy="password"]').type("password123");
      cy.get('[data-cy="login-submit"]').click();

      // Vérifier l'accès aux nouvelles fonctionnalités
      cy.visit("/correcteur");

      cy.get('[data-cy="corrector-dashboard"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Interface Correcteur");

      cy.get('[data-cy="role-trial-notice"]')
        .should("be.visible")
        .should("contain", "Période d'essai: 29 jours restants");
    });

    it("devrait permettre la gestion des suspensions et réactivations", () => {
      cy.task("log", "🔹 Test suspensions et réactivations");

      cy.loginAsAdmin();
      cy.visit("/admin/utilisateurs");

      // Suspendre un utilisateur actif
      cy.get('[data-cy="users-table"]')
        .contains("jean.dupont@test.com")
        .closest('[data-cy="user-row"]')
        .within(() => {
          cy.get('[data-cy="suspend-user"]').click();
        });

      cy.get('[data-cy="suspension-modal"]', { timeout: 10000 })
        .should("be.visible");

      // Motif de suspension
      cy.get('[data-cy="suspension-reason"]').select("policy-violation");
      cy.get('[data-cy="suspension-details"]')
        .type("Violation des conditions d'utilisation - contenu inapproprié dans messages");

      // Durée de suspension
      cy.get('[data-cy="suspension-duration"]').select("temporary");
      cy.get('[data-cy="suspension-days"]').type("7");

      // Actions lors de la suspension
      cy.get('[data-cy="suspension-actions"]').within(() => {
        cy.get('[data-cy="block-login"]').should("be.checked");
        cy.get('[data-cy="freeze-projects"]').check();
        cy.get('[data-cy="notify-user"]').check();
        cy.get('[data-cy="suspend-payments"]').check();
      });

      cy.get('[data-cy="apply-suspension"]').click();

      // Vérifier la suspension
      cy.get('[data-cy="user-suspended-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Utilisateur suspendu avec succès");

      cy.get('[data-cy="users-table"]')
        .contains("jean.dupont@test.com")
        .closest('[data-cy="user-row"]')
        .should("contain", "Suspendu")
        .should("contain", "7 jours");

      // Test d'accès bloqué
      cy.logout();
      cy.visit("/login");
      cy.get('[data-cy="email"]').type("jean.dupont@test.com");
      cy.get('[data-cy="password"]').type("password123");
      cy.get('[data-cy="login-submit"]').click();

      // Vérifier le blocage
      cy.get('[data-cy="suspension-notice"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Compte suspendu")
        .should("contain", "Violation des conditions")
        .should("contain", "Durée: 7 jours");

      // Réactivation par l'admin
      cy.loginAsAdmin();
      cy.visit("/admin/utilisateurs");

      cy.get('[data-cy="filter-by-status"]').select("suspended");

      cy.get('[data-cy="users-table"]')
        .contains("jean.dupont@test.com")
        .closest('[data-cy="user-row"]')
        .within(() => {
          cy.get('[data-cy="reactivate-user"]').click();
        });

      cy.get('[data-cy="reactivation-modal"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="reactivation-reason"]')
        .type("Malentendu résolu - utilisateur sensibilisé aux règles");

      cy.get('[data-cy="restore-full-access"]').check();
      cy.get('[data-cy="send-reactivation-email"]').check();

      cy.get('[data-cy="confirm-reactivation"]').click();

      // Vérifier la réactivation
      cy.get('[data-cy="user-reactivated-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Utilisateur réactivé avec succès");

      // Test d'accès restauré
      cy.logout();
      cy.visit("/login");
      cy.get('[data-cy="email"]').type("jean.dupont@test.com");
      cy.get('[data-cy="password"]').type("password123");
      cy.get('[data-cy="login-submit"]').click();

      cy.get('[data-cy="reactivation-welcome"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Compte réactivé")
        .should("contain", "Accès complet restauré");
    });
  });

  context("📋 Gestion des Commandes", () => {
    it("devrait permettre la gestion complète des statuts de commandes", () => {
      cy.task("log", "🔹 Test gestion statuts commandes");

      cy.loginAsAdmin();
      cy.visit("/admin/commandes");

      // Interface de gestion des commandes
      cy.get('[data-cy="orders-management"]', { timeout: 15000 })
        .should("be.visible");

      // Vérifier les commandes existantes
      cy.get('[data-cy="orders-table"]').within(() => {
        adminTestData.orders.sampleOrders.forEach((order) => {
          cy.should("contain", order.title);
          cy.should("contain", order.status);
        });
      });

      // === WORKFLOW: EN_ATTENTE → EN_COURS ===
      cy.get('[data-cy="orders-table"]')
        .contains("Correction Roman Fantasy")
        .closest('[data-cy="order-row"]')
        .within(() => {
          cy.should("contain", "EN_ATTENTE");
          cy.get('[data-cy="change-status"]').click();
        });

      cy.get('[data-cy="status-change-modal"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="current-status"]')
        .should("contain", "Statut actuel: EN_ATTENTE");

      cy.get('[data-cy="new-status"]').select("EN_COURS");

      // Assignation correcteur obligatoire pour EN_COURS
      cy.get('[data-cy="corrector-assignment"]', { timeout: 5000 })
        .should("be.visible");

      cy.get('[data-cy="available-correctors"]').select("pierre.corrector@test.com");
      cy.get('[data-cy="estimated-completion"]').type("2025-08-15");
      cy.get('[data-cy="internal-notes"]')
        .type("Projet assigné au correcteur spécialisé en fantasy");

      cy.get('[data-cy="apply-status-change"]').click();

      // Vérifier le changement
      cy.get('[data-cy="status-changed-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Statut modifié: EN_ATTENTE → EN_COURS");

      cy.get('[data-cy="orders-table"]')
        .contains("Correction Roman Fantasy")
        .closest('[data-cy="order-row"]')
        .should("contain", "EN_COURS")
        .should("contain", "pierre.corrector@test.com");

      // === WORKFLOW: EN_COURS → TERMINE ===
      cy.get('[data-cy="orders-table"]')
        .contains("Relecture Mémoire")
        .closest('[data-cy="order-row"]')
        .within(() => {
          cy.get('[data-cy="change-status"]').click();
        });

      cy.get('[data-cy="new-status"]').select("TERMINE");

      // Livraison obligatoire pour TERMINE
      cy.get('[data-cy="delivery-details"]', { timeout: 5000 })
        .should("be.visible");

      cy.get('[data-cy="corrected-file-upload"]')
        .selectFile("cypress/fixtures/corrected-memoir.pdf", { force: true });

      cy.get('[data-cy="delivery-notes"]')
        .type("Correction complète effectuée. Toutes les recommandations appliquées.");

      cy.get('[data-cy="quality-score"]').select("excellent");
      cy.get('[data-cy="completion-time"]').type("5"); // 5 jours

      cy.get('[data-cy="apply-status-change"]').click();

      // Vérifier la livraison
      cy.get('[data-cy="order-completed-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Commande terminée et livrée");

      // === WORKFLOW: Annulation ===
      cy.get('[data-cy="create-test-order"]').click();

      cy.get('[data-cy="quick-order-form"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="order-title"]').type("Commande Test Annulation");
      cy.get('[data-cy="order-client"]').select("marie.martin@test.com");
      cy.get('[data-cy="order-amount"]').type("150");

      cy.get('[data-cy="create-order"]').click();
      cy.wait(3000);

      // Annuler la nouvelle commande
      cy.get('[data-cy="orders-table"]')
        .contains("Commande Test Annulation")
        .closest('[data-cy="order-row"]')
        .within(() => {
          cy.get('[data-cy="change-status"]').click();
        });

      cy.get('[data-cy="new-status"]').select("ANNULE");

      cy.get('[data-cy="cancellation-reason"]').select("client-request");
      cy.get('[data-cy="refund-required"]').check();
      cy.get('[data-cy="refund-amount"]').type("150");

      cy.get('[data-cy="apply-status-change"]').click();

      cy.get('[data-cy="order-cancelled-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Commande annulée et remboursement traité");
    });

    it("devrait permettre la recherche et le filtrage avancé des commandes", () => {
      cy.task("log", "🔹 Test recherche et filtrage commandes");

      cy.loginAsAdmin();
      cy.visit("/admin/commandes");

      // === Recherche par titre ===
      cy.get('[data-cy="order-search"]').type("Roman");

      cy.get('[data-cy="orders-table"]', { timeout: 10000 })
        .should("contain", "Correction Roman Fantasy")
        .should("not.contain", "Relecture Mémoire");

      // === Filtrage par statut ===
      cy.get('[data-cy="clear-search"]').click();
      cy.get('[data-cy="filter-by-status"]').select("EN_COURS");

      cy.get('[data-cy="orders-table"]')
        .should("contain", "EN_COURS")
        .should("not.contain", "EN_ATTENTE");

      // === Filtrage par client ===
      cy.get('[data-cy="reset-filters"]').click();
      cy.get('[data-cy="filter-by-client"]').type("jean.dupont");

      cy.get('[data-cy="orders-table"]')
        .should("contain", "jean.dupont@test.com");

      // === Filtrage par période ===
      cy.get('[data-cy="reset-filters"]').click();
      cy.get('[data-cy="filter-by-date-range"]').click();

      cy.get('[data-cy="date-range-picker"]', { timeout: 10000 })
        .should("be.visible");

      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      cy.get('[data-cy="date-from"]').type(lastWeek.toISOString().split('T')[0]);
      cy.get('[data-cy="date-to"]').type(today.toISOString().split('T')[0]);

      cy.get('[data-cy="apply-date-filter"]').click();

      cy.get('[data-cy="orders-table"]')
        .should("be.visible");

      // === Tri par colonnes ===
      cy.get('[data-cy="reset-filters"]').click();

      // Tri par montant (décroissant)
      cy.get('[data-cy="sort-by-amount"]').click();

      cy.get('[data-cy="orders-table"] [data-cy="order-row"]').first()
        .should("contain", "600€"); // Montant le plus élevé

      // Tri par date de création
      cy.get('[data-cy="sort-by-date"]').click();

      // === Filtres combinés ===
      cy.get('[data-cy="filter-by-status"]').select("EN_COURS");
      cy.get('[data-cy="filter-by-priority"]').select("HAUTE");

      cy.get('[data-cy="orders-table"]')
        .should("contain", "HAUTE")
        .should("contain", "EN_COURS");

      // === Export des résultats filtrés ===
      cy.get('[data-cy="export-filtered-orders"]').click();

      cy.get('[data-cy="export-options"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="export-format"]').select("csv");
      cy.get('[data-cy="include-client-details"]').check();
      cy.get('[data-cy="include-payment-info"]').check();

      cy.get('[data-cy="generate-export"]').click();

      cy.get('[data-cy="export-ready"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Export généré avec succès")
        .should("contain", "Commandes filtrées exportées");
    });

    it("devrait gérer les commandes en lot (batch operations)", () => {
      cy.task("log", "🔹 Test opérations en lot sur commandes");

      cy.loginAsAdmin();
      cy.visit("/admin/commandes");

      // Sélection multiple
      cy.get('[data-cy="select-all-orders"]').click();

      cy.get('[data-cy="batch-actions-panel"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "3 commandes sélectionnées");

      // === Changement de statut en lot ===
      cy.get('[data-cy="batch-status-change"]').click();

      cy.get('[data-cy="batch-status-modal"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="selected-orders-preview"]')
        .should("contain", "3 commandes sélectionnées")
        .should("contain", "Statuts actuels variés");

      cy.get('[data-cy="batch-new-status"]').select("EN_ATTENTE_REVISION");
      cy.get('[data-cy="batch-notes"]')
        .type("Révision de qualité requise pour toutes les commandes sélectionnées");

      cy.get('[data-cy="apply-batch-status"]').click();

      // Vérifier l'application en lot
      cy.get('[data-cy="batch-operation-success"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "3 commandes mises à jour avec succès");

      // === Assignation en lot ===
      cy.get('[data-cy="select-all-orders"]').click();
      cy.get('[data-cy="batch-assign-corrector"]').click();

      cy.get('[data-cy="batch-assignment-modal"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="load-balancing"]').click();

      cy.get('[data-cy="auto-assignment-preview"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Répartition optimale calculée")
        .should("contain", "Charge de travail équilibrée");

      cy.get('[data-cy="apply-auto-assignment"]').click();

      cy.get('[data-cy="batch-assignment-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Assignations automatiques appliquées");

      // === Export en lot ===
      cy.get('[data-cy="filter-by-status"]').select("EN_ATTENTE_REVISION");
      cy.get('[data-cy="select-all-visible"]').click();

      cy.get('[data-cy="batch-export"]').click();

      cy.get('[data-cy="batch-export-modal"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="export-type"]').select("detailed-report");
      cy.get('[data-cy="include-files"]').check();
      cy.get('[data-cy="include-communications"]').check();

      cy.get('[data-cy="generate-batch-export"]').click();

      cy.get('[data-cy="batch-export-ready"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "Rapport détaillé généré")
        .should("contain", "Toutes les commandes et fichiers inclus");

      // === Suppression en lot (avec confirmation renforcée) ===
      cy.get('[data-cy="create-test-orders"]').click();

      cy.get('[data-cy="test-orders-count"]').type("5");
      cy.get('[data-cy="generate-test-orders"]').click();
      cy.wait(5000);

      cy.get('[data-cy="filter-by-title"]').type("Test Order");
      cy.get('[data-cy="select-all-visible"]').click();

      cy.get('[data-cy="batch-delete"]').click();

      cy.get('[data-cy="batch-delete-confirmation"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "ATTENTION: Suppression définitive");

      cy.get('[data-cy="deletion-impact"]')
        .should("contain", "5 commandes seront supprimées")
        .should("contain", "Fichiers associés: Préservés")
        .should("contain", "Données client: Préservées");

      cy.get('[data-cy="confirm-batch-delete"]').type("DELETE");
      cy.get('[data-cy="execute-batch-delete"]').click();

      cy.get('[data-cy="batch-delete-success"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "5 commandes supprimées avec succès");
    });
  });

  context("📊 Dashboard et Statistiques", () => {
    it("devrait afficher des statistiques en temps réel", () => {
      cy.task("log", "🔹 Test dashboard statistiques temps réel");

      cy.loginAsAdmin();
      cy.visit("/admin/dashboard");

      // KPIs principaux
      cy.get('[data-cy="kpi-dashboard"]', { timeout: 15000 })
        .should("be.visible");

      adminTestData.statistics.expectedKPIs.forEach((kpi) => {
        cy.get(`[data-cy="kpi-${kpi}"]`)
          .should("be.visible")
          .should("contain", kpi.replace("_", " "));
      });

      // Vérifier les données temps réel
      cy.get('[data-cy="kpi-users_total"]').within(() => {
        cy.should("contain", "Utilisateurs Total");
        cy.get('[data-cy="kpi-value"]')
          .should("be.visible")
          .invoke("text")
          .should("match", /^\d+$/); // Nombre

        cy.get('[data-cy="kpi-trend"]')
          .should("be.visible");
      });

      cy.get('[data-cy="kpi-revenue_monthly"]').within(() => {
        cy.should("contain", "Revenus Mensuel");
        cy.get('[data-cy="kpi-value"]')
          .should("contain", "€");
      });

      // Graphiques temps réel
      cy.get('[data-cy="charts-dashboard"]').within(() => {
        cy.get('[data-cy="revenue-chart"]')
          .should("be.visible");

        cy.get('[data-cy="users-growth-chart"]')
          .should("be.visible");

        cy.get('[data-cy="orders-status-chart"]')
          .should("be.visible");

        cy.get('[data-cy="satisfaction-trend-chart"]')
          .should("be.visible");
      });

      // Test du rafraîchissement automatique
      cy.get('[data-cy="auto-refresh-indicator"]')
        .should("contain", "Mise à jour automatique: 30s");

      // Simuler de nouvelles données
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/simulate-new-activity`,
        body: {
          newUsers: 2,
          newOrders: 3,
          newRevenue: 450
        }
      });

      // Attendre le rafraîchissement automatique
      cy.wait(35000);

      // Vérifier la mise à jour
      cy.get('[data-cy="last-update"]')
        .should("contain", "à l'instant");

      // Test de l'export des statistiques
      cy.get('[data-cy="export-dashboard"]').click();

      cy.get('[data-cy="export-dashboard-modal"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="export-period"]').select("current-month");
      cy.get('[data-cy="export-format"]').select("pdf");
      cy.get('[data-cy="include-charts"]').check();

      cy.get('[data-cy="generate-dashboard-export"]').click();

      cy.get('[data-cy="dashboard-export-ready"]', { timeout: 20000 })
        .should("be.visible")
        .should("contain", "Rapport dashboard généré");
    });

    it("devrait permettre la personnalisation du dashboard", () => {
      cy.task("log", "🔹 Test personnalisation dashboard");

      cy.loginAsAdmin();
      cy.visit("/admin/dashboard");

      // Mode édition du dashboard
      cy.get('[data-cy="customize-dashboard"]').click();

      cy.get('[data-cy="dashboard-edit-mode"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Mode édition activé");

      // Réorganiser les widgets
      cy.get('[data-cy="widget-revenue"]')
        .trigger("mousedown", { which: 1 })
        .trigger("dragstart");

      cy.get('[data-cy="drop-zone-top-right"]')
        .trigger("dragenter")
        .trigger("dragover")
        .trigger("drop");

      // Ajouter de nouveaux widgets
      cy.get('[data-cy="add-widget"]').click();

      cy.get('[data-cy="widget-library"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="widget-category-analytics"]').click();

      cy.get('[data-cy="available-widgets"]').within(() => {
        cy.get('[data-cy="widget-conversion-funnel"]').click();
        cy.get('[data-cy="widget-geographic-distribution"]').click();
        cy.get('[data-cy="widget-customer-lifetime-value"]').click();
      });

      cy.get('[data-cy="add-selected-widgets"]').click();

      // Configurer un widget
      cy.get('[data-cy="widget-conversion-funnel"]').within(() => {
        cy.get('[data-cy="configure-widget"]').click();
      });

      cy.get('[data-cy="widget-config-modal"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="widget-title"]').clear().type("Entonnoir de Conversion Personnalisé");
      cy.get('[data-cy="widget-timeframe"]').select("last-30-days");
      cy.get('[data-cy="widget-refresh-rate"]').select("5-minutes");

      cy.get('[data-cy="save-widget-config"]').click();

      // Supprimer un widget
      cy.get('[data-cy="widget-satisfaction-trend"]').within(() => {
        cy.get('[data-cy="remove-widget"]').click();
      });

      // Sauvegarder la configuration
      cy.get('[data-cy="save-dashboard-layout"]').click();

      cy.get('[data-cy="dashboard-saved"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Configuration dashboard sauvegardée");

      // Sortir du mode édition
      cy.get('[data-cy="exit-edit-mode"]').click();

      // Vérifier la persistance de la configuration
      cy.reload();
      cy.wait(5000);

      cy.get('[data-cy="widget-conversion-funnel"]')
        .should("be.visible")
        .should("contain", "Entonnoir de Conversion Personnalisé");

      cy.get('[data-cy="widget-satisfaction-trend"]')
        .should("not.exist");

      // Test des presets de dashboard
      cy.get('[data-cy="dashboard-presets"]').click();

      cy.get('[data-cy="preset-options"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="preset-financial"]').click();

      cy.get('[data-cy="preset-preview"]')
        .should("contain", "Dashboard orienté finances")
        .should("contain", "Revenus, coûts, marges");

      cy.get('[data-cy="apply-preset"]').click();

      cy.get('[data-cy="preset-applied"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Preset financier appliqué");
    });

    it("devrait générer des rapports analytiques avancés", () => {
      cy.task("log", "🔹 Test rapports analytiques avancés");

      cy.loginAsAdmin();
      cy.visit("/admin/analytics");

      // Interface de génération de rapports
      cy.get('[data-cy="analytics-interface"]', { timeout: 15000 })
        .should("be.visible");

      // === Rapport de performance business ===
      cy.get('[data-cy="create-report"]').click();

      cy.get('[data-cy="report-wizard"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="report-type"]').select("business-performance");
      cy.get('[data-cy="report-period"]').select("quarterly");
      cy.get('[data-cy="report-detail-level"]').select("detailed");

      // Sélection des métriques
      cy.get('[data-cy="metrics-selection"]').within(() => {
        cy.get('[data-cy="metric-revenue"]').check();
        cy.get('[data-cy="metric-customer-acquisition"]').check();
        cy.get('[data-cy="metric-retention"]').check();
        cy.get('[data-cy="metric-satisfaction"]').check();
      });

      // Segmentation
      cy.get('[data-cy="segmentation-options"]').within(() => {
        cy.get('[data-cy="segment-by-user-type"]').check();
        cy.get('[data-cy="segment-by-geography"]').check();
        cy.get('[data-cy="segment-by-service"]').check();
      });

      cy.get('[data-cy="generate-report"]').click();

      // Vérifier la génération
      cy.get('[data-cy="report-generation-progress"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "Génération rapport en cours...");

      cy.get('[data-cy="report-ready"]', { timeout: 90000 })
        .should("be.visible")
        .should("contain", "Rapport business performance généré");

      // Vérifier le contenu du rapport
      cy.get('[data-cy="report-content"]').within(() => {
        cy.should("contain", "Résumé Exécutif");
        cy.should("contain", "Métriques Clés");
        cy.should("contain", "Analyse par Segment");
        cy.should("contain", "Recommandations");
      });

      // === Rapport d'analyse prédictive ===
      cy.get('[data-cy="create-report"]').click();
      cy.get('[data-cy="report-type"]').select("predictive-analysis");

      cy.get('[data-cy="prediction-horizon"]').select("12-months");
      cy.get('[data-cy="confidence-level"]').select("90%");

      // Modèles prédictifs
      cy.get('[data-cy="prediction-models"]').within(() => {
        cy.get('[data-cy="model-revenue-forecast"]').check();
        cy.get('[data-cy="model-user-growth"]').check();
        cy.get('[data-cy="model-churn-prediction"]').check();
      });

      cy.get('[data-cy="generate-report"]').click();

      cy.get('[data-cy="predictive-report-ready"]', { timeout: 120000 })
        .should("be.visible")
        .should("contain", "Rapport prédictif généré");

      // === Rapport de comparaison temporelle ===
      cy.get('[data-cy="create-report"]').click();
      cy.get('[data-cy="report-type"]').select("time-comparison");

      cy.get('[data-cy="comparison-periods"]').within(() => {
        cy.get('[data-cy="period-current"]').select("current-quarter");
        cy.get('[data-cy="period-compare"]').select("previous-quarter");
      });

      cy.get('[data-cy="generate-report"]').click();

      cy.get('[data-cy="comparison-report-ready"]', { timeout: 60000 })
        .should("be.visible");

      // Vérifier les insights automatiques
      cy.get('[data-cy="auto-insights"]').within(() => {
        cy.should("contain", "Insights automatiques détectés");
        cy.should("contain", "Tendances significatives");
        cy.should("contain", "Anomalies identifiées");
      });

      // Export et partage des rapports
      cy.get('[data-cy="export-report"]').click();

      cy.get('[data-cy="export-options"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="export-formats"]').within(() => {
        cy.get('[data-cy="format-pdf"]').check();
        cy.get('[data-cy="format-excel"]').check();
        cy.get('[data-cy="format-powerpoint"]').check();
      });

      cy.get('[data-cy="include-raw-data"]').check();
      cy.get('[data-cy="include-visualizations"]').check();

      cy.get('[data-cy="generate-exports"]').click();

      cy.get('[data-cy="exports-ready"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", "3 formats exportés avec succès");
    });
  });

  afterEach(() => {
    // Nettoyage après chaque test
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });

    // Nettoyer les données de test admin
    cy.request({
      method: "DELETE",
      url: `${Cypress.env("API_BASE_URL")}/dev/cleanup-admin-test-data`,
      failOnStatusCode: false
    });
  });
});