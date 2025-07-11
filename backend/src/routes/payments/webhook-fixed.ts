import { PrismaClient } from "@prisma/client";
import express from "express";
import { notifyAdminNewPayment, notifyPaymentSuccess } from "../../controllers/notificationsController";
import { InvoiceService } from "../../services/invoiceService";
import { stripeService } from "../../services/stripeService";
import { AuditService, AUDIT_ACTIONS } from "../../services/auditService";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Webhook Stripe pour recevoir les notifications de paiement
 * Route: POST /payments/webhook
 *
 * Cette route reçoit les événements Stripe et met à jour les commandes
 * en fonction du statut de paiement.
 */
router.post("/", async (req: express.Request, res: express.Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const rawBody = req.body as Buffer;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'Stripe Webhook';

  if (!signature) {
    console.error("❌ [Stripe Webhook] Signature manquante");
    
    // Log tentative d'accès webhook sans signature
    await AuditService.logSecurityEvent(
      'webhook',
      'WEBHOOK_UNAUTHORIZED_ACCESS',
      { error: 'Missing signature' },
      ip,
      userAgent,
      'HIGH'
    );
    
    return res.status(400).json({
      error: "Signature Stripe manquante",
      received: false,
    });
  }

  let event: any;

  try {
    // Vérifier la signature du webhook avec le service Stripe
    event = stripeService.constructEvent(rawBody, signature);

    console.log(
      `✅ [Stripe Webhook] Événement reçu: ${event.type} (ID: ${event.id})`
    );

    // Log réception du webhook
    await AuditService.logPaymentOperation(
      'stripe-webhook',
      event.id,
      'webhook',
      undefined,
      ip,
      userAgent
    );

  } catch (error) {
    console.error("❌ [Stripe Webhook] Erreur de signature:", error);
    
    // Log tentative d'accès webhook avec signature invalide
    await AuditService.logSecurityEvent(
      'webhook',
      'WEBHOOK_INVALID_SIGNATURE',
      { error: error.message },
      ip,
      userAgent,
      'CRITICAL'
    );
    
    return res.status(400).json({
      error: "Signature webhook invalide",
      received: false,
    });
  }

  try {
    // Traiter les événements selon leur type
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        console.log(`🎯 [Stripe Webhook] Session complétée: ${session.id}`);
        console.log(
          `📊 [Stripe Webhook] Statut paiement: ${session.payment_status}`
        );
        console.log(
          `💰 [Stripe Webhook] Montant: ${session.amount_total} ${session.currency}`
        );

        // Récupérer la commande correspondante par stripeSessionId
        const commande = await prisma.commande.findFirst({
          where: {
            stripeSessionId: session.id,
          },
          include: {
            user: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                email: true,
              },
            },
          },
        });

        if (!commande) {
          console.error(
            `❌ [Stripe Webhook] Commande non trouvée pour session: ${session.id}`
          );
          
          // Log commande non trouvée
          await AuditService.logPaymentOperation(
            'stripe-webhook',
            session.id,
            'webhook',
            session.amount_total,
            ip,
            userAgent
          );
          
          return res.status(404).json({
            error: "Commande non trouvée",
            received: false,
          });
        }

        // Mettre à jour le statut de paiement et de la commande
        const updatedCommande = await prisma.commande.update({
          where: { id: commande.id },
          data: {
            paymentStatus: "paid",
            statut: "EN_COURS", // Commande passe en cours après paiement
            updatedAt: new Date(),
          },
          include: {
            user: true, // Inclure l'utilisateur pour la facture
          },
        });

        console.log(`✅ [Stripe Webhook] Commande ${commande.id} mise à jour:`);
        console.log(`   - Statut paiement: ${updatedCommande.paymentStatus}`);
        console.log(`   - Statut commande: ${updatedCommande.statut}`);
        console.log(`   - Montant: ${session.amount_total} centimes`);
        console.log(
          `   - Client: ${commande.user.prenom} ${commande.user.nom} (${commande.user.email})`
        );
        console.log(`   - Titre: ${commande.titre}`);

        // Log paiement réussi
        await AuditService.logPaymentOperation(
          commande.user.email,
          session.id,
          'webhook',
          session.amount_total,
          ip,
          userAgent
        );

        // 🧾 Génération automatique de la facture
        try {
          console.log(`🧾 [Stripe Webhook] Génération de la facture...`);

          // Créer un objet commande avec le montant pour le service de facturation
          const commandeForInvoice = {
            ...updatedCommande,
            amount: session.amount_total, // Ajouter le montant depuis Stripe
          };

          await InvoiceService.processInvoiceForCommande(commandeForInvoice);
          
          console.log(
            `✅ [Stripe Webhook] Facture générée et envoyée avec succès`
          );

          // Log génération de facture
          await AuditService.logAdminAction(
            'stripe-webhook',
            'INVOICE_GENERATED',
            'invoice',
            commande.id,
            { 
              sessionId: session.id,
              amount: session.amount_total,
              customerEmail: commande.user.email 
            },
            ip,
            userAgent,
            'MEDIUM'
          );

        } catch (invoiceError) {
          console.error(
            `❌ [Stripe Webhook] Erreur lors de la génération de facture:`,
            invoiceError
          );
          
          // Log erreur de génération de facture
          await AuditService.logAdminAction(
            'stripe-webhook',
            'INVOICE_GENERATION_ERROR',
            'invoice',
            commande.id,
            { 
              sessionId: session.id,
              error: invoiceError.message 
            },
            ip,
            userAgent,
            'HIGH'
          );
          
          // On continue le traitement même si la facture échoue
          // Le webhook doit toujours retourner 200 à Stripe
        }

        // 🔔 Créer des notifications pour le paiement
        try {
          // Notification pour le client
          await notifyPaymentSuccess(
            commande.user.id,
            session.amount_total,
            commande.titre
          );

          // Notification pour les admins
          await notifyAdminNewPayment(
            `${commande.user.prenom} ${commande.user.nom}`,
            session.amount_total,
            commande.titre
          );

          console.log(
            `✅ [Stripe Webhook] Notifications de paiement créées avec succès`
          );
        } catch (notificationError) {
          console.error(
            `❌ [Stripe Webhook] Erreur lors de la création des notifications:`,
            notificationError
          );
          // On continue le traitement même si les notifications échouent
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;

        console.log(`❌ [Stripe Webhook] Paiement échoué: ${paymentIntent.id}`);
        console.log(
          `📝 [Stripe Webhook] Raison: ${
            paymentIntent.last_payment_error?.message || "Non spécifiée"
          }`
        );

        // Log échec de paiement
        await AuditService.logPaymentOperation(
          'stripe-webhook',
          paymentIntent.id,
          'webhook',
          paymentIntent.amount,
          ip,
          userAgent
        );

        // Chercher la commande via les métadonnées
        if (paymentIntent.metadata?.commandeId) {
          const commande = await prisma.commande.update({
            where: { id: paymentIntent.metadata.commandeId },
            data: {
              paymentStatus: "failed",
              updatedAt: new Date(),
            },
            include: {
              user: true,
            },
          });

          console.log(
            `📝 [Stripe Webhook] Commande ${commande.id} marquée comme paiement échoué`
          );

          // Log mise à jour de commande
          await AuditService.logAdminAction(
            'stripe-webhook',
            'COMMAND_PAYMENT_FAILED',
            'command',
            commande.id,
            { 
              paymentIntentId: paymentIntent.id,
              error: paymentIntent.last_payment_error?.message,
              customerEmail: commande.user.email
            },
            ip,
            userAgent,
            'HIGH'
          );

        } else {
          console.warn(
            `⚠️ [Stripe Webhook] Pas d'ID commande dans les métadonnées du PaymentIntent`
          );
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;

        console.log(`💳 [Stripe Webhook] Facture payée: ${invoice.id}`);
        console.log(
          `💰 [Stripe Webhook] Montant: ${invoice.amount_paid} ${invoice.currency}`
        );

        // Log paiement de facture
        await AuditService.logPaymentOperation(
          'stripe-webhook',
          invoice.id,
          'webhook',
          invoice.amount_paid,
          ip,
          userAgent
        );

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;

        console.log(
          `❌ [Stripe Webhook] Paiement facture échoué: ${invoice.id}`
        );
        console.log(
          `💰 [Stripe Webhook] Montant: ${invoice.amount_due} ${invoice.currency}`
        );

        // Log échec paiement facture
        await AuditService.logPaymentOperation(
          'stripe-webhook',
          invoice.id,
          'webhook',
          invoice.amount_due,
          ip,
          userAgent
        );

        break;
      }

      default: {
        console.log(`🔔 [Stripe Webhook] Événement non géré: ${event.type}`);
        console.log(
          `📄 [Stripe Webhook] Données:`,
          JSON.stringify(event.data.object, null, 2)
        );

        // Log événement non géré
        await AuditService.logPaymentOperation(
          'stripe-webhook',
          event.id,
          'webhook',
          undefined,
          ip,
          userAgent
        );

        // Log pour analytics ou debug
        console.log(
          `⚠️ [Stripe Webhook] Événement ${event.type} ignoré - pas de handler configuré`
        );
        break;
      }
    }

    // Confirmer la réception du webhook
    console.log(
      `✅ [Stripe Webhook] Événement ${event.type} traité avec succès`
    );
    res.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error(`❌ [Stripe Webhook] Erreur lors du traitement:`, error);

    // Log détaillé pour debug
    if (error instanceof Error) {
      console.error(`📝 [Stripe Webhook] Message d'erreur: ${error.message}`);
      console.error(`📍 [Stripe Webhook] Stack trace:`, error.stack);
    }

    // Log erreur de traitement
    await AuditService.logPaymentOperation(
      'stripe-webhook',
      event?.id || 'unknown',
      'webhook',
      undefined,
      ip,
      userAgent
    );

    res.status(500).json({
      error: "Erreur interne lors du traitement du webhook",
      received: false,
    });
  }
});

export default router;