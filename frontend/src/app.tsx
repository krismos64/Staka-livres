import React, { useState, Suspense, lazy } from "react";
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
import GuestOrderForm from "./components/forms/GuestOrderForm";
import MainLayout from "./components/layout/MainLayout";
import { ToastProvider } from "./components/layout/ToastProvider";
import PackSelectionModal from "./components/modals/PackSelectionModal";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ActivateAccountPage from "./pages/ActivateAccountPage";
// Lazy loading des pages admin pour code splitting
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminCommandes = lazy(() => import("./pages/admin/AdminCommandes"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminFactures = lazy(() => import("./pages/admin/AdminFactures"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const AdminMessagerie = lazy(() => import("./pages/admin/AdminMessagerie"));
const AdminPages = lazy(() => import("./pages/admin/AdminPages"));
const AdminStatistiques = lazy(() => import("./pages/admin/AdminStatistiques"));
const AdminTarifs = lazy(() => import("./pages/admin/AdminTarifs"));
const AdminUtilisateurs = lazy(() => import("./pages/admin/AdminUtilisateurs"));
// Lazy loading des pages principales utilisateur
const BillingPage = lazy(() => import("./pages/BillingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const FilesPage = lazy(() => import("./pages/FilesPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ProfilPage = lazy(() => import("./pages/ProfilPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));

// Pages critiques gardées en synchrone pour une UX optimale
import ForgotPassword from "./pages/ForgotPassword";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import StaticPageBySlug from "./pages/pages/[slug]";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ResetPassword from "./pages/ResetPassword";
import SignupPage from "./pages/SignupPage";
import MentionsLegalesPage from "./pages/MentionsLegalesPage";
import CGVPage from "./pages/CGVPage";
import PremierChapitreArticle from "./pages/blog/PremierChapitreArticle";
import AmazonKDPGuideArticle from "./pages/blog/AmazonKDPGuideArticle";
import ErreursAutoeditionArticle from "./pages/blog/ErreursAutoeditionArticle";
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
  const { user, isLoading, login, logout, error, clearError } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Routes>
      {/* Routes publiques */}
      <Route
        path="/"
        element={
          <LandingPage
            onLoginClick={() => navigate("/login")}
            onSignupClick={() => navigate("/signup")}
          />
        }
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
            onGoToSignup={() => navigate("/signup")}
            onBackToLanding={() => navigate("/")}
            authError={error}
            clearAuthError={clearError}
          />
        }
      />
      <Route
        path="/signup"
        element={
          <SignupPage
            onSignupSuccess={() => navigate("/app")}
            onBackToLogin={() => navigate("/login")}
            onBackToLanding={() => navigate("/")}
          />
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
      <Route path="/cgv" element={<CGVPage />} />
      <Route path="/blog/premier-chapitre" element={<PremierChapitreArticle />} />
      <Route path="/blog/amazon-kdp-guide" element={<AmazonKDPGuideArticle />} />
      <Route path="/blog/erreurs-autoedition" element={<ErreursAutoeditionArticle />} />
      <Route path="/pages/:slug" element={<StaticPageBySlug />} />
      <Route
        path="/payment/success"
        element={<PaymentSuccessPage onBackToApp={() => navigate("/")} />}
      />
      <Route
        path="/payment-success"
        element={<PaymentSuccessPage onBackToApp={() => navigate("/")} />}
      />
      <Route
        path="/payment/cancel"
        element={<PaymentCancelPage onBackToApp={() => {}} />}
      />
      <Route path="/commande-invitee" element={<GuestOrderForm />} />
      <Route path="/activation/:token" element={<ActivateAccountPage />} />

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
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
      <PackSelectionModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onOrderCreated={(data) => {
          // Redirection vers le checkout Stripe
          window.location.href = data.checkoutUrl;
        }}
      />
    </MainLayout>
  );
};

// Composant de fallback pour le lazy loading
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Chargement de la page...</span>
  </div>
);

const AdminRoutes: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return (
    <AdminLayout onLogout={onLogout}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUtilisateurs />} />
          <Route path="utilisateurs" element={<AdminUtilisateurs />} />
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
      </Suspense>
    </AdminLayout>
  );
};

const PageIntrouvable = () => (
  <div className="flex items-center justify-center h-screen">
    <h1 className="text-2xl">404 - Page Introuvable</h1>
  </div>
);

export default App;
