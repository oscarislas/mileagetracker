import { cn } from "./classUtils";

/**
 * Style utilities for common UI patterns and components
 * Consolidates repeated styling patterns across the application
 */

/**
 * Common loading spinner classes used across components
 */
export const loadingSpinnerClasses = {
  /** Small spinner (16px) for inline use */
  sm: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent",
  /** Medium spinner (20px) for buttons and general use */
  md: "animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent",
  /** Large spinner (24px) for loading states */
  lg: "animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent",
  /** Extra large spinner (32px) for page loading */
  xl: "animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent",
} as const;

/**
 * Common input styling patterns with consistent focus states
 */
export const inputStyles = {
  /** Base input classes with focus ring */
  base: "w-full border rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent transition-colors",
  /** Search input with icon padding */
  search: "pl-9 pr-4 py-2 text-sm",
  /** Select dropdown styling */
  select: "px-3 py-2 text-sm",
  /** Error state styling */
  error: "border-ctp-red focus:ring-ctp-red",
  /** Normal border styling */
  normal: "border-ctp-surface1",
  /** Disabled state styling */
  disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
} as const;

/**
 * Common card and surface styling patterns
 */
export const cardStyles = {
  /** Basic card with rounded corners and padding */
  base: "bg-ctp-surface0 rounded-lg p-4 shadow-sm",
  /** Card with border */
  bordered:
    "bg-ctp-surface0 rounded-lg p-4 shadow-sm border border-ctp-surface1",
  /** Elevated card with more prominent shadow */
  elevated: "bg-ctp-surface0 rounded-lg p-4 shadow-lg shadow-ctp-crust/10",
  /** Interactive card with hover effects */
  interactive:
    "bg-ctp-surface0 rounded-lg p-4 shadow-sm border border-ctp-surface1 hover:border-ctp-surface2 transition-all duration-200",
  /** Compact card with less padding */
  compact: "bg-ctp-surface0 rounded-lg p-3 shadow-sm",
} as const;

/**
 * Common modal and overlay styling patterns
 */
export const modalStyles = {
  /** Modal backdrop overlay */
  backdrop: "fixed inset-0 bg-ctp-crust/50 backdrop-blur-sm z-40",
  /** Modal container positioning */
  container: "fixed inset-0 z-50 flex items-center justify-center p-4",
  /** Modal content base styling */
  content:
    "bg-ctp-surface0 rounded-xl shadow-xl border border-ctp-surface1 w-full max-w-md p-6",
  /** Modal content for larger modals */
  contentLarge:
    "bg-ctp-surface0 rounded-xl shadow-xl border border-ctp-surface1 w-full max-w-2xl p-6",
} as const;

/**
 * Common error and alert styling patterns
 */
export const alertStyles = {
  /** Error alert styling */
  error: "p-3 bg-ctp-red/10 border border-ctp-red rounded-lg",
  /** Success alert styling */
  success: "p-3 bg-ctp-green/10 border border-ctp-green rounded-lg",
  /** Warning alert styling */
  warning: "p-3 bg-ctp-yellow/10 border border-ctp-yellow rounded-lg",
  /** Info alert styling */
  info: "p-3 bg-ctp-blue/10 border border-ctp-blue rounded-lg",
} as const;

/**
 * Common text styling patterns
 */
export const textStyles = {
  /** Error text */
  error: "text-ctp-red text-sm",
  /** Success text */
  success: "text-ctp-green text-sm",
  /** Muted/secondary text */
  muted: "text-ctp-subtext1 text-sm",
  /** Helper text */
  helper: "text-ctp-subtext0 text-xs",
  /** Large heading */
  headingLg: "text-3xl font-bold text-ctp-text",
  /** Medium heading */
  headingMd: "text-xl font-semibold text-ctp-text",
  /** Small heading */
  headingSm: "text-lg font-semibold text-ctp-text",
} as const;

/**
 * Common badge and chip styling patterns
 */
export const badgeStyles = {
  /** Success badge */
  success: "bg-ctp-green/10 px-3 py-2 rounded-lg flex items-center gap-2",
  /** Error badge */
  error: "bg-ctp-red/10 px-3 py-2 rounded-lg flex items-center gap-2",
  /** Blue/primary badge */
  primary: "bg-ctp-blue/10 px-3 py-2 rounded-lg flex items-center gap-2",
  /** Neutral badge */
  neutral: "bg-ctp-surface1 px-3 py-2 rounded-lg flex items-center gap-2",
} as const;

/**
 * Utility function to create input styling based on error state
 */
export function createInputClasses(
  hasError: boolean,
  className?: string,
): string {
  return cn(
    inputStyles.base,
    hasError ? inputStyles.error : inputStyles.normal,
    inputStyles.disabled,
    className,
  );
}

/**
 * Utility function to create search input styling
 */
export function createSearchInputClasses(
  hasError: boolean = false,
  className?: string,
): string {
  return cn(
    inputStyles.base,
    inputStyles.search,
    hasError ? inputStyles.error : inputStyles.normal,
    inputStyles.disabled,
    className,
  );
}

/**
 * Utility function to create select dropdown styling
 */
export function createSelectClasses(
  hasError: boolean = false,
  className?: string,
): string {
  return cn(
    inputStyles.base,
    inputStyles.select,
    hasError ? inputStyles.error : inputStyles.normal,
    inputStyles.disabled,
    className,
  );
}

/**
 * Utility function to create card styling based on variant
 */
export function createCardClasses(
  variant: keyof typeof cardStyles = "base",
  className?: string,
): string {
  return cn(cardStyles[variant], className);
}

/**
 * Utility function to create alert styling based on type
 */
export function createAlertClasses(
  type: keyof typeof alertStyles,
  className?: string,
): string {
  return cn(alertStyles[type], className);
}

/**
 * Utility function to create badge styling based on variant
 */
export function createBadgeClasses(
  variant: keyof typeof badgeStyles = "neutral",
  className?: string,
): string {
  return cn(badgeStyles[variant], className);
}

/**
 * Common layout utility classes
 */
export const layoutStyles = {
  /** Standard container with max width and centering */
  container: "max-w-7xl mx-auto px-4",
  /** Full height page container */
  page: "min-h-screen pb-20 px-4 pt-4 space-y-6 max-w-7xl mx-auto",
  /** Flex row with gap */
  flexRow: "flex items-center gap-3",
  /** Flex column with gap */
  flexCol: "flex flex-col gap-3",
  /** Grid with responsive columns */
  grid: "grid grid-cols-1 md:grid-cols-3 gap-4",
  /** Center content */
  center: "flex items-center justify-center",
} as const;

/**
 * Common animation classes
 */
export const animationStyles = {
  /** Fade in animation */
  fadeIn: "animate-in fade-in duration-200",
  /** Slide in from top */
  slideInTop: "animate-in slide-in-from-top-2 duration-150",
  /** Slide in from bottom */
  slideInBottom: "animate-in slide-in-from-bottom-2 duration-150",
  /** Scale in animation */
  scaleIn: "animate-in zoom-in-95 duration-200",
  /** Bounce animation for loading states */
  bounce: "animate-bounce",
} as const;

/**
 * Creates loading spinner classes for different contexts
 */
export function createLoadingSpinnerClasses(
  size: keyof typeof loadingSpinnerClasses = "md",
  color?: "blue" | "white" | "current",
): string {
  const baseClasses = loadingSpinnerClasses[size];

  switch (color) {
    case "blue":
      return baseClasses.replace(
        "border-white border-t-transparent",
        "border-ctp-blue/30 border-t-ctp-blue",
      );
    case "current":
      return baseClasses.replace(
        "border-white border-t-transparent",
        "border-current/30 border-t-current",
      );
    default:
      return baseClasses;
  }
}

/**
 * Common focus ring utility for interactive elements
 */
export const focusRingClasses =
  "focus:outline-none focus:ring-2 focus:ring-ctp-blue focus:ring-offset-2";

/**
 * Common disabled state utility
 */
export const disabledClasses =
  "disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Common touch target utility for mobile-friendly interactions
 */
export const touchTargetClasses = "touch-manipulation min-h-[44px]";
