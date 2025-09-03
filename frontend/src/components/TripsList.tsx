import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ListBulletIcon, ExclamationTriangleIcon, WifiIcon } from '@heroicons/react/24/outline'
import { useTrips } from '../hooks/useTrips'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import TripItem from './TripItem'

export default function TripsList() {
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 10
  
  const { data: tripsData, isLoading, isError, error } = useTrips(currentPage, limit)
  const { data: connectionStatus } = useConnectionStatus()

  if (isLoading) {
    return (
      <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ListBulletIcon className="h-5 w-5 text-ctp-blue" />
          <h2 className="text-lg font-semibold text-ctp-text">Recent Trips</h2>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-ctp-surface1 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    console.error('Error loading trips:', error)
    const isConnectionError = error?.message?.includes('Cannot connect to server')
    
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
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-ctp-red mx-auto mb-3" />
          <p className="text-ctp-red text-sm mb-2 font-medium">
            {isConnectionError ? 'Cannot Connect to Server' : 'Failed to Load Trips'}
          </p>
          <p className="text-ctp-subtext1 text-xs mb-4">
            {isConnectionError 
              ? 'Make sure the backend server is running on http://localhost:8080'
              : (error?.message || 'Please check your connection and try again')
            }
          </p>
          {isConnectionError && (
            <div className="text-ctp-subtext1 text-xs bg-ctp-base rounded p-2">
              <p className="mb-1">To start the server:</p>
              <code className="text-ctp-blue">make quick-start</code> or <code className="text-ctp-blue">make up</code>
            </div>
          )}
        </div>
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
    <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
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
        <div className="text-center py-12">
          <ListBulletIcon className="h-16 w-16 text-ctp-subtext0 mx-auto mb-4" />
          <p className="text-ctp-text text-lg font-medium mb-2">
            No trips recorded yet
          </p>
          <p className="text-ctp-subtext1 text-sm mb-4">
            Start tracking your business mileage by adding your first trip above
          </p>
          <div className="text-ctp-subtext1 text-xs bg-ctp-base rounded-lg p-3 max-w-sm mx-auto">
            <p className="mb-1">💡 <strong>Tip:</strong></p>
            <p>Enter your client name, trip date, and miles driven to get started with tax deduction tracking</p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {trips.map((trip) => (
              <TripItem key={trip.id} trip={trip} />
            ))}
          </div>

          {/* Pagination */}
          {total_pages > 1 && (
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