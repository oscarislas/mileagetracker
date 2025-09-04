import { useState, useRef, useEffect } from "react";
import { PlusIcon, UserIcon, TruckIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useCreateTrip } from "../hooks/useTrips";
import { useClientSuggestions } from "../hooks/useClients";
import { getTodayDateString } from "../utils/dateUtils";
import { ClientSuggestions } from "./ui";
import type { CreateTripRequest } from "../types";

export interface QuickAddTripFormProps {
  mode?: "inline" | "modal";
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  showCollapseState?: boolean;
}

export type FormStep = "collapsed" | "client" | "details" | "success";

export default function QuickAddTripForm({
  mode = "inline",
  onSuccess,
  onCancel,
  className = "",
  showCollapseState = true,
}: QuickAddTripFormProps) {
  const [step, setStep] = useState<FormStep>(
    showCollapseState ? "collapsed" : "client",
  );
  const [formData, setFormData] = useState<CreateTripRequest>({
    client_name: "",
    trip_date: getTodayDateString(),
    miles: 0,
    notes: "",
  });
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  const clientInputRef = useRef<HTMLInputElement>(null);
  const milesInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const createTripMutation = useCreateTrip();
  const { data: clientSuggestions } = useClientSuggestions(
    formData.client_name,
  );

  // Focus management for modal mode
  useEffect(() => {
    if (mode === "modal" && step === "client") {
      setTimeout(() => clientInputRef.current?.focus(), 100);
    }
  }, [mode, step]);

  const handleClientSubmit = (clientName: string) => {
    setFormData({ ...formData, client_name: clientName });
    setShowClientSuggestions(false);
    setStep("details");
    setTimeout(() => milesInputRef.current?.focus(), 100);
  };

  const handleClientSelect = (clientName: string) => {
    handleClientSubmit(clientName);
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, client_name: value });
    setShowClientSuggestions(value.length > 0);
  };

  const handleClientNameFocus = () => {
    if (formData.client_name.length > 0) {
      setShowClientSuggestions(true);
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        clientInputRef.current &&
        !clientInputRef.current.contains(event.target as Node)
      ) {
        setShowClientSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = () => {
    if (formData.miles > 0) {
      createTripMutation.mutate(formData, {
        onSuccess: () => {
          setStep("success");
          setTimeout(() => {
            if (mode === "modal") {
              // Call onSuccess callback and let parent handle closing
              onSuccess?.();
            } else {
              // Inline mode: reset to collapsed state
              setStep(showCollapseState ? "collapsed" : "client");
              resetForm();
            }
          }, 2000);
        },
      });
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: "",
      trip_date: getTodayDateString(),
      miles: 0,
      notes: "",
    });
  };

  const handleCancel = () => {
    if (mode === "modal") {
      onCancel?.();
    } else {
      setStep("collapsed");
      resetForm();
    }
  };

  const handleBack = () => {
    setStep("client");
  };

  // Collapsed state (only shown for inline mode with showCollapseState)
  if (step === "collapsed" && showCollapseState) {
    return (
      <div
        className={`bg-gradient-to-r from-ctp-blue/10 to-ctp-sapphire/10 rounded-xl p-4 border border-ctp-blue/20 ${className}`}
      >
        <button
          onClick={() => {
            setStep("client");
            setTimeout(() => clientInputRef.current?.focus(), 100);
          }}
          className="w-full flex items-center justify-center gap-3 py-4 text-ctp-blue font-semibold hover:bg-ctp-blue/10 rounded-lg transition-colors"
        >
          <div className="bg-ctp-blue/20 p-2 rounded-full">
            <PlusIcon className="h-5 w-5" />
          </div>
          Quick Add Trip
        </button>
      </div>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <div
        className={`bg-gradient-to-r from-ctp-green/10 to-ctp-teal/10 rounded-xl p-6 border border-ctp-green/20 text-center ${className}`}
      >
        <CheckCircleIcon className="h-12 w-12 text-ctp-green mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-ctp-text mb-1">
          Trip Added!
        </h3>
        <p className="text-sm text-ctp-subtext1">
          {formData.miles} miles to {formData.client_name}
        </p>
      </div>
    );
  }

  // Form container styling based on mode
  const containerClasses =
    mode === "modal"
      ? `space-y-4 overflow-visible ${className}`
      : `bg-ctp-surface0 rounded-xl p-6 border border-ctp-surface1 space-y-4 ${className}`;

  return (
    <div className={containerClasses}>
      {/* Progress indicator - only show for inline mode */}
      {mode === "inline" && (
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`h-2 w-2 rounded-full ${step === "client" ? "bg-ctp-blue" : "bg-ctp-green"}`}
          ></div>
          <div
            className={`h-1 w-8 rounded-full ${step === "details" ? "bg-ctp-blue" : step === "client" ? "bg-ctp-surface2" : "bg-ctp-green"}`}
          ></div>
          <div
            className={`h-2 w-2 rounded-full ${step === "details" ? "bg-ctp-blue" : "bg-ctp-surface2"}`}
          ></div>
        </div>
      )}

      {/* Client step */}
      {step === "client" && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="client-name-input"
              className="block text-sm font-medium text-ctp-text mb-2"
            >
              Who did you visit?
            </label>
            <div className="relative overflow-visible min-h-[44px]">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ctp-subtext1" />
              <input
                id="client-name-input"
                ref={clientInputRef}
                type="text"
                value={formData.client_name}
                onChange={handleClientNameChange}
                onFocus={handleClientNameFocus}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && formData.client_name.trim()) {
                    handleClientSubmit(formData.client_name);
                  }
                  if (e.key === "Escape") {
                    setShowClientSuggestions(false);
                    if (mode === "modal") {
                      handleCancel();
                    }
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent transition-all duration-150"
                placeholder="Start typing client name..."
                maxLength={30}
                aria-describedby="client-suggestions"
              />

              {/* Enhanced Client Suggestions */}
              <ClientSuggestions
                ref={suggestionsRef}
                clients={clientSuggestions?.clients || []}
                show={showClientSuggestions}
                onSelect={handleClientSelect}
                isLoading={false}
                query={formData.client_name}
                maxItems={3}
                noResultsMessage="No clients found - create a new one!"
                positionUp={mode === "modal"}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 px-4 text-ctp-subtext1 hover:text-ctp-text focus:ring-2 focus:ring-ctp-blue focus:outline-none rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                formData.client_name.trim() &&
                handleClientSubmit(formData.client_name)
              }
              disabled={!formData.client_name.trim()}
              className="flex-1 bg-ctp-blue hover:bg-ctp-blue/90 disabled:bg-ctp-blue/30 text-white py-2 px-4 rounded-lg font-medium focus:ring-2 focus:ring-ctp-blue focus:ring-offset-2 focus:outline-none"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Details step */}
      {step === "details" && (
        <div className="space-y-4">
          <div className="bg-ctp-base rounded-lg p-3 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-ctp-blue" />
            <span className="text-ctp-text font-medium">
              {formData.client_name}
            </span>
            <button
              onClick={handleBack}
              className="ml-auto text-xs text-ctp-subtext1 hover:text-ctp-text focus:ring-2 focus:ring-ctp-blue focus:outline-none rounded px-1"
            >
              Change
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="miles-input"
                className="block text-sm font-medium text-ctp-text mb-2"
              >
                Miles
              </label>
              <div className="relative">
                <TruckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ctp-subtext1" />
                <input
                  id="miles-input"
                  ref={milesInputRef}
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  value={formData.miles || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      miles: parseFloat(e.target.value) || 0,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && formData.miles > 0) {
                      handleSubmit();
                    }
                    if (e.key === "Escape" && mode === "modal") {
                      handleCancel();
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent"
                  placeholder="0.0"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="date-input"
                className="block text-sm font-medium text-ctp-text mb-2"
              >
                Date
              </label>
              <input
                id="date-input"
                type="date"
                value={formData.trip_date}
                onChange={(e) =>
                  setFormData({ ...formData, trip_date: e.target.value })
                }
                className="w-full px-3 py-3 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text focus:ring-2 focus:ring-ctp-blue focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="notes-input"
              className="block text-sm font-medium text-ctp-text mb-2"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes-input"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Escape" && mode === "modal") {
                  handleCancel();
                }
              }}
              className="w-full px-3 py-2 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent resize-none"
              placeholder="Trip purpose, meeting notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-4 text-ctp-subtext1 hover:text-ctp-text font-medium focus:ring-2 focus:ring-ctp-blue focus:outline-none rounded-lg"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !formData.miles ||
                formData.miles <= 0 ||
                createTripMutation.isPending
              }
              className="flex-1 bg-ctp-blue hover:bg-ctp-blue/90 disabled:bg-ctp-blue/30 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 focus:ring-2 focus:ring-ctp-blue focus:ring-offset-2 focus:outline-none"
              aria-describedby={
                createTripMutation.isPending ? "loading-status" : undefined
              }
            >
              {createTripMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span id="loading-status" className="sr-only">
                    Adding trip...
                  </span>
                </>
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
              Add Trip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
