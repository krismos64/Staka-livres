import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";

const prisma = new PrismaClient();

// Schémas de validation
const annualStatsSchema = z.object({
  query: z.object({
    year: z.string().regex(/^\d{4}$/, "Année invalide").transform(Number),
  }),
});

export const statsController = {
  // GET /stats/annual?year=2025
  async getAnnualStats(req: Request, res: Response) {
    try {
      const { query } = annualStatsSchema.parse({ query: req.query });
      const userId = req.user!.id;
      const { year } = query;

      // Créer les dates de début et fin de l'année
      const startOfYear = new Date(year, 0, 1); // 1er janvier
      const endOfYear = new Date(year + 1, 0, 1); // 1er janvier de l'année suivante

      // Requête pour agréger les données des commandes payées dans l'année
      const statsData = await prisma.commande.aggregate({
        where: {
          userId,
          // Commandes payées dans l'année
          paymentStatus: "paid",
          updatedAt: {
            gte: startOfYear,
            lt: endOfYear,
          },
        },
        _sum: {
          amount: true, // Somme des montants
        },
        _count: {
          id: true, // Nombre de commandes
        },
      });

      // Calculer le nombre total de pages corrigées
      // Pour l'instant, on utilise une estimation basée sur le montant (1 page = ~2€)
      // Dans une vraie implémentation, il faudrait ajouter un champ "pages" au modèle Commande
      const totalAmount = statsData._sum.amount || 0;
      const estimatedPages = Math.round(totalAmount / 200); // 200 centimes = 2€ par page

      // Formater la réponse selon les spécifications
      const response = {
        totalSpent: totalAmount,
        pagesCorrected: estimatedPages,
        orders: statsData._count.id,
      };

      res.json(response);
    } catch (error) {
      console.error("❌ [Stats] Erreur récupération stats annuelles:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Paramètres invalides" 
        });
      }
      
      res.status(500).json({ 
        error: "Erreur lors de la récupération des statistiques annuelles" 
      });
    }
  },
};