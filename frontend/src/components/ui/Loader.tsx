interface LoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
  color?: "blue" | "gray" | "white";
}

export default function Loader({
  size = "md",
  message,
  className = "",
  color = "blue",
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const colorClasses = {
    blue: "text-blue-600 border-blue-600",
    gray: "text-gray-600 border-gray-600",
    white: "text-white border-white",
  };

  return (
    <div
      className={`flex items-center justify-center gap-2 ${colorClasses[color]} ${className}`}
    >
      <div
        className={`animate-spin ${sizeClasses[size]} border-2 border-t-transparent rounded-full ${colorClasses[color]}`}
        role="status"
        aria-label={message || "Chargement"}
      ></div>
      {message && (
        <span className={textSizeClasses[size]} aria-live="polite">
          {message}
        </span>
      )}
    </div>
  );
}
