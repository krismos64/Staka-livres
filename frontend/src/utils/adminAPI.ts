import {
  Commande,
  CommandeStats,
  PaginatedResponse,
  StatutCommande,
  User,
  UserStats,
} from "../types/shared";
import { tokenUtils } from "./auth";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:3001";

interface UpdateCommandeRequest {
  statut: StatutCommande;
  noteCorrecteur?: string;
}

export const adminAPI = {
  // Stats
  async getUserStats(): Promise<UserStats> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/users/stats`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Erreur de récupération des stats utilisateurs"
      );
    }

    return data.data;
  },

  async getCommandeStats(): Promise<CommandeStats> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/commandes/stats`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Erreur de récupération des stats commandes"
      );
    }

    return data.data;
  },

  // Utilisateurs
  async getUsers(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/admin/users?page=${page}&limit=${limit}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Erreur de récupération des utilisateurs"
      );
    }

    return data;
  },

  async getUserById(id: string): Promise<User> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/user/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Erreur de récupération de l'utilisateur"
      );
    }

    return data.data;
  },

  // Commandes
  async getCommandes(
    page = 1,
    limit = 10,
    statut?: StatutCommande
  ): Promise<PaginatedResponse<Commande>> {
    const authHeaders = tokenUtils.getAuthHeader();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (statut) {
      params.append("statut", statut);
    }

    const response = await fetch(`${API_BASE_URL}/admin/commandes?${params}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération des commandes");
    }

    return data;
  },

  async getCommandeById(id: string): Promise<Commande> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/commande/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération de la commande");
    }

    return data.data;
  },

  async updateCommande(
    id: string,
    updates: UpdateCommandeRequest
  ): Promise<Commande> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/commande/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de mise à jour de la commande");
    }

    return data.data;
  },
};
