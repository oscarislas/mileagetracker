import {
  ChartBarIcon,
  CurrencyDollarIcon,
  TruckIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  WifiIcon,
} from "@heroicons/react/24/outline";
import { useSummary } from "../hooks/useSummary";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import StatsCard from "../components/StatsCard";
import type { MonthlySummary } from "../types";

interface SummaryStatsProps {
  summaryData: MonthlySummary[];
}

function SummaryStats({ summaryData }: SummaryStatsProps) {
  // Calculate overall statistics
  const totalMiles = summaryData.reduce(
    (sum, month) => sum + month.total_miles,
    0,
  );
  const totalAmount = summaryData.reduce((sum, month) => sum + month.amount, 0);
  const totalMonths = summaryData.length;
  const averagePerMonth = totalMonths > 0 ? totalMiles / totalMonths : 0;

  // Calculate trend (compare recent vs older months)
  const recentMonths = summaryData.slice(-3); // Last 3 months
  const olderMonths = summaryData.slice(0, -3); // Earlier months

  const recentAvg =
    recentMonths.length > 0
      ? recentMonths.reduce((sum, month) => sum + month.total_miles, 0) /
        recentMonths.length
      : 0;
  const olderAvg =
    olderMonths.length > 0
      ? olderMonths.reduce((sum, month) => sum + month.total_miles, 0) /
        olderMonths.length
      : 0;

  const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard
        title="Total Miles"
        value={totalMiles.toFixed(1)}
        subtitle="6-month total"
        icon={TruckIcon}
        color="blue"
        trend={
          Math.abs(trend) > 1
            ? { value: Math.round(trend * 10) / 10, label: "recent trend" }
            : undefined
        }
      />

      <StatsCard
        title="Tax Deduction"
        value={`$${totalAmount.toFixed(2)}`}
        subtitle="Estimated savings"
        icon={CurrencyDollarIcon}
        color="green"
      />

      <StatsCard
        title="Active Months"
        value={totalMonths}
        subtitle="With recorded trips"
        icon={CalendarIcon}
        color="purple"
      />

      <StatsCard
        title="Monthly Average"
        value={`${averagePerMonth.toFixed(1)} mi`}
        subtitle="Per active month"
        icon={ArrowTrendingUpIcon}
        color="yellow"
      />
    </div>
  );
}

interface MonthlyBreakdownProps {
  summaryData: MonthlySummary[];
}

function MonthlyBreakdown({ summaryData }: MonthlyBreakdownProps) {
  if (summaryData.length === 0) {
    return (
      <div className="bg-ctp-surface0 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ctp-text mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-ctp-mauve" />
          Monthly Breakdown
        </h2>
        <div className="text-center py-8">
          <CalendarIcon className="h-16 w-16 text-ctp-subtext0 mx-auto mb-4" />
          <p className="text-ctp-text text-lg font-medium mb-2">
            No trips recorded yet
          </p>
          <p className="text-ctp-subtext1 text-sm mb-4">
            Start tracking your business mileage to see monthly statistics
          </p>
        </div>
      </div>
    );
  }

  // Sort months by year and month_num (most recent first)
  const sortedMonths = [...summaryData].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month_num - a.month_num;
  });

  const maxMiles = Math.max(...summaryData.map((m) => m.total_miles));

  return (
    <div className="bg-ctp-surface0 rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ctp-text mb-4 flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-ctp-mauve" />
        Monthly Breakdown
      </h2>

      <div className="space-y-3">
        {sortedMonths.map((month) => {
          const percentage =
            maxMiles > 0 ? (month.total_miles / maxMiles) * 100 : 0;

          return (
            <div
              key={`${month.year}-${month.month_num}`}
              className="relative bg-ctp-base rounded-lg p-4 hover:bg-ctp-surface1 transition-colors"
            >
              {/* Progress bar background */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-ctp-blue/10 to-transparent rounded-lg"
                style={{ width: `${percentage}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-ctp-text">{month.month}</h3>
                  <p className="text-sm text-ctp-subtext1">{month.year}</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <TruckIcon className="h-4 w-4 text-ctp-blue" />
                      <span className="font-medium text-ctp-text">
                        {month.total_miles.toFixed(1)} mi
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-ctp-green font-medium">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      {month.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SummaryPage() {
  const { data: summary, isLoading, isError, error } = useSummary();
  const { data: connectionStatus } = useConnectionStatus();

  if (isLoading) {
    return (
      <div className="pb-20 px-4 pt-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ctp-text mb-2">Summary</h1>
          <p className="text-ctp-subtext1">Your mileage tracking overview</p>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-ctp-surface0 rounded-xl p-4 border border-ctp-surface1 animate-pulse"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-9 h-9 bg-ctp-surface1 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-ctp-surface1 rounded w-16" />
                  <div className="h-2 bg-ctp-surface1 rounded w-12" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-6 bg-ctp-surface1 rounded w-20" />
                <div className="h-3 bg-ctp-surface1 rounded w-16" />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-ctp-surface0 rounded-lg p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-ctp-surface1 rounded" />
              <div className="h-5 bg-ctp-surface1 rounded w-32" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-ctp-base rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    console.error("Error loading summary:", error);
    const isConnectionError = error?.message?.includes(
      "Cannot connect to server",
    );

    return (
      <div className="pb-20 px-4 pt-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ctp-text mb-2">Summary</h1>
          <p className="text-ctp-subtext1">Your mileage tracking overview</p>
        </div>

        <div className="bg-ctp-surface0 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-ctp-blue" />
              <h2 className="text-lg font-semibold text-ctp-text">
                Summary Data
              </h2>
            </div>
            {connectionStatus && (
              <div className="flex items-center gap-1 text-xs">
                <WifiIcon
                  className={`h-3 w-3 ${connectionStatus.connected ? "text-ctp-green" : "text-ctp-red"}`}
                />
                <span
                  className={
                    connectionStatus.connected
                      ? "text-ctp-green"
                      : "text-ctp-red"
                  }
                >
                  {connectionStatus.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
            )}
          </div>

          <div className="text-center py-8">
            <ExclamationTriangleIcon className="h-16 w-16 text-ctp-red mx-auto mb-4" />
            <h3 className="text-lg font-medium text-ctp-text mb-2">
              {isConnectionError
                ? "Cannot Connect to Server"
                : "Failed to Load Summary"}
            </h3>
            <p className="text-ctp-subtext1 text-sm mb-4">
              {isConnectionError
                ? "Make sure the backend server is running on http://localhost:8080"
                : error?.message ||
                  "Please check your connection and try again"}
            </p>

            {isConnectionError && (
              <div className="bg-ctp-base rounded-lg p-4 max-w-md mx-auto text-left">
                <h4 className="font-medium text-ctp-text mb-2">
                  🛠️ To start the server:
                </h4>
                <div className="space-y-1 text-sm font-mono text-ctp-blue">
                  <p>
                    <code>make quick-start</code>
                  </p>
                  <p>or</p>
                  <p>
                    <code>make up</code>
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-ctp-blue hover:bg-ctp-blue/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const summaryData = summary?.months || [];
  const hasData = summaryData.length > 0;

  return (
    <div className="pb-20 px-4 pt-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ctp-text mb-2">Summary</h1>
        <p className="text-ctp-subtext1">Your mileage tracking overview</p>
      </div>

      {hasData && <SummaryStats summaryData={summaryData} />}

      <MonthlyBreakdown summaryData={summaryData} />
    </div>
  );
}
