import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import { stripeService } from "../services/stripeService";

const prisma = new PrismaClient();

// Schémas de validation
const setDefaultPaymentMethodSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID de moyen de paiement requis"),
  }),
});

const deletePaymentMethodSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID de moyen de paiement requis"),
  }),
});

const addPaymentMethodSchema = z.object({
  body: z.object({
    paymentMethodId: z.string().min(1, "ID du moyen de paiement Stripe requis"),
  }),
});

export const paymentMethodsController = {
  // POST /payment-methods/setup-intent - Créer un Setup Intent pour ajouter un moyen de paiement
  async createSetupIntent(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ 
          error: "Utilisateur introuvable" 
        });
      }

      // Créer un Setup Intent avec Stripe
      const setupIntent = await stripeService.createSetupIntent(user.email);

      res.json({ 
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id
      });
    } catch (error) {
      console.error("❌ [PaymentMethods] Erreur création Setup Intent:", error);
      res.status(500).json({ 
        error: "Erreur lors de la création du Setup Intent" 
      });
    }
  },

  // POST /payment-methods - Ajouter un nouveau moyen de paiement
  async addPaymentMethod(req: Request, res: Response) {
    try {
      const { body } = addPaymentMethodSchema.parse({ body: req.body });
      const userId = req.user!.id;

      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ 
          error: "Utilisateur introuvable" 
        });
      }

      // Récupérer les détails du moyen de paiement depuis Stripe
      const paymentMethodDetails = await stripeService.getPaymentMethodDetails(body.paymentMethodId);

      if (!paymentMethodDetails.card) {
        return res.status(400).json({ 
          error: "Type de moyen de paiement non supporté" 
        });
      }

      // Vérifier si c'est le premier moyen de paiement (sera par défaut)
      const existingPaymentMethods = await prisma.paymentMethod.findMany({
        where: { userId, isActive: true },
      });
      const isDefault = existingPaymentMethods.length === 0;

      // Enregistrer dans la base de données
      const newPaymentMethod = await prisma.paymentMethod.create({
        data: {
          userId,
          stripePaymentMethodId: body.paymentMethodId,
          brand: paymentMethodDetails.card.brand,
          last4: paymentMethodDetails.card.last4,
          expMonth: paymentMethodDetails.card.exp_month,
          expYear: paymentMethodDetails.card.exp_year,
          fingerprint: paymentMethodDetails.card.fingerprint,
          isDefault,
          isActive: true,
        },
      });

      // Si c'est maintenant le moyen de paiement par défaut, désactiver les autres
      if (isDefault && existingPaymentMethods.length > 0) {
        await prisma.paymentMethod.updateMany({
          where: {
            userId,
            id: { not: newPaymentMethod.id },
          },
          data: {
            isDefault: false,
          },
        });
      }

      res.status(201).json({ 
        success: true, 
        message: "Moyen de paiement ajouté avec succès",
        paymentMethod: {
          id: newPaymentMethod.id,
          brand: newPaymentMethod.brand,
          last4: newPaymentMethod.last4,
          expMonth: newPaymentMethod.expMonth,
          expYear: newPaymentMethod.expYear,
          isDefault: newPaymentMethod.isDefault,
        }
      });
    } catch (error) {
      console.error("❌ [PaymentMethods] Erreur ajout moyen de paiement:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Paramètres invalides" 
        });
      }
      
      res.status(500).json({ 
        error: "Erreur lors de l'ajout du moyen de paiement" 
      });
    }
  },

  // GET /payment-methods
  async getPaymentMethods(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Récupérer les moyens de paiement depuis la base de données
      const paymentMethods = await prisma.paymentMethod.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          brand: true,
          last4: true,
          expMonth: true,
          expYear: true,
          isDefault: true,
          createdAt: true,
        },
      });

      // Formater la réponse selon les spécifications
      const formattedPaymentMethods = paymentMethods.map((pm: any) => ({
        id: pm.id,
        brand: pm.brand,
        last4: pm.last4,
        expMonth: pm.expMonth,
        expYear: pm.expYear,
        isDefault: pm.isDefault,
      }));

      res.json(formattedPaymentMethods);
    } catch (error) {
      console.error("❌ [PaymentMethods] Erreur récupération:", error);
      res.status(500).json({ 
        error: "Erreur lors de la récupération des moyens de paiement" 
      });
    }
  },

  // PUT /payment-methods/:id/default
  async setDefaultPaymentMethod(req: Request, res: Response) {
    try {
      const { params } = setDefaultPaymentMethodSchema.parse({ params: req.params });
      const userId = req.user!.id;

      // Vérifier que le moyen de paiement appartient à l'utilisateur
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          id: params.id,
          userId,
          isActive: true,
        },
      });

      if (!paymentMethod) {
        return res.status(404).json({ 
          error: "Moyen de paiement introuvable" 
        });
      }

      // Récupérer l'utilisateur pour obtenir son stripeCustomerId
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ 
          error: "Utilisateur introuvable" 
        });
      }

      // Mettre à jour dans Stripe si pas en mode mock
      await stripeService.setDefaultPaymentMethod(
        paymentMethod.stripePaymentMethodId,
        user.email
      );

      // Mettre à jour dans la base de données
      await prisma.$transaction([
        // Enlever le statut par défaut de tous les autres moyens de paiement
        prisma.paymentMethod.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        }),
        // Définir le nouveau moyen de paiement par défaut
        prisma.paymentMethod.update({
          where: {
            id: params.id,
          },
          data: {
            isDefault: true,
          },
        }),
      ]);

      res.json({ 
        success: true, 
        message: "Moyen de paiement par défaut mis à jour" 
      });
    } catch (error) {
      console.error("❌ [PaymentMethods] Erreur définition par défaut:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Paramètres invalides" 
        });
      }
      
      res.status(500).json({ 
        error: "Erreur lors de la mise à jour du moyen de paiement par défaut" 
      });
    }
  },

  // DELETE /payment-methods/:id
  async deletePaymentMethod(req: Request, res: Response) {
    try {
      const { params } = deletePaymentMethodSchema.parse({ params: req.params });
      const userId = req.user!.id;

      // Vérifier que le moyen de paiement appartient à l'utilisateur
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          id: params.id,
          userId,
          isActive: true,
        },
      });

      if (!paymentMethod) {
        return res.status(404).json({ 
          error: "Moyen de paiement introuvable" 
        });
      }

      // Détacher le moyen de paiement de Stripe si pas en mode mock
      await stripeService.detachPaymentMethod(paymentMethod.stripePaymentMethodId);

      // Marquer comme inactif dans la base de données (soft delete)
      await prisma.paymentMethod.update({
        where: {
          id: params.id,
        },
        data: {
          isActive: false,
          isDefault: false,
        },
      });

      res.json({ 
        success: true, 
        message: "Moyen de paiement supprimé" 
      });
    } catch (error) {
      console.error("❌ [PaymentMethods] Erreur suppression:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Paramètres invalides" 
        });
      }
      
      res.status(500).json({ 
        error: "Erreur lors de la suppression du moyen de paiement" 
      });
    }
  },
};