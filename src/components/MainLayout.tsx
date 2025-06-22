import React, { ReactNode } from "react";
import Header from "./Header"; // On importe le vrai Header
import Sidebar from "./Sidebar"; // On importe le vrai Sidebar

// --- Interface et Composant MainLayout ---
type SectionName =
  | "dashboard"
  | "projects"
  | "messages"
  | "files"
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
}

function MainLayout({
  pageTitle,
  onSectionChange,
  onLogout,
  children,
  activeSection,
  onNewProjectClick,
}: MainLayoutProps) {
  return (
    <div>
      <Header
        pageTitle={pageTitle}
        onSectionChange={onSectionChange}
        onLogout={onLogout}
      />
      <div className="flex">
        {/* Sidebar seulement si la maquette la prévoit */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onNewProjectClick={onNewProjectClick}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
