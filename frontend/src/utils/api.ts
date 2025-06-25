// Configuration API pour les appels backend
const API_BASE_URL = "http://localhost:3001";

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

// Configuration Stripe (prix par type de service)
export const stripeConfig = {
  priceIds: {
    correction_standard: "price_1234567890", // À remplacer par le vrai ID Stripe
    correction_express: "price_0987654321", // À remplacer par le vrai ID Stripe
    correction_premium: "price_1122334455", // À remplacer par le vrai ID Stripe
  },
};
