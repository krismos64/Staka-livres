import React, { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getUnreadConversationsCount } from "../../utils/adminAPI";
import Notifications from "../common/Notifications";
import { DemoBanner, useDemoMode } from "./DemoModeProvider";
<<<<<<< HEAD
=======
import { SecurityAuditPanel } from "./RequireAdmin";
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629

export type AdminSection =
  | "dashboard"
  | "users"
  | "commandes"
  | "factures"
  | "faq"
  | "tarifs"
  | "pages"
  | "statistiques"
  | "messagerie";

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

  const getActiveSection = () => {
    const path = location.pathname.split("/").pop() || "dashboard";
    if (path === "admin") return "dashboard";
    return path;
  };
  const activeSection = getActiveSection();

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
      }[activeSection] || "Panel d'administration"
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* Bannière de démonstration */}
      <DemoBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* --- Sidebar --- */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white shadow-2xl transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
          style={{ top: isDemo ? "48px" : "0" }} // Décaler si bannière démo
        >
          <div className="flex flex-col h-full">
            {/* Logo et en-tête */}
            <div className="flex items-center justify-center px-6 py-5 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-shield-alt text-white text-xl"></i>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold tracking-wider">STAKA</h1>
                  {isDemo && (
                    <span className="text-xs text-purple-300 font-medium">
                      <i className="fas fa-theater-masks mr-1"></i>
                      MODE DÉMO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
              <p className="px-4 mb-3 text-xs uppercase text-gray-400 tracking-wider">
                Navigation
              </p>
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

            {/* Profil utilisateur et déconnexion */}
            <div className="p-4 border-t border-gray-700 bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.prenom?.[0].toUpperCase()}
                    {user?.nom?.[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-xs text-gray-400">
                    Administrateur {isDemo && "• Démo"}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-700"
                  title="Déconnexion"
                >
                  <i className="fas fa-sign-out-alt text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay pour mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ top: isDemo ? "48px" : "0" }}
          ></div>
        )}

        {/* --- Contenu principal --- */}
        <div className="flex-1 flex flex-col lg:ml-0 min-w-0">
          {/* En-tête */}
          <header className="bg-white shadow-md px-6 py-4 z-30">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <i className="fas fa-bars text-xl"></i>
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      {getPageTitle()}
                      {isDemo && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                          Démo
                        </span>
                      )}
                    </h1>
                    <p className="text-gray-600 text-sm">
                      {getPageDescription()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Clochette de notifications admin */}
                <Notifications />
                
                <div className="hidden md:flex items-center text-sm text-gray-500">
                  <i className="fas fa-user mr-2"></i>
                  {user?.email}
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.prenom?.[0].toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Contenu */}
          <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
        </div>
      </div>

<<<<<<< HEAD
=======
      {/* Panel d'audit de sécurité (développement uniquement) */}
      <SecurityAuditPanel />
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
    </div>
  );
};

export default AdminLayout;
