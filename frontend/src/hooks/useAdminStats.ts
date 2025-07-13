import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

export interface DernierPaiement {
  id: string;
  montant: number;
  date: string;
  clientNom: string;
  clientEmail: string;
  projetTitre: string;
}

export interface StatistiquesAdmin {
  chiffreAffairesMois: number;
  evolutionCA: number;
  nouvellesCommandesMois: number;
  evolutionCommandes: number;
  nouveauxClientsMois: number;
  evolutionClients: number;
  derniersPaiements: DernierPaiement[];
  satisfactionMoyenne: number;
  nombreAvisTotal: number;
  resumeMois: {
    periode: string;
    totalCA: number;
    totalCommandes: number;
    totalClients: number;
  };
}

export interface MonthlyStats {
  months: string[];
  revenue: number[];
  newUsers: number[];
  orders: number[];
  derniersPaiements: DernierPaiement[];
}

const getCurrentMonthName = (): string => {
  const now = new Date();
  return now.toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });
};

const calculateEvolution = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const transformMonthlyStatsToAdminStats = (monthlyStats: MonthlyStats): StatistiquesAdmin => {
  const { months, revenue, newUsers, orders, derniersPaiements } = monthlyStats;
  
  // Get current month (last month in array) and previous month
  const currentMonthRevenue = revenue[revenue.length - 1] || 0;
  const previousMonthRevenue = revenue[revenue.length - 2] || 0;
  
  const currentMonthOrders = orders[orders.length - 1] || 0;
  const previousMonthOrders = orders[orders.length - 2] || 0;
  
  const currentMonthUsers = newUsers[newUsers.length - 1] || 0;
  const previousMonthUsers = newUsers[newUsers.length - 2] || 0;
  
  // Calculate totals for resume
  const totalCA = revenue.reduce((sum, amount) => sum + amount, 0);
  const totalCommandes = orders.reduce((sum, count) => sum + count, 0);
  const totalClients = newUsers.reduce((sum, count) => sum + count, 0);
  
  return {
    chiffreAffairesMois: currentMonthRevenue,
    evolutionCA: calculateEvolution(currentMonthRevenue, previousMonthRevenue),
    nouvellesCommandesMois: currentMonthOrders,
    evolutionCommandes: calculateEvolution(currentMonthOrders, previousMonthOrders),
    nouveauxClientsMois: currentMonthUsers,
    evolutionClients: calculateEvolution(currentMonthUsers, previousMonthUsers),
    derniersPaiements: derniersPaiements || [],
    satisfactionMoyenne: 4.8, // Mock data
    nombreAvisTotal: 127, // Mock data
    resumeMois: {
      periode: getCurrentMonthName(),
      totalCA: totalCA,
      totalCommandes: totalCommandes,
      totalClients: totalClients,
    },
  };
};

const fetchAdminStats = async (): Promise<StatistiquesAdmin> => {
  const response = await fetch(buildApiUrl("/admin/stats"), {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  const monthlyStats: MonthlyStats = await response.json();
  return transformMonthlyStatsToAdminStats(monthlyStats);
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};