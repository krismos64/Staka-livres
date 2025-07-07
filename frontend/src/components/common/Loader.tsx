interface LoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export default function Loader({
  size = "md",
  message,
  className = "",
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

  return (
    <div
      className={`flex items-center justify-center gap-2 text-blue-600 ${className}`}
    >
      <div
        className={`animate-spin ${sizeClasses[size]} border-2 border-blue-600 border-t-transparent rounded-full`}
      ></div>
      {message && <span className={textSizeClasses[size]}>{message}</span>}
    </div>
  );
}
