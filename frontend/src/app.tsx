import React, { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import AdminLayout from "./components/admin/AdminLayout";
import { DemoModeProvider } from "./components/admin/DemoModeProvider";
import MainLayout from "./components/layout/MainLayout";
import { ToastProvider } from "./components/layout/ToastProvider";
import ModalNouveauProjet from "./components/modals/ModalNouveauProjet";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminCommandes from "./pages/admin/AdminCommandes";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFactures from "./pages/admin/AdminFactures";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminMessagerie from "./pages/admin/AdminMessagerie";
import AdminPages from "./pages/admin/AdminPages";
import AdminStatistiques from "./pages/admin/AdminStatistiques";
import AdminTarifs from "./pages/admin/AdminTarifs";
import AdminUtilisateurs from "./pages/admin/AdminUtilisateurs";
import BillingPage from "./pages/BillingPage";
import DashboardPage from "./pages/DashboardPage";
import FilesPage from "./pages/FilesPage";
import HelpPage from "./pages/HelpPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import StaticPageBySlug from "./pages/pages/[slug]";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ProfilPage from "./pages/ProfilPage";
import ProjectsPage from "./pages/ProjectsPage";
import SettingsPage from "./pages/SettingsPage";
import SignupPage from "./pages/SignupPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import "./styles/global.css";

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

const pageConfig: Record<string, { title: string; section: SectionName }> = {
  "": { title: "Dashboard", section: "dashboard" },
  dashboard: { title: "Dashboard", section: "dashboard" },
  projects: { title: "Projets", section: "projects" },
  messages: { title: "Messagerie", section: "messages" },
  notifications: { title: "Notifications", section: "notifications" },
  files: { title: "Fichiers", section: "files" },
  billing: { title: "Facturation", section: "billing" },
  help: { title: "Aide & Support", section: "help" },
  profile: { title: "Mon Profil", section: "profile" },
  settings: { title: "Paramètres", section: "settings" },
};

const App: React.FC = () => (
  <AuthProvider>
    <ToastProvider>
      <DemoModeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DemoModeProvider>
    </ToastProvider>
  </AuthProvider>
);

const AppRoutes: React.FC = () => {
  const { user, isLoading, login, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Routes>
      {/* Routes publiques */}
      <Route
        path="/"
        element={<LandingPage onLoginClick={() => navigate("/login")} />}
      />
      <Route
        path="/login"
        element={
          <LoginPage
            onLogin={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const email = formData.get("email") as string;
              const password = formData.get("password") as string;
              const user = await login({ email, password });
              if (user) {
                if (user.role === "ADMIN") {
                  navigate("/admin");
                } else {
                  navigate("/app");
                }
              }
            }}
          />
        }
      />
      <Route
        path="/signup"
        element={
          <SignupPage onSignupSuccess={() => {}} onBackToLogin={() => {}} />
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pages/:slug" element={<StaticPageBySlug />} />
      <Route
        path="/payment/success"
        element={<PaymentSuccessPage onBackToApp={() => {}} />}
      />
      <Route
        path="/payment/cancel"
        element={<PaymentCancelPage onBackToApp={() => {}} />}
      />

      {/* Routes protégées */}
      {user ? (
        <>
          {/* Routes Admin */}
          {user.role === "ADMIN" && (
            <Route
              path="/admin/*"
              element={<AdminRoutes onLogout={logout} />}
            />
          )}
          {/* Fallback pour admin vers son dashboard */}
          {user.role === "ADMIN" && (
            <Route path="/app" element={<Navigate to="/admin" replace />} />
          )}

          {/* Routes User */}
          {user.role === "USER" && (
            <Route path="/app/*" element={<AppContent onLogout={logout} />} />
          )}
          {/* Fallback pour user vers son dashboard */}
          {user.role === "USER" && (
            <Route path="/" element={<Navigate to="/app" replace />} />
          )}
        </>
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
      <Route path="*" element={<PageIntrouvable />} />
    </Routes>
  );
};

const AppContent: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNewProjectModalOpen, setNewProjectModalOpen] = useState(false);

  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentPath = pathParts.length > 1 ? pathParts[1] : "";

  const currentPage = pageConfig[currentPath] || pageConfig[""];

  const handleSectionChange = (section: SectionName) => {
    navigate(`/app/${section}`);
  };

  return (
    <MainLayout
      onLogout={onLogout}
      activeSection={currentPage.section}
      onSectionChange={handleSectionChange}
      pageTitle={currentPage.title}
      onNewProjectClick={() => setNewProjectModalOpen(true)}
    >
      <Routes>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="projects"
          element={
            <ProjectsPage
              onNewProjectClick={() => setNewProjectModalOpen(true)}
            />
          }
        />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="projects/:projectId/files" element={<FilesPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="profile" element={<ProfilPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<PageIntrouvable />} />
      </Routes>
      <ModalNouveauProjet
        open={isNewProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
      />
    </MainLayout>
  );
};

const AdminRoutes: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return (
    <AdminLayout onLogout={onLogout}>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUtilisateurs />} />
        <Route path="commandes" element={<AdminCommandes />} />
        <Route path="factures" element={<AdminFactures />} />
        <Route path="faq" element={<AdminFAQ />} />
        <Route path="tarifs" element={<AdminTarifs />} />
        <Route path="pages" element={<AdminPages />} />
        <Route path="statistiques" element={<AdminStatistiques />} />
        <Route path="messagerie" element={<AdminMessagerie />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<PageIntrouvable />} />
      </Routes>
    </AdminLayout>
  );
};

const PageIntrouvable = () => (
  <div className="flex items-center justify-center h-screen">
    <h1 className="text-2xl">404 - Page Introuvable</h1>
  </div>
);

export default App;
