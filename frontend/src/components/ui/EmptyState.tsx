import { type ReactNode } from "react";

interface EmptyStateProps {
  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;
  /** Title text */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button or content */
  action?: ReactNode;
  /** Optional tip content */
  tip?: {
    title: string;
    items: string[];
  };
  /** Custom CSS classes */
  className?: string;
}

/**
 * Reusable empty state component with consistent styling
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tip,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="bg-ctp-blue/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-ctp-blue" />
      </div>

      <h3 className="text-lg font-medium text-ctp-text mb-2">{title}</h3>
      <p className="text-ctp-subtext1 text-sm mb-4">{description}</p>

      {tip && (
        <div className="bg-ctp-base rounded-lg p-4 max-w-sm mx-auto border border-ctp-surface1 mb-4">
          <p className="text-ctp-text font-medium mb-2">💡 {tip.title}</p>
          <ul className="text-left text-sm text-ctp-subtext1 space-y-1">
            {tip.items.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {action}
    </div>
  );
}

export default EmptyState;
