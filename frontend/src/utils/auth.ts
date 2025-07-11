import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "../types/shared";

// Correction radicale : toujours /api côté navigateur, backend:3001 côté Node
const API_BASE_URL =
  typeof window !== "undefined" ? "/api" : "http://backend:3001";

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<User | null>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  isAdmin: () => boolean;
}

// Gestion du token
export const tokenUtils = {
  get: () => localStorage.getItem("auth_token"),
  set: (token: string) => localStorage.setItem("auth_token", token),
  remove: () => localStorage.removeItem("auth_token"),
  getAuthHeader: (): Record<string, string> => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

// Utilitaires API
export const authAPI = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // DEBUG: log de la valeur API_BASE_URL à chaque login
    console.log("[auth] API_BASE_URL utilisé:", API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de connexion");
    }

    return data;
  },

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur d'inscription");
    }

    return data;
  },

  async me(): Promise<User> {
    const authHeaders = tokenUtils.getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur de récupération du profil");
    }

    return data;
  },
};

// Vérifications de rôle
export const roleCheckers = {
  isAdmin: (user: User | null): boolean => {
    return user?.role === "ADMIN";
  },

  isUser: (user: User | null): boolean => {
    return user?.role === "USER";
  },
};
