import { type ReactNode } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Button from "./Button";

interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message */
  message: string;
  /** Whether this is a connection error */
  isConnectionError?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Custom action instead of retry */
  action?: ReactNode;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Reusable error state component with consistent styling
 */
export function ErrorState({
  title = "Something went wrong",
  message,
  isConnectionError = false,
  onRetry,
  action,
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="bg-ctp-red/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <ExclamationTriangleIcon className="h-8 w-8 text-ctp-red" />
      </div>

      <h3 className="text-lg font-medium text-ctp-text mb-2">{title}</h3>
      <p className="text-ctp-subtext1 text-sm mb-4">{message}</p>

      {isConnectionError && (
        <div className="bg-ctp-base rounded-lg p-4 max-w-md mx-auto text-left mb-6">
          <h4 className="font-medium text-ctp-text mb-2">
            🛠️ To start the server:
          </h4>
          <div className="space-y-1 text-sm font-mono text-ctp-blue">
            <p>
              <code>make quick-start</code>
            </p>
            <p>or</p>
            <p>
              <code>make up</code>
            </p>
          </div>
        </div>
      )}

      {action ||
        (onRetry && (
          <Button onClick={onRetry} variant="primary">
            Try Again
          </Button>
        ))}
    </div>
  );
}

export default ErrorState;
