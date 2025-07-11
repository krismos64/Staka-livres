import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

// Types pour les statistiques annuelles
export interface AnnualStats {
  totalSpent: number; // Montant total dépensé en centimes
  pagesCorrected: number; // Nombre total de pages corrigées
  orders: number; // Nombre total de commandes
}

// API function
async function fetchAnnualStats(year: number): Promise<AnnualStats> {
  const response = await fetch(buildApiUrl(`/stats/annual?year=${year}`), {
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
}

// Hook pour récupérer les statistiques annuelles
export function useAnnualStats(year: number) {
  return useQuery<AnnualStats, Error>({
    queryKey: ["annualStats", year],
    queryFn: () => fetchAnnualStats(year),
    enabled: !!year && year > 2000 && year <= new Date().getFullYear() + 1, // Validation de l'année
    staleTime: 5 * 60 * 1000, // 5 minutes - les stats changent rarement
    retry: 2,
    refetchOnWindowFocus: false,
  });
}