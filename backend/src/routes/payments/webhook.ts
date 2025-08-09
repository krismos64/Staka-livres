import { PrismaClient } from "@prisma/client";
import express from "express";
import { notifyAdminNewPayment, notifyPaymentSuccess, notifyClientCommandeCreated } from "../../controllers/notificationsController";
import { InvoiceService } from "../../services/invoiceService";
import { stripeService } from "../../services/stripeService";
import { ActivationEmailService } from "../../services/activationEmailService";
import { WelcomeConversationService } from "../../services/welcomeConversationService";
import bcrypt from "bcryptjs";

const router = express.Router();

// Export prisma instance for testing
export let prisma = new PrismaClient();

// Allow replacing prisma instance for testing
export const setPrismaInstance = (newPrisma: PrismaClient) => {
  prisma = newPrisma;
};

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

        // Tenter de récupérer une commande existante d'abord
        let commande = await prisma.commande.findFirst({
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

        if (commande) {
          // 🟢 FLUX CLASSIQUE : Commande existante
          console.log(`🔄 [Stripe Webhook] Traitement commande existante: ${commande.id}`);
          
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
        } else {
          // 🟡 NOUVEAU FLUX : Commande invitée (PendingCommande)
          console.log(`🆕 [Stripe Webhook] Recherche PendingCommande pour session: ${session.id}`);
          
          const pendingCommande = await prisma.pendingCommande.findFirst({
            where: {
              stripeSessionId: session.id,
              isProcessed: false,
            },
          });

          if (!pendingCommande) {
            console.error(
              `❌ [Stripe Webhook] Aucune commande ou PendingCommande trouvée pour session: ${session.id}`
            );
            return res.status(404).json({
              error: "Commande non trouvée",
              received: false,
            });
          }

          console.log(`🎯 [Stripe Webhook] PendingCommande trouvée: ${pendingCommande.id} pour ${pendingCommande.email}`);

          try {
            // 👤 ÉTAPE 1: Vérifier si l'utilisateur existe déjà ou le créer
            let targetUser = await prisma.user.findUnique({
              where: { email: pendingCommande.email }
            });

            if (targetUser) {
              // 🔄 UTILISATEUR EXISTANT : Projet d'un utilisateur connecté
              console.log(`👤 [Stripe Webhook] Utilisateur existant trouvé: ${targetUser.id} - ${targetUser.email}`);
            } else {
              // 🆕 NOUVEL UTILISATEUR : Commande publique (invité)
              targetUser = await prisma.user.create({
                data: {
                  prenom: pendingCommande.prenom,
                  nom: pendingCommande.nom,
                  email: pendingCommande.email,
                  password: pendingCommande.passwordHash === "PENDING_ACTIVATION" 
                    ? await bcrypt.hash("temporary_password_" + Date.now(), 12) // Mot de passe temporaire sécurisé
                    : pendingCommande.passwordHash, // Rétrocompatibilité
                  telephone: pendingCommande.telephone,
                  // adresse collectée par Stripe automatiquement
                  isActive: false, // ⚠️ INACTIF en attendant activation + définition mot de passe
                  role: "USER",
                },
              });
              console.log(`👤 [Stripe Webhook] Nouvel utilisateur créé (inactif): ${targetUser.id} - ${targetUser.email}`);
            }

            // 📋 ÉTAPE 2: Récupérer les détails du service
            const service = await prisma.tarif.findFirst({
              where: { id: pendingCommande.serviceId },
              select: { nom: true, description: true }
            });

            const serviceTitle = service?.nom || "Service de correction";
            const serviceDescription = service?.description || "Correction professionnelle de manuscrit";

            // 📝 ÉTAPE 3: Créer la commande
            // Combiner la description du service avec la description du client
            const finalDescription = pendingCommande.description 
              ? `${serviceDescription}\n\n--- Description du client ---\n${pendingCommande.description}`
              : serviceDescription;

            const newCommande = await prisma.commande.create({
              data: {
                userId: targetUser.id,
                titre: serviceTitle,
                description: finalDescription, // Description combinée service + client
                statut: "PAYEE", // Directement payée
                paymentStatus: "paid",
                stripeSessionId: session.id,
                amount: session.amount_total,
                packType: pendingCommande.serviceId, // Référence au service
                pagesDeclarees: pendingCommande.nombrePages, // Transférer le nombre de pages déclaré
              },
            });

            console.log(`📝 [Stripe Webhook] Commande créée: ${newCommande.id} - ${newCommande.titre}`);

            // 🔗 ÉTAPE 4: Lier PendingCommande aux entités créées
            await prisma.pendingCommande.update({
              where: { id: pendingCommande.id },
              data: {
                userId: targetUser.id,
                commandeId: newCommande.id,
                isProcessed: true, // Marquer comme traité
              },
            });

            // 🔑 ÉTAPE 5: Générer token d'activation et envoyer email (seulement pour nouveaux utilisateurs)
            if (!targetUser.isActive) {
              try {
                await ActivationEmailService.sendActivationEmail(
                  {
                    id: pendingCommande.id,
                    prenom: pendingCommande.prenom,
                    nom: pendingCommande.nom,
                    email: pendingCommande.email,
                    activationToken: pendingCommande.activationToken,
                  },
                  newCommande.titre
                );

                console.log(`📧 [Stripe Webhook] Email d'activation envoyé à ${pendingCommande.email}`);
              } catch (emailError) {
                console.error(`❌ [Stripe Webhook] Erreur email d'activation:`, emailError);
                // Ne pas faire échouer le webhook pour un problème d'email
              }
            } else {
              console.log(`✅ [Stripe Webhook] Utilisateur déjà actif, pas d'email d'activation nécessaire`);
            }

            // 🧾 ÉTAPE 6: Génération de la facture
            try {
              const commandeForInvoice = {
                ...newCommande,
                user: targetUser,
                amount: session.amount_total,
              };

              await InvoiceService.processInvoiceForCommande(commandeForInvoice);
              console.log(`✅ [Stripe Webhook] Facture générée pour la commande`);
            } catch (invoiceError) {
              console.error(`❌ [Stripe Webhook] Erreur génération facture:`, invoiceError);
            }

            // 🔔 ÉTAPE 7: Notifications admin
            try {
              await notifyAdminNewPayment(
                `${pendingCommande.prenom} ${pendingCommande.nom}`,
                session.amount_total,
                newCommande.titre
              );

              console.log(`✅ [Stripe Webhook] Notification admin envoyée pour commande invitée`);
            } catch (notificationError) {
              console.error(`❌ [Stripe Webhook] Erreur notification admin:`, notificationError);
            }

            // 💬 ÉTAPE 8: Créer conversation initiale de bienvenue (seulement pour nouveaux utilisateurs)
            if (!targetUser.isActive) {
              try {
                await WelcomeConversationService.createWelcomeConversation(
                  {
                    id: targetUser.id,
                    prenom: targetUser.prenom,
                    nom: targetUser.nom,
                    email: targetUser.email
                  },
                  {
                    id: newCommande.id,
                    titre: newCommande.titre
                  }
                );
                console.log(`💬 [Stripe Webhook] Conversation de bienvenue créée pour ${pendingCommande.email}`);
              } catch (conversationError) {
                console.error(`❌ [Stripe Webhook] Erreur création conversation:`, conversationError);
                // Ne pas faire échouer le flux pour un problème de conversation
              }
            } else {
              console.log(`✅ [Stripe Webhook] Utilisateur existant, pas de conversation de bienvenue nécessaire`);
            }

            // 📎 ÉTAPE FINALE: Migrer les fichiers temporaires vers la vraie commande
            try {
              // Chercher les fichiers temporaires associés à cette pendingCommande
              const tempFiles = await prisma.file.findMany({
                where: {
                  description: {
                    startsWith: `TEMP_PENDING:${pendingCommande.id}|`
                  },
                  commandeId: null
                }
              });

              if (tempFiles.length > 0) {
                console.log(`📎 [Stripe Webhook] Migration de ${tempFiles.length} fichier(s) temporaire(s) vers la commande ${newCommande.id}`);
                
                // Mettre à jour chaque fichier individuellement pour restaurer la description originale
                for (const tempFile of tempFiles) {
                  const originalDescription = tempFile.description?.replace(`TEMP_PENDING:${pendingCommande.id}|`, '') || null;
                  
                  await prisma.file.update({
                    where: { id: tempFile.id },
                    data: {
                      uploadedById: targetUser.id,
                      commandeId: newCommande.id,
                      description: originalDescription
                    }
                  });
                }

                console.log(`✅ [Stripe Webhook] ${tempFiles.length} fichier(s) migré(s) avec succès`);
              }
            } catch (fileError) {
              console.error(`❌ [Stripe Webhook] Erreur migration fichiers:`, fileError);
              // Ne pas faire échouer le flux pour un problème de fichier
            }

            // 🔔 ÉTAPE FINALE: Notifier le client que son projet a été créé après paiement
            try {
              if (targetUser.isActive) {
                // Pour utilisateur existant : notification de projet créé
                await notifyClientCommandeCreated(
                  targetUser.id,
                  newCommande.titre,
                  newCommande.id,
                  service?.nom || "correction"
                );
                console.log(`🔔 [Stripe Webhook] Notification client envoyée pour projet créé après paiement`);
              }
              // Pour nouveaux utilisateurs, la notification sera envoyée lors de l'activation
            } catch (clientNotifError) {
              console.error(`❌ [Stripe Webhook] Erreur notification client:`, clientNotifError);
            }

            console.log(`🎉 [Stripe Webhook] Flux commande complété avec succès pour ${pendingCommande.email}`);

          } catch (processingError) {
            console.error(`❌ [Stripe Webhook] Erreur lors du traitement PendingCommande:`, processingError);
            // En cas d'erreur, marquer comme non traitée pour retry manuel
            throw processingError;
          }
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
