import axios from "axios";
import { debugLog } from "./debug";
import { UnifiedConversation, UnifiedMessage } from "../types/messages"; // Import correct
import {
  Commande,
  CommandeDetailed,
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
import { debugLog } from "./debug";
import { MockDataService } from "./mockData";

// Correction radicale : toujours /api côté navigateur, backend:3001 côté Node
const API_BASE_URL =
  typeof window !== "undefined" ? "/api" : "http://backend:3001";

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
  type?: string;
  isPublic?: boolean;
  sortOrder?: number;
}

interface UpdatePageRequest {
  titre?: string;
  slug?: string;
  contenu?: string;
  description?: string;
  statut?: StatutPage;
  type?: string;
  isPublic?: boolean;
  sortOrder?: number;
}

// Fonction pour gérer la déconnexion automatique
const handleAutoLogout = () => {
  tokenUtils.remove();
  // Rediriger vers la page de login
  window.location.href = "/login";
};

// Créer une instance Axios avec intercepteurs
const createApiInstance = (): any => {
  // DEBUG: log de la valeur API_BASE_URL à chaque création d'instance axios
  debugLog("API_BASE_URL utilisé:", API_BASE_URL);
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
          debugLog("Token expiré, tentative de refresh...");

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

          debugLog("Token rafraîchi avec succès");
          return instance(originalRequest);
        } catch (refreshError) {
          debugLog("Échec du refresh token:", refreshError);

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

// Mapping des statuts français -> Prisma (hors classe)
const mapStatutToStatus = (statut: string | undefined) => {
  switch (statut) {
    case "BROUILLON":
      return "DRAFT";
    case "PUBLIEE":
      return "PUBLISHED";
    case "ARCHIVEE":
      return "ARCHIVED";
    default:
      return undefined;
  }
};

// Service adaptatif qui détecte le mode démo
class AdaptiveAdminAPI {
  // Vérifier si le mode démo est activé
  private isDemoMode(): boolean {
    return MockDataService.isDemoMode();
  }

  // Simule les actions CRUD en mode démo (sans effet réel)
  private async simulateAction(action: string, duration = 300): Promise<void> {
    if (this.isDemoMode()) {
      debugLog(`DEMO MODE - Simulation de l'action:`, action);
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

      // 🔍 DEBUG pour les endpoints tarifs
      if (url.includes("/admin/tarifs")) {
        console.log(`🔍 [realApiCall] URL: ${method} ${url}`);
        console.log(`🔍 [realApiCall] Réponse brute:`, responseData);
        console.log(`🔍 [realApiCall] responseData.data:`, responseData.data);
        console.log(
          `🔍 [realApiCall] responseData.success:`,
          responseData.success
        );
      }

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

      // ✅ CORRECTION SPÉCIFIQUE POUR LES TARIFS
      // Le backend tarifs retourne toujours { success: true, data: Tarif|Tarif[], message?: "..." }
      if (
        url.includes("/admin/tarifs") &&
        responseData.success &&
        responseData.data !== undefined
      ) {
        console.log(`✅ [realApiCall] Retour data tarif:`, responseData.data);

        // Pour GET /admin/tarifs (liste), on retourne l'objet complet pour que getTarifs puisse faire .data
        if (url.includes("/admin/tarifs?") || url.endsWith("/admin/tarifs")) {
          console.log(
            `✅ [realApiCall] Liste tarifs - Retour objet complet:`,
            responseData
          );
          return responseData; // Retourne { success: true, data: Tarif[] }
        }

        // Pour les autres endpoints tarifs (PUT, POST, GET /:id), on retourne directement les données
        return responseData.data; // Retourne directement le tarif
      }

      // Pour les endpoints qui retournent une structure avec data/pagination, on retourne tout
      // Pour les autres (getUserById, etc.), on retourne juste les données
      if (
        responseData.data !== undefined &&
        responseData.pagination !== undefined
      ) {
        return responseData; // Retourne l'objet complet { data: [...], pagination: {...} }
      }

      // 🔍 Extraction de data avec logs pour debug
      const extractedData = responseData.data || responseData;
      if (url.includes("/admin/tarifs")) {
        console.log(
          `🔍 [realApiCall] Données extraites (fallback):`,
          extractedData
        );
      }

      return extractedData; // Pour les autres cas
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

    return this.realApiCall(`/admin/users/${id}/toggle-status`, "PATCH");
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

    // Le backend n'a pas encore d'endpoint stats spécifique, on va les calculer depuis la liste
    const factures = await this.getFactures(1, 1000); // Récupérer un grand nombre pour calculer
    const total = factures.pagination?.total || factures.data?.length || 0;
    const payees = factures.data?.filter(f => f.statut === StatutFacture.PAYEE).length || 0;
    const enAttente = factures.data?.filter(f => f.statut === StatutFacture.EN_ATTENTE).length || 0;
    const montantTotal = factures.data?.reduce((sum, f) => sum + (f.montant || 0), 0) || 0;

    return {
      total,
      payees,
      enAttente,
      montantTotal,
      montantTotalFormate: `${(montantTotal / 100).toFixed(2)} €`,
      montantMensuel: 0, // À implémenter si nécessaire
      montantMensuelFormate: "0,00 €"
    };
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

    const response = await this.realApiCall<{
      invoices: any[];
      pagination: any;
    }>(`/admin/factures?${params}`);

    // Transformer les données du backend (format Invoice) vers le format Facture attendu par le frontend
    const transformedInvoices = response.invoices.map((invoice: any) => ({
      id: invoice.id,
      commandeId: invoice.commande?.id || '',
      userId: invoice.commande?.client?.id || '',
      numero: invoice.number,
      montant: invoice.amount,
      montantFormate: invoice.amountFormatted,
      statut: this.mapInvoiceStatusToStatutFacture(invoice.commande?.statut),
      dateEcheance: undefined, // Pas dans le format backend actuel
      datePaiement: undefined, // Pas dans le format backend actuel
      pdfUrl: invoice.pdfUrl,
      stripePaymentId: undefined, // Pas dans le format backend actuel
      createdAt: invoice.createdAt,
      updatedAt: invoice.createdAt, // Utiliser createdAt comme fallback
      user: invoice.commande?.client ? {
        id: invoice.commande.client.id,
        prenom: invoice.commande.client.nom.split(' ')[0] || '',
        nom: invoice.commande.client.nom.split(' ').slice(1).join(' ') || invoice.commande.client.nom,
        email: invoice.commande.client.email,
      } : undefined,
      commande: invoice.commande ? {
        id: invoice.commande.id,
        titre: invoice.commande.titre,
        statut: invoice.commande.statut,
        amount: invoice.commande.amount,
        user: invoice.commande.client,
      } : undefined,
    }));

    return {
      data: transformedInvoices,
      pagination: response.pagination,
    };
  }

  // Méthode utilitaire pour mapper les statuts
  private mapInvoiceStatusToStatutFacture(commandeStatut?: string): StatutFacture {
    switch (commandeStatut) {
      case 'PAYEE':
      case 'TERMINE':
        return StatutFacture.PAYEE;
      case 'EN_COURS':
      case 'ESTIMATION_ENVOYEE':
        return StatutFacture.EN_ATTENTE;
      case 'ANNULEE':
        return StatutFacture.ANNULEE;
      default:
        return StatutFacture.EN_ATTENTE;
    }
  }

  async getFactureById(id: string): Promise<Facture> {
    if (this.isDemoMode()) {
      return MockDataService.getFactureById(id);
    }

    const invoice = await this.realApiCall<any>(`/admin/factures/${id}`);

    // Transformer les données du backend vers le format Facture
    return {
      id: invoice.id,
      commandeId: invoice.commande?.id || '',
      userId: invoice.commande?.client?.id || '',
      numero: invoice.number,
      montant: invoice.amount,
      montantFormate: invoice.amountFormatted,
      statut: this.mapInvoiceStatusToStatutFacture(invoice.commande?.statut),
      dateEcheance: undefined,
      datePaiement: undefined,
      pdfUrl: invoice.pdfUrl,
      stripePaymentId: undefined,
      createdAt: invoice.createdAt,
      updatedAt: invoice.createdAt,
      user: invoice.commande?.client ? {
        id: invoice.commande.client.id,
        prenom: invoice.commande.client.prenom || '',
        nom: invoice.commande.client.nom || '',
        email: invoice.commande.client.email,
      } : undefined,
      commande: invoice.commande ? {
        id: invoice.commande.id,
        titre: invoice.commande.titre,
        description: invoice.commande.description,
        statut: invoice.commande.statut,
        amount: invoice.commande.amount,
        createdAt: invoice.commande.createdAt,
        user: invoice.commande.client,
      } : undefined,
    };
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
      await this.realApiCall<void>(`/admin/factures/${id}/resend`, "POST");
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
      // Pour le téléchargement PDF, on ouvre directement l'URL
      const downloadUrl = `${this.baseURL}/admin/factures/${id}/download`;
      window.open(downloadUrl, '_blank');
      
      return {
        message: "Téléchargement démarré",
        factureNumber: `INV-${id}`,
        info: "Le fichier PDF va être téléchargé",
      };
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
    console.log("🔍 [getTarifs] Début - Mode démo:", this.isDemoMode());

    if (this.isDemoMode()) {
      // Retour direct du tableau pour compatibilité avec les pages admin existantes
      const response = await MockDataService.getTarifs(
        page,
        limit,
        search,
        actif
      );
      console.log("🔍 [getTarifs] Mode démo - Réponse:", response);
      return response.data || [];
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (typeof actif === "boolean") params.append("actif", actif.toString());

    console.log("🔍 [getTarifs] API réelle - URL:", `/admin/tarifs?${params}`);

    // API réelle - récupérer directement les données
    const response = await this.realApiCall<{
      success: boolean;
      data: Tarif[];
    }>(`/admin/tarifs?${params}`);

    console.log("🔍 [getTarifs] API réelle - Réponse complète:", response);
    console.log("🔍 [getTarifs] API réelle - response.data:", response.data);
    console.log(
      "🔍 [getTarifs] API réelle - Type response.data:",
      typeof response.data,
      Array.isArray(response.data)
    );

    const result = response.data || [];
    console.log("🔍 [getTarifs] API réelle - Résultat final:", result);
    return result;
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

    return this.realApiCall(`/admin/pages/${id}`);
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

    // Mapping explicite des champs frontend -> backend
    const payload = {
      title: pageData.titre,
      slug: pageData.slug,
      content: pageData.contenu,
      status: mapStatutToStatus(pageData.statut),
      metaDescription: pageData.description, // mapping SEO
      metaTitle: pageData.titre, // mapping SEO
      type: pageData.type || "PAGE", // valeur par défaut
      isPublic: pageData.isPublic !== undefined ? pageData.isPublic : true,
      sortOrder: pageData.sortOrder !== undefined ? pageData.sortOrder : 0,
      // Ajoute ici d'autres mappings si besoin (type, category, etc.)
    };

    return this.realApiCall("/admin/pages", "POST", payload);
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

    // Mapping explicite pour update aussi
    const payload = {
      title: pageData.titre,
      slug: pageData.slug,
      content: pageData.contenu,
      status: mapStatutToStatus(pageData.statut),
      metaDescription: pageData.description,
      metaTitle: pageData.titre,
      type: pageData.type || "PAGE",
      isPublic: pageData.isPublic !== undefined ? pageData.isPublic : true,
      sortOrder: pageData.sortOrder !== undefined ? pageData.sortOrder : 0,
      // autres champs...
    };

    debugLog("Mise à jour de la page", { id, pageData });
    const response = await apiClient.patch(`/admin/pages/${id}`, payload);
    return response.data.data;
  }

  async deletePage(id: string): Promise<void> {
    if (this.isDemoMode()) {
      await this.simulateAction("deletePage", 500);
      return;
    }

    await this.realApiCall(`/admin/pages/${id}`, "DELETE");
  }

  async publishPage(id: string): Promise<PageStatique> {
    if (this.isDemoMode()) {
      await this.simulateAction("publishPage", 300);
      const currentPage = await this.getPageById(id);
      return {
        ...currentPage,
        statut: StatutPage.PUBLIEE,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall(`/admin/pages/${id}/publish`, "PUT");
  }

  async unpublishPage(id: string): Promise<PageStatique> {
    if (this.isDemoMode()) {
      await this.simulateAction("unpublishPage", 300);
      const currentPage = await this.getPageById(id);
      return {
        ...currentPage,
        statut: StatutPage.BROUILLON,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.realApiCall(`/admin/pages/${id}/unpublish`, "PUT");
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

  // ===== MESSAGERIE UNIFIÉE =====

  async getConversations(): Promise<UnifiedConversation[]> {
    return this.realApiCall("/admin/messages/conversations");
  }

  async getMessagesByConversation(
    conversationId: string
  ): Promise<UnifiedMessage[]> {
    return this.realApiCall(`/admin/messages/conversations/${conversationId}`);
  }

  async replyToConversation(
    conversationId: string,
    content: string
  ): Promise<UnifiedMessage> {
    return this.realApiCall(
      `/admin/messages/conversations/${conversationId}/reply`,
      "POST",
      { content }
    );
  }

  async getUnreadConversationsCount(): Promise<number> {
    const response = await this.realApiCall<{ count: number }>(
      "/messages/unread-count"
    );
    return response.count;
  }

  // ===============================
  // MESSAGES API METHODS
  // ===============================
  async getMessages(filters: any = {}): Promise<any> {
    const { page = 1, limit = 10, ...otherFilters } = filters;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    Object.entries(otherFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });
    
    return this.realApiCall(`/messages?${params}`);
  }

  async getMessageDetail(id: string): Promise<any> {
    return this.realApiCall(`/messages/${id}`);
  }

  async sendMessage(data: any): Promise<any> {
    return this.realApiCall("/messages", "POST", data);
  }

  async updateMessage(id: string, data: any): Promise<any> {
    return this.realApiCall(`/messages/${id}`, "PUT", data);
  }

  async deleteMessage(id: string, hard: boolean = false): Promise<void> {
    const params = hard ? "?hard=true" : "";
    return this.realApiCall(`/messages/${id}${params}`, "DELETE");
  }

  async getMessageStats(): Promise<any> {
    return this.realApiCall("/messages/stats");
  }

  async bulkUpdateMessages(messageIds: string[], action: any): Promise<any> {
    return this.realApiCall("/messages/bulk", "POST", { messageIds, action });
  }

  async exportMessages(filters: any): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });
    
    return this.realApiCall(`/messages/export?${params}`);
  }
}

// Export de l'instance du service adaptatif
const adminAPI = new AdaptiveAdminAPI();

// ===============================
// EXPORTS
// ===============================

// Dashboard
export const getDashboardStats = () => adminAPI.getDashboardStats();

// Users
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

// Commandes
export const getCommandes = (params: AdminCommandesParams = {}) =>
  adminAPI.getCommandes(params);
export const getCommandeById = (id: string) => adminAPI.getCommandeById(id);
export const createCommande = (commandeData: CreateCommandeRequest) =>
  adminAPI.createCommande(commandeData);
export const updateCommande = (id: string, updateData: UpdateCommandeRequest) =>
  adminAPI.updateCommande(id, updateData);
export const deleteCommande = (id: string) => adminAPI.deleteCommande(id);

// Factures
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

// FAQ
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

// Tarifs
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

// Pages
export const getPages = (
  page?: number,
  limit?: number,
  search?: string,
  statut?: StatutPage
) => adminAPI.getPages(page, limit, search, statut);
export const getPageById = (id: string) => adminAPI.getPageById(id);
export const createPage = (pageData: CreatePageRequest) =>
  adminAPI.createPage(pageData);
export const updatePage = (id: string, pageData: UpdatePageRequest) =>
  adminAPI.updatePage(id, pageData);
export const deletePage = (id: string) => adminAPI.deletePage(id);
export const publishPage = (id: string) => adminAPI.publishPage(id);
export const unpublishPage = (id: string) => adminAPI.unpublishPage(id);

// MESSAGERIE UNIFIÉE
export const getConversations = () => adminAPI.getConversations();
export const getMessagesByConversation = (conversationId: string) =>
  adminAPI.getMessagesByConversation(conversationId);
export const replyToConversation = (conversationId: string, content: string) =>
  adminAPI.replyToConversation(conversationId, content);
export const getUnreadConversationsCount = () =>
  adminAPI.getUnreadConversationsCount();

// Logs & Stats
export const getLogs = (
  page?: number,
  limit?: number,
  search?: string,
  type?: TypeLog
) => adminAPI.getLogs(page, limit, search, type);
export const getStatistiquesAvancees = () => adminAPI.getStatistiquesAvancees();

// Demo Mode
export const refreshDemoData = () => adminAPI.refreshDemoData();
export const resetDemoData = () => adminAPI.resetDemoData();

// ===============================
// MESSAGES API OBJECT
// ===============================
export const messagesAPI = {
  // Récupérer la liste des messages avec pagination et filtres
  getMessages: (filters: any = {}) => adminAPI.getMessages(filters),

  // Récupérer le détail d'un message spécifique
  getMessageDetail: (id: string) => adminAPI.getMessageDetail(id),

  // Envoyer un nouveau message
  sendMessage: (data: any) => adminAPI.sendMessage(data),

  // Mettre à jour un message existant
  updateMessage: (id: string, data: any) => adminAPI.updateMessage(id, data),

  // Supprimer un message
  deleteMessage: (id: string, hard: boolean = false) => adminAPI.deleteMessage(id, hard),

  // Récupérer les statistiques des messages
  getStats: () => adminAPI.getMessageStats(),

  // Mise à jour en masse des messages
  bulkUpdate: (messageIds: string[], action: any) => adminAPI.bulkUpdateMessages(messageIds, action),

  // Exporter les messages
  exportMessages: (filters: any) => adminAPI.exportMessages(filters),

  // Récupérer les conversations
  getConversations: () => adminAPI.getConversations(),

  // Récupérer les messages d'une conversation
  getMessagesByConversation: (conversationId: string) => adminAPI.getMessagesByConversation(conversationId),

  // Répondre à une conversation
  replyToConversation: (conversationId: string, content: string) => adminAPI.replyToConversation(conversationId, content),

  // Compter les conversations non lues
  getUnreadConversationsCount: () => adminAPI.getUnreadConversationsCount(),
};
