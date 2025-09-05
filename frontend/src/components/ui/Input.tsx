import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/classUtils";
import { createInputClasses } from "../../utils/styleUtils";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Whether the input has an error state */
  error?: boolean;
  /** Input size variant */
  size?: "sm" | "md" | "lg";
  /** Whether input has an icon (affects padding) */
  hasIcon?: boolean;
}

/**
 * Reusable input component with consistent styling and variants
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, error, size = "md", hasIcon, type = "text", ...props },
    ref,
  ) => {
    const sizeClasses = {
      sm: "py-2 text-sm",
      md: "py-3",
      lg: "py-4 text-lg",
    };

    const paddingClasses = hasIcon ? "pl-10 pr-4" : "px-4";

    const inputClasses = createInputClasses(
      error || false,
      cn(sizeClasses[size], paddingClasses, className),
    );

    return <input type={type} className={inputClasses} ref={ref} {...props} />;
  },
);

Input.displayName = "Input";

export default Input;
