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
        successUrl: `${process.env.FRONTEND_URL}?payment=success`,
        cancelUrl: `${process.env.FRONTEND_URL}?payment=cancel`,
      });

      // Marquer la commande comme en attente de paiement
      await prisma.commande.update({
        where: { id: commandeId },
        data: {
          paymentStatus: "unpaid",
          stripeSessionId: session.id,
        },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Erreur création session paiement:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
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
