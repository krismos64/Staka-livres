import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface DernierPaiement {
  id: string;
  montant: number;
  date: string;
  clientNom: string;
  clientEmail: string;
  projetTitre: string;
}

export interface MonthlyStats {
  months: string[];
  revenue: number[];
  newUsers: number[];
  orders: number[];
  derniersPaiements: DernierPaiement[];
}

export class AdminStatsService {
  static async getMonthlyStats(): Promise<MonthlyStats> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Get revenue from paid invoices
    const revenueData = await prisma.invoice.groupBy({
      by: ['createdAt'],
      where: {
        status: 'PAID',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Get new users count
    const usersData = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get orders count
    const ordersData = await prisma.commande.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get recent payments (last 10)
    const recentPayments = await prisma.invoice.findMany({
      where: {
        status: 'PAID',
      },
      include: {
        commande: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Create 12 month array
    const months: string[] = [];
    const revenueMap = new Map<string, number>();
    const usersMap = new Map<string, number>();
    const ordersMap = new Map<string, number>();

    // Generate month strings and initialize maps
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      months.push(monthKey);
      revenueMap.set(monthKey, 0);
      usersMap.set(monthKey, 0);
      ordersMap.set(monthKey, 0);
    }

    // Process revenue data (convert from centimes to euros)
    revenueData.forEach((item) => {
      const monthKey = item.createdAt.toISOString().slice(0, 7);
      const currentValue = revenueMap.get(monthKey) || 0;
      const amountInEuros = Number(item._sum.amount || 0) / 100;
      revenueMap.set(monthKey, currentValue + amountInEuros);
    });

    // Process users data
    usersData.forEach((item) => {
      const monthKey = item.createdAt.toISOString().slice(0, 7);
      const currentValue = usersMap.get(monthKey) || 0;
      usersMap.set(monthKey, currentValue + (item._count.id || 0));
    });

    // Process orders data
    ordersData.forEach((item) => {
      const monthKey = item.createdAt.toISOString().slice(0, 7);
      const currentValue = ordersMap.get(monthKey) || 0;
      ordersMap.set(monthKey, currentValue + (item._count.id || 0));
    });

    // Convert to arrays
    const revenue = months.map(month => revenueMap.get(month) || 0);
    const newUsers = months.map(month => usersMap.get(month) || 0);
    const orders = months.map(month => ordersMap.get(month) || 0);

    // Format recent payments
    const derniersPaiements: DernierPaiement[] = recentPayments.map(invoice => ({
      id: invoice.id,
      montant: Number(invoice.amount) / 100, // Convert to euros
      date: invoice.createdAt.toISOString(),
      clientNom: invoice.commande?.user ? `${invoice.commande.user.prenom} ${invoice.commande.user.nom}` : 'Client inconnu',
      clientEmail: invoice.commande?.user?.email || 'Email inconnu',
      projetTitre: invoice.commande?.titre || 'Projet sans titre',
    }));

    return {
      months,
      revenue,
      newUsers,
      orders,
      derniersPaiements,
    };
  }
}