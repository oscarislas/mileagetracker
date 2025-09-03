import { ChartBarIcon, CurrencyDollarIcon, ExclamationTriangleIcon, WifiIcon } from '@heroicons/react/24/outline'
import { useSummary } from '../hooks/useSummary'
import { useConnectionStatus } from '../hooks/useConnectionStatus'

export default function SummaryCard() {
  const { data: summary, isLoading, isError, error } = useSummary()
  const { data: connectionStatus } = useConnectionStatus()

  if (isLoading) {
    return (
      <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ChartBarIcon className="h-5 w-5 text-ctp-blue" />
          <h2 className="text-lg font-semibold text-ctp-text">6-Month Summary</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-ctp-surface1 rounded w-3/4"></div>
          <div className="h-4 bg-ctp-surface1 rounded w-1/2"></div>
          <div className="h-4 bg-ctp-surface1 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (isError) {
    console.error('Error loading summary:', error)
    const isConnectionError = error?.message?.includes('Cannot connect to server')
    
    return (
      <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-ctp-blue" />
            <h2 className="text-lg font-semibold text-ctp-text">6-Month Summary</h2>
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
            {isConnectionError ? 'Cannot Connect to Server' : 'Failed to Load Summary'}
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


  const totalMiles = summary?.months?.reduce((sum, month) => sum + month.total_miles, 0) || 0
  const totalAmount = summary?.months?.reduce((sum, month) => sum + month.amount, 0) || 0

  return (
    <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ChartBarIcon className="h-5 w-5 text-ctp-blue" />
        <h2 className="text-lg font-semibold text-ctp-text">6-Month Summary</h2>
      </div>

      {/* Total Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-ctp-base rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-ctp-blue">{totalMiles.toFixed(1)}</p>
          <p className="text-sm text-ctp-subtext1">Total Miles</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-ctp-green">${totalAmount.toFixed(2)}</p>
          <p className="text-sm text-ctp-subtext1">Tax Deduction</p>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-ctp-text mb-2">Monthly Breakdown</h3>
        {!summary?.months || summary.months.length === 0 || totalMiles === 0 ? (
          <div className="text-center py-6">
            <ChartBarIcon className="h-12 w-12 text-ctp-subtext0 mx-auto mb-3" />
            <p className="text-ctp-subtext1 text-sm mb-2">No trips in the last 6 months</p>
            <p className="text-ctp-subtext1 text-xs">
              Add trips to see your mileage summary and tax deductions
            </p>
          </div>
        ) : (
          summary.months.map((month) => (
            <div
              key={`${month.year}-${month.month_num}`}
              className="flex items-center justify-between py-2 px-3 bg-ctp-base rounded"
            >
              <span className="text-sm font-medium text-ctp-text">
                {month.month}
              </span>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ctp-subtext1">
                  {month.total_miles.toFixed(1)} mi
                </span>
                <span className="font-medium text-ctp-green flex items-center gap-1">
                  <CurrencyDollarIcon className="h-3 w-3" />
                  {month.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}