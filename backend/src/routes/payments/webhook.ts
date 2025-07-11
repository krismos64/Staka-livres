import { PrismaClient } from "@prisma/client";
import express from "express";
import { notifyAdminNewPayment, notifyPaymentSuccess } from "../../controllers/notificationsController";
import { InvoiceService } from "../../services/invoiceService";
import { stripeService } from "../../services/stripeService";

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

  if (!signature) {
    console.error("❌ [Stripe Webhook] Signature manquante");
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
  } catch (error) {
    console.error("❌ [Stripe Webhook] Erreur de signature:", error);
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
        } catch (invoiceError) {
          console.error(
            `❌ [Stripe Webhook] Erreur lors de la génération de facture:`,
            invoiceError
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

        // Chercher la commande via les métadonnées
        if (paymentIntent.metadata?.commandeId) {
          const commande = await prisma.commande.update({
            where: { id: paymentIntent.metadata.commandeId },
            data: {
              paymentStatus: "failed",
              updatedAt: new Date(),
            },
          });

          console.log(
            `📝 [Stripe Webhook] Commande ${commande.id} marquée comme paiement échoué`
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

        // TODO: Créer un enregistrement Invoice si le modèle existe
        // await prisma.invoice.create({
        //   data: {
        //     stripeInvoiceId: invoice.id,
        //     commandeId: invoice.metadata?.commandeId,
        //     amount: invoice.amount_paid,
        //     currency: invoice.currency,
        //     status: "paid",
        //     paidAt: new Date(invoice.status_transitions.paid_at! * 1000)
        //   }
        // });

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

        // TODO: Traiter l'échec de paiement de facture
        break;
      }

      default: {
        console.log(`🔔 [Stripe Webhook] Événement non géré: ${event.type}`);
        console.log(
          `📄 [Stripe Webhook] Données:`,
          JSON.stringify(event.data.object, null, 2)
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

    res.status(500).json({
      error: "Erreur interne lors du traitement du webhook",
      received: false,
    });
  }
});

export default router;
