import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/classUtils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Whether the textarea has an error state */
  error?: boolean;
  /** Whether textarea has an icon (affects padding) */
  hasIcon?: boolean;
  /** Disable resize functionality */
  noResize?: boolean;
}

/**
 * Reusable textarea component with consistent styling
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, hasIcon, noResize, ...props }, ref) => {
    const baseClasses = [
      "w-full",
      "border",
      "rounded-lg",
      "bg-ctp-base",
      "text-ctp-text",
      "placeholder-ctp-subtext0",
      "focus:ring-2",
      "focus:ring-ctp-blue",
      "focus:border-transparent",
      "transition-colors",
      "disabled:opacity-50",
      "disabled:cursor-not-allowed",
    ];

    const paddingClasses = hasIcon ? "pl-10 pr-4 py-3" : "px-4 py-3";
    const borderClasses = error ? "border-ctp-red" : "border-ctp-surface1";
    const resizeClasses = noResize ? "resize-none" : "resize-y";

    return (
      <textarea
        className={cn(
          ...baseClasses,
          paddingClasses,
          borderClasses,
          resizeClasses,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
