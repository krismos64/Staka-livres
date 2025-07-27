import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getUnreadConversationsCount } from "../../utils/adminAPI";
import Notifications from "../common/Notifications";
import { DemoBanner, useDemoMode } from "./DemoModeProvider";
import { SecurityAuditPanel } from "./RequireAdmin";

export type AdminSection =
  | "dashboard"
  | "users"
  | "commandes"
  | "factures"
  | "faq"
  | "tarifs"
  | "pages"
  | "statistiques"
  | "messagerie"
  | "audit-logs";

interface AdminLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

// Hook pour récupérer le nombre de conversations non lues
const useUnreadConversationsCount = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { isDemo } = useDemoMode();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadConversationsCount();
        setUnreadCount(count);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du compteur de conversations non lues:",
          error
        );
      }
    };

    // Charger initialement
    fetchUnreadCount();

    // Rafraîchir toutes les 30 secondes en mode démo, 2 minutes en mode normal
    const interval = setInterval(fetchUnreadCount, isDemo ? 30000 : 120000);

    return () => clearInterval(interval);
  }, [isDemo]);

  return unreadCount;
};

// Composant pour les liens de la barre latérale
const SidebarLink: React.FC<{
  to: string;
  label: string;
  icon: string;
  isActive: boolean;
  badge?: number;
}> = ({ to, label, icon, isActive, badge }) => (
  <li>
    <Link
      to={to}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left text-base transition-all duration-200 ease-in-out transform hover:translate-x-2 ${
        isActive
          ? "bg-blue-600 text-white shadow-lg"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
    >
      <i className={`${icon} w-6 text-center text-lg`}></i>
      <span className="font-semibold flex-1">{label}</span>
      {badge && badge > 0 && (
        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  </li>
);

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const unreadConversationsCount = useUnreadConversationsCount();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const getActiveSection = () => {
    const path = location.pathname.split("/").pop() || "dashboard";
    if (path === "admin") return "dashboard";
    return path;
  };
  const activeSection = getActiveSection();

  // Gestion de la fermeture de la sidebar sur mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024 // Seulement sur mobile/tablette
      ) {
        setSidebarOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    // Ajouter les event listeners seulement si la sidebar est ouverte
    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [sidebarOpen]);

  // Fermer la sidebar lors du changement de route sur mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "fas fa-tachometer-alt",
    },
    {
      id: "users",
      label: "Utilisateurs",
      icon: "fas fa-users-cog",
    },
    {
      id: "commandes",
      label: "Commandes",
      icon: "fas fa-file-invoice-dollar",
    },
    {
      id: "factures",
      label: "Factures",
      icon: "fas fa-receipt",
    },
    {
      id: "messagerie",
      label: "Messagerie",
      icon: "fas fa-comments",
    },
    {
      id: "statistiques",
      label: "Statistiques",
      icon: "fas fa-chart-line",
    },
    {
      id: "faq",
      label: "FAQ",
      icon: "fas fa-question-circle",
    },
    {
      id: "tarifs",
      label: "Tarifs",
      icon: "fas fa-euro-sign",
    },
    {
      id: "pages",
      label: "Pages statiques",
      icon: "fas fa-file-alt",
    },
    {
      id: "audit-logs",
      label: "Logs/Audit",
      icon: "fas fa-shield-alt",
    },
  ];

  const getPageTitle = (): string => {
    const baseTitle =
      {
        dashboard: "Dashboard Admin",
        users: "Gestion des utilisateurs",
        commandes: "Gestion des commandes",
        factures: "Gestion des factures",
        messagerie: "Messagerie Admin",
        faq: "Gestion de la FAQ",
        tarifs: "Gestion des tarifs",
        pages: "Pages statiques",
        statistiques: "Statistiques avancées",
        "audit-logs": "Logs d'Audit",
      }[activeSection] || "Administration";

    return isDemo ? `${baseTitle} (Démo)` : baseTitle;
  };

  const getPageDescription = (): string => {
    return (
      {
        dashboard: "Tableau de bord et aperçu général",
        users: "Gérer les comptes et permissions",
        commandes: "Suivi des corrections et projets",
        factures: "Gestion de la facturation et paiements",
        messagerie: "Superviser les conversations client-correcteur",
        faq: "Questions fréquentes et réponses",
        tarifs: "Configuration des prix et services",
        pages: "Contenu éditorial et pages marketing",
        statistiques: "Analyses et rapports détaillés",
        "audit-logs": "Supervision des activités administratives et de sécurité",
      }[activeSection] || "Panel d'administration"
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* Bannière de démonstration */}
      <DemoBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* Overlay pour mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* --- Sidebar --- */}
        <div
          ref={sidebarRef}
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white shadow-2xl transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
          style={{ top: isDemo ? "48px" : "0" }} // Décaler si bannière démo
        >
          <div className="flex flex-col h-full">
            {/* Logo et en-tête */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-shield-alt text-white text-xl"></i>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                  <p className="text-xs text-gray-400">
                    {isDemo ? "Mode Démo" : "Administration"}
                  </p>
                </div>
              </div>
              
              {/* Bouton fermeture mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                aria-label="Fermer la navigation"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
              <ul className="space-y-2">
                {sidebarItems.map((item) => (
                  <SidebarLink
                    key={item.id}
                    to={`/admin/${item.id}`}
                    label={item.label}
                    icon={item.icon}
                    isActive={activeSection === item.id}
                    badge={
                      item.id === "messagerie"
                        ? unreadConversationsCount
                        : undefined
                    }
                  />
                ))}
              </ul>
            </nav>

            {/* Footer de la sidebar */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-tr from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- Contenu principal --- */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Bouton menu mobile */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Ouvrir la navigation"
                >
                  <i className="fas fa-bars text-xl"></i>
                </button>

                {/* Titre de la page */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getPageTitle()}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {getPageDescription()}
                  </p>
                </div>
              </div>

              {/* Actions de droite */}
              <div className="flex items-center gap-4">
                <Notifications />
                <SecurityAuditPanel />
              </div>
            </div>
          </header>

          {/* Contenu */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
