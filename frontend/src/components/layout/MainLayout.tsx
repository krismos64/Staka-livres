import { ReactNode, useState } from "react";
import Header from "./Header"; // On importe le vrai Header
import Sidebar from "./Sidebar"; // On importe le vrai Sidebar

// --- Interface et Composant MainLayout ---
type SectionName =
  | "dashboard"
  | "projects"
  | "messages"
  | "billing"
  | "help"
  | "profile"
  | "settings";

interface MainLayoutProps {
  pageTitle: string;
  onSectionChange: (section: SectionName) => void;
  onLogout: () => void;
  children: ReactNode;
  activeSection: SectionName; // Ajout pour la Sidebar
  onNewProjectClick: () => void;
  onGoToAdmin?: () => void;
}

function MainLayout({
  pageTitle,
  onSectionChange,
  onLogout,
  children,
  activeSection,
  onNewProjectClick,
  onGoToAdmin,
}: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onNewProjectClick={onNewProjectClick}
      />

      <div className="lg:pl-72">
        <Header
          pageTitle={pageTitle}
          onSectionChange={onSectionChange}
          onLogout={onLogout}
          onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          onGoToAdmin={onGoToAdmin}
        />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Overlay pour le mode mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default MainLayout;
