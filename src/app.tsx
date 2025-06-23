import React, { useState } from "react";
import MainLayout from "./components/layout/MainLayout";
import { ToastProvider } from "./components/layout/ToastProvider";
import ModalNouveauProjet from "./components/modals/ModalNouveauProjet";
import BillingPage from "./pages/BillingPage";
import Dashboard from "./pages/DashboardPage";
import FilesPage from "./pages/FilesPage";
import HelpPage from "./pages/HelpPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
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

type AppMode = "landing" | "login" | "app";

// Composant principal de l'application
function App() {
  // Mode de l'application : landing page par défaut
  const [appMode, setAppMode] = useState<AppMode>("landing");
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
    setAppMode("app");
  };

  // Gère la déconnexion
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentSection("dashboard");
    setAppMode("landing"); // Retour à la landing page
  };

  // Gère l'accès à l'application depuis la landing page
  const handleAccessApp = () => {
    setAppMode("login");
  };

  // Gère le retour à la landing page
  const handleBackToLanding = () => {
    setAppMode("landing");
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
    <ToastProvider>
      <div className="App">
        {appMode === "landing" && <LandingPage onAccessApp={handleAccessApp} />}

        {appMode === "login" && (
          <LoginPage
            onLogin={handleLogin}
            onBackToLanding={handleBackToLanding}
          />
        )}

        {appMode === "app" && isLoggedIn && (
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
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
