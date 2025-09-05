import { forwardRef } from "react";
import { cn } from "../../utils/classUtils";
import { createLoadingSpinnerClasses } from "../../utils/styleUtils";

export interface LoadingSpinnerProps {
  /** Spinner size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Color variant for the spinner */
  color?: "blue" | "white" | "current";
  /** Additional CSS classes */
  className?: string;
  /** Loading text to display next to spinner */
  text?: string;
  /** Whether to center the spinner */
  centered?: boolean;
  /** Custom test ID for testing */
  "data-testid"?: string;
}

/**
 * Reusable loading spinner component with consistent styling
 * Consolidates all loading spinner patterns across the application
 */
export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  (
    {
      size = "md",
      color = "white",
      className,
      text,
      centered = false,
      "data-testid": testId,
    },
    ref,
  ) => {
    const spinnerClasses = createLoadingSpinnerClasses(size, color);

    const containerClasses = cn(
      "inline-flex items-center gap-2",
      centered && "justify-center",
      className,
    );

    const textClasses = cn(
      "text-sm",
      color === "white"
        ? "text-white"
        : color === "blue"
          ? "text-ctp-blue"
          : "text-current",
    );

    return (
      <div
        ref={ref}
        className={containerClasses}
        data-testid={testId}
        role="status"
        aria-live="polite"
        aria-label={text ? `Loading: ${text}` : "Loading"}
      >
        <div className={spinnerClasses} />
        {text && <span className={textClasses}>{text}</span>}
      </div>
    );
  },
);

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
