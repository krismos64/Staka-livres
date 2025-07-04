import axios from "axios";
import {
  Commande,
  CommandeDetailed,
  CommandeStats,
  Conversation,
  ConversationStats,
  ConversationTag,
  CreateMessageRequest,
  Facture,
  FactureStats,
  FAQ,
  LogEntry,
  Message,
  PageStatique,
  PaginatedResponse,
  PrioriteConversation,
  Role,
  StatistiquesAvancees,
  StatutCommande,
  StatutConversation,
  StatutFacture,
  StatutPage,
  Tarif,
  TypeLog,
  UpdateConversationRequest,
  User,
  UserStats,
} from "../types/shared";
import { tokenUtils } from "./auth";
import { MockDataService } from "./mockData";

const API_BASE_URL = (() => {
  // Pour Jest et tests
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    return (global as any).API_BASE_URL || "http://backend:3001";
  }

  // Pour Vite en développement/production
  try {
    return (
      (import.meta as any).env?.VITE_API_URL ||
      (typeof window !== "undefined"
        ? "http://localhost:3001"
        : "http://backend:3001")
    );
  } catch {
    // Fallback pour Jest si import.meta n'est pas disponible
    return typeof window !== "undefined"
      ? "http://localhost:3001"
      : "http://backend:3001";
  }
})();

interface UpdateCommandeRequest {
  statut: StatutCommande;
  noteCorrecteur?: string;
}

interface CreateCommandeRequest {
  titre: string;
  description?: string;
  userId: string;
}

// Interface pour la réponse de refresh token
interface RefreshTokenResponse {
  token: string;
  user: User;
}

// Interfaces unifiées pour les paramètres d'API
export interface AdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface AdminCommandesParams {
  page?: number;
  limit?: number;
  search?: string;
  statut?: StatutCommande;
  clientId?: string;
  dateFrom?: string; // ISO string
  dateTo?: string; // ISO string
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

// === INTERFACES POUR NOUVELLES API FACTURES ===

interface UpdateFactureRequest {
  statut: StatutFacture;
}

interface CreateUserRequest {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  role: Role;
}

interface UpdateUserRequest {
  prenom?: string;
  nom?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
}

interface CreateFAQRequest {
  question: string;
  answer: string;
  details?: string;
  categorie: string;
  ordre: number;
  visible: boolean;
}

interface UpdateFAQRequest {
  question?: string;
  answer?: string;
  details?: string;
  categorie?: string;
  ordre?: number;
  visible?: boolean;
}

interface CreateTarifRequest {
  nom: string;
  description: string;
  prix: number;
  prixFormate: string;
  typeService: string;
  dureeEstimee?: string;
  actif: boolean;
  ordre: number;
}

interface UpdateTarifRequest {
  nom?: string;
  description?: string;
  prix?: number;
  prixFormate?: string;
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

// Fonction pour gérer la déconnexion automatique
const handleAutoLogout = () => {
  tokenUtils.remove();
  // Rediriger vers la page de login
  window.location.href = "/login";
};

// Créer une instance Axios avec intercepteurs
const createApiInstance = (): any => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Variable pour éviter les boucles infinies lors du refresh
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    failedQueue = [];
  };

  // Intercepteur de requête pour ajouter le token
  instance.interceptors.request.use(
    (config: any) => {
      const token = tokenUtils.get();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse pour gérer les 401
  instance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Si un refresh est déjà en cours, ajouter la requête à la file d'attente
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return instance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          console.log("[AdminAPI] Token expiré, tentative de refresh...");

          // Appel du endpoint de refresh
          const refreshResponse = await axios.post<RefreshTokenResponse>(
            `${API_BASE_URL}/auth/refresh`,
            {},
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenUtils.get()}`,
              },
            }
          );

          const { token: newToken } = refreshResponse.data;

          // Mettre à jour le token
          tokenUtils.set(newToken);

          // Traiter la file d'attente
          processQueue(null, newToken);

          // Rejouer la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          console.log("[AdminAPI] Token rafraîchi avec succès");
          return instance(originalRequest);
        } catch (refreshError) {
          console.error("[AdminAPI] Échec du refresh token:", refreshError);

          // En cas d'échec du refresh, déconnecter l'utilisateur
          processQueue(refreshError, null);
          handleAutoLogout();

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Instance Axios configurée
const apiClient = createApiInstance();

// Service adaptatif qui détecte le mode démo
class AdaptiveAdminAPI {
  // Vérifier si le mode démo est activé
  private isDemoMode(): boolean {
    return MockDataService.isDemoMode();
  }

  // Simule les actions CRUD en mode démo (sans effet réel)
  private async simulateAction(action: string, duration = 300): Promise<void> {
    if (this.isDemoMode()) {
      console.log(`[DEMO MODE] Simulation de l'action: ${action}`);
      await new Promise((resolve) => setTimeout(resolve, duration));
      return;
    }
  }

  // Wrapper pour les appels API réels avec Axios
  private async realApiCall<T>(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any
  ): Promise<T> {
    try {
      const response = await apiClient.request({
        url,
        method,
        data,
      });

      const responseData = response.data;

      // FIX: Traitement spécial pour l'endpoint /admin/commandes
      if (
        url.includes("/admin/commandes") &&
        responseData.data &&
        responseData.stats
      ) {
        // Le backend retourne { message, data, stats: { total, byStatut: { EN_ATTENTE: ..., EN_COURS: ... } }, page, totalPages, filters }
        // On transforme en format attendu par le frontend
        const backendStats = responseData.stats;
        const frontendStats: CommandeStats = {
          total: backendStats.total || 0,
          enAttente: backendStats.byStatut?.EN_ATTENTE || 0,
          enCours: backendStats.byStatut?.EN_COURS || 0,
          termine: backendStats.byStatut?.TERMINE || 0,
          annulee: backendStats.byStatut?.ANNULEE || 0,
          tauxCompletion:
            backendStats.total > 0
              ? Math.round(
                  ((backendStats.byStatut?.TERMINE || 0) / backendStats.total) *
                    100
                )
              : 0,
        };

        return {
          data: responseData.data,
          stats: frontendStats,
          pagination: {
            page: responseData.page || 1,
            limit: 10, // Défaut
            total: backendStats.total || 0,
            totalPages: Math.ceil((backendStats.total || 0) / 10),
          },
          success: true,
        } as T;
      }

      // Pour les endpoints qui retournent une structure avec data/pagination, on retourne tout
      // Pour les autres (getUserById, etc.), on retourne juste les données
      if (
        responseData.data !== undefined &&
        responseData.pagination !== undefined
      ) {
        return responseData; // Retourne l'objet complet { data: [...], pagination: {...} }
      }

      return responseData.data || responseData; // Pour les autres cas
    } catch (error) {
      console.error(`❌ [DEBUG FRONTEND] Erreur API:`, error);

      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          error.message ||
          `Erreur API: ${error.response?.status}`;
        throw new Error(message);
      }

      throw error;
    }
  }

  // ===============================
  // DASHBOARD & STATS GÉNÉRALES
  // ===============================
  async getDashboardStats(): Promise<{
    userStats: UserStats;
    commandeStats: CommandeStats;
    factureStats: FactureStats;
  }> {
    if (this.isDemoMode()) {
      return MockDataService.getDashboardStats();
    }

    return this.realApiCall("/admin/stats");
  }

  // ===============================
  // GESTION UTILISATEURS
  // ===============================
  async getUsers(
    params: AdminUsersParams = {}
  ): Promise<PaginatedResponse<User>> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy,
      sortDirection,
    } = params;

    if (this.isDemoMode()) {
      return MockDataService.getUsers(page, limit, search, role);
    }

    const urlParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) urlParams.append("search", search);
    if (role) urlParams.append("role", role);
    if (isActive !== undefined)
      urlParams.append("isActive", isActive.toString());
    if (sortBy) urlParams.append("sortBy", sortBy);
    if (sortDirection) urlParams.append("sortDirection", sortDirection);

    console.log(
      "🌐 [adminAPI] URL construite pour getUsers:",
      `/admin/users?${urlParams}`
    );

    return this.realApiCall(`/admin/users?${urlParams}`);
  }

  async getUserById(id: string): Promise<User> {
    if (this.isDemoMode()) {
      return MockDataService.getUserById(id);
    }

    return this.realApiCall(`/admin/users/${id}`);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    if (this.isDemoMode()) {
      await this.simulateAction("createUser", 400);
      return {
        id: `user-demo-${Date.now()}`,
        ...userData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall("/admin/users", "POST", userData);
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    if (this.isDemoMode()) {
      await this.simulateAction("updateUser", 300);
      const currentUser = await this.getUserById(id);
      return {
        ...currentUser,
        ...userData,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall(`/admin/users/${id}`, "PUT", userData);
  }

  async deleteUser(id: string): Promise<void> {
    if (this.isDemoMode()) {
      await this.simulateAction("deleteUser", 500);
      return;
    }

    await this.realApiCall(`/admin/users/${id}`, "DELETE");
  }

  async getUserStats(): Promise<UserStats> {
    if (this.isDemoMode()) {
      return MockDataService.getUserStats();
    }

    return this.realApiCall("/admin/users/stats");
  }

  async toggleUserStatus(id: string): Promise<User> {
    if (this.isDemoMode()) {
      await this.simulateAction("toggleUserStatus", 300);
      const currentUser = await this.getUserById(id);
      return {
        ...currentUser,
        isActive: !currentUser.isActive,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall(`/admin/users/${id}/toggle-status`, "PUT");
  }

  async activateUser(id: string): Promise<User> {
    if (this.isDemoMode()) {
      await this.simulateAction("activateUser", 300);
      const currentUser = await this.getUserById(id);
      return {
        ...currentUser,
        isActive: true,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall(`/admin/users/${id}/activate`, "PUT");
  }

  async deactivateUser(id: string): Promise<User> {
    if (this.isDemoMode()) {
      await this.simulateAction("deactivateUser", 300);
      const currentUser = await this.getUserById(id);
      return {
        ...currentUser,
        isActive: false,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall(`/admin/users/${id}/deactivate`, "PUT");
  }

  // ===============================
  // GESTION COMMANDES
  // ===============================
  async getCommandes(
    params: AdminCommandesParams = {}
  ): Promise<PaginatedResponse<Commande> & { stats: CommandeStats }> {
    const {
      page = 1,
      limit = 10,
      search,
      statut,
      clientId,
      dateFrom,
      dateTo,
      sortBy,
      sortDirection,
    } = params;

    if (this.isDemoMode()) {
      return MockDataService.getCommandes(page, limit, statut, search);
    }

    const urlParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search && search.trim()) urlParams.append("search", search.trim());
    if (statut) urlParams.append("statut", statut);
    if (clientId && clientId.trim())
      urlParams.append("clientId", clientId.trim());
    if (dateFrom) urlParams.append("dateFrom", dateFrom);
    if (dateTo) urlParams.append("dateTo", dateTo);
    if (sortBy) urlParams.append("sortBy", sortBy);
    if (sortDirection) urlParams.append("sortDirection", sortDirection);

    console.log(
      `🔍 [DEBUG FRONTEND] Query string construite: ${urlParams.toString()}`
    );

    return this.realApiCall(`/admin/commandes?${urlParams}`);
  }

  async getCommandeById(id: string): Promise<CommandeDetailed> {
    if (this.isDemoMode()) {
      const commandes = await MockDataService.getCommandes(1, 100);
      const commande = commandes.data?.find((c) => c.id === id);
      if (!commande) throw new Error("Commande non trouvée");
      return commande as CommandeDetailed;
    }

    return this.realApiCall(`/admin/commandes/${id}`);
  }

  async createCommande(commandeData: CreateCommandeRequest): Promise<Commande> {
    if (this.isDemoMode()) {
      await this.simulateAction("createCommande", 400);
      return {
        id: `cmd-demo-${Date.now()}`,
        ...commandeData,
        statut: StatutCommande.EN_ATTENTE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall("/admin/commande", "POST", commandeData);
  }

  async updateCommande(
    id: string,
    updateData: UpdateCommandeRequest
  ): Promise<Commande> {
    if (this.isDemoMode()) {
      await this.simulateAction("updateCommande", 300);
      const currentCommande = await this.getCommandeById(id);
      return {
        ...currentCommande,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall(`/admin/commandes/${id}`, "PUT", updateData);
  }

  async deleteCommande(id: string): Promise<void> {
    if (this.isDemoMode()) {
      await this.simulateAction("deleteCommande", 500);
      return;
    }

    await this.realApiCall(`/admin/commandes/${id}`, "DELETE");
  }

  // ===============================
  // GESTION FACTURES
  // ===============================
  async getFactureStats(): Promise<FactureStats> {
    if (this.isDemoMode()) {
      return MockDataService.getFactureStats();
    }

    return this.realApiCall("/admin/factures/stats");
  }

  async getFactures(
    page = 1,
    limit = 10,
    statut?: StatutFacture,
    search?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  ): Promise<PaginatedResponse<Facture>> {
    if (this.isDemoMode()) {
      return MockDataService.getFactures(page, limit, statut, search);
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (statut) params.append("statut", statut);
    if (search) params.append("search", search);
    if (sortBy) params.append("sortBy", sortBy);
    if (sortOrder) params.append("sortOrder", sortOrder);

    return this.realApiCall(`/admin/factures?${params}`);
  }

  async getFactureById(id: string): Promise<Facture> {
    if (this.isDemoMode()) {
      return MockDataService.getFactureById(id);
    }

    return this.realApiCall(`/admin/factures/${id}`);
  }

  async updateFacture(
    id: string,
    updateData: UpdateFactureRequest
  ): Promise<Facture> {
    if (this.isDemoMode()) {
      await this.simulateAction("updateFacture", 300);
      const currentFacture = await this.getFactureById(id);
      return {
        ...currentFacture,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall(`/admin/factures/${id}`, "PUT", updateData);
  }

  async deleteFacture(id: string): Promise<void> {
    if (this.isDemoMode()) {
      await this.simulateAction("deleteFacture", 500);
      return;
    }

    await this.realApiCall(`/admin/factures/${id}`, "DELETE");
  }

  async sendFactureReminder(id: string): Promise<void> {
    if (this.isDemoMode()) {
      await this.simulateAction("sendFactureReminder");
      console.log("🔔 [DEMO] Relance facture envoyée:", id);
      return;
    }

    try {
      await this.realApiCall<void>(`/admin/factures/${id}/reminder`, "POST");
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi de la relance:", error);
      throw error;
    }
  }

  async getFacturePdf(
    id: string
  ): Promise<{ message: string; factureNumber: string; info: string }> {
    if (this.isDemoMode()) {
      await this.simulateAction("getFacturePdf");
      console.log("📄 [DEMO] Téléchargement PDF facture:", id);
      return {
        message: "PDF généré en mode démo",
        factureNumber: "INV-DEMO-001",
        info: "Téléchargement simulé en mode démo",
      };
    }

    try {
      const response = await this.realApiCall<{
        message: string;
        factureNumber: string;
        info: string;
      }>(`/admin/factures/${id}/pdf`, "GET");
      return response;
    } catch (error) {
      console.error("❌ Erreur lors du téléchargement du PDF:", error);
      throw error;
    }
  }

  // ===============================
  // API FACTURES RÉELLES (NOUVEAUX ENDPOINTS)
  // ===============================

  // ===============================
  // GESTION FAQ
  // ===============================
  async getFAQ(
    page = 1,
    limit = 10,
    search?: string,
    visible?: boolean
  ): Promise<FAQ[]> {
    if (this.isDemoMode()) {
      // Retour direct du tableau pour compatibilité avec les pages admin existantes
      const response = await MockDataService.getFAQ(
        page,
        limit,
        search,
        visible
      );
      return response.data || [];
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (typeof visible === "boolean")
      params.append("visible", visible.toString());

    const response = await this.realApiCall<{ success: boolean; data: FAQ[] }>(
      `/admin/faq?${params}`
    );
    return response.data || [];
  }

  async getFAQById(id: string): Promise<FAQ> {
    if (this.isDemoMode()) {
      const faqs = await MockDataService.getFAQ(1, 100);
      const faq = faqs.data?.find((f) => f.id === id);
      if (!faq) throw new Error("FAQ non trouvée");
      return faq;
    }

    const response = await this.realApiCall<{ success: boolean; data: FAQ }>(
      `/admin/faq/${id}`
    );
    return response.data;
  }

  async createFAQ(faqData: CreateFAQRequest): Promise<FAQ> {
    if (this.isDemoMode()) {
      await this.simulateAction("createFAQ", 400);
      return {
        id: `faq-demo-${Date.now()}`,
        ...faqData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const response = await this.realApiCall<{ success: boolean; data: FAQ }>(
      "/admin/faq",
      "POST",
      faqData
    );
    return response.data;
  }

  async updateFAQ(id: string, faqData: UpdateFAQRequest): Promise<FAQ> {
    if (this.isDemoMode()) {
      await this.simulateAction("updateFAQ", 300);
      const currentFAQ = await this.getFAQById(id);
      return { ...currentFAQ, ...faqData, updatedAt: new Date().toISOString() };
    }

    const response = await this.realApiCall<{ success: boolean; data: FAQ }>(
      `/admin/faq/${id}`,
      "PUT",
      faqData
    );
    return response.data;
  }

  async deleteFAQ(id: string): Promise<void> {
    if (this.isDemoMode()) {
      await this.simulateAction("deleteFAQ", 500);
      return;
    }

    await this.realApiCall(`/admin/faq/${id}`, "DELETE");
  }

  // Méthode pour récupérer les FAQ publiques
  async getFAQPublic(): Promise<FAQ[]> {
    const response = await this.realApiCall<{ success: boolean; data: FAQ[] }>(
      "/faq?visible=true"
    );
    return response.data || [];
  }

  // ===============================
  // GESTION TARIFS
  // ===============================
  async getTarifs(
    page = 1,
    limit = 10,
    search?: string,
    actif?: boolean
  ): Promise<Tarif[]> {
    if (this.isDemoMode()) {
      // Retour direct du tableau pour compatibilité avec les pages admin existantes
      const response = await MockDataService.getTarifs(
        page,
        limit,
        search,
        actif
      );
      return response.data || [];
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (typeof actif === "boolean") params.append("actif", actif.toString());

    // API réelle - récupérer directement les données
    const response = await this.realApiCall<{
      success: boolean;
      data: Tarif[];
    }>(`/admin/tarifs?${params}`);
    return response.data || [];
  }

  async getTarifById(id: string): Promise<Tarif> {
    if (this.isDemoMode()) {
      const tarifs = await MockDataService.getTarifs(1, 100);
      const tarif = tarifs.data?.find((t) => t.id === id);
      if (!tarif) throw new Error("Tarif non trouvé");
      return tarif;
    }

    const response = await this.realApiCall<{ success: boolean; data: Tarif }>(
      `/admin/tarifs/${id}`
    );
    return response.data;
  }

  async createTarif(tarifData: CreateTarifRequest): Promise<Tarif> {
    if (this.isDemoMode()) {
      await this.simulateAction("createTarif", 400);
      return {
        id: `tarif-demo-${Date.now()}`,
        ...tarifData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const response = await this.realApiCall<{ success: boolean; data: Tarif }>(
      "/admin/tarifs",
      "POST",
      tarifData
    );
    return response.data;
  }

  async updateTarif(id: string, tarifData: UpdateTarifRequest): Promise<Tarif> {
    if (this.isDemoMode()) {
      await this.simulateAction("updateTarif", 300);
      const currentTarif = await this.getTarifById(id);
      return {
        ...currentTarif,
        ...tarifData,
        updatedAt: new Date().toISOString(),
      };
    }

    const response = await this.realApiCall<{ success: boolean; data: Tarif }>(
      `/admin/tarifs/${id}`,
      "PUT",
      tarifData
    );
    return response.data;
  }

  async deleteTarif(id: string): Promise<void> {
    if (this.isDemoMode()) {
      await this.simulateAction("deleteTarif", 500);
      return;
    }

    await this.realApiCall(`/admin/tarifs/${id}`, "DELETE");
  }

  // ===============================
  // GESTION PAGES STATIQUES
  // ===============================
  async getPages(
    page = 1,
    limit = 10,
    search?: string,
    statut?: StatutPage
  ): Promise<PageStatique[]> {
    if (this.isDemoMode()) {
      // Retour direct du tableau pour compatibilité avec les pages admin existantes
      const response = await MockDataService.getPages(
        page,
        limit,
        search,
        statut
      );
      return response.data || [];
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (statut) params.append("statut", statut);

    // Pour l'API réelle, on assume qu'elle retourne directement le tableau pour cette interface
    return this.realApiCall(`/admin/pages?${params}`);
  }

  async getPageById(id: string): Promise<PageStatique> {
    if (this.isDemoMode()) {
      const pages = await MockDataService.getPages(1, 100);
      const page = pages.data?.find((p) => p.id === id);
      if (!page) throw new Error("Page non trouvée");
      return page;
    }

    return this.realApiCall(`/admin/page/${id}`);
  }

  async createPage(pageData: CreatePageRequest): Promise<PageStatique> {
    if (this.isDemoMode()) {
      await this.simulateAction("createPage", 400);
      return {
        id: `page-demo-${Date.now()}`,
        ...pageData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall("/admin/page", "POST", pageData);
  }

  async updatePage(
    id: string,
    pageData: UpdatePageRequest
  ): Promise<PageStatique> {
    if (this.isDemoMode()) {
      await this.simulateAction("updatePage", 300);
      const currentPage = await this.getPageById(id);
      return {
        ...currentPage,
        ...pageData,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall(`/admin/page/${id}`, "PUT", pageData);
  }

  async deletePage(id: string): Promise<void> {
    if (this.isDemoMode()) {
      await this.simulateAction("deletePage", 500);
      return;
    }

    await this.realApiCall(`/admin/page/${id}`, "DELETE");
  }

  // ===============================
  // GESTION LOGS
  // ===============================
  async getLogs(
    page = 1,
    limit = 10,
    search?: string,
    type?: TypeLog
  ): Promise<PaginatedResponse<LogEntry>> {
    if (this.isDemoMode()) {
      return MockDataService.getLogs(page, limit, search, type);
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (type) params.append("type", type);

    return this.realApiCall(`/admin/logs?${params}`);
  }

  // ===============================
  // STATISTIQUES AVANCÉES
  // ===============================
  async getStatistiquesAvancees(): Promise<StatistiquesAvancees> {
    return this.realApiCall("/admin/stats/advanced");
  }

  // ===============================
  // ACTIONS DÉMO
  // ===============================
  async refreshDemoData(): Promise<{ success: boolean; message: string }> {
    if (this.isDemoMode()) {
      return MockDataService.refreshDemoData();
    }

    throw new Error("Action disponible uniquement en mode démo");
  }

  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    if (this.isDemoMode()) {
      return MockDataService.resetDemoData();
    }

    throw new Error("Action disponible uniquement en mode démo");
  }

  // ===============================
  // GESTION MESSAGERIE
  // ===============================
  async getConversations(
    page = 1,
    limit = 10,
    search?: string,
    statut?: StatutConversation,
    priorite?: PrioriteConversation,
    userId?: string
  ): Promise<Conversation[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (statut) params.append("statut", statut);
    if (priorite) params.append("priorite", priorite);
    if (userId) params.append("userId", userId);

    return this.realApiCall(`/admin/conversations?${params}`);
  }

  async getConversationById(id: string): Promise<Conversation> {
    return this.realApiCall(`/admin/conversations/${id}`);
  }

  async getConversationStats(): Promise<ConversationStats> {
    return this.realApiCall(`/admin/conversations/stats`);
  }

  async createMessage(
    conversationId: string,
    messageData: CreateMessageRequest
  ): Promise<Message> {
    return this.realApiCall(
      `/admin/conversations/${conversationId}/messages`,
      "POST",
      messageData
    );
  }

  async updateConversation(
    id: string,
    updateData: UpdateConversationRequest
  ): Promise<Conversation> {
    return this.realApiCall(`/admin/conversations/${id}`, "PUT", updateData);
  }

  async deleteConversation(id: string): Promise<void> {
    return this.realApiCall(`/admin/conversations/${id}`, "DELETE");
  }

  async exportConversations(format: "csv" | "json" = "csv"): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}/admin/conversations/export?format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${tokenUtils.get()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async getConversationTags(): Promise<ConversationTag[]> {
    return this.realApiCall(`/admin/conversations/tags`);
  }

  async getUnreadConversationsCount(): Promise<number> {
    return this.realApiCall(`/admin/conversations/unread-count`);
  }
}

// Export de l'instance du service adaptatif
export const adminAPI = new AdaptiveAdminAPI();

// Exports directs des méthodes pour compatibilité
export const getDashboardStats = () => adminAPI.getDashboardStats();

export const getUsers = (params: AdminUsersParams = {}) =>
  adminAPI.getUsers(params);
export const getUserById = (id: string) => adminAPI.getUserById(id);
export const createUser = (userData: CreateUserRequest) =>
  adminAPI.createUser(userData);
export const updateUser = (id: string, userData: UpdateUserRequest) =>
  adminAPI.updateUser(id, userData);
export const deleteUser = (id: string) => adminAPI.deleteUser(id);
export const getUserStats = () => adminAPI.getUserStats();
export const toggleUserStatus = (id: string) => adminAPI.toggleUserStatus(id);
export const activateUser = (id: string) => adminAPI.activateUser(id);
export const deactivateUser = (id: string) => adminAPI.deactivateUser(id);

export const getCommandes = (params: AdminCommandesParams = {}) =>
  adminAPI.getCommandes(params);
export const getCommandeById = (id: string) => adminAPI.getCommandeById(id);
export const createCommande = (commandeData: CreateCommandeRequest) =>
  adminAPI.createCommande(commandeData);
export const updateCommande = (id: string, updateData: UpdateCommandeRequest) =>
  adminAPI.updateCommande(id, updateData);
export const deleteCommande = (id: string) => adminAPI.deleteCommande(id);

export const getFactureStats = () => adminAPI.getFactureStats();
export const getFactures = (
  page?: number,
  limit?: number,
  statut?: StatutFacture,
  search?: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc"
) => adminAPI.getFactures(page, limit, statut, search, sortBy, sortOrder);
export const getFactureById = (id: string) => adminAPI.getFactureById(id);
export const updateFacture = (id: string, updateData: UpdateFactureRequest) =>
  adminAPI.updateFacture(id, updateData);
export const deleteFacture = (id: string) => adminAPI.deleteFacture(id);
export const sendFactureReminder = (id: string) =>
  adminAPI.sendFactureReminder(id);
export const getFacturePdf = (id: string) => adminAPI.getFacturePdf(id);

export const getFAQ = (
  page?: number,
  limit?: number,
  search?: string,
  visible?: boolean
) => adminAPI.getFAQ(page, limit, search, visible);
export const getFAQById = (id: string) => adminAPI.getFAQById(id);
export const createFAQ = (faqData: CreateFAQRequest) =>
  adminAPI.createFAQ(faqData);
export const updateFAQ = (id: string, faqData: UpdateFAQRequest) =>
  adminAPI.updateFAQ(id, faqData);
export const deleteFAQ = (id: string) => adminAPI.deleteFAQ(id);
export const getFAQPublic = () => adminAPI.getFAQPublic();

// Export tarifs
export const getTarifs = (
  page?: number,
  limit?: number,
  search?: string,
  actif?: boolean
) => adminAPI.getTarifs(page, limit, search, actif);
export const getTarifById = (id: string) => adminAPI.getTarifById(id);
export const createTarif = (tarifData: CreateTarifRequest) =>
  adminAPI.createTarif(tarifData);
export const updateTarif = (id: string, tarifData: UpdateTarifRequest) =>
  adminAPI.updateTarif(id, tarifData);
export const deleteTarif = (id: string) => adminAPI.deleteTarif(id);

// Exports des méthodes de messagerie
export const getConversations = (
  page?: number,
  limit?: number,
  search?: string,
  statut?: StatutConversation,
  priorite?: PrioriteConversation,
  userId?: string
) => adminAPI.getConversations(page, limit, search, statut, priorite, userId);

export const getConversationById = (id: string) =>
  adminAPI.getConversationById(id);
export const getConversationStats = () => adminAPI.getConversationStats();
export const createMessage = (
  conversationId: string,
  messageData: CreateMessageRequest
) => adminAPI.createMessage(conversationId, messageData);
export const updateConversation = (
  id: string,
  updateData: UpdateConversationRequest
) => adminAPI.updateConversation(id, updateData);
export const deleteConversation = (id: string) =>
  adminAPI.deleteConversation(id);
export const exportConversations = (format?: "csv" | "json") =>
  adminAPI.exportConversations(format);
export const getConversationTags = () => adminAPI.getConversationTags();
export const getUnreadConversationsCount = () =>
  adminAPI.getUnreadConversationsCount();

// Export statistiques avancées
export const getStatistiquesAvancees = () => adminAPI.getStatistiquesAvancees();
