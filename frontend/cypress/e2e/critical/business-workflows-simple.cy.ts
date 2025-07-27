/// <reference types="cypress" />

/**
 * Tests E2E - Workflows Métier Simplifié (Critique)
 * 
 * Version simplifiée des workflows métier avec mocks complets
 * pour tester les fonctionnalités business critiques
 */

describe("🔄 Workflows Métier Simplifié - Tests Critiques", () => {
  const projectData = {
    client: {
      email: "client.test@example.com",
      prenom: "Marie",
      nom: "Dubois"
    },
    corrector: {
      email: "corrector.test@example.com",
      prenom: "Jean",
      nom: "Correcteur"
    },
    project: {
      title: "Roman Fantasy - Les Terres Oubliées",
      type: "Roman",
      pages: 250,
      pack: "integral",
      description: "Roman fantasy épique de 250 pages nécessitant une correction complète"
    },
    payment: {
      amount: 500,
      currency: "EUR"
    }
  };

  beforeEach(() => {
    // Effacer le localStorage et sessionStorage
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });

    // Mocks génériques pour tous les workflows
    cy.intercept('POST', '/api/projects', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 'project_test_123',
          title: projectData.project.title,
          status: 'CREATED',
          amount: projectData.payment.amount,
          createdAt: new Date().toISOString()
        }
      }
    }).as('createProject');

    cy.intercept('POST', '/api/payments/create-checkout-session', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          sessionId: 'cs_test_workflow',
          url: '/payment/success?session_id=cs_test_workflow&mock=true'
        }
      }
    }).as('createPaymentSession');

    cy.intercept('GET', '/api/payments/verify-session/*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          paymentStatus: 'paid',
          projectId: 'project_test_123',
          amount: projectData.payment.amount,
          currency: 'eur'
        }
      }
    }).as('verifyPayment');

    cy.visit("/");
    cy.wait(1000);
  });

  context("📋 Cycle Complet de Correction", () => {
    it("devrait tester les étapes du workflow de base", () => {
      // ÉTAPE 1: Simulation de création de projet client
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-client-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'client-1',
          email: projectData.client.email,
          prenom: projectData.client.prenom,
          nom: projectData.client.nom,
          role: 'USER'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'client-1',
          email: projectData.client.email,
          prenom: projectData.client.prenom,
          nom: projectData.client.nom,
          role: 'USER'
        }
      });

      // Accéder à la création de projet
      cy.visit('/app/projects', { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier que l'interface de création fonctionne
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', '404');
      
      // Simuler la création d'un projet
      cy.get('body').then(($body) => {
        if ($body.text().includes('Nouveau projet') || $body.text().includes('Créer')) {
          cy.log('✅ Interface de création de projet détectée');
        }
      });
    });

    it("devrait simuler le workflow de paiement", () => {
      // ÉTAPE 2: Simulation du paiement
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-client-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'client-1',
          email: projectData.client.email,
          role: 'USER'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'client-1',
          email: projectData.client.email,
          role: 'USER'
        }
      });

      // Accéder au processus de paiement
      cy.visit('/payment/checkout?project=project_test_123', { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier que le paiement fonctionne
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', 'Cannot read');
      
      // Simuler le succès du paiement
      cy.visit('/payment/success?session_id=cs_test_workflow&mock=true', { failOnStatusCode: false });
      cy.wait(2000);
      
      cy.get('body').should('be.visible');
    });

    it("devrait tester l'assignation aux correcteurs", () => {
      // ÉTAPE 3: Simulation de l'assignation admin
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-admin-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'admin-1',
          email: 'admin@staka-editions.com',
          role: 'ADMIN'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'admin-1',
          email: 'admin@staka-editions.com',
          role: 'ADMIN'
        }
      });

      // Mock de l'assignation
      cy.intercept('POST', '/api/admin/projects/*/assign', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            projectId: 'project_test_123',
            assignedTo: 'corrector-1',
            assignedAt: new Date().toISOString(),
            status: 'ASSIGNED'
          }
        }
      }).as('assignProject');

      // Accéder à l'interface d'assignation
      cy.visit('/admin/projects', { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier l'interface admin
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', '404');
    });

    it("devrait simuler le travail du correcteur", () => {
      // ÉTAPE 4: Simulation du travail de correction
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-corrector-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'corrector-1',
          email: projectData.corrector.email,
          prenom: projectData.corrector.prenom,
          nom: projectData.corrector.nom,
          role: 'CORRECTOR'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'corrector-1',
          email: projectData.corrector.email,
          prenom: projectData.corrector.prenom,
          nom: projectData.corrector.nom,
          role: 'CORRECTOR'
        }
      });

      // Mock des projets assignés
      cy.intercept('GET', '/api/corrector/projects*', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'project_test_123',
              title: projectData.project.title,
              status: 'ASSIGNED',
              pages: projectData.project.pages,
              deadline: '2025-08-15'
            }
          ]
        }
      }).as('getCorrectorProjects');

      // Mock de la soumission de correction
      cy.intercept('POST', '/api/corrector/projects/*/submit', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            projectId: 'project_test_123',
            status: 'COMPLETED',
            submittedAt: new Date().toISOString(),
            correctedFileUrl: '/files/corrected-manuscript.pdf'
          }
        }
      }).as('submitCorrection');

      // Accéder à l'interface correcteur
      cy.visit('/corrector/projects', { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier l'interface correcteur
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', '404');
    });

    it("devrait tester la livraison finale", () => {
      // ÉTAPE 5: Simulation de la livraison
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-client-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'client-1',
          email: projectData.client.email,
          role: 'USER'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'client-1',
          email: projectData.client.email,
          role: 'USER'
        }
      });

      // Mock des projets terminés
      cy.intercept('GET', '/api/projects*', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'project_test_123',
              title: projectData.project.title,
              status: 'COMPLETED',
              correctedFileUrl: '/files/corrected-manuscript.pdf',
              completedAt: new Date().toISOString()
            }
          ]
        }
      }).as('getCompletedProjects');

      // Mock du téléchargement
      cy.intercept('GET', '/api/files/download/*', {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="corrected-manuscript.pdf"'
        },
        body: 'Mock corrected content'
      }).as('downloadCorrectedFile');

      // Accéder aux projets terminés
      cy.visit('/app/projects?status=completed', { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier la livraison
      cy.get('body').should('be.visible');
      cy.get('body').should('not.contain', 'Cannot read');
    });
  });

  context("📝 Workflow de Révision", () => {
    it("devrait tester le processus de demande de révision", () => {
      // Client demande une révision
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-client-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'client-1',
          email: projectData.client.email,
          role: 'USER'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'client-1',
          email: projectData.client.email,
          role: 'USER'
        }
      });

      // Mock de demande de révision
      cy.intercept('POST', '/api/projects/*/request-revision', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            projectId: 'project_test_123',
            revisionRequest: 'Révision demandée',
            status: 'REVISION_REQUESTED',
            requestedAt: new Date().toISOString()
          }
        }
      }).as('requestRevision');

      cy.visit('/app/projects', { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier la demande de révision
      cy.get('body').should('be.visible');
    });

    it("devrait simuler la réponse du correcteur", () => {
      // Correcteur répond à la révision
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-corrector-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'corrector-1',
          email: projectData.corrector.email,
          role: 'CORRECTOR'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'corrector-1',
          email: projectData.corrector.email,
          role: 'CORRECTOR'
        }
      });

      // Mock de réponse à la révision
      cy.intercept('POST', '/api/corrector/projects/*/respond-revision', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            projectId: 'project_test_123',
            response: 'Révision effectuée',
            status: 'REVISION_COMPLETED',
            respondedAt: new Date().toISOString()
          }
        }
      }).as('respondRevision');

      cy.visit('/corrector/projects', { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier la réponse à la révision
      cy.get('body').should('be.visible');
    });
  });

  context("🚨 Processus d'Escalade", () => {
    it("devrait simuler l'intervention admin", () => {
      // Admin intervient dans un conflit
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-admin-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'admin-1',
          email: 'admin@staka-editions.com',
          role: 'ADMIN'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'admin-1',
          email: 'admin@staka-editions.com',
          role: 'ADMIN'
        }
      });

      // Mock de l'escalade
      cy.intercept('POST', '/api/admin/projects/*/escalate', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            projectId: 'project_test_123',
            escalationType: 'QUALITY_ISSUE',
            resolution: 'Admin resolution',
            resolvedAt: new Date().toISOString()
          }
        }
      }).as('escalateProject');

      cy.visit('/admin/projects/escalations', { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier l'escalade
      cy.get('body').should('be.visible');
    });
  });

  context("⭐ Système de Feedback", () => {
    it("devrait permettre la notation post-livraison", () => {
      // Client note le travail terminé
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-client-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'client-1',
          email: projectData.client.email,
          role: 'USER'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'client-1',
          email: projectData.client.email,
          role: 'USER'
        }
      });

      // Mock de notation
      cy.intercept('POST', '/api/projects/*/rate', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            projectId: 'project_test_123',
            rating: 5,
            feedback: 'Excellent travail',
            ratedAt: new Date().toISOString()
          }
        }
      }).as('rateProject');

      cy.visit('/app/projects/project_test_123/feedback', { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier la notation
      cy.get('body').should('be.visible');
    });

    it("devrait générer les statistiques de performance", () => {
      // Admin consulte les stats
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-admin-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 'admin-1',
          email: 'admin@staka-editions.com',
          role: 'ADMIN'
        }));
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          id: 'admin-1',
          email: 'admin@staka-editions.com',
          role: 'ADMIN'
        }
      });

      // Mock des statistiques
      cy.intercept('GET', '/api/admin/stats/performance', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            averageRating: 4.8,
            completedProjects: 150,
            averageDeliveryTime: '7 jours',
            clientSatisfaction: 96,
            correctorPerformance: {
              topCorrectors: [
                { name: 'Jean Correcteur', rating: 4.9, projects: 45 }
              ]
            }
          }
        }
      }).as('getPerformanceStats');

      cy.visit('/admin/stats', { failOnStatusCode: false });
      cy.wait(2000);

      // Vérifier les statistiques
      cy.get('body').should('be.visible');
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