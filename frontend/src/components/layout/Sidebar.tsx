import React from "react";
import { useProjects } from "../../hooks/useProjects";
import { useMessages } from "../../hooks/useMessages";

type SectionName =
  | "dashboard"
  | "projects"
  | "messages"
  | "notifications"
  | "files"
  | "billing"
  | "help"
  | "profile"
  | "settings";

interface SidebarProps {
  activeSection: SectionName;
  onSectionChange: (section: SectionName) => void;
  onNewProjectClick: () => void;
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({
  activeSection,
  onSectionChange,
  onNewProjectClick,
  isOpen,
  onClose,
}: SidebarProps) {
  // Récupérer les projets pour calculer le nombre de projets actifs
  const { data: projectsResponse } = useProjects({
    page: 1,
    limit: 50, // Maximum autorisé par l'API
    status: 'all'
  });

  // Récupérer les messages pour vérifier s'il y a des messages non lus
  const { data: messagesResponse } = useMessages({
    page: 1,
    limit: 10
  });

  const projects = projectsResponse?.data || [];
  const messages = messagesResponse?.data || [];
  
  // Calculer le nombre de projets actifs (en cours, en attente, en correction)
  const activeProjectsCount = projects.filter(p => 
    p.status === "EN_COURS" || 
    p.status === "EN_ATTENTE" || 
    p.status === "En cours" || 
    p.status === "En attente" ||
    p.status === "En correction"
  ).length;

  // Vérifier s'il y a des messages non lus (messages récents de l'admin)
  const hasUnreadMessages = messages.some(m => 
    m.fromAdmin && !m.isRead && 
    new Date(m.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Messages de moins de 24h
  );

  const handleNavigation = (section: SectionName) => {
    onSectionChange(section);
    onClose(); // Ferme la sidebar après la navigation sur mobile
  };

  return (
    <aside
      id="sidebar"
      className={`fixed inset-y-0 left-0 z-40 w-72 bg-white min-h-screen px-0 pt-10 border-r border-gray-200 transform lg:translate-x-0 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <nav>
        <ul className="space-y-2 px-0">
          {/* Tableau de bord */}
          <li>
            <button
              onClick={() => handleNavigation("dashboard")}
              className={`w-full flex items-center px-8 py-3 rounded-2xl text-base font-medium transition
                ${
                  activeSection === "dashboard"
                    ? "bg-[#eef4ff] text-[#2253e6]"
                    : "text-gray-700 hover:bg-[#eef4ff] hover:text-[#2253e6]"
                }`}
            >
              <i className="fas fa-home mr-3 text-lg"></i>
              Tableau de bord
            </button>
          </li>
          {/* Mes projets */}
          <li>
            <button
              onClick={() => handleNavigation("projects")}
              className={`w-full flex items-center px-8 py-3 rounded-2xl text-base font-medium transition
                ${
                  activeSection === "projects"
                    ? "bg-[#eef4ff] text-[#2253e6]"
                    : "text-gray-700 hover:bg-[#eef4ff] hover:text-[#2253e6]"
                }`}
            >
              <i className="fas fa-folder mr-3 text-lg"></i>
              Mes projets
              {activeProjectsCount > 0 && (
                <span className="ml-auto flex items-center">
                  <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full ml-2">
                    {activeProjectsCount}
                  </span>
                </span>
              )}
            </button>
          </li>
          {/* Mes fichiers */}
          <li>
            <button
              onClick={() => handleNavigation("files")}
              className={`w-full flex items-center px-8 py-3 rounded-2xl text-base font-medium transition
                ${
                  activeSection === "files"
                    ? "bg-[#eef4ff] text-[#2253e6]"
                    : "text-gray-700 hover:bg-[#eef4ff] hover:text-[#2253e6]"
                }`}
            >
              <i className="fas fa-file mr-3 text-lg"></i>
              Mes fichiers
            </button>
          </li>
          {/* Messages */}
          <li>
            <button
              onClick={() => handleNavigation("messages")}
              className={`w-full flex items-center px-8 py-3 rounded-2xl text-base font-medium transition relative
                ${
                  activeSection === "messages"
                    ? "bg-[#eef4ff] text-[#2253e6]"
                    : "text-gray-700 hover:bg-[#eef4ff] hover:text-[#2253e6]"
                }`}
            >
              <i className="fas fa-comments mr-3 text-lg"></i>
              Messages
              {/* Indicateur de messages non lus */}
              {hasUnreadMessages && (
                <span className="ml-auto">
                  <span className="w-3 h-3 bg-red-500 rounded-full block animate-pulse"></span>
                </span>
              )}
            </button>
          </li>
          {/* Facturation */}
          <li>
            <button
              onClick={() => handleNavigation("billing")}
              className={`w-full flex items-center px-8 py-3 rounded-2xl text-base font-medium transition
                ${
                  activeSection === "billing"
                    ? "bg-[#eef4ff] text-[#2253e6]"
                    : "text-gray-700 hover:bg-[#eef4ff] hover:text-[#2253e6]"
                }`}
            >
              <i className="fas fa-credit-card mr-3 text-lg"></i>
              Facturation
            </button>
          </li>
          {/* Aide & Support */}
          <li>
            <button
              onClick={() => handleNavigation("help")}
              className={`w-full flex items-center px-8 py-3 rounded-2xl text-base font-medium transition
                ${
                  activeSection === "help"
                    ? "bg-[#eef4ff] text-[#2253e6]"
                    : "text-gray-700 hover:bg-[#eef4ff] hover:text-[#2253e6]"
                }`}
            >
              <i className="fas fa-question-circle mr-3 text-lg"></i>
              Aide & Support
            </button>
          </li>
        </ul>
        {/* Actions rapides */}
        <div className="mt-12 px-4">
          <div className="bg-[#eef4ff] rounded-2xl py-6 px-4 flex flex-col gap-4">
            <h4 className="font-bold text-gray-900 mb-1 text-lg">
              Actions rapides
            </h4>
            <button
              className="w-full bg-[#2563eb] hover:bg-[#2253e6] text-white text-lg font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
              onClick={onNewProjectClick}
            >
              <i className="fas fa-plus"></i>
              Nouveau projet
            </button>
            <button
              className="w-full bg-white text-gray-700 py-3 px-4 rounded-xl text-base border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2"
              onClick={() => handleNavigation("help")}
            >
              <i className="fas fa-question-circle"></i>
              Contacter l'équipe
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
