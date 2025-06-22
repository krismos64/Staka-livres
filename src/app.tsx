import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";
import MainLayout from "./components/MainLayout";
import ModalNouveauProjet from "./components/ModalNouveauProjet";
import BillingPage from "./pages/BillingPage";
import FilesPage from "./pages/FilesPage";
import HelpPage from "./pages/HelpPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilPage from "./pages/ProfilPage";
import ProjectsPage from "./pages/ProjectsPage";
import SettingsPage from "./pages/SettingsPage";

import "./styles/global.css";

type SectionName =
  | "dashboard"
  | "projects"
  | "messages"
  | "files"
  | "billing"
  | "help"
  | "profile"
  | "settings";

// Composant principal de l'application
function App() {
  // État pour la connexion
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  // Section active
  const [currentSection, setCurrentSection] =
    useState<SectionName>("dashboard");
  // État pour le modal nouveau projet
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Gère la connexion
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  // Gère la déconnexion
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentSection("dashboard");
  };

  // Mapping titre => section
  const getPageTitle = (): string => {
    const titles: Record<SectionName, string> = {
      dashboard: "Tableau de bord",
      projects: "Mes projets",
      messages: "Messages",
      files: "Mes fichiers",
      billing: "Facturation",
      help: "Aide & Support",
      profile: "Mon profil",
      settings: "Paramètres",
    };
    return titles[currentSection] || "Page";
  };

  // Rendu dynamique de la section en cours
  const renderSection = () => {
    switch (currentSection) {
      case "dashboard":
        return <Dashboard />;
      case "projects":
        return (
          <ProjectsPage
            onNewProjectClick={() => setShowNewProjectModal(true)}
          />
        );
      case "messages":
        return <MessagesPage />;
      case "files":
        return <FilesPage />;
      case "billing":
        return <BillingPage />;
      case "help":
        return <HelpPage />;
      case "profile":
        return <ProfilPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <div>Section inconnue: {currentSection}</div>;
    }
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <>
          <MainLayout
            pageTitle={getPageTitle()}
            onSectionChange={setCurrentSection}
            onLogout={handleLogout}
            activeSection={currentSection}
            onNewProjectClick={() => setShowNewProjectModal(true)}
          >
            {renderSection()}
          </MainLayout>
          <ModalNouveauProjet
            open={showNewProjectModal}
            onClose={() => setShowNewProjectModal(false)}
          />
        </>
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
