import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { refreshDemoData, resetDemoData } from "../../utils/adminAPI"; // Correction de l'import
import { useToast } from "../layout/ToastProvider";

interface DemoModeState {
  isDemo: boolean;
  demoConfig: {
    readOnly: boolean;
    showBanner: boolean;
    allowedActions: string[];
    restrictedFeatures: string[];
    sessionDuration: number; // en minutes
    duration: number; // en minutes
  };
  startTime: number;
  remainingTime: number;
}

interface DemoModeContextType extends DemoModeState {
  enableDemo: (config?: Partial<DemoModeState["demoConfig"]>) => void;
  disableDemo: () => void;
  isActionAllowed: (action: string) => boolean;
  isFeatureRestricted: (feature: string) => boolean;
  getRemainingTime: () => number;
  extendSession: (minutes: number) => void;
}

const defaultDemoConfig: DemoModeState["demoConfig"] = {
  readOnly: false,
  showBanner: true,
  allowedActions: ["read", "search", "filter", "export", "preview"],
  restrictedFeatures: ["delete", "bulk-delete", "user-deactivate"],
  sessionDuration: 30, // 30 minutes par défaut
  duration: 0, // 0 minutes par défaut
};

const DemoModeContext = createContext<DemoModeContextType | undefined>(
  undefined
);

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error("useDemoMode must be used within a DemoModeProvider");
  }
  return context;
};

interface DemoModeProviderProps {
  children: ReactNode;
}

export const DemoModeProvider: React.FC<DemoModeProviderProps> = ({
  children,
}) => {
  const [demoState, setDemoState] = useState<DemoModeState>({
    isDemo: false,
    demoConfig: defaultDemoConfig,
    startTime: 0,
    remainingTime: 0,
  });

  const { showToast } = useToast();

  // Détection automatique du mode démo via URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get("demo");
    const readOnlyParam = urlParams.get("readonly");

    if (demoParam === "true") {
      enableDemo({
        readOnly: readOnlyParam === "true",
        sessionDuration: parseInt(urlParams.get("duration") || "30", 10),
      });
    }
  }, []);

  // Gestion du timer de session
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (demoState.isDemo && demoState.startTime > 0) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - demoState.startTime) / 1000 / 60); // minutes
        const remaining = Math.max(
          0,
          demoState.demoConfig.sessionDuration - elapsed
        );

        setDemoState((prev) => ({ ...prev, remainingTime: remaining }));

        // Notifications de fin de session
        if (remaining === 5) {
          showToast(
            "warning",
            "Session démo",
            "Il vous reste 5 minutes de démonstration"
          );
        } else if (remaining === 1) {
          showToast(
            "warning",
            "Session démo",
            "Il vous reste 1 minute de démonstration"
          );
        } else if (remaining === 0) {
          showToast(
            "info",
            "Session terminée",
            "La démonstration est terminée"
          );
          disableDemo();
        }
      }, 60000); // Vérifier chaque minute
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    demoState.isDemo,
    demoState.startTime,
    demoState.demoConfig.sessionDuration,
  ]);

  const enableDemo = (customConfig?: Partial<DemoModeState["demoConfig"]>) => {
    const config = { ...defaultDemoConfig, ...customConfig };
    const startTime = Date.now();

    setDemoState({
      isDemo: true,
      demoConfig: config,
      startTime,
      remainingTime: config.sessionDuration,
    });

    showToast(
      "info",
      "Mode démo activé",
      `Session de ${config.sessionDuration} minutes${
        config.readOnly ? " (lecture seule)" : ""
      }`
    );

    // Log pour les analytics
    console.log("🎭 Mode démo activé:", {
      config,
      startTime: new Date(startTime),
    });
  };

  const disableDemo = () => {
    setDemoState({
      isDemo: false,
      demoConfig: defaultDemoConfig,
      startTime: 0,
      remainingTime: 0,
    });

    showToast("info", "Mode démo désactivé", "Retour au mode normal");

    // Nettoyer l'URL
    const url = new URL(window.location.href);
    url.searchParams.delete("demo");
    url.searchParams.delete("readonly");
    url.searchParams.delete("duration");
    window.history.replaceState({}, "", url.toString());
  };

  const isActionAllowed = (action: string): boolean => {
    if (!demoState.isDemo) return true;

    if (demoState.demoConfig.readOnly) {
      return demoState.demoConfig.allowedActions.includes(action);
    }

    return !demoState.demoConfig.restrictedFeatures.includes(action);
  };

  const isFeatureRestricted = (feature: string): boolean => {
    if (!demoState.isDemo) return false;
    return demoState.demoConfig.restrictedFeatures.includes(feature);
  };

  const getRemainingTime = (): number => {
    if (!demoState.isDemo) return 0;

    const now = Date.now();
    const elapsed = Math.floor((now - demoState.startTime) / 1000 / 60);
    return Math.max(0, demoState.demoConfig.sessionDuration - elapsed);
  };

  const extendSession = (minutes: number) => {
    if (!demoState.isDemo) return;

    setDemoState((prev) => ({
      ...prev,
      demoConfig: {
        ...prev.demoConfig,
        sessionDuration: prev.demoConfig.sessionDuration + minutes,
      },
    }));

    showToast("success", "Session étendue", `${minutes} minutes ajoutées`);
  };

  const value: DemoModeContextType = {
    ...demoState,
    enableDemo,
    disableDemo,
    isActionAllowed,
    isFeatureRestricted,
    getRemainingTime,
    extendSession,
  };

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
};

// Composant bannière démo amélioré
export const DemoBanner: React.FC = () => {
  const { isDemo, demoConfig, remainingTime, disableDemo, extendSession } =
    useDemoMode();

  const { showToast } = useToast();
  const [isActionsLoading, setIsActionsLoading] = useState(false);

  if (!isDemo || !demoConfig.showBanner) return null;

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const handleRefreshData = async () => {
    try {
      setIsActionsLoading(true);
      const result = await refreshDemoData();
      showToast("success", "Données rafraîchies", result.message);

      // Recharger la page pour voir les nouvelles données
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      showToast("error", "Erreur", "Impossible de rafraîchir les données");
    } finally {
      setIsActionsLoading(false);
    }
  };

  const handleResetData = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir réinitialiser toutes les données de démonstration ?"
      )
    ) {
      return;
    }

    try {
      setIsActionsLoading(true);
      const result = await resetDemoData();
      showToast("success", "Données réinitialisées", result.message);

      // Recharger la page pour voir les données réinitialisées
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      showToast("error", "Erreur", "Impossible de réinitialiser les données");
    } finally {
      setIsActionsLoading(false);
    }
  };

  const getTimeColor = (): string => {
    if (remainingTime <= 1) return "text-red-400";
    if (remainingTime <= 5) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 relative overflow-hidden">
      {/* Motif de fond animé */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse transform translate-x-full"></div>
      </div>

      <div className="relative flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="font-semibold text-lg">🎭 MODE DÉMONSTRATION</span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-sm">
            <span>Données fictives actives</span>
            <span className="text-gray-300">•</span>
            <span>Aucune modification réelle</span>
            {demoConfig.readOnly && (
              <>
                <span className="text-gray-300">•</span>
                <span className="bg-yellow-500 bg-opacity-20 px-2 py-1 rounded text-xs">
                  LECTURE SEULE
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Timer */}
          {demoConfig.duration > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm">Temps restant:</span>
              <span className={`font-mono font-bold ${getTimeColor()}`}>
                {formatTime(remainingTime)}
              </span>
            </div>
          )}

          {/* Actions démo */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefreshData}
              disabled={isActionsLoading}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Générer de nouvelles données fictives"
            >
              {isActionsLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "🔄 Rafraîchir"
              )}
            </button>

            <button
              onClick={handleResetData}
              disabled={isActionsLoading}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remettre les données à l'état initial"
            >
              🔄 Reset
            </button>

            {demoConfig.duration > 0 && (
              <button
                onClick={() => extendSession(10)}
                className="bg-green-500 bg-opacity-80 hover:bg-opacity-100 transition-all duration-200 px-3 py-1 rounded-md text-sm font-medium"
                title="Prolonger la session de démonstration"
              >
                ⏰ +10min
              </button>
            )}

            <button
              onClick={disableDemo}
              className="bg-red-500 bg-opacity-80 hover:bg-opacity-100 transition-all duration-200 px-3 py-1 rounded-md text-sm font-medium"
              title="Quitter le mode démonstration"
            >
              ❌ Quitter
            </button>
          </div>
        </div>
      </div>

      {/* Barre de progression du temps restant */}
      {demoConfig.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-20">
          <div
            className="h-full bg-white transition-all duration-1000"
            style={{
              width: `${Math.max(
                0,
                (remainingTime / demoConfig.duration) * 100
              )}%`,
              backgroundColor:
                remainingTime <= 5
                  ? "#ef4444"
                  : remainingTime <= 10
                  ? "#f59e0b"
                  : "#10b981",
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

// HOC pour protéger les actions en mode démo
export const withDemoRestriction = <P extends object>(
  Component: React.ComponentType<P>,
  action: string,
  fallbackComponent?: React.ComponentType<P>
) => {
  return (props: P) => {
    const { isActionAllowed } = useDemoMode();

    if (!isActionAllowed(action)) {
      if (fallbackComponent) {
        return React.createElement(fallbackComponent, props);
      }
      return null;
    }

    return React.createElement(Component, props);
  };
};

// Hook pour les actions conditionnelles en mode démo
export const useDemoAction = () => {
  const { isDemo, isActionAllowed, demoConfig } = useDemoMode();
  const { showToast } = useToast();

  const executeAction = (
    action: string,
    callback: () => void,
    message?: string
  ) => {
    if (!isActionAllowed(action)) {
      const defaultMessage = demoConfig.readOnly
        ? "Action non autorisée en mode lecture seule"
        : "Cette action est limitée en mode démonstration";

      showToast("warning", "Action restreinte", message || defaultMessage);
      return;
    }

    callback();
  };

  return { executeAction, isDemo, isActionAllowed };
};

export default DemoModeProvider;
