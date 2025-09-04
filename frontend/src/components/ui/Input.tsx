import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../utils/classUtils'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Whether the input has an error state */
  error?: boolean
  /** Input size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether input has an icon (affects padding) */
  hasIcon?: boolean
}

/**
 * Reusable input component with consistent styling and variants
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, size = 'md', hasIcon, type = 'text', ...props }, ref) => {
    const sizeClasses = {
      sm: 'py-2 text-sm',
      md: 'py-3',
      lg: 'py-4 text-lg'
    }

    const baseClasses = [
      'w-full',
      'border',
      'rounded-lg',
      'bg-ctp-base',
      'text-ctp-text',
      'placeholder-ctp-subtext0',
      'focus:ring-2',
      'focus:ring-ctp-blue',
      'focus:border-transparent',
      'transition-colors',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed'
    ]

    const paddingClasses = hasIcon ? 'pl-10 pr-4' : 'px-4'
    const borderClasses = error ? 'border-ctp-red' : 'border-ctp-surface1'

    return (
      <input
        type={type}
        className={cn(
          ...baseClasses,
          sizeClasses[size],
          paddingClasses,
          borderClasses,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input