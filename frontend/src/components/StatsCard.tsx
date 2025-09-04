import React from "react";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "blue" | "green" | "purple" | "yellow";
  trend?: {
    value: number;
    label: string;
  };
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
}: StatsCardProps) {
  const colorClasses = {
    blue: "bg-ctp-blue/10 text-ctp-blue border-ctp-blue/20",
    green: "bg-ctp-green/10 text-ctp-green border-ctp-green/20",
    purple: "bg-ctp-mauve/10 text-ctp-mauve border-ctp-mauve/20",
    yellow: "bg-ctp-yellow/10 text-ctp-yellow border-ctp-yellow/20",
  };

  const trendColor =
    trend && trend.value >= 0 ? "text-ctp-green" : "text-ctp-red";

  return (
    <div className="bg-ctp-surface0 rounded-xl p-4 border border-ctp-surface1 hover:border-ctp-surface2 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-ctp-subtext1">{title}</h3>
              {trend && (
                <div
                  className={`text-xs ${trendColor} flex items-center gap-1`}
                >
                  <span>{trend.value >= 0 ? "↗" : "↘"}</span>
                  <span>
                    {Math.abs(trend.value)}% {trend.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-bold text-ctp-text">{value}</p>
            {subtitle && (
              <p className="text-sm text-ctp-subtext1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Usage example component
export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard
        title="Total Miles"
        value="1,245.3"
        subtitle="This month"
        icon={TruckIcon}
        color="blue"
        trend={{ value: 12.5, label: "vs last month" }}
      />

      <StatsCard
        title="Tax Deduction"
        value="$834.35"
        subtitle="Estimated savings"
        icon={CurrencyDollarIcon}
        color="green"
        trend={{ value: 8.3, label: "vs last month" }}
      />

      <StatsCard
        title="Active Clients"
        value="8"
        subtitle="This period"
        icon={ChartBarIcon}
        color="purple"
      />

      <StatsCard
        title="Avg per Trip"
        value="45.2 mi"
        subtitle="Distance"
        icon={ClockIcon}
        color="yellow"
        trend={{ value: -5.2, label: "vs last month" }}
      />
    </div>
  );
}
