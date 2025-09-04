import { WifiIcon } from "@heroicons/react/24/outline";
import { useConnectionStatus } from "../../hooks/useConnectionStatus";

interface ConnectionStatusProps {
  /** Size of the status indicator */
  size?: "sm" | "md" | "lg";
  /** Whether to show text alongside icon */
  showText?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Reusable connection status indicator component
 */
export function ConnectionStatus({
  size = "sm",
  showText = true,
  className = "",
}: ConnectionStatusProps) {
  const { data: connectionStatus } = useConnectionStatus();

  if (!connectionStatus) {
    return null;
  }

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const statusColor = connectionStatus.connected
    ? "text-ctp-green"
    : "text-ctp-red";
  const statusText = connectionStatus.connected ? "Connected" : "Disconnected";

  return (
    <div
      className={`flex items-center gap-1 ${textSizeClasses[size]} ${className}`}
    >
      <WifiIcon className={`${sizeClasses[size]} ${statusColor}`} />
      {showText && <span className={statusColor}>{statusText}</span>}
    </div>
  );
}

export default ConnectionStatus;
