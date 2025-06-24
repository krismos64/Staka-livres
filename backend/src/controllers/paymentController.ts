import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { stripeService } from "../services/stripeService";

const prisma = new PrismaClient();

export const paymentController = {
  // Créer une session de paiement
  async createCheckoutSession(req: Request, res: Response) {
    try {
      const { commandeId, priceId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      // Vérifier que la commande appartient à l'utilisateur
      const commande = await prisma.commande.findFirst({
        where: {
          id: commandeId,
          userId: userId,
        },
      });

      if (!commande) {
        return res.status(404).json({ error: "Commande non trouvée" });
      }

      const session = await stripeService.createCheckoutSession({
        priceId,
        userId,
        commandeId,
        successUrl: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Erreur création session paiement:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  },

  // Webhook Stripe
  async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers["stripe-signature"] as string;
      const body = req.body;

      if (!signature) {
        return res.status(400).json({ error: "Signature manquante" });
      }

      const event = stripeService.constructEvent(body, signature);

      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object as any;
          const { userId, commandeId } = session.metadata;

          // Mettre à jour le statut de la commande
          await prisma.commande.update({
            where: { id: commandeId },
            data: {
              statut: "EN_COURS",
              // stripeSessionId sera ajouté dans une migration ultérieure
            },
          });

          console.log(`✅ Paiement confirmé pour commande ${commandeId}`);
          break;

        default:
          console.log(`🔔 Événement non géré: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Erreur webhook Stripe:", error);
      res.status(400).json({ error: "Webhook invalide" });
    }
  },

  // Vérifier le statut d'un paiement
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await stripeService.retrieveSession(sessionId);

      res.json({
        status: session.payment_status,
        metadata: session.metadata,
      });
    } catch (error) {
      console.error("Erreur récupération session:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  },
};
