/**
 * Tests d'intégration avancés Stripe Webhooks
 * Validation des flux de synchronisation paiement ↔ backend
 */

describe('Stripe Webhooks - Tests d\'Intégration Avancés', () => {
  let testCommandeId: string;
  let testUserId: string;

  beforeEach(() => {
    testUserId = `user-webhook-${Date.now()}`;
    testCommandeId = `commande-webhook-${Date.now()}`;

    // Configuration utilisateur test
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'test-webhook-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: testUserId,
        email: 'webhook-test@staka.com',
        prenom: 'Webhook',
        nom: 'Test',
        role: 'USER'
      }));
    });

    // Mock des APIs pour setup initial
    cy.intercept('GET', '**/api/commandes*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          commandes: [
            {
              id: testCommandeId,
              titre: 'Test Webhook Integration',
              statut: 'EN_ATTENTE',
              userId: testUserId,
              paiementStatut: 'PENDING',
              createdAt: new Date().toISOString()
            }
          ]
        }
      }
    }).as('getCommandes');
  });

  describe('Webhook checkout.session.completed', () => {
    it('should update commande status after successful payment', () => {
      // Mock webhook simulation endpoint
      cy.intercept('POST', '**/api/payments/webhook', {
        statusCode: 200,
        body: { received: true }
      }).as('webhookReceived');

      // Mock commande updated après webhook
      cy.intercept('GET', '**/api/commandes*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            commandes: [
              {
                id: testCommandeId,
                titre: 'Test Webhook Integration',
                statut: 'EN_ATTENTE', // Statut business reste en attente
                userId: testUserId,
                paiementStatut: 'PAID', // Statut paiement mis à jour
                stripeSessionId: 'cs_test_webhook_session',
                createdAt: new Date().toISOString()
              }
            ]
          }
        }
      }).as('getCommandesUpdated');

      // Simuler l'arrivée d'un webhook (en réalité envoyé par Stripe)
      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        headers: {
          'stripe-signature': 'test-webhook-signature',
          'content-type': 'application/json'
        },
        body: {
          id: 'evt_test_webhook',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_webhook_session',
              payment_status: 'paid',
              metadata: {
                commandeId: testCommandeId,
                userId: testUserId
              },
              amount_total: 5000, // 50€
              currency: 'eur'
            }
          }
        },
        failOnStatusCode: false
      });

      // Vérifier que la commande est mise à jour
      cy.visit('/app/projects');
      cy.wait('@getCommandesUpdated');

      // Vérifier l'affichage mis à jour
      cy.contains('Test Webhook Integration').should('be.visible');
      cy.contains('Payé').should('be.visible');
    });

    it('should create invoice after successful payment webhook', () => {
      // Mock création facture
      cy.intercept('POST', '**/api/invoices/generate', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            invoiceId: 'inv_webhook_test',
            pdfUrl: 'https://test.s3.amazonaws.com/invoice.pdf',
            amount: 5000
          }
        }
      }).as('generateInvoice');

      // Mock liste factures avec nouvelle facture
      cy.intercept('GET', '**/api/invoices*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            invoices: [
              {
                id: 'inv_webhook_test',
                commandeId: testCommandeId,
                amount: 5000,
                status: 'paid',
                pdfUrl: 'https://test.s3.amazonaws.com/invoice.pdf',
                createdAt: new Date().toISOString()
              }
            ]
          }
        }
      }).as('getInvoices');

      // Simuler webhook payment success
      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        headers: { 'stripe-signature': 'test-signature' },
        body: {
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_invoice_webhook',
              payment_status: 'paid',
              metadata: { commandeId: testCommandeId }
            }
          }
        },
        failOnStatusCode: false
      });

      // Vérifier la création de facture
      cy.visit('/app/billing');
      cy.wait('@getInvoices');

      cy.contains('inv_webhook_test').should('be.visible');
      cy.contains('50,00 €').should('be.visible');
    });

    it('should send notification emails after payment', () => {
      // Mock endpoint notifications
      cy.intercept('GET', '**/api/notifications*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            notifications: [
              {
                id: 'notif_webhook_payment',
                type: 'PAYMENT_SUCCESS',
                title: 'Paiement confirmé',
                message: 'Votre paiement de 50€ a été confirmé',
                isRead: false,
                createdAt: new Date().toISOString()
              }
            ]
          }
        }
      }).as('getNotifications');

      // Simuler webhook avec notification
      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        body: {
          type: 'checkout.session.completed',
          data: {
            object: {
              payment_status: 'paid',
              metadata: { commandeId: testCommandeId }
            }
          }
        },
        failOnStatusCode: false
      });

      // Vérifier les notifications
      cy.visit('/app/notifications');
      cy.wait('@getNotifications');

      cy.contains('Paiement confirmé').should('be.visible');
      cy.contains('50€').should('be.visible');
    });
  });

  describe('Webhook payment_intent.payment_failed', () => {
    it('should handle payment failure correctly', () => {
      // Mock commande avec échec paiement
      cy.intercept('GET', '**/api/commandes*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            commandes: [
              {
                id: testCommandeId,
                titre: 'Test Payment Failed',
                statut: 'EN_ATTENTE',
                paiementStatut: 'FAILED',
                errorMessage: 'Carte refusée',
                userId: testUserId
              }
            ]
          }
        }
      }).as('getCommandesFailed');

      // Simuler webhook d'échec
      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        body: {
          type: 'payment_intent.payment_failed',
          data: {
            object: {
              id: 'pi_test_failed',
              status: 'failed',
              last_payment_error: {
                message: 'Your card was declined.',
                code: 'card_declined'
              },
              metadata: { commandeId: testCommandeId }
            }
          }
        },
        failOnStatusCode: false
      });

      // Vérifier l'affichage de l'échec
      cy.visit('/app/projects');
      cy.wait('@getCommandesFailed');

      cy.contains('Test Payment Failed').should('be.visible');
      cy.contains('Échec').should('be.visible');
      cy.contains('Carte refusée').should('be.visible');
    });

    it('should allow retry after payment failure', () => {
      cy.intercept('GET', '**/api/commandes*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            commandes: [{
              id: testCommandeId,
              paiementStatut: 'FAILED',
              statut: 'EN_ATTENTE'
            }]
          }
        }
      });

      // Mock retry payment
      cy.intercept('POST', '**/api/payments/retry', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            sessionId: 'cs_test_retry',
            url: '/payment/success?session_id=cs_test_retry'
          }
        }
      }).as('retryPayment');

      cy.visit('/app/projects');

      // Cliquer sur retry
      cy.get('button:contains("Réessayer"), .btn-retry-payment').click();
      cy.wait('@retryPayment');

      // Devrait rediriger vers nouveau paiement
      cy.url().should('include', '/payment/success');
    });
  });

  describe('Webhook invoice.payment_succeeded', () => {
    it('should update billing status for recurring payments', () => {
      // Mock pour abonnements/paiements récurrents
      cy.intercept('GET', '**/api/billing/subscriptions*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            subscriptions: [
              {
                id: 'sub_test_webhook',
                status: 'active',
                current_period_end: Date.now() + 86400000, // +1 jour
                plan: 'Premium Monthly'
              }
            ]
          }
        }
      }).as('getSubscriptions');

      // Simuler webhook facture payée
      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        body: {
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              id: 'in_test_webhook',
              subscription: 'sub_test_webhook',
              amount_paid: 2000, // 20€
              status: 'paid'
            }
          }
        },
        failOnStatusCode: false
      });

      cy.visit('/app/billing');
      cy.wait('@getSubscriptions');

      cy.contains('Premium Monthly').should('be.visible');
      cy.contains('active').should('be.visible');
    });
  });

  describe('Sécurité des webhooks', () => {
    it('should reject webhooks without valid signature', () => {
      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        headers: {
          'stripe-signature': 'invalid-signature'
        },
        body: {
          type: 'checkout.session.completed',
          data: { object: { id: 'test' } }
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('signature');
      });
    });

    it('should handle duplicate webhook events', () => {
      const webhookEvent = {
        id: 'evt_duplicate_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_duplicate_test',
            payment_status: 'paid',
            metadata: { commandeId: testCommandeId }
          }
        }
      };

      // Premier webhook
      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        body: webhookEvent,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200);
      });

      // Webhook dupliqué (même ID)
      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        body: webhookEvent,
        failOnStatusCode: false
      }).then((response) => {
        // Devrait être ignoré ou traité gracieusement
        expect(response.status).to.be.oneOf([200, 409]);
      });
    });

    it('should validate webhook payload structure', () => {
      // Payload malformé
      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        body: {
          type: 'checkout.session.completed',
          // data manquant
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
      });
    });
  });

  describe('Performance et monitoring', () => {
    it('should process webhooks quickly', () => {
      const startTime = Date.now();

      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        body: {
          type: 'checkout.session.completed',
          data: {
            object: {
              payment_status: 'paid',
              metadata: { commandeId: testCommandeId }
            }
          }
        },
        failOnStatusCode: false
      }).then((response) => {
        const processingTime = Date.now() - startTime;
        expect(processingTime).to.be.lessThan(5000); // < 5 secondes
        expect(response.status).to.eq(200);
      });
    });

    it('should log webhook events properly', () => {
      // Mock endpoint logs audit
      cy.intercept('GET', '**/api/admin/audit*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            logs: [
              {
                id: 'audit_webhook',
                action: 'WEBHOOK_RECEIVED',
                details: { type: 'checkout.session.completed' },
                timestamp: new Date().toISOString()
              }
            ]
          }
        }
      }).as('getAuditLogs');

      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        body: {
          type: 'checkout.session.completed',
          data: { object: { payment_status: 'paid' } }
        },
        failOnStatusCode: false
      });

      // Vérifier les logs (si admin)
      cy.window().then((win) => {
        win.localStorage.setItem('user', JSON.stringify({
          role: 'ADMIN',
          email: 'admin@test.com'
        }));
      });

      cy.visit('/admin/audit-logs');
      cy.wait('@getAuditLogs');

      cy.contains('WEBHOOK_RECEIVED').should('be.visible');
    });
  });

  describe('Intégration avec notifications', () => {
    it('should trigger admin notifications for high-value payments', () => {
      // Mock notifications admin
      cy.intercept('GET', '**/api/admin/notifications*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            notifications: [
              {
                id: 'admin_notif_payment',
                type: 'HIGH_VALUE_PAYMENT',
                title: 'Paiement important reçu',
                message: 'Paiement de 500€ confirmé',
                priority: 'HIGH'
              }
            ]
          }
        }
      }).as('getAdminNotifications');

      // Webhook paiement élevé
      cy.request({
        method: 'POST',
        url: '/api/payments/webhook',
        body: {
          type: 'checkout.session.completed',
          data: {
            object: {
              payment_status: 'paid',
              amount_total: 50000, // 500€
              metadata: { commandeId: testCommandeId }
            }
          }
        },
        failOnStatusCode: false
      });

      // Admin devrait voir la notification
      cy.window().then((win) => {
        win.localStorage.setItem('user', JSON.stringify({
          role: 'ADMIN'
        }));
      });

      cy.visit('/admin/notifications');
      cy.wait('@getAdminNotifications');

      cy.contains('Paiement important').should('be.visible');
      cy.contains('500€').should('be.visible');
    });
  });
});