interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "warning" | "error" | "info";
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ErrorMessage({
  message = "Une erreur est survenue",
  onRetry,
  retryLabel = "Réessayer",
  variant = "warning",
  className = "",
  showIcon = true,
  size = "md",
}: ErrorMessageProps) {
  const variantStyles = {
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const iconClasses = {
    warning: "fas fa-exclamation-triangle text-yellow-600",
    error: "fas fa-times-circle text-red-600",
    info: "fas fa-info-circle text-blue-600",
  };

  const buttonStyles = {
    warning:
      "bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-300",
    error: "bg-red-100 hover:bg-red-200 text-red-900 border-red-300",
    info: "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300",
  };

  const sizeClasses = {
    sm: "text-sm p-3",
    md: "text-base p-4",
    lg: "text-lg p-5",
  };

  const iconSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div
      className={`border rounded-lg flex items-start gap-3 ${variantStyles[variant]} ${sizeClasses[size]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <i
          className={`${iconClasses[variant]} ${iconSizeClasses[size]} mt-0.5 flex-shrink-0`}
          aria-hidden="true"
        ></i>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium break-words">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          data-testid="retry-button"
          className={`ml-2 px-3 py-1 rounded text-sm font-medium transition-colors border ${buttonStyles[variant]} flex-shrink-0`}
          type="button"
          aria-label={retryLabel}
        >
          <i className="fas fa-refresh mr-1" aria-hidden="true"></i>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
