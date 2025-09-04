// Loading skeleton components for better perceived performance

export function TripItemSkeleton() {
  return (
    <div className="bg-ctp-surface0 rounded-lg border border-ctp-surface1 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-ctp-surface2 rounded-lg w-8 h-8"></div>
          <div className="flex-1">
            <div className="bg-ctp-surface2 h-4 rounded w-32 mb-1"></div>
            <div className="bg-ctp-surface2 h-3 rounded w-20"></div>
          </div>
        </div>
        <div className="bg-ctp-surface2 h-6 rounded w-16"></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-ctp-surface2 w-4 h-4 rounded"></div>
          <div className="bg-ctp-surface2 h-3 rounded w-20"></div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <div className="bg-ctp-surface2 w-4 h-4 rounded"></div>
          <div className="bg-ctp-surface2 h-3 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

export function TripListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <TripItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function QuickAddTripSkeleton() {
  return (
    <div className="bg-ctp-surface0 rounded-xl p-6 border border-ctp-surface1 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full bg-ctp-surface2"></div>
        <div className="h-1 w-8 rounded-full bg-ctp-surface2"></div>
        <div className="h-2 w-2 rounded-full bg-ctp-surface2"></div>
      </div>

      <div className="space-y-4">
        <div className="bg-ctp-surface2 h-10 rounded-lg"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-ctp-surface2 h-10 rounded-lg"></div>
          <div className="bg-ctp-surface2 h-10 rounded-lg"></div>
        </div>
        <div className="bg-ctp-surface2 h-16 rounded-lg"></div>
        <div className="flex gap-2">
          <div className="bg-ctp-surface2 h-10 rounded-lg flex-1"></div>
          <div className="bg-ctp-surface2 h-10 rounded-lg flex-1"></div>
        </div>
      </div>
    </div>
  );
}

export function SummaryCardSkeleton() {
  return (
    <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-ctp-surface2 w-5 h-5 rounded"></div>
        <div className="bg-ctp-surface2 h-5 rounded w-32"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="text-center">
            <div className="bg-ctp-surface2 h-8 rounded w-20 mx-auto mb-2"></div>
            <div className="bg-ctp-surface2 h-4 rounded w-16 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsOverviewSkeleton() {
  return (
    <div className="bg-gradient-to-r from-ctp-blue/5 to-ctp-sapphire/5 rounded-xl p-4 animate-pulse">
      <div className="grid grid-cols-3 gap-4 text-center">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <div className="bg-ctp-surface2 h-8 rounded w-12 mx-auto mb-2"></div>
            <div className="bg-ctp-surface2 h-3 rounded w-16 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Empty state component for better UX
export function TripsEmptyState() {
  return (
    <div className="text-center py-12">
      <div className="bg-ctp-blue/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <svg
          className="h-8 w-8 text-ctp-blue"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-ctp-text mb-2">
        No trips recorded yet
      </h3>
      <p className="text-ctp-subtext1 text-sm mb-4">
        Start tracking your business mileage
      </p>
      <div className="bg-ctp-base rounded-lg p-4 max-w-sm mx-auto border border-ctp-surface1">
        <p className="text-ctp-text font-medium mb-2">💡 Getting Started</p>
        <ul className="text-left text-sm text-ctp-subtext1 space-y-1">
          <li>• Enter your client name</li>
          <li>• Add trip date and miles driven</li>
          <li>• Track deductions automatically</li>
        </ul>
      </div>
    </div>
  );
}

// Connection error state
export function ConnectionErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="bg-ctp-red/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <svg
          className="h-8 w-8 text-ctp-red"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-ctp-text mb-2">
        Connection Error
      </h3>
      <p className="text-ctp-subtext1 text-sm mb-4">
        Cannot connect to the server
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-ctp-blue hover:bg-ctp-blue/90 text-white px-4 py-2 rounded-lg font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
