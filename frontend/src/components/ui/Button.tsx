import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/classUtils";
import { LoadingSpinner } from "./";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Whether button is in loading state */
  loading?: boolean;
  /** Icon to display before text */
  icon?: React.ComponentType<{ className?: string }>;
  /** Full width button */
  fullWidth?: boolean;
  /** Children content */
  children: ReactNode;
}

/**
 * Reusable button component with consistent styling and variants
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      icon: Icon,
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses = [
      "inline-flex",
      "items-center",
      "justify-center",
      "gap-2",
      "font-medium",
      "rounded-lg",
      "transition-colors",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-offset-2",
      "disabled:cursor-not-allowed",
      "touch-manipulation",
    ];

    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-3 text-sm",
      lg: "px-6 py-4 text-base",
    };

    const variantClasses = {
      primary: [
        "bg-ctp-blue",
        "text-white",
        "hover:bg-ctp-blue/90",
        "focus:ring-ctp-blue",
        "disabled:bg-ctp-blue/50",
      ],
      secondary: [
        "bg-ctp-surface1",
        "text-ctp-text",
        "hover:bg-ctp-surface2",
        "focus:ring-ctp-surface1",
        "disabled:bg-ctp-surface1/50",
      ],
      danger: [
        "bg-ctp-red",
        "text-white",
        "hover:bg-ctp-red/90",
        "focus:ring-ctp-red",
        "disabled:bg-ctp-red/50",
      ],
      success: [
        "bg-ctp-green",
        "text-white",
        "hover:bg-ctp-green/90",
        "focus:ring-ctp-green",
        "disabled:bg-ctp-green/50",
      ],
      ghost: [
        "text-ctp-subtext1",
        "hover:text-ctp-text",
        "hover:bg-ctp-surface1",
        "focus:ring-ctp-surface1",
      ],
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        className={cn(
          ...baseClasses,
          sizeClasses[size],
          ...variantClasses[variant],
          widthClass,
          className,
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading ? (
          <LoadingSpinner size="sm" color="white" />
        ) : Icon ? (
          <Icon className="h-4 w-4" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
