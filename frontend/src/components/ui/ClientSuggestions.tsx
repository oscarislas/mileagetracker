import { forwardRef } from 'react'
import { cn } from '../../utils/classUtils'
import type { Client } from '../../types'

interface ClientSuggestionsProps {
  /** Array of client suggestions to display */
  clients: Client[]
  /** Whether to show the suggestions dropdown */
  show: boolean
  /** Callback when a client is selected */
  onSelect: (clientName: string) => void
  /** Maximum number of suggestions to display */
  maxItems?: number
  /** Custom CSS classes */
  className?: string
}

/**
 * Reusable client suggestions dropdown component
 */
export const ClientSuggestions = forwardRef<HTMLDivElement, ClientSuggestionsProps>(
  ({ clients, show, onSelect, maxItems = 5, className }, ref) => {
    if (!show || clients.length === 0) {
      return null
    }

    const displayedClients = clients.slice(0, maxItems)

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-10 w-full mt-1',
          'bg-ctp-surface0 border border-ctp-surface1',
          'rounded-lg shadow-lg',
          'max-h-48 overflow-y-auto',
          className
        )}
      >
        {displayedClients.map((client, index) => (
          <button
            key={client.id}
            type="button"
            onClick={() => onSelect(client.name)}
            className={cn(
              'w-full text-left px-3 py-2',
              'hover:bg-ctp-surface1 text-ctp-text',
              'transition-colors',
              'focus:outline-none focus:bg-ctp-surface1',
              index === 0 && 'rounded-t-lg',
              index === displayedClients.length - 1 && 'rounded-b-lg'
            )}
          >
            {client.name}
          </button>
        ))}
      </div>
    )
  }
)

ClientSuggestions.displayName = 'ClientSuggestions'

export default ClientSuggestions