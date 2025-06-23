import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: "messages" | "search" | "error";
}

function EmptyState({
  title,
  description,
  icon,
  action,
  illustration = "messages",
}: EmptyStateProps) {
  // SVG illustration selon le type
  const renderIllustration = () => {
    if (illustration === "messages") {
      return (
        <svg
          className="w-24 h-24 text-gray-300 mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      );
    }

    if (illustration === "search") {
      return (
        <svg
          className="w-24 h-24 text-gray-300 mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      );
    }

    // Default: error/empty
    return (
      <svg
        className="w-24 h-24 text-gray-300 mb-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      {/* Illustration ou icône */}
      <div className="flex flex-col items-center mb-6">
        {renderIllustration()}

        {/* Icône alternative avec FontAwesome */}
        {icon && !illustration && (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <i className={`${icon} text-gray-400 text-2xl`}></i>
          </div>
        )}
      </div>

      {/* Contenu textuel */}
      <div className="max-w-sm mx-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>

        {/* Action optionnelle */}
        {action && (
          <button
            onClick={action.onClick}
            className="
              bg-blue-600 hover:bg-blue-700 text-white 
              px-6 py-3 rounded-xl font-semibold 
              transition-colors duration-200
              inline-flex items-center gap-2
            "
          >
            <i className="fas fa-plus text-sm"></i>
            {action.label}
          </button>
        )}
      </div>

      {/* Animation subtile */}
      <div className="mt-8 opacity-30">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default EmptyState;
