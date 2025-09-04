import { type ReactNode, forwardRef } from 'react'

interface FormFieldProps {
  /** Field label */
  label: string
  /** Whether the field is required */
  required?: boolean
  /** Error message to display */
  error?: string
  /** Helper text to display below input */
  helperText?: string
  /** Icon component to display in input */
  icon?: React.ComponentType<{ className?: string }>
  /** Additional CSS classes */
  className?: string
  /** Children (input element) */
  children: ReactNode
  /** ID for accessibility */
  id?: string
}

/**
 * Reusable form field wrapper with label, error handling, and consistent styling
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, required, error, helperText, icon: Icon, className = '', children, id }, ref) => {
    return (
      <div ref={ref} className={`space-y-2 ${className}`}>
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-ctp-text"
        >
          {label}
          {required && <span className="text-ctp-red ml-1">*</span>}
        </label>
        
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ctp-subtext1" />
          )}
          {children}
        </div>
        
        {error && (
          <p className="text-ctp-red text-sm">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="text-ctp-subtext1 text-xs">{helperText}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export default FormField