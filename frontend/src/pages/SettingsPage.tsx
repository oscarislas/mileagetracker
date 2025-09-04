import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { apiClient } from "../services/apiClient";
import { getApiErrorMessage } from "../utils/errorUtils";
import type { SettingsResponse, UpdateSettingsRequest } from "../types";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [mileageRate, setMileageRate] = useState("");
  const [error, setError] = useState("");

  const {
    data: settings,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response =
        await apiClient.get<SettingsResponse>("/api/v1/settings");
      return response.data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UpdateSettingsRequest) => {
      const response = await apiClient.put<SettingsResponse>(
        "/api/v1/settings",
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setError("");
    },
    onError: (error: unknown) => {
      setError(getApiErrorMessage(error));
    },
  });

  // Set initial rate when settings load (proper useEffect to avoid render-time side effect)
  useEffect(() => {
    if (settings && !mileageRate) {
      setMileageRate(settings.mileage_rate.toString());
    }
  }, [settings, mileageRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const rate = parseFloat(mileageRate);
    if (isNaN(rate) || rate < 0) {
      setError("Please enter a valid mileage rate");
      return;
    }

    updateSettingsMutation.mutate({ mileage_rate: rate });
  };

  if (isLoading) {
    return (
      <div className="pb-20 px-4 pt-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-ctp-blue border-t-transparent mx-auto"></div>
          <p className="text-ctp-subtext1 text-sm mt-2">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pb-20 px-4 pt-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ctp-text mb-2">Settings</h1>
          <p className="text-ctp-subtext1">
            Configure your mileage tracking preferences
          </p>
        </div>

        <div className="bg-ctp-surface0 rounded-lg p-6 shadow-sm text-center">
          <div className="text-ctp-red mb-4">
            <svg
              className="h-12 w-12 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-ctp-text mb-2">
              Unable to load settings
            </h3>
            <p className="text-ctp-subtext1 text-sm mb-4">
              {getApiErrorMessage(queryError) ||
                "Failed to connect to the server. Please check your connection."}
            </p>
          </div>

          <div className="bg-ctp-surface1 rounded-lg p-4 text-left">
            <h4 className="font-medium text-ctp-text mb-2">
              💡 Default Settings:
            </h4>
            <p className="text-sm text-ctp-subtext1 mb-2">
              • Mileage Rate: $0.67 per mile (2024 IRS standard rate)
            </p>
            <p className="text-xs text-ctp-subtext1">
              Settings will be available once the server connection is restored.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-ctp-blue hover:bg-ctp-blue/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 pt-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ctp-text mb-2">Settings</h1>
        <p className="text-ctp-subtext1">
          Configure your mileage tracking preferences
        </p>
      </div>

      <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="mileageRate"
              className="block text-sm font-medium text-ctp-text mb-2"
            >
              Mileage Rate (per mile)
            </label>
            <div className="relative">
              <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ctp-subtext1" />
              <input
                type="number"
                id="mileageRate"
                step="0.01"
                min="0"
                value={mileageRate}
                onChange={(e) => setMileageRate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent"
                placeholder="0.67"
              />
            </div>
            <p className="text-xs text-ctp-subtext1 mt-1">
              Current IRS standard mileage rate is $0.67 per mile (2024)
            </p>
          </div>

          {error && (
            <div className="p-3 bg-ctp-red/10 border border-ctp-red rounded-lg">
              <p className="text-ctp-red text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="w-full bg-ctp-blue hover:bg-ctp-blue/90 disabled:bg-ctp-blue/50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
