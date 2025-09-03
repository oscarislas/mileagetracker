import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ListBulletIcon, WifiIcon } from '@heroicons/react/24/outline'
import { useTrips } from '../hooks/useTrips'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import EnhancedTripItem from './EnhancedTripItem'
import { TripListSkeleton, TripsEmptyState, ConnectionErrorState } from './LoadingSkeletons'
import type { TripFilters } from '../types'

interface TripsListProps {
  enhanced?: boolean
  showPagination?: boolean
  limit?: number
  filters?: TripFilters
}

export default function TripsList({ enhanced = false, showPagination = true, limit = 10, filters }: TripsListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const { data: tripsData, isLoading, isError, error } = useTrips(currentPage, limit, filters)
  const { data: connectionStatus } = useConnectionStatus()

  if (isLoading) {
    return (
      <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ListBulletIcon className="h-5 w-5 text-ctp-blue" />
          <h2 className="text-lg font-semibold text-ctp-text">Recent Trips</h2>
        </div>
        <TripListSkeleton />
      </div>
    )
  }

  if (isError) {
    console.error('Error loading trips:', error)
    
    return (
      <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListBulletIcon className="h-5 w-5 text-ctp-blue" />
            <h2 className="text-lg font-semibold text-ctp-text">Recent Trips</h2>
          </div>
          {connectionStatus && (
            <div className="flex items-center gap-1 text-xs">
              <WifiIcon className={`h-3 w-3 ${connectionStatus.connected ? 'text-ctp-green' : 'text-ctp-red'}`} />
              <span className={connectionStatus.connected ? 'text-ctp-green' : 'text-ctp-red'}>
                {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          )}
        </div>
        <ConnectionErrorState onRetry={() => window.location.reload()} />
      </div>
    )
  }

  if (!tripsData) {
    return (
      <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ListBulletIcon className="h-5 w-5 text-ctp-blue" />
          <h2 className="text-lg font-semibold text-ctp-text">Recent Trips</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-ctp-subtext1 text-sm">Loading trips...</p>
        </div>
      </div>
    )
  }

  const { trips, total_pages } = tripsData

  return (
    <div data-testid="trips-list" className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListBulletIcon className="h-5 w-5 text-ctp-blue" />
          <h2 className="text-lg font-semibold text-ctp-text">Recent Trips</h2>
        </div>
        <span className="text-sm text-ctp-subtext1">
          {tripsData.total} total
        </span>
      </div>

      {trips.length === 0 ? (
        filters && (filters.searchQuery || filters.dateRange || filters.clientFilter || filters.milesRange) ? (
          <div className="text-center py-8">
            <div className="text-ctp-subtext0 mb-4">
              <ListBulletIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            </div>
            <p className="text-ctp-text text-lg font-medium mb-2">No trips match your filters</p>
            <p className="text-ctp-subtext1 text-sm mb-4">Try adjusting your search criteria or clear filters to see all trips</p>
            <div className="bg-ctp-surface1 rounded-lg p-3 max-w-sm mx-auto">
              <p className="text-xs text-ctp-subtext1 mb-1">Current filters:</p>
              <div className="flex flex-wrap gap-1">
                {filters.searchQuery && (
                  <span className="text-xs bg-ctp-blue/20 text-ctp-blue px-2 py-1 rounded">
                    Search: "{filters.searchQuery}"
                  </span>
                )}
                {filters.clientFilter && (
                  <span className="text-xs bg-ctp-green/20 text-ctp-green px-2 py-1 rounded">
                    Client: {filters.clientFilter}
                  </span>
                )}
                {filters.dateRange && (
                  <span className="text-xs bg-ctp-yellow/20 text-ctp-yellow px-2 py-1 rounded">
                    Date: {filters.dateRange}
                  </span>
                )}
                {filters.milesRange && (
                  <span className="text-xs bg-ctp-red/20 text-ctp-red px-2 py-1 rounded">
                    Miles: {filters.milesRange}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <TripsEmptyState />
        )
      ) : (
        <>
          <div className={enhanced ? "space-y-3" : "space-y-2"}>
            {trips.map((trip) => (
              <EnhancedTripItem key={trip.id} trip={trip} />
            ))}
          </div>

          {/* Pagination */}
          {showPagination && total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-ctp-surface1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-ctp-subtext1 hover:text-ctp-text disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, total_pages))].map((_, i) => {
                  const pageNum = i + 1
                  // Show first 2, last 2, and current page area
                  if (
                    pageNum <= 2 ||
                    pageNum > total_pages - 2 ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 text-sm font-medium rounded ${
                          currentPage === pageNum
                            ? 'bg-ctp-blue text-white'
                            : 'text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface1'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  } else if (pageNum === 3 && currentPage > 4) {
                    return <span key={pageNum} className="text-ctp-subtext1">...</span>
                  } else if (pageNum === total_pages - 2 && currentPage < total_pages - 3) {
                    return <span key={pageNum} className="text-ctp-subtext1">...</span>
                  }
                  return null
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(total_pages, currentPage + 1))}
                disabled={currentPage >= total_pages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-ctp-subtext1 hover:text-ctp-text disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}