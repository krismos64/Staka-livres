import React, { useEffect, useState } from "react";
import AdminLayout, { AdminSection } from "./components/admin/AdminLayout";
import MainLayout from "./components/layout/MainLayout";
import { ToastProvider } from "./components/layout/ToastProvider";
import ModalNouveauProjet from "./components/modals/ModalNouveauProjet";
import { AuthProvider, RequireAdmin, useAuth } from "./contexts/AuthContext";
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
import SignupPage from "./pages/SignupPage";
import AdminCommandes from "./pages/admin/AdminCommandes";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUtilisateurs from "./pages/admin/AdminUtilisateurs";

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

type AppMode = "landing" | "login" | "signup" | "app" | "admin";

// Composant interne qui utilise useAuth
const AppContent: React.FC = () => {
  const { user, login, logout, isLoading } = useAuth();

  // Mode de l'application : landing page par défaut
  const [appMode, setAppMode] = useState<AppMode>("landing");

  // Section active pour l'app normale
  const [currentSection, setCurrentSection] =
    useState<SectionName>("dashboard");

  // Section active pour l'admin
  const [adminSection, setAdminSection] = useState<AdminSection>("dashboard");

  // État pour le modal nouveau projet
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Gère la redirection automatique au chargement de l'app
  useEffect(() => {
    // Attend que la vérification de l'authentification soit terminée
    if (isLoading) {
      return;
    }

    const paymentStatus = localStorage.getItem("paymentStatus");

    if (user) {
      // Si l'utilisateur est connecté, on passe en mode app
      setAppMode(user.role === "ADMIN" ? "admin" : "app");

      if (paymentStatus) {
        // Si on revient d'un paiement, on va directement à la facturation
        setCurrentSection("billing");
      }
    }
    // Si pas d'utilisateur, on reste sur la landing page (comportement par défaut)
  }, [isLoading, user]);

  // Gère la redirection APRÈS avoir cliqué sur le bouton de paiement
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");

    if (paymentStatus === "success" || paymentStatus === "cancel") {
      // Stocker le statut dans localStorage pour qu'il survive au rechargement
      localStorage.setItem("paymentStatus", paymentStatus);
      // Recharger l'app à la racine pour avoir un état propre
      window.location.href = window.location.pathname;
    }
  }, []);

  const handleSignupSuccess = () => {
    setAppMode("app");
  };

  // Gère la connexion avec l'API réelle
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    console.log("[App.tsx] Lancement de handleLogin...");
    const loggedInUser = await login({ email, password });
    console.log("[App.tsx] Utilisateur reçu après login:", loggedInUser);

    if (loggedInUser) {
      if (loggedInUser.role === "ADMIN") {
        console.log("[App.tsx] Utilisateur est ADMIN, passage en mode 'admin'");
        setAppMode("admin");
      } else {
        console.log("[App.tsx] Utilisateur est USER, passage en mode 'app'");
        setAppMode("app");
      }
    } else {
      console.log("[App.tsx] Échec de la connexion, loggedInUser est null.");
    }
  };

  // Gère la déconnexion
  const handleLogout = () => {
    logout();
    setCurrentSection("dashboard");
    setAdminSection("dashboard");
    setAppMode("landing");
  };

  // Gère l'accès à l'application depuis la landing page
  const handleAccessApp = () => {
    setAppMode("login");
  };

  // Gère l'accès à la page de connexion depuis la navbar
  const handleLoginClick = () => {
    setAppMode("login");
  };

  // Gère le retour à la landing page
  const handleBackToLanding = () => {
    setAppMode("landing");
  };

  // Gère l'accès à la page d'inscription
  const handleGoToSignup = () => {
    setAppMode("signup");
  };

  // Gère le retour à la page de connexion depuis l'inscription
  const handleBackToLogin = () => {
    setAppMode("login");
  };

  // Gère le passage en mode admin
  const handleGoToAdmin = () => {
    if (user?.role === "ADMIN") {
      setAppMode("admin");
    }
  };

  // Gère le retour à l'app normale
  const handleBackToApp = () => {
    setAppMode("app");
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

  // Rendu dynamique de la section admin
  const renderAdminSection = () => {
    switch (adminSection) {
      case "dashboard":
        return <AdminDashboard />;
      case "utilisateurs":
        return <AdminUtilisateurs />;
      case "commandes":
        return <AdminCommandes />;
      default:
        return <div>Section admin inconnue: {adminSection}</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="App">
      {appMode === "landing" && <LandingPage onLoginClick={handleLoginClick} />}

      {appMode === "login" && (
        <LoginPage
          onLogin={handleLogin}
          onBackToLanding={handleBackToLanding}
          onGoToSignup={handleGoToSignup}
        />
      )}

      {appMode === "signup" && (
        <SignupPage
          onBackToLogin={handleBackToLogin}
          onBackToLanding={handleBackToLanding}
          onSignupSuccess={handleSignupSuccess}
        />
      )}

      {appMode === "app" && user && (
        <>
          <MainLayout
            pageTitle={getPageTitle()}
            onSectionChange={setCurrentSection}
            onLogout={handleLogout}
            activeSection={currentSection}
            onNewProjectClick={() => setShowNewProjectModal(true)}
            onGoToAdmin={handleGoToAdmin}
          >
            {renderSection()}
          </MainLayout>
          <ModalNouveauProjet
            open={showNewProjectModal}
            onClose={() => setShowNewProjectModal(false)}
          />
        </>
      )}

      {appMode === "admin" && user && user.role === "ADMIN" && (
        <RequireAdmin>
          <AdminLayout
            activeSection={adminSection}
            onSectionChange={setAdminSection}
            onLogout={handleLogout}
          >
            {renderAdminSection()}
          </AdminLayout>
        </RequireAdmin>
      )}
    </div>
  );
};

// Composant principal de l'application avec providers
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
