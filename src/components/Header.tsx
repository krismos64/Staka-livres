import React from "react";
import Notifications from "./Notifications";
import UserMenu from "./UserMenu";

type SectionName =
  | "dashboard"
  | "projects"
  | "messages"
  | "files"
  | "billing"
  | "help"
  | "profile"
  | "settings";

interface HeaderProps {
  pageTitle: string;
  onSectionChange: (section: SectionName) => void;
  onLogout: () => void;
}

function Header({ pageTitle, onSectionChange, onLogout }: HeaderProps) {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-book-open text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Staka Éditions
                </h1>
                <p className="text-xs text-gray-500">Espace Client</p>
              </div>
            </div>
            <div className="hidden md:block">
              <span className="text-gray-400">•</span>
              <span className="ml-2 text-sm text-gray-600">{pageTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Notifications />
            <UserMenu onSectionChange={onSectionChange} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;
