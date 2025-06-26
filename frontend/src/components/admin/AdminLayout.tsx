import React, { ReactNode, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export type AdminSection =
  | "dashboard"
  | "utilisateurs"
  | "commandes"
  | "factures"
  | "faq"
  | "tarifs"
  | "pages"
  | "statistiques"
  | "logs";

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onLogout: () => void;
}

// Composant pour les liens de la barre latérale
const SidebarLink: React.FC<{
  item: { id: AdminSection; label: string; icon: string };
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left text-base transition-all duration-200 ease-in-out transform hover:translate-x-2 ${
        isActive
          ? "bg-blue-600 text-white shadow-lg"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
    >
      <i className={`${item.icon} w-6 text-center text-lg`}></i>
      <span className="font-semibold">{item.label}</span>
    </button>
  </li>
);

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const sidebarItems = [
    {
      id: "dashboard" as AdminSection,
      label: "Dashboard",
      icon: "fas fa-tachometer-alt",
    },
    {
      id: "utilisateurs" as AdminSection,
      label: "Utilisateurs",
      icon: "fas fa-users-cog",
    },
    {
      id: "commandes" as AdminSection,
      label: "Commandes",
      icon: "fas fa-file-invoice-dollar",
    },
    {
      id: "factures" as AdminSection,
      label: "Factures",
      icon: "fas fa-receipt",
    },
    {
      id: "statistiques" as AdminSection,
      label: "Statistiques",
      icon: "fas fa-chart-line",
    },
    {
      id: "faq" as AdminSection,
      label: "FAQ",
      icon: "fas fa-question-circle",
    },
    {
      id: "tarifs" as AdminSection,
      label: "Tarifs",
      icon: "fas fa-euro-sign",
    },
    {
      id: "pages" as AdminSection,
      label: "Pages statiques",
      icon: "fas fa-file-alt",
    },
    {
      id: "logs" as AdminSection,
      label: "Logs & Audit",
      icon: "fas fa-history",
    },
  ];

  const getPageTitle = (): string => {
    return (
      {
        dashboard: "Dashboard Admin",
        utilisateurs: "Gestion des utilisateurs",
        commandes: "Gestion des commandes",
        factures: "Gestion des factures",
        faq: "Gestion de la FAQ",
        tarifs: "Gestion des tarifs",
        pages: "Pages statiques",
        statistiques: "Statistiques avancées",
        logs: "Logs & Audit",
      }[activeSection] || "Administration"
    );
  };

  const getPageDescription = (): string => {
    return (
      {
        dashboard: "Tableau de bord et aperçu général",
        utilisateurs: "Gérer les comptes et permissions",
        commandes: "Suivi des corrections et projets",
        factures: "Gestion de la facturation et paiements",
        faq: "Questions fréquentes et réponses",
        tarifs: "Configuration des prix et services",
        pages: "Contenu éditorial et pages marketing",
        statistiques: "Analyses et rapports détaillés",
        logs: "Historique des actions et audit de sécurité",
      }[activeSection] || "Panel d'administration"
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* --- Sidebar --- */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white shadow-2xl transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo et en-tête */}
          <div className="flex items-center justify-center px-6 py-5 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-shield-alt text-white text-xl"></i>
              </div>
              <h1 className="text-xl font-bold tracking-wider">STAKA</h1>
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
                  item={item}
                  isActive={activeSection === item.id}
                  onClick={() => onSectionChange(item.id)}
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
                <p className="text-xs text-gray-400">Administrateur</p>
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
        ></div>
      )}

      {/* --- Contenu principal --- */}
      <div className="flex-1 flex flex-col lg:ml-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {getPageDescription()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                <i className="fas fa-bell text-lg"></i>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="w-px h-6 bg-gray-200"></div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium text-gray-800">
                  {user?.prenom}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu de la page avec animation */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
