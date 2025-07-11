import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { LoginRequest, RegisterRequest, User } from "../types/shared";
import {
  authAPI,
  AuthContextType,
  roleCheckers,
  tokenUtils,
} from "../utils/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = tokenUtils.get();

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authAPI.me();
      setUser(userData);
    } catch (err) {
      console.error("Erreur auth:", err);
      tokenUtils.remove();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    console.log(
      "[AuthContext] Tentative de connexion pour:",
      credentials.email
    );

    try {
      const response = await authAPI.login(credentials);
      console.log("[AuthContext] Connexion réussie, réponse API:", response);
      tokenUtils.set(response.token);
      setUser(response.user);
      return response.user;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de connexion";
      console.error("[AuthContext] Erreur de connexion:", err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.register(userData);
      tokenUtils.set(response.token);
      setUser(response.user);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur d'inscription";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    tokenUtils.remove();
    setUser(null);
    setError(null);
  };

  const isAdmin = (): boolean => {
    return roleCheckers.isAdmin(user);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    error,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// HOC pour protéger les routes admin
export const RequireAdmin: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Accès refusé
          </h1>
          <p className="text-gray-600">
            Vous devez être administrateur pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
