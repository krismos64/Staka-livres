import {
  Commande,
  CommandeStats,
  Facture,
  FactureStats,
  FAQ,
  LogEntry,
  PageStatique,
  PaginatedResponse,
  Role,
  StatistiquesAvancees,
  StatutCommande,
  StatutFacture,
  StatutPage,
  Tarif,
  TypeLog,
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

interface UpdateUserRequest {
  role?: Role;
  isActive?: boolean;
}

interface CreateFAQRequest {
  question: string;
  reponse: string;
  categorie: string;
  ordre: number;
  visible: boolean;
}

interface UpdateFAQRequest {
  question?: string;
  reponse?: string;
  categorie?: string;
  ordre?: number;
  visible?: boolean;
}

interface CreateTarifRequest {
  nom: string;
  description: string;
  prix: number;
  typeService: string;
  dureeEstimee?: string;
  actif: boolean;
  ordre: number;
}

interface UpdateTarifRequest {
  nom?: string;
  description?: string;
  prix?: number;
  typeService?: string;
  dureeEstimee?: string;
  actif?: boolean;
  ordre?: number;
}

interface CreatePageRequest {
  titre: string;
  slug: string;
  contenu: string;
  description?: string;
  statut: StatutPage;
}

interface UpdatePageRequest {
  titre?: string;
  slug?: string;
  contenu?: string;
  description?: string;
  statut?: StatutPage;
}

export const adminAPI = {
  // ===============================
  // DASHBOARD & STATS GÉNÉRALES
  // ===============================
  async getDashboardStats(): Promise<{
    userStats: UserStats;
    commandeStats: CommandeStats;
    factureStats: FactureStats;
  }> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération des stats");
    }

    return data.data;
  },

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

  // ===============================
  // GESTION UTILISATEURS
  // ===============================
  async getUsers(
    page = 1,
    limit = 10,
    search?: string,
    role?: Role
  ): Promise<PaginatedResponse<User>> {
    const authHeaders = tokenUtils.getAuthHeader();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (role) params.append("role", role);

    const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

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

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/user/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de mise à jour utilisateur");
    }

    return data.data;
  },

  async activateUser(id: string): Promise<User> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/user/${id}/activate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur d'activation utilisateur");
    }

    return data.data;
  },

  async deactivateUser(id: string): Promise<User> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/admin/user/${id}/deactivate`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de désactivation utilisateur");
    }

    return data.data;
  },

  async deleteUser(id: string): Promise<void> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/user/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erreur de suppression utilisateur");
    }
  },

  // ===============================
  // GESTION COMMANDES
  // ===============================
  async getCommandes(
    page = 1,
    limit = 10,
    statut?: StatutCommande,
    search?: string
  ): Promise<PaginatedResponse<Commande>> {
    const authHeaders = tokenUtils.getAuthHeader();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (statut) params.append("statut", statut);
    if (search) params.append("search", search);

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

  async deleteCommande(id: string): Promise<void> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/commande/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erreur de suppression de la commande");
    }
  },

  // ===============================
  // GESTION FACTURES
  // ===============================
  async getFactureStats(): Promise<FactureStats> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/invoices/stats`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Erreur de récupération des stats factures"
      );
    }

    return data.data;
  },

  async getFactures(
    page = 1,
    limit = 10,
    statut?: StatutFacture,
    search?: string
  ): Promise<PaginatedResponse<Facture>> {
    const authHeaders = tokenUtils.getAuthHeader();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (statut) params.append("statut", statut);
    if (search) params.append("search", search);

    const response = await fetch(`${API_BASE_URL}/admin/invoices?${params}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération des factures");
    }

    return data;
  },

  async getFactureById(id: string): Promise<Facture> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/invoice/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération de la facture");
    }

    return data.data;
  },

  async downloadFacture(id: string): Promise<Blob> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/admin/invoice/${id}/download`,
      {
        headers: {
          ...authHeaders,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erreur de téléchargement de la facture");
    }

    return response.blob();
  },

  async sendFactureReminder(id: string): Promise<void> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/admin/invoice/${id}/reminder`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erreur d'envoi de rappel");
    }
  },

  async deleteFacture(id: string): Promise<void> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/invoice/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erreur de suppression de la facture");
    }
  },

  // ===============================
  // GESTION FAQ
  // ===============================
  async getFAQ(categorie?: string, visible?: boolean): Promise<FAQ[]> {
    const authHeaders = tokenUtils.getAuthHeader();
    const params = new URLSearchParams();

    if (categorie) params.append("categorie", categorie);
    if (visible !== undefined) params.append("visible", visible.toString());

    const response = await fetch(`${API_BASE_URL}/admin/faq?${params}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération des FAQ");
    }

    return data.data;
  },

  async createFAQ(faq: CreateFAQRequest): Promise<FAQ> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/faq`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(faq),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de création de la FAQ");
    }

    return data.data;
  },

  async updateFAQ(id: string, updates: UpdateFAQRequest): Promise<FAQ> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/faq/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de mise à jour de la FAQ");
    }

    return data.data;
  },

  async reorderFAQ(id: string, newOrder: number): Promise<FAQ> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/faq/${id}/reorder`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ ordre: newOrder }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de réorganisation de la FAQ");
    }

    return data.data;
  },

  async deleteFAQ(id: string): Promise<void> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/faq/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erreur de suppression de la FAQ");
    }
  },

  // ===============================
  // GESTION TARIFS
  // ===============================
  async getTarifs(service?: string, actif?: boolean): Promise<Tarif[]> {
    const authHeaders = tokenUtils.getAuthHeader();
    const params = new URLSearchParams();

    if (service) params.append("service", service);
    if (actif !== undefined) params.append("actif", actif.toString());

    const response = await fetch(`${API_BASE_URL}/admin/tarifs?${params}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération des tarifs");
    }

    return data.data;
  },

  async createTarif(tarif: CreateTarifRequest): Promise<Tarif> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/tarif`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(tarif),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de création du tarif");
    }

    return data.data;
  },

  async updateTarif(id: string, updates: UpdateTarifRequest): Promise<Tarif> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/tarif/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de mise à jour du tarif");
    }

    return data.data;
  },

  async activateTarif(id: string): Promise<Tarif> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/tarif/${id}/activate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur d'activation du tarif");
    }

    return data.data;
  },

  async deactivateTarif(id: string): Promise<Tarif> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/admin/tarif/${id}/deactivate`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de désactivation du tarif");
    }

    return data.data;
  },

  async deleteTarif(id: string): Promise<void> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/tarif/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erreur de suppression du tarif");
    }
  },

  // ===============================
  // GESTION PAGES STATIQUES
  // ===============================
  async getPages(
    statut?: StatutPage,
    search?: string
  ): Promise<PageStatique[]> {
    const authHeaders = tokenUtils.getAuthHeader();
    const params = new URLSearchParams();

    if (statut) params.append("statut", statut);
    if (search) params.append("search", search);

    const response = await fetch(`${API_BASE_URL}/admin/pages?${params}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération des pages");
    }

    return data.data;
  },

  async getPageById(id: string): Promise<PageStatique> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/page/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération de la page");
    }

    return data.data;
  },

  async createPage(page: CreatePageRequest): Promise<PageStatique> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/page`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(page),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de création de la page");
    }

    return data.data;
  },

  async updatePage(
    id: string,
    updates: UpdatePageRequest
  ): Promise<PageStatique> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/page/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de mise à jour de la page");
    }

    return data.data;
  },

  async publishPage(id: string): Promise<PageStatique> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/page/${id}/publish`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de publication de la page");
    }

    return data.data;
  },

  async unpublishPage(id: string): Promise<PageStatique> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/page/${id}/unpublish`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de dépublication de la page");
    }

    return data.data;
  },

  async deletePage(id: string): Promise<void> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/page/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erreur de suppression de la page");
    }
  },

  // ===============================
  // STATISTIQUES AVANCÉES
  // ===============================
  async getStatistiquesAvancees(): Promise<StatistiquesAvancees> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération des analytics");
    }

    return data.data;
  },

  async getRevenueAnalytics(period = "month"): Promise<any> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/admin/analytics/revenue?period=${period}`,
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
        data.message || "Erreur de récupération des analytics revenus"
      );
    }

    return data.data;
  },

  async getUsersAnalytics(period = "month"): Promise<any> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/admin/analytics/users?period=${period}`,
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
        data.message || "Erreur de récupération des analytics utilisateurs"
      );
    }

    return data.data;
  },

  async getProjectsAnalytics(period = "month"): Promise<any> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/admin/analytics/projects?period=${period}`,
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
        data.message || "Erreur de récupération des analytics projets"
      );
    }

    return data.data;
  },

  // ===============================
  // LOGS SYSTÈME
  // ===============================
  async getLogs(
    page = 1,
    limit = 10,
    type?: TypeLog,
    userId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedResponse<LogEntry>> {
    const authHeaders = tokenUtils.getAuthHeader();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) params.append("type", type);
    if (userId) params.append("userId", userId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await fetch(`${API_BASE_URL}/admin/logs?${params}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération des logs");
    }

    return data;
  },

  async exportLogs(
    format = "csv",
    type?: TypeLog,
    startDate?: string,
    endDate?: string
  ): Promise<Blob> {
    const authHeaders = tokenUtils.getAuthHeader();
    const params = new URLSearchParams({
      format,
    });

    if (type) params.append("type", type);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await fetch(
      `${API_BASE_URL}/admin/logs/export?${params}`,
      {
        headers: {
          ...authHeaders,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erreur d'export des logs");
    }

    return response.blob();
  },
};
