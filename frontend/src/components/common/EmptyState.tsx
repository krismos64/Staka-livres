import React from "react";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  buttonText,
  onButtonClick,
}) => {
  return (
    <div className="text-center p-8">
      {icon && <i className={`${icon} text-5xl mb-4 text-gray-400`}></i>}
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{message}</p>
      {buttonText && onButtonClick && (
        <button
          onClick={onButtonClick}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
