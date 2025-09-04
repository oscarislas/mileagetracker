/**
 * Utility function to conditionally combine class names
 * Similar to clsx/classnames but lightweight for this project
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Common form input class combinations
 */
export const inputClasses = {
  base: [
    'w-full',
    'border',
    'rounded-lg',
    'bg-ctp-base',
    'text-ctp-text',
    'placeholder-ctp-subtext0',
    'focus:ring-2',
    'focus:ring-ctp-blue',
    'focus:border-transparent',
    'transition-colors'
  ],
  withIcon: 'pl-10 pr-4',
  withoutIcon: 'px-4',
  error: 'border-ctp-red',
  normal: 'border-ctp-surface1',
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed'
}

/**
 * Common button class combinations
 */
export const buttonClasses = {
  base: [
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-2',
    'font-medium',
    'rounded-lg',
    'transition-colors',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:cursor-not-allowed',
    'touch-manipulation'
  ],
  sizes: {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base'
  },
  variants: {
    primary: [
      'bg-ctp-blue',
      'text-white',
      'hover:bg-ctp-blue/90',
      'focus:ring-ctp-blue',
      'disabled:bg-ctp-blue/50'
    ],
    secondary: [
      'bg-ctp-surface1',
      'text-ctp-text',
      'hover:bg-ctp-surface2',
      'focus:ring-ctp-surface1',
      'disabled:bg-ctp-surface1/50'
    ],
    danger: [
      'bg-ctp-red',
      'text-white',
      'hover:bg-ctp-red/90',
      'focus:ring-ctp-red',
      'disabled:bg-ctp-red/50'
    ],
    success: [
      'bg-ctp-green',
      'text-white',
      'hover:bg-ctp-green/90',
      'focus:ring-ctp-green',
      'disabled:bg-ctp-green/50'
    ]
  }
}

/**
 * Common card/surface class combinations
 */
export const surfaceClasses = {
  card: [
    'bg-ctp-surface0',
    'rounded-lg',
    'border',
    'border-ctp-surface1',
    'shadow-sm'
  ],
  interactive: [
    'hover:border-ctp-surface2',
    'transition-all',
    'duration-200'
  ]
}