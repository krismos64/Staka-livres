import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { stripeService } from "../services/stripeService";
import { AuditService, AUDIT_ACTIONS } from "../services/auditService";

const prisma = new PrismaClient();

// Helper pour extraire les infos de la requête
const getRequestInfo = (req: Request) => ({
  ip: req.ip || req.connection.remoteAddress || 'unknown',
  userAgent: req.get('user-agent') || 'unknown',
  userEmail: req.user?.email || 'unknown',
});

export const paymentController = {
  // Créer une session de paiement
  async createCheckoutSession(req: Request, res: Response) {
    const { ip, userAgent, userEmail } = getRequestInfo(req);
    
    try {
      const { commandeId, priceId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        await AuditService.logSecurityEvent(
          userEmail,
          'PAYMENT_UNAUTHORIZED_ACCESS',
          { action: 'CREATE_CHECKOUT_SESSION', commandeId, priceId },
          ip,
          userAgent,
          'HIGH'
        );
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      // Log tentative de création de session
      await AuditService.logPaymentOperation(
        userEmail,
        'pending',
        'create',
        undefined,
        ip,
        userAgent
      );

      // Vérifier que la commande appartient à l'utilisateur
      const commande = await prisma.commande.findFirst({
        where: {
          id: commandeId,
          userId: userId,
        },
      });

      if (!commande) {
        await AuditService.logSecurityEvent(
          userEmail,
          'PAYMENT_UNAUTHORIZED_COMMAND_ACCESS',
          { action: 'CREATE_CHECKOUT_SESSION', commandeId, userId },
          ip,
          userAgent,
          'HIGH'
        );
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

      // Log création de session réussie
      await AuditService.logPaymentOperation(
        userEmail,
        session.id,
        'create',
        session.amount_total,
        ip,
        userAgent
      );

      console.log(`✅ [Payment] ${userEmail} - Session créée: ${session.id} pour commande ${commandeId}`);

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("❌ [Payment] Erreur création session paiement:", error);
      
      await AuditService.logPaymentOperation(
        userEmail,
        'error',
        'create',
        undefined,
        ip,
        userAgent
      );

      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  },

  // Vérifier le statut d'un paiement
  async getPaymentStatus(req: Request, res: Response) {
    const { ip, userAgent, userEmail } = getRequestInfo(req);
    
    try {
      const { sessionId } = req.params;

      // Log consultation de statut
      await AuditService.logPaymentOperation(
        userEmail,
        sessionId,
        'check',
        undefined,
        ip,
        userAgent
      );

      const session = await stripeService.retrieveSession(sessionId);

      // Vérifier que la session appartient à l'utilisateur
      const commande = await prisma.commande.findFirst({
        where: {
          stripeSessionId: sessionId,
          userId: req.user?.id,
        },
      });

      if (!commande) {
        await AuditService.logSecurityEvent(
          userEmail,
          'PAYMENT_UNAUTHORIZED_SESSION_ACCESS',
          { action: 'GET_PAYMENT_STATUS', sessionId },
          ip,
          userAgent,
          'HIGH'
        );
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      console.log(`📊 [Payment] ${userEmail} - Consultation statut session ${sessionId}: ${session.payment_status}`);

      res.json({
        status: session.payment_status,
        metadata: session.metadata,
      });
    } catch (error) {
      console.error("❌ [Payment] Erreur récupération session:", error);
      
      await AuditService.logPaymentOperation(
        userEmail,
        req.params.sessionId,
        'check',
        undefined,
        ip,
        userAgent
      );

      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  },
};