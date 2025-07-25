/// <reference types="cypress" />

/**
 * Tests E2E - Workflows Métier Avancés (Intégration)
 * 
 * Tests d'intégration approfondis des workflows métier avec scénarios complexes,
 * performances et cas d'usage réels nécessitant un backend complet.
 * 
 * Couverture avancée :
 * - Workflows parallèles et concurrents
 * - Gestion des pics de charge
 * - Intégrations système (CRM, facturation, analytics)
 * - Workflows multi-correcteurs et collaboratifs
 * - Automation intelligente et IA
 */

describe("🔄 Workflows Métier Avancés - Tests Intégration", () => {
  const testEnvironment = {
    concurrentProjects: 10,
    multiCorrectorProject: {
      title: "Encyclopédie Multi-Volume",
      totalPages: 1000,
      volumes: 4,
      correctors: 3
    },
    bulkOrders: {
      clientCount: 5,
      projectsPerClient: 3,
      totalProjects: 15
    }
  };

  before(() => {
    cy.task("log", "🚀 Démarrage des tests d'intégration workflows avancés");
    cy.resetDatabase();
    
    // Vérifier la capacité du système
    cy.request({
      method: "GET",
      url: `${Cypress.env("API_BASE_URL")}/system/capacity`,
      timeout: 30000
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.maxConcurrentProjects).to.be.greaterThan(10);
      cy.task("log", `✅ Capacité système: ${response.body.maxConcurrentProjects} projets concurrents`);
    });
  });

  context("⚡ Workflows Parallèles et Performance", () => {
    it("devrait gérer 10 projets simultanés sans dégradation", () => {
      const startTime = Date.now();
      const projectPromises = [];

      // Créer 10 projets en parallèle
      for (let i = 1; i <= testEnvironment.concurrentProjects; i++) {
        const projectData = {
          title: `Projet Concurrent ${i}`,
          type: i % 2 === 0 ? "Roman" : "Nouvelle",
          pages: 100 + (i * 10),
          priority: i <= 3 ? "HAUTE" : "NORMALE"
        };

        projectPromises.push(
          cy.loginAsUser().then(() => {
            return cy.request({
              method: "POST",
              url: `${Cypress.env("API_BASE_URL")}/projects/quick-create`,
              headers: {
                Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
              },
              body: projectData,
              timeout: 30000
            });
          })
        );
      }

      // Attendre que tous les projets soient créés
      cy.wrap(Promise.all(projectPromises)).then((responses) => {
        const creationTime = Date.now() - startTime;
        cy.task("log", `⚡ ${testEnvironment.concurrentProjects} projets créés en ${creationTime}ms`);
        
        expect(creationTime).to.be.lessThan(15000); // Moins de 15 secondes
        
        responses.forEach((response, index) => {
          expect(response.status).to.eq(201);
          expect(response.body.project.title).to.contain(`Projet Concurrent ${index + 1}`);
        });
      });

      // Vérifier la performance côté admin
      cy.loginAsAdmin();
      cy.visit("/admin/projets");

      const dashboardStartTime = Date.now();
      
      cy.get('[data-cy="project-list"]', { timeout: 20000 })
        .should("be.visible");

      cy.then(() => {
        const dashboardLoadTime = Date.now() - dashboardStartTime;
        cy.task("log", `📊 Dashboard chargé en ${dashboardLoadTime}ms avec ${testEnvironment.concurrentProjects} projets`);
        expect(dashboardLoadTime).to.be.lessThan(5000);
      });

      // Vérifier que tous les projets sont présents
      for (let i = 1; i <= testEnvironment.concurrentProjects; i++) {
        cy.get('[data-cy="project-list"]')
          .should("contain", `Projet Concurrent ${i}`);
      }

      // Tester l'assignation en masse
      cy.get('[data-cy="bulk-actions"]').click();
      cy.get('[data-cy="select-all-projects"]').click();
      cy.get('[data-cy="bulk-assign"]').click();

      cy.get('[data-cy="auto-assign-by-workload"]').click();
      cy.get('[data-cy="confirm-bulk-assignment"]').click();

      // Vérifier l'assignation massive
      cy.get('[data-cy="bulk-assignment-success"]', { timeout: 30000 })
        .should("be.visible")
        .should("contain", `${testEnvironment.concurrentProjects} projets assignés`);

      // Vérifier la répartition de charge
      cy.visit("/admin/correcteurs");
      
      cy.get('[data-cy="workload-distribution"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="corrector-list"] [data-cy="corrector-row"]').each(($row) => {
        cy.wrap($row).within(() => {
          cy.get('[data-cy="current-projects"]')
            .invoke("text")
            .then((projectCount) => {
              const count = parseInt(projectCount);
              expect(count).to.be.lessThan(5); // Charge équilibrée
            });
        });
      });
    });

    it("devrait optimiser automatiquement les workflows selon la charge", () => {
      // Simuler un pic de charge
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/simulate-peak-load`,
        body: {
          projectCount: 25,
          urgentCount: 5,
          duration: 300 // 5 minutes
        }
      });

      cy.loginAsAdmin();
      cy.visit("/admin/system-health");

      // Vérifier les métriques système
      cy.get('[data-cy="system-load"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Charge élevée détectée");

      // Vérifier les optimisations automatiques
      cy.get('[data-cy="auto-optimizations"]')
        .should("contain", "Mode haute performance activé")
        .should("contain", "Assignations automatiques accélérées")
        .should("contain", "Notifications groupées");

      // Vérifier l'ajustement des délais
      cy.get('[data-cy="deadline-adjustments"]')
        .should("contain", "Délais ajustés automatiquement")
        .should("contain", "Clients notifiés");

      // Tester la priorisation intelligente
      cy.visit("/admin/projets");
      
      cy.get('[data-cy="intelligent-sorting"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Tri intelligent activé");

      // Vérifier l'ordre de priorité
      cy.get('[data-cy="project-list"] [data-cy="project-row"]').first()
        .should("contain", "URGENT")
        .should("contain", "Priorité: 1");

      // Vérifier les alertes préventives
      cy.get('[data-cy="capacity-alerts"]')
        .should("contain", "Capacité: 85%")
        .should("contain", "Recrutement recommandé");
    });

    it("devrait maintenir la cohérence des données avec transactions distribuées", () => {
      // Test de concurrence sur les ressources partagées
      cy.loginAsAdmin();
      
      // Créer plusieurs actions simultanées sur le même projet
      cy.createPaidProject("Projet Test Concurrence").then((projectId) => {
        const actions = [
          { action: "assign", correctorId: "corrector_1" },
          { action: "update-priority", priority: "HAUTE" },
          { action: "update-deadline", deadline: "2025-08-01" },
          { action: "add-note", note: "Note de test concurrence" }
        ];

        // Exécuter les actions en parallèle
        const actionPromises = actions.map((actionData) => {
          return cy.request({
            method: "POST",
            url: `${Cypress.env("API_BASE_URL")}/admin/projects/${projectId}/action`,
            headers: {
              Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
            },
            body: actionData,
            timeout: 15000
          });
        });

        cy.wrap(Promise.all(actionPromises)).then((responses) => {
          // Vérifier que toutes les actions ont réussi
          responses.forEach((response, index) => {
            expect(response.status).to.eq(200);
            cy.task("log", `✅ Action ${actions[index].action} complétée`);
          });
        });

        // Vérifier la cohérence finale
        cy.request({
          method: "GET",
          url: `${Cypress.env("API_BASE_URL")}/admin/projects/${projectId}/full`,
          headers: {
            Authorization: `Bearer ${cy.window().its("localStorage").invoke("getItem", "auth_token")}`
          }
        }).then((response) => {
          const project = response.body;
          
          expect(project.assignedCorrectorId).to.eq("corrector_1");
          expect(project.priority).to.eq("HAUTE");
          expect(project.deadline).to.eq("2025-08-01");
          expect(project.notes).to.have.length.greaterThan(0);
          
          // Vérifier l'audit trail
          expect(project.auditLogs).to.have.length(4);
          project.auditLogs.forEach((log) => {
            expect(log.timestamp).to.exist;
            expect(log.userId).to.exist;
            expect(log.action).to.be.oneOf(['ASSIGN', 'UPDATE_PRIORITY', 'UPDATE_DEADLINE', 'ADD_NOTE']);
          });
        });
      });
    });
  });

  context("👥 Workflows Multi-Correcteurs", () => {
    it("devrait coordonner un projet multi-correcteurs avec synchronisation", () => {
      const projectData = testEnvironment.multiCorrectorProject;
      
      cy.loginAsUser();
      cy.visit("/commander");

      // Créer un gros projet nécessitant plusieurs correcteurs
      cy.get('[data-cy="project-title"]').type(projectData.title);
      cy.get('[data-cy="project-type"]').select("Manuel technique");
      cy.get('[data-cy="project-pages"]').type(projectData.totalPages.toString());
      cy.get('[data-cy="project-complexity"]').select("Très élevée");
      cy.get('[data-cy="multi-corrector"]').check(); // Option multi-correcteurs

      // Configuration multi-correcteurs
      cy.get('[data-cy="corrector-specialties"]').should("be.visible");
      cy.get('[data-cy="specialty-technique"]').check();
      cy.get('[data-cy="specialty-style"]').check();
      cy.get('[data-cy="specialty-structure"]').check();

      cy.get('[data-cy="estimated-correctors"]')
        .should("contain", `${projectData.correctors} correcteurs recommandés`);

      cy.get('[data-cy="validate-order"]').click();
      cy.simulateStripePayment();

      // Récupérer l'ID du projet
      let projectId: string;
      cy.get('[data-cy="project-id"]')
        .invoke("text")
        .then((id) => {
          projectId = id.trim();
          
          // Assignation multi-correcteurs côté admin
          cy.logout();
          cy.loginAsAdmin();
          cy.visit(`/admin/projects/${projectId}/multi-assign`);

          // Interface d'assignation collaborative
          cy.get('[data-cy="multi-corrector-workspace"]', { timeout: 10000 })
            .should("be.visible");

          // Diviser le projet en sections
          cy.get('[data-cy="create-sections"]').click();
          
          cy.get('[data-cy="auto-section-by-pages"]').click();
          cy.get('[data-cy="pages-per-section"]').type("350"); // ~350 pages par correcteur

          cy.get('[data-cy="generate-sections"]').click();

          // Vérifier les sections créées
          cy.get('[data-cy="project-sections"]', { timeout: 10000 })
            .should("have.length", projectData.correctors);

          // Assigner chaque section à un correcteur spécialisé
          cy.get('[data-cy="project-sections"] [data-cy="section-row"]').each(($section, index) => {
            cy.wrap($section).within(() => {
              cy.get('[data-cy="assign-corrector"]').click();
              
              // Sélectionner le correcteur selon la spécialité
              const specialties = ["technique", "style", "structure"];
              cy.get(`[data-cy="corrector-${specialties[index]}"]`).click();
              
              cy.get('[data-cy="confirm-section-assignment"]').click();
            });
          });

          // Configurer la coordination
          cy.get('[data-cy="coordination-settings"]').click();
          
          cy.get('[data-cy="lead-corrector"]').select("corrector-technique");
          cy.get('[data-cy="sync-frequency"]').select("daily");
          cy.get('[data-cy="quality-check"]').check();
          
          cy.get('[data-cy="start-collaborative-work"]').click();

          // Vérifier la synchronisation
          cy.get('[data-cy="collaboration-dashboard"]', { timeout: 15000 })
            .should("be.visible")
            .should("contain", "3 correcteurs actifs")
            .should("contain", "Synchronisation activée");

          // Simuler le travail collaboratif
          projectData.correctors.forEach((_, correctorIndex) => {
            cy.request({
              method: "POST",
              url: `${Cypress.env("API_BASE_URL")}/correctors/section-progress`,
              body: {
                projectId,
                sectionIndex: correctorIndex,
                progress: 50,
                notes: `Section ${correctorIndex + 1} à 50%`,
                issuesFound: correctorIndex === 1 ? ["inconsistency-chapter-3"] : []
              }
            });
          });

          // Vérifier la synchronisation des progressions
          cy.reload();
          cy.wait(3000);

          cy.get('[data-cy="progress-sync"]')
            .should("contain", "Section 1: 50%")
            .should("contain", "Section 2: 50%")
            .should("contain", "Section 3: 50%");

          // Vérifier la gestion des conflits
          cy.get('[data-cy="sync-issues"]')
            .should("contain", "1 conflit détecté")
            .should("contain", "inconsistency-chapter-3");

          cy.get('[data-cy="resolve-conflict"]').click();
          
          cy.get('[data-cy="conflict-resolution"]', { timeout: 10000 })
            .should("be.visible");

          cy.get('[data-cy="assign-resolver"]').select("lead-corrector");
          cy.get('[data-cy="conflict-priority"]').select("high");
          cy.get('[data-cy="submit-resolution"]').click();

          // Vérifier les notifications de coordination
          cy.get('[data-cy="coordinator-notifications"]')
            .should("contain", "Conflit assigné au correcteur principal")
            .should("contain", "Correcteurs concernés notifiés");
        });
    });

    it("devrait gérer la qualité et cohérence entre correcteurs", () => {
      cy.createPaidProject("Projet Qualité Multi-Correcteurs").then((projectId) => {
        // Simuler des corrections de différents correcteurs
        const corrections = [
          {
            correctorId: "corrector_1",
            section: "1-100",
            style: "formal",
            corrections: 150,
            quality: "high"
          },
          {
            correctorId: "corrector_2", 
            section: "101-200",
            style: "casual", // Style différent - problème de cohérence
            corrections: 200,
            quality: "medium"
          }
        ];

        corrections.forEach((correction) => {
          cy.request({
            method: "POST",
            url: `${Cypress.env("API_BASE_URL")}/correctors/submit-section`,
            body: {
              projectId,
              ...correction
            }
          });
        });

        // Analyse de cohérence automatique
        cy.loginAsAdmin();
        cy.visit(`/admin/projects/${projectId}/quality-check`);

        cy.get('[data-cy="run-coherence-check"]').click();

        // Vérifier la détection des incohérences
        cy.get('[data-cy="coherence-report"]', { timeout: 15000 })
          .should("be.visible")
          .should("contain", "Incohérence de style détectée")
          .should("contain", "Section 1: formal")
          .should("contain", "Section 2: casual");

        // Suggestions d'harmonisation
        cy.get('[data-cy="harmonization-suggestions"]')
          .should("contain", "Unifier le style vers: formal")
          .should("contain", "Sections concernées: 101-200");

        // Lancer l'harmonisation
        cy.get('[data-cy="apply-harmonization"]').click();
        cy.get('[data-cy="harmonization-target"]').select("formal");
        cy.get('[data-cy="confirm-harmonization"]').click();

        // Notifier le correcteur concerné
        cy.get('[data-cy="harmonization-task"]', { timeout: 10000 })
          .should("be.visible")
          .should("contain", "Tâche d'harmonisation créée")
          .should("contain", "corrector_2 notifié");

        // Vérifier les métriques de qualité
        cy.get('[data-cy="quality-metrics"]')
          .should("contain", "Score global: 82%")
          .should("contain", "Cohérence: En cours d'amélioration")
          .should("contain", "Corrections moyennes: 175/section");
      });
    });

    it("devrait optimiser la communication entre correcteurs", () => {
      cy.createPaidProject("Projet Communication Multi-Correcteurs").then((projectId) => {
        // Simuler une discussion entre correcteurs
        cy.loginAsAdmin();
        cy.visit(`/admin/projects/${projectId}/corrector-chat`);

        // Interface de chat intégrée
        cy.get('[data-cy="corrector-chat"]', { timeout: 10000 })
          .should("be.visible");

        // Simuler des messages entre correcteurs
        const chatMessages = [
          {
            correctorId: "corrector_1",
            message: "J'ai remarqué des incohérences dans les noms de personnages entre nos sections. Pouvons-nous harmoniser ?",
            type: "question"
          },
          {
            correctorId: "corrector_2", 
            message: "Bonne remarque ! Je propose d'utiliser la liste que j'ai établie pour ma section.",
            type: "response",
            attachments: ["character-list.pdf"]
          },
          {
            correctorId: "corrector_3",
            message: "Parfait, j'adopte votre liste. Faut-il que je reprenne ma section déjà corrigée ?",
            type: "question"
          }
        ];

        chatMessages.forEach((msg) => {
          cy.request({
            method: "POST",
            url: `${Cypress.env("API_BASE_URL")}/projects/${projectId}/corrector-message`,
            body: msg
          });
        });

        cy.reload();
        cy.wait(2000);

        // Vérifier l'affichage du chat
        cy.get('[data-cy="chat-messages"]')
          .should("contain", "incohérences dans les noms")
          .should("contain", "liste que j'ai établie")
          .should("contain", "reprendre ma section");

        // Vérifier les pièces jointes
        cy.get('[data-cy="chat-attachment"]')
          .should("contain", "character-list.pdf")
          .should("have.attr", "href");

        // Décisions collaboratives
        cy.get('[data-cy="create-decision"]').click();
        
        cy.get('[data-cy="decision-title"]')
          .type("Harmonisation des noms de personnages");
        
        cy.get('[data-cy="decision-description"]')
          .type("Adopter la liste de personnages établie par le correcteur 2 pour toutes les sections.");

        cy.get('[data-cy="affected-sections"]')
          .select(["section-1", "section-3"]);

        cy.get('[data-cy="vote-required"]').check();
        cy.get('[data-cy="create-team-decision"]').click();

        // Système de vote
        cy.get('[data-cy="decision-created"]', { timeout: 10000 })
          .should("be.visible")
          .should("contain", "Vote créé pour l'équipe");

        // Simuler les votes
        ["corrector_1", "corrector_2", "corrector_3"].forEach((correctorId) => {
          cy.request({
            method: "POST",
            url: `${Cypress.env("API_BASE_URL")}/projects/${projectId}/vote`,
            body: {
              correctorId,
              vote: "approve",
              comment: "D'accord avec cette harmonisation"
            }
          });
        });

        // Vérifier le résultat du vote
        cy.reload();
        cy.wait(2000);

        cy.get('[data-cy="vote-results"]')
          .should("contain", "3/3 approuvent")
          .should("contain", "Décision adoptée")
          .should("contain", "Harmonisation approuvée");

        // Actions automatiques suite à la décision
        cy.get('[data-cy="automated-actions"]')
          .should("contain", "Tâches d'harmonisation créées")
          .should("contain", "Correcteurs notifiés")
          .should("contain", "Deadline ajustée");
      });
    });
  });

  context("🤖 Automation Intelligente", () => {
    it("devrait implémenter l'assignation IA basée sur l'historique", () => {
      // Créer un historique de performances
      const performanceHistory = [
        { correctorId: "corrector_ai_1", specialty: "Roman", avgQuality: 4.8, avgSpeed: 95, clientSatisfaction: 4.9 },
        { correctorId: "corrector_ai_2", specialty: "Technique", avgQuality: 4.6, avgSpeed: 85, clientSatisfaction: 4.7 },
        { correctorId: "corrector_ai_3", specialty: "Roman", avgQuality: 4.2, avgSpeed: 120, clientSatisfaction: 4.3 }
      ];

      // Envoyer les données d'historique
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/seed-performance-history`,
        body: { correctors: performanceHistory }
      });

      // Créer un nouveau projet Roman
      cy.loginAsUser();
      cy.visit("/commander");
      
      cy.get('[data-cy="project-title"]').type("Roman IA Assignment Test");
      cy.get('[data-cy="project-type"]').select("Roman");
      cy.get('[data-cy="project-pages"]').type("200");
      cy.get('[data-cy="quality-priority"]').select("maximum"); // Privilégier la qualité
      cy.get('[data-cy="ai-assignment"]').check(); // Assignation IA

      cy.get('[data-cy="validate-order"]').click();
      cy.simulateStripePayment();

      // Vérifier l'assignation IA côté admin
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/projets");

      cy.get('[data-cy="project-list"]')
        .contains("Roman IA Assignment Test")
        .closest('[data-cy="project-row"]')
        .should("contain", "Assigné par IA")
        .should("contain", "corrector_ai_1"); // Meilleur score pour Roman + qualité

      // Vérifier les métriques de l'assignation IA
      cy.get('[data-cy="project-list"]')
        .contains("Roman IA Assignment Test")
        .click();

      cy.get('[data-cy="ai-assignment-details"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Score de compatibilité: 4.8/5")
        .should("contain", "Spécialité: Roman (match parfait)")
        .should("contain", "Qualité priorisée")
        .should("contain", "Satisfaction client prédite: 4.9/5");

      // Créer un second projet privilégiant la vitesse
      cy.loginAsUser();
      cy.visit("/commander");
      
      cy.get('[data-cy="project-title"]').type("Roman Speed Priority Test");
      cy.get('[data-cy="project-type"]').select("Roman");
      cy.get('[data-cy="project-pages"]').type("150");
      cy.get('[data-cy="speed-priority"]').select("maximum"); // Privilégier la vitesse
      cy.get('[data-cy="ai-assignment"]').check();

      cy.get('[data-cy="validate-order"]').click();
      cy.simulateStripePayment();

      // Cette fois, l'IA devrait choisir corrector_ai_3 (plus rapide)
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/projets");

      cy.get('[data-cy="project-list"]')
        .contains("Roman Speed Priority Test")
        .closest('[data-cy="project-row"]')
        .should("contain", "corrector_ai_3"); // Plus rapide pour Roman

      // Analyser l'amélioration de l'IA
      cy.visit("/admin/ai-analytics");

      cy.get('[data-cy="ai-performance"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Taux de succès: 96%")
        .should("contain", "Amélioration continue activée");
    });

    it("devrait prédire et prévenir les problèmes de workflow", () => {
      // Créer des patterns de données pour l'IA prédictive
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/create-risk-patterns`,
        body: {
          riskFactors: [
            { correctorId: "corrector_risk_1", lateDeliveries: 3, currentLoad: 5 },
            { projectType: "Technique", avgDelayDays: 2.5, complexity: "high" },
            { clientId: "client_demanding_1", revisionRate: 0.8, avgRating: 3.2 }
          ]
        }
      });

      // Créer un projet avec facteurs de risque
      cy.loginAsUser();
      cy.visit("/commander");
      
      cy.get('[data-cy="project-title"]').type("Projet Risque IA");
      cy.get('[data-cy="project-type"]').select("Technique");
      cy.get('[data-cy="project-pages"]').type("300");
      cy.get('[data-cy="project-complexity"]').select("Très élevée");
      cy.get('[data-cy="tight-deadline"]').check(); // Délai serré

      cy.get('[data-cy="validate-order"]').click();
      cy.simulateStripePayment();

      // L'IA devrait détecter les risques
      cy.logout();
      cy.loginAsAdmin();
      cy.visit("/admin/ai-predictions");

      cy.get('[data-cy="risk-predictions"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Projet Risque IA")
        .should("contain", "Risque de retard: 75%")
        .should("contain", "Risque de révision: 60%");

      // Recommandations préventives
      cy.get('[data-cy="ai-recommendations"]')
        .should("contain", "Assigner 2 correcteurs")
        .should("contain", "Étendre le délai de 3 jours")
        .should("contain", "Communication client renforcée");

      // Appliquer les recommandations
      cy.get('[data-cy="apply-ai-recommendations"]').click();
      
      cy.get('[data-cy="recommendation-modal"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="multi-corrector-assignment"]').check();
      cy.get('[data-cy="deadline-extension"]').check();
      cy.get('[data-cy="proactive-communication"]').check();

      cy.get('[data-cy="implement-recommendations"]').click();

      // Vérifier la mise en œuvre
      cy.get('[data-cy="recommendations-applied"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "2 correcteurs assignés")
        .should("contain", "Délai étendu à")
        .should("contain", "Client notifié des ajustements");

      // Suivre l'efficacité des prédictions
      cy.visit("/admin/ai-effectiveness");

      cy.get('[data-cy="prediction-accuracy"]')
        .should("contain", "Précision des prédictions: 89%")
        .should("contain", "Prévention réussie: 12 projets ce mois");
    });

    it("devrait optimiser dynamiquement les tarifs selon la demande", () => {
      // Simuler différents niveaux de demande
      const demandScenarios = [
        { period: "low-demand", projects: 5, avgDelayDays: 0.5 },
        { period: "high-demand", projects: 25, avgDelayDays: 3.2 },
        { period: "peak-demand", projects: 40, avgDelayDays: 5.8 }
      ];

      demandScenarios.forEach((scenario) => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_BASE_URL")}/dev/simulate-demand`,
          body: scenario
        });

        cy.loginAsAdmin();
        cy.visit("/admin/dynamic-pricing");

        // Vérifier l'ajustement automatique des tarifs
        cy.get('[data-cy="current-demand"]', { timeout: 10000 })
          .should("contain", scenario.period.replace("-", " "));

        if (scenario.period === "peak-demand") {
          cy.get('[data-cy="pricing-adjustment"]')
            .should("contain", "Tarifs augmentés de 20%")
            .should("contain", "Prime urgence: +30%")
            .should("contain", "Délais standard: +2 jours");

          cy.get('[data-cy="client-communication"]')
            .should("contain", "Clients informés des ajustements")
            .should("contain", "Options alternatives proposées");

        } else if (scenario.period === "low-demand") {
          cy.get('[data-cy="pricing-adjustment"]')
            .should("contain", "Promotion -15%")
            .should("contain", "Délais raccourcis")
            .should("contain", "Marketing automatique activé");
        }

        // Vérifier l'impact sur les nouvelles commandes
        cy.logout();
        cy.loginAsUser();
        cy.visit("/tarifs");

        cy.get('[data-cy="current-pricing"]', { timeout: 10000 })
          .should("be.visible");

        if (scenario.period === "peak-demand") {
          cy.get('[data-cy="pricing-notice"]')
            .should("contain", "Période de forte demande")
            .should("contain", "Tarifs ajustés temporairement");
            
          cy.get('[data-cy="alternative-options"]')
            .should("contain", "Délai flexible: -10%")
            .should("contain", "Programmé: -20%");
        }
      });

      // Analyser l'efficacité de l'optimisation dynamique
      cy.loginAsAdmin();
      cy.visit("/admin/pricing-analytics");

      cy.get('[data-cy="dynamic-pricing-results"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Revenus optimisés: +18%")
        .should("contain", "Satisfaction client maintenue: 4.6/5")
        .should("contain", "Délais moyens améliorés: -1.2 jours");
    });
  });

  context("📊 Analytics et Reporting Avancés", () => {
    it("devrait générer des rapports prédictifs de performance", () => {
      // Créer des données historiques riches
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/generate-historical-data`,
        body: {
          timeRange: "6-months",
          includeSeasonality: true,
          includeCorrectorsData: true,
          includeClientBehavior: true
        }
      });

      cy.loginAsAdmin();
      cy.visit("/admin/predictive-analytics");

      // Générer un rapport prédictif
      cy.get('[data-cy="generate-prediction"]').click();
      
      cy.get('[data-cy="prediction-settings"]', { timeout: 10000 })
        .should("be.visible");

      cy.get('[data-cy="prediction-period"]').select("next-quarter");
      cy.get('[data-cy="include-seasonality"]').check();
      cy.get('[data-cy="include-market-trends"]').check();
      cy.get('[data-cy="confidence-level"]').select("95%");

      cy.get('[data-cy="generate-report"]').click();

      // Analyser les prédictions
      cy.get('[data-cy="prediction-results"]', { timeout: 30000 })
        .should("be.visible");

      // Prédictions de demande
      cy.get('[data-cy="demand-forecast"]')
        .should("contain", "Demande prédite: +23%")
        .should("contain", "Pic attendu: Septembre")
        .should("contain", "Creux attendu: Juillet");

      // Prédictions de capacité
      cy.get('[data-cy="capacity-forecast"]')
        .should("contain", "Capacité actuelle suffisante jusqu'à")
        .should("contain", "Recrutement recommandé: 2 correcteurs")
        .should("contain", "Spécialités prioritaires: Technique, Roman");

      // Prédictions financières
      cy.get('[data-cy="revenue-forecast"]')
        .should("contain", "Revenus prédits:")
        .should("contain", "Marge d'erreur: ±5%")
        .should("contain", "Confiance: 95%");

      // Recommandations stratégiques
      cy.get('[data-cy="strategic-recommendations"]')
        .should("contain", "Développer l'offre technique")
        .should("contain", "Investir dans l'automation")
        .should("contain", "Renforcer le marketing digital");

      // Exporter le rapport
      cy.get('[data-cy="export-predictions"]').click();
      cy.get('[data-cy="export-format"]').select("pdf-executive");
      cy.get('[data-cy="confirm-export"]').click();

      cy.get('[data-cy="export-success"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "Rapport exporté avec succès");
    });

    it("devrait monitorer les KPIs en temps réel avec alertes intelligentes", () => {
      // Configurer le monitoring temps réel
      cy.loginAsAdmin();
      cy.visit("/admin/real-time-monitoring");

      cy.get('[data-cy="monitoring-dashboard"]', { timeout: 10000 })
        .should("be.visible");

      // Configurer des seuils d'alerte
      cy.get('[data-cy="configure-alerts"]').click();
      
      cy.get('[data-cy="alert-settings"]')
        .should("be.visible");

      const alertRules = [
        { metric: "avg-response-time", threshold: "2-hours", severity: "warning" },
        { metric: "client-satisfaction", threshold: "4.0", severity: "critical", operator: "below" },
        { metric: "corrector-workload", threshold: "8-projects", severity: "warning", operator: "above" },
        { metric: "revenue-daily", threshold: "1000-euro", severity: "info", operator: "above" }
      ];

      alertRules.forEach((rule, index) => {
        cy.get(`[data-cy="alert-rule-${index}"]`).within(() => {
          cy.get('[data-cy="metric"]').select(rule.metric);
          cy.get('[data-cy="operator"]').select(rule.operator || "above");
          cy.get('[data-cy="threshold"]').type(rule.threshold);
          cy.get('[data-cy="severity"]').select(rule.severity);
        });
      });

      cy.get('[data-cy="save-alert-rules"]').click();

      // Simuler des événements déclenchant les alertes
      cy.request({
        method: "POST",
        url: `${Cypress.env("API_BASE_URL")}/dev/trigger-alert-conditions`,
        body: {
          conditions: [
            { type: "high-response-time", value: "3-hours" },
            { type: "low-satisfaction", value: "3.8" },
            { type: "overloaded-corrector", correctorId: "corrector_overload_1", projects: 10 }
          ]
        }
      });

      // Vérifier les alertes
      cy.reload();
      cy.wait(5000);

      cy.get('[data-cy="active-alerts"]', { timeout: 15000 })
        .should("be.visible")
        .should("contain", "3 alertes actives");

      cy.get('[data-cy="alert-list"]').within(() => {
        cy.get('[data-cy="alert-warning"]')
          .should("contain", "Temps de réponse élevé")
          .should("contain", "Correcteur surchargé");

        cy.get('[data-cy="alert-critical"]')
          .should("contain", "Satisfaction client faible")
          .should("contain", "Action immédiate requise");
      });

      // Actions automatiques déclenchées
      cy.get('[data-cy="automated-actions"]')
        .should("contain", "Réassignation automatique lancée")
        .should("contain", "Support client notifié")
        .should("contain", "Manager alerté");

      // Dashboard en temps réel
      cy.get('[data-cy="realtime-metrics"]').within(() => {
        cy.get('[data-cy="projects-in-progress"]')
          .should("be.visible")
          .invoke("text")
          .should("match", /^\d+$/);

        cy.get('[data-cy="avg-satisfaction"]')
          .should("be.visible")
          .invoke("text")
          .should("match", /^\d\.\d$/);

        cy.get('[data-cy="active-correctors"]')
          .should("be.visible");

        cy.get('[data-cy="daily-revenue"]')
          .should("be.visible")
          .should("contain", "€");
      });

      // Historique des alertes et résolutions
      cy.get('[data-cy="alert-history"]').click();
      
      cy.get('[data-cy="historical-alerts"]', { timeout: 10000 })
        .should("be.visible")
        .should("contain", "Alertes résolues automatiquement")
        .should("contain", "Temps moyen de résolution")
        .should("contain", "Efficacité des actions automatiques");
    });
  });

  after(() => {
    // Nettoyage complet des tests d'intégration
    cy.task("log", "🧹 Nettoyage final des tests workflows avancés");
    
    // Nettoyer les données de test
    cy.request({
      method: "DELETE",
      url: `${Cypress.env("API_BASE_URL")}/dev/cleanup-integration-data`,
      failOnStatusCode: false
    });

    // Réinitialiser les paramètres système
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_BASE_URL")}/dev/reset-system-settings`,
      failOnStatusCode: false
    });

    // Désactiver les optimisations de test
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_BASE_URL")}/dev/disable-test-optimizations`,
      failOnStatusCode: false
    });
  });
});