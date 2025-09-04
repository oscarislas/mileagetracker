import { forwardRef } from "react";
import { UserIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { cn } from "../../utils/classUtils";
import type { Client } from "../../types";

interface ClientSuggestionsProps {
  /** Array of client suggestions to display */
  clients: Client[];
  /** Whether to show the suggestions dropdown */
  show: boolean;
  /** Callback when a client is selected */
  onSelect: (clientName: string) => void;
  /** Maximum number of suggestions to display */
  maxItems?: number;
  /** Custom CSS classes */
  className?: string;
  /** Loading state for suggestions */
  isLoading?: boolean;
  /** No results message */
  noResultsMessage?: string;
  /** Current query for highlighting */
  query?: string;
  /** Position the dropdown above the input (default: false) */
  positionUp?: boolean;
}

/**
 * Reusable client suggestions dropdown component
 */
export const ClientSuggestions = forwardRef<
  HTMLDivElement,
  ClientSuggestionsProps
>(({ clients, show, onSelect, maxItems = 5, className, isLoading = false, noResultsMessage = "No clients found", query = "", positionUp = false }, ref) => {
  if (!show) {
    return null;
  }

  const displayedClients = clients.slice(0, maxItems);
  
  // Helper function to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-ctp-yellow/20 text-ctp-yellow px-0.5 rounded">{part}</mark> : 
        part
    );
  };

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 w-full",
        positionUp ? "bottom-full mb-2" : "top-full mt-2",
        "bg-ctp-surface0 border border-ctp-surface1/50",
        "rounded-xl shadow-xl shadow-ctp-crust/20",
        "max-h-[180px] overflow-y-auto scrollbar-thin",
        "backdrop-blur-sm",
        positionUp 
          ? "animate-in slide-in-from-bottom-2 duration-150" 
          : "animate-in slide-in-from-top-2 duration-150",
        className,
      )}
      style={{
        // Ensure dropdown doesn't go below viewport on upward positioning
        ...(positionUp && {
          maxHeight: 'min(180px, calc(100vh - 100px))'
        })
      }}
      role="listbox"
      aria-label="Client suggestions"
    >
      {isLoading ? (
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-ctp-blue border-t-transparent" />
          <span className="text-ctp-subtext1 text-sm">Searching clients...</span>
        </div>
      ) : displayedClients.length > 0 ? (
        <>
          <div className="px-3 py-2 border-b border-ctp-surface1/30">
            <div className="flex items-center gap-2 text-ctp-subtext1 text-xs font-medium">
              <MagnifyingGlassIcon className="h-3 w-3" />
              <span>Recent clients</span>
            </div>
          </div>
          {displayedClients.map((client, index) => (
            <button
              key={client.id}
              type="button"
              onClick={() => onSelect(client.name)}
              className={cn(
                "w-full text-left px-4 py-3",
                "flex items-center gap-3",
                "hover:bg-ctp-surface1/50 text-ctp-text",
                "transition-all duration-150",
                "focus:outline-none focus:bg-ctp-surface1/50",
                "focus:ring-2 focus:ring-ctp-blue/50 focus:ring-inset",
                "active:bg-ctp-surface2/50",
                "min-h-[44px]", // Touch-friendly minimum height
                "group",
                index === displayedClients.length - 1 && "rounded-b-xl",
              )}
              role="option"
              aria-selected={false}
            >
              <div className="flex-shrink-0 p-1.5 rounded-full bg-ctp-blue/10 group-hover:bg-ctp-blue/20 transition-colors">
                <UserIcon className="h-3 w-3 text-ctp-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm leading-tight">
                  {highlightMatch(client.name, query)}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-ctp-blue text-xs">→</div>
              </div>
            </button>
          ))}
        </>
      ) : (
        <div className="px-4 py-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 rounded-full bg-ctp-surface1">
              <UserIcon className="h-4 w-4 text-ctp-subtext1" />
            </div>
            <p className="text-ctp-subtext1 text-sm font-medium">{noResultsMessage}</p>
            <p className="text-ctp-subtext0 text-xs">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
});

ClientSuggestions.displayName = "ClientSuggestions";

export default ClientSuggestions;
