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

  return response.json();
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