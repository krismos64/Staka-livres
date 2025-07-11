import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { StatistiquesAdmin, DernierPaiement } from "../types/adminStats";

const prisma = new PrismaClient();

export const getAdminStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Chiffre d'affaires du mois en cours
    const currentMonthRevenue = await prisma.commande.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: startOfMonth },
        statut: "TERMINE"
      }
    });

    // Chiffre d'affaires du mois précédent
    const lastMonthRevenue = await prisma.commande.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        statut: "TERMINE"
      }
    });

    // Nouvelles commandes du mois
    const currentMonthOrders = await prisma.commande.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    });

    // Nouvelles commandes du mois précédent
    const lastMonthOrders = await prisma.commande.count({
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
      }
    });

    // Nouveaux clients du mois
    const currentMonthUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startOfMonth },
        role: "USER"
      }
    });

    // Nouveaux clients du mois précédent
    const lastMonthUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        role: "USER"
      }
    });

    // Derniers paiements (5 plus récents)
    const recentPayments = await prisma.commande.findMany({
      where: {
        statut: "TERMINE",
        amount: { gt: 0 }
      },
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 5
    });

    // Total des commandes pour satisfaction (mock pour l'instant)
    const totalCompletedOrders = await prisma.commande.count({
      where: { statut: "TERMINE" }
    });

    // Calculer les évolutions
    const currentRevenue = currentMonthRevenue._sum.amount || 0;
    const lastRevenue = lastMonthRevenue._sum.amount || 0;
    const evolutionCA = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    const evolutionCommandes = lastMonthOrders > 0 ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 : 0;
    const evolutionClients = lastMonthUsers > 0 ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

    // Formater les derniers paiements
    const derniersPaiements: DernierPaiement[] = recentPayments.map((payment: any) => ({
      id: payment.id,
      montant: payment.amount || 0,
      date: payment.updatedAt.toISOString(),
      clientNom: `${payment.user.prenom} ${payment.user.nom}`,
      clientEmail: payment.user.email,
      projetTitre: payment.titre
    }));

    const stats: StatistiquesAdmin = {
      chiffreAffairesMois: currentRevenue,
      evolutionCA: Math.round(evolutionCA * 100) / 100,
      nouvellesCommandesMois: currentMonthOrders,
      evolutionCommandes: Math.round(evolutionCommandes * 100) / 100,
      nouveauxClientsMois: currentMonthUsers,
      evolutionClients: Math.round(evolutionClients * 100) / 100,
      derniersPaiements,
      satisfactionMoyenne: 4.6,
      nombreAvisTotal: Math.floor(totalCompletedOrders * 0.7),
      resumeMois: {
        periode: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        totalCA: currentRevenue,
        totalCommandes: currentMonthOrders,
        totalClients: currentMonthUsers
      }
    };

    res.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    next(error);
  }
};