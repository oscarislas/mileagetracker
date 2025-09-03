import { useState } from 'react'
import { 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  TruckIcon,
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useDeleteTrip } from '../hooks/useTrips'
import { formatTripDateRelative, getTimeAgo } from '../utils/dateUtils'
import type { Trip } from '../types'

interface EnhancedTripItemProps {
  trip: Trip
  showActions?: boolean
}

export default function EnhancedTripItem({ trip, showActions = true }: EnhancedTripItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const deleteTripMutation = useDeleteTrip()

  const estimatedDeduction = trip.miles * 0.67
  
  // Removed formatDate and getTimeAgo functions - using utilities instead

  if (showDeleteConfirm) {
    return (
      <div className="bg-ctp-surface0 border-l-4 border-ctp-red rounded-lg p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-ctp-red/10 p-2 rounded-full">
            <TrashIcon className="h-5 w-5 text-ctp-red" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-ctp-text mb-1">Delete trip?</h3>
            <p className="text-sm text-ctp-subtext1 mb-3">
              This will permanently remove the trip to <strong>{trip.client_name}</strong> on {formatTripDateRelative(trip.trip_date)}.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  deleteTripMutation.mutate(trip.id, {
                    onSuccess: () => setShowDeleteConfirm(false)
                  })
                }}
                disabled={deleteTripMutation.isPending}
                className="bg-ctp-red hover:bg-ctp-red/90 disabled:bg-ctp-red/50 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                {deleteTripMutation.isPending && (
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                )}
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-ctp-surface1 hover:bg-ctp-surface2 text-ctp-text px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="trip-item" className="bg-ctp-surface0 rounded-lg border border-ctp-surface1 hover:border-ctp-surface2 transition-all duration-200 overflow-hidden group">
      {/* Main content */}
      <div className="p-4">
        {/* Header with client and actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-ctp-blue/10 p-2 rounded-lg">
              <UserIcon className="h-4 w-4 text-ctp-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-ctp-text truncate">{trip.client_name}</h3>
              <p className="text-xs text-ctp-subtext1">
                Added {getTimeAgo(trip.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {/* Deduction amount */}
            <div className="bg-ctp-green/10 px-2 py-1 rounded-lg flex items-center gap-1">
              <CurrencyDollarIcon className="h-3 w-3 text-ctp-green" />
              <span className="text-sm font-semibold text-ctp-green">
                {estimatedDeduction.toFixed(2)}
              </span>
            </div>

            {/* Always visible action buttons */}
            {showActions && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    // TODO: Implement edit functionality
                    alert('Edit functionality will be implemented soon!')
                  }}
                  className="p-2 text-ctp-blue hover:text-ctp-blue/80 hover:bg-ctp-blue/10 rounded-lg transition-colors touch-manipulation"
                  aria-label="Edit trip"
                  title="Edit trip"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-ctp-red hover:text-ctp-red/80 hover:bg-ctp-red/10 rounded-lg transition-colors touch-manipulation"
                  aria-label="Delete trip"
                  title="Delete trip"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Trip details grid */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-ctp-subtext1" />
            <span className="text-sm text-ctp-text font-medium">
              {formatTripDateRelative(trip.trip_date)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 justify-end">
            <TruckIcon className="h-4 w-4 text-ctp-subtext1" />
            <span className="text-sm text-ctp-text font-medium">
              {trip.miles} miles
            </span>
          </div>
        </div>

        {/* Notes */}
        {trip.notes && (
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-ctp-surface1">
            <DocumentTextIcon className="h-4 w-4 text-ctp-subtext1 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-ctp-subtext1 line-clamp-2">
              {trip.notes}
            </p>
          </div>
        )}
      </div>

      {/* Status bar - could show sync status, validation, etc. */}
      <div className="h-1 bg-ctp-green"></div>
    </div>
  )
}

// Quick action floating button for mobile
export function TripActionButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-20 right-4 z-50 md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-ctp-blue hover:bg-ctp-blue/90 text-white p-4 rounded-full shadow-lg transition-all duration-200 active:scale-95"
      >
        <PlusIcon className={`h-6 w-6 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-2">
          <button className="bg-ctp-surface0 border border-ctp-surface1 text-ctp-text p-3 rounded-full shadow-lg hover:bg-ctp-surface1 transition-colors">
            <TruckIcon className="h-5 w-5" />
          </button>
          <button className="bg-ctp-surface0 border border-ctp-surface1 text-ctp-text p-3 rounded-full shadow-lg hover:bg-ctp-surface1 transition-colors">
            <UserIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}