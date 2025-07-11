// Configuration API pour les appels backend
// En mode développement, Vite proxy /api vers le backend
const API_BASE_URL = "/api";

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    payments: {
      createCheckoutSession: "/payments/create-checkout-session",
      getStatus: "/payments/status",
      webhook: "/payments/webhook",
    },
    auth: {
      login: "/auth/login",
      register: "/auth/register",
      me: "/auth/me",
    },
    commandes: {
      list: "/commandes",
      create: "/commandes",
      get: "/commandes",
    },
    invoices: {
      list: "/invoices",
      detail: "/invoices",
      download: "/invoices",
    },
    messages: {
      list: "/messages",
      detail: "/messages",
      create: "/messages",
      update: "/messages",
      delete: "/messages",
      stats: "/messages/stats",
      attachments: "/messages",
    },
    tarifs: {
      list: "/tarifs",
    },
  },
};

// Helper pour construire les URLs complètes
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper pour les requêtes authentifiées
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper pour les requêtes publiques
export const getPublicHeaders = (): HeadersInit => {
  return {
    "Content-Type": "application/json",
  };
};

// Helper pour les uploads de fichiers (sans Content-Type)
export const getFileUploadHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
    // Note: Pas de Content-Type pour permettre au navigateur de définir multipart/form-data avec boundary
  };
};

// Configuration Stripe (prix par type de service)
export const stripeConfig = {
  priceIds: {
    correction_standard: "price_1234567890", // À remplacer par le vrai ID Stripe
    correction_express: "price_0987654321", // À remplacer par le vrai ID Stripe
    correction_premium: "price_1122334455", // À remplacer par le vrai ID Stripe
  },
};

// Types pour les tarifs
export interface TarifAPI {
  id: string;
  nom: string;
  description: string;
  prix: number;
  prixFormate: string;
  typeService: string;
  dureeEstimee?: string;
  actif: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export interface TarifsResponse {
  success: boolean;
  data: TarifAPI[];
  message: string;
}

// Types pour les factures
export interface InvoiceAPI {
  id: string;
  amount: number;
  amountFormatted: string;
  createdAt: string;
  pdfUrl: string;
  commande: {
    id: string;
    titre: string;
    statut: string;
    createdAt: string;
    description?: string;
    user?: {
      prenom: string;
      nom: string;
      email: string;
    };
  };
}

export interface InvoicesResponse {
  invoices: InvoiceAPI[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// API Helpers pour les tarifs publics
export async function fetchTarifs(): Promise<TarifAPI[]> {
  const response = await fetch(buildApiUrl(apiConfig.endpoints.tarifs.list), {
    method: "GET",
    headers: getPublicHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  const result: TarifsResponse = await response.json();
  return result.data;
}

// API Helpers pour les factures
export async function fetchInvoices(
  page = 1,
  limit = 10
): Promise<InvoicesResponse> {
  const response = await fetch(
    buildApiUrl(
      `${apiConfig.endpoints.invoices.list}?page=${page}&limit=${limit}`
    ),
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

export async function fetchInvoice(id: string): Promise<InvoiceAPI> {
  const response = await fetch(
    buildApiUrl(`${apiConfig.endpoints.invoices.detail}/${id}`),
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

export async function downloadInvoice(id: string): Promise<Blob> {
  const response = await fetch(
    buildApiUrl(`${apiConfig.endpoints.invoices.download}/${id}/download`),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.blob();
}
