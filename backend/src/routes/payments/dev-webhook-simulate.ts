import { PrismaClient } from "@prisma/client";
import express from "express";
import { notifyAdminNewPayment } from "../../controllers/notificationsController";
import { InvoiceService } from "../../services/invoiceService";
import { ActivationEmailService } from "../../services/activationEmailService";
import { WelcomeConversationService } from "../../services/welcomeConversationService";

const router = express.Router();
const prisma = new PrismaClient();

// Middleware JSON pour cette route spécifique
router.use(express.json());

/**
 * Endpoint pour simuler un webhook Stripe en développement local
 * Route: POST /payments/dev-webhook-simulate
 * 
 * Simule le traitement d'une session Stripe payée quand les webhooks 
 * ne peuvent pas atteindre localhost
 */
router.post("/", async (req: express.Request, res: express.Response) => {
  const { sessionId } = req.body || {};

  if (!sessionId) {
    return res.status(400).json({
      error: "Session ID requis",
      message: "Veuillez fournir un sessionId Stripe"
    });
  }

  console.log(`🧪 [DEV WEBHOOK] Simulation traitement session: ${sessionId}`);

  try {
    // Chercher la PendingCommande
    const pendingCommande = await prisma.pendingCommande.findFirst({
      where: {
        stripeSessionId: sessionId,
      },
    });

    if (!pendingCommande) {
      return res.status(404).json({
        error: "Session non trouvée",
        message: `Aucune PendingCommande trouvée pour la session ${sessionId}`
      });
    }

    console.log(`🎯 [DEV WEBHOOK] PendingCommande trouvée: ${pendingCommande.id} pour ${pendingCommande.email}`);
    console.log(`📊 [DEV WEBHOOK] Statut isProcessed: ${pendingCommande.isProcessed}`);

    if (pendingCommande.isProcessed) {
      console.log(`⚠️ [DEV WEBHOOK] Cette commande a déjà été traitée !`);
      return res.json({
        success: true,
        message: "Commande déjà traitée",
        data: {
          pendingCommandeId: pendingCommande.id,
          email: pendingCommande.email,
          isProcessed: true
        }
      });
    }

    // Simuler un montant payé (récupéré depuis le service ou calculé)
    const mockAmountTotal = 48000; // 480€ par exemple

    // 👤 ÉTAPE 1: Créer l'utilisateur (inactif)
    const newUser = await prisma.user.create({
      data: {
        prenom: pendingCommande.prenom,
        nom: pendingCommande.nom,
        email: pendingCommande.email,
        password: pendingCommande.passwordHash, // Déjà hashé
        telephone: pendingCommande.telephone,
        adresse: pendingCommande.adresse,
        isActive: false, // ⚠️ INACTIF en attendant activation
        role: "USER",
      },
    });

    console.log(`👤 [DEV WEBHOOK] Utilisateur créé (inactif): ${newUser.id} - ${newUser.email}`);

    // 📋 ÉTAPE 2: Récupérer les détails du service
    const service = await prisma.tarif.findFirst({
      where: { id: pendingCommande.serviceId },
      select: { nom: true, description: true }
    });

    const serviceTitle = service?.nom || "Service de correction";
    const serviceDescription = service?.description || "Correction professionnelle de manuscrit";

    // 📝 ÉTAPE 3: Créer la commande
    const newCommande = await prisma.commande.create({
      data: {
        userId: newUser.id,
        titre: serviceTitle,
        description: serviceDescription,
        statut: "PAYEE", // Directement payée
        paymentStatus: "paid",
        stripeSessionId: sessionId,
        amount: mockAmountTotal,
        packType: pendingCommande.serviceId, // Référence au service
      },
    });

    console.log(`📝 [DEV WEBHOOK] Commande créée: ${newCommande.id} - ${newCommande.titre}`);

    console.log(`🔗 [DEV WEBHOOK] Début ÉTAPE 4: Lier PendingCommande...`);

    // 🔗 ÉTAPE 4: Lier PendingCommande aux entités créées et marquer comme traitée
    await prisma.pendingCommande.update({
      where: { id: pendingCommande.id },
      data: {
        userId: newUser.id,
        commandeId: newCommande.id,
        isProcessed: true, // ✅ Marquer comme traitée
      },
    });

    console.log(`✅ [DEV WEBHOOK] ÉTAPE 4 terminée, début ÉTAPE 5 activation...`);

    // 🔑 ÉTAPE 5: Générer token d'activation et envoyer email
    try {
      console.log(`🔑 [DEV WEBHOOK] Début envoi email d'activation à ${pendingCommande.email}`);
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

      console.log(`📧 [DEV WEBHOOK] Email d'activation envoyé à ${pendingCommande.email}`);
    } catch (emailError) {
      console.error(`❌ [DEV WEBHOOK] Erreur email d'activation:`, emailError);
    }

    // 🧾 ÉTAPE 6: Génération de la facture
    try {
      const commandeForInvoice = {
        ...newCommande,
        user: newUser,
        amount: mockAmountTotal,
      };

      await InvoiceService.processInvoiceForCommande(commandeForInvoice);
      console.log(`✅ [DEV WEBHOOK] Facture générée pour la commande invitée`);
    } catch (invoiceError) {
      console.error(`❌ [DEV WEBHOOK] Erreur génération facture:`, invoiceError);
    }

    // 🔔 ÉTAPE 7: Notifications admin
    try {
      await notifyAdminNewPayment(
        `${pendingCommande.prenom} ${pendingCommande.nom}`,
        mockAmountTotal,
        newCommande.titre
      );

      console.log(`✅ [DEV WEBHOOK] Notification admin envoyée pour commande invitée`);
    } catch (notificationError) {
      console.error(`❌ [DEV WEBHOOK] Erreur notification admin:`, notificationError);
    }

    // 💬 ÉTAPE 8: Créer conversation initiale de bienvenue
    try {
      await WelcomeConversationService.createWelcomeConversation(
        {
          id: newUser.id,
          prenom: newUser.prenom,
          nom: newUser.nom,
          email: newUser.email
        },
        {
          id: newCommande.id,
          titre: newCommande.titre
        }
      );
      console.log(`💬 [DEV WEBHOOK] Conversation de bienvenue créée pour ${pendingCommande.email}`);
    } catch (conversationError) {
      console.error(`❌ [DEV WEBHOOK] Erreur création conversation:`, conversationError);
    }

    // 📎 ÉTAPE 9: Migrer les fichiers temporaires vers la vraie commande
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
        console.log(`📎 [DEV WEBHOOK] Migration de ${tempFiles.length} fichier(s) temporaire(s) vers la commande ${newCommande.id}`);
        
        // Mettre à jour chaque fichier individuellement pour restaurer la description originale
        for (const tempFile of tempFiles) {
          const originalDescription = tempFile.description?.replace(`TEMP_PENDING:${pendingCommande.id}|`, '') || null;
          
          await prisma.file.update({
            where: { id: tempFile.id },
            data: {
              uploadedById: newUser.id,
              commandeId: newCommande.id,
              description: originalDescription
            }
          });
        }

        console.log(`✅ [DEV WEBHOOK] ${tempFiles.length} fichier(s) migré(s) avec succès`);
      }
    } catch (fileError) {
      console.error(`❌ [DEV WEBHOOK] Erreur migration fichiers:`, fileError);
      // Ne pas faire échouer le flux pour un problème de fichier
    }

    console.log(`🎉 [DEV WEBHOOK] Simulation flux commande invitée complétée avec succès pour ${pendingCommande.email}`);

    res.json({
      success: true,
      message: "Webhook simulé avec succès",
      data: {
        userId: newUser.id,
        commandeId: newCommande.id,
        pendingCommandeId: pendingCommande.id,
        email: pendingCommande.email,
        isProcessed: true
      }
    });

  } catch (error) {
    console.error(`❌ [DEV WEBHOOK] Erreur lors de la simulation:`, error);
    res.status(500).json({
      error: "Erreur lors de la simulation",
      message: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

export default router;