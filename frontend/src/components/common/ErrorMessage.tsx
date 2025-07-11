interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "warning" | "error" | "info";
  className?: string;
  showIcon?: boolean;
}

export default function ErrorMessage({
  message = "Une erreur est survenue",
  onRetry,
  retryLabel = "Réessayer",
  variant = "warning",
  className = "",
  showIcon = true,
}: ErrorMessageProps) {
  const variantStyles = {
    warning: "bg-yellow-100 border-yellow-300 text-yellow-800",
    error: "bg-red-100 border-red-300 text-red-800",
    info: "bg-blue-100 border-blue-300 text-blue-800",
  };

  const iconClasses = {
    warning: "fas fa-exclamation-triangle text-yellow-600",
    error: "fas fa-times-circle text-red-600",
    info: "fas fa-info-circle text-blue-600",
  };

  const buttonStyles = {
    warning: "bg-yellow-200 hover:bg-yellow-300 text-yellow-900",
    error: "bg-red-200 hover:bg-red-300 text-red-900",
    info: "bg-blue-200 hover:bg-blue-300 text-blue-900",
  };

  return (
    <div
      className={`border px-4 py-2 rounded-lg inline-flex items-center ${variantStyles[variant]} ${className}`}
    >
      {showIcon && <i className={`${iconClasses[variant]} mr-2`}></i>}
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className={`ml-3 px-2 py-1 rounded text-sm transition-colors ${buttonStyles[variant]}`}
          title={retryLabel}
        >
          <i className="fas fa-refresh mr-1"></i>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
