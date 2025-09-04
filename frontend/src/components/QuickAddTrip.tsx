import { useState, useRef } from "react";
import { PlusIcon, UserIcon, TruckIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useCreateTrip } from "../hooks/useTrips";
import { useClientSuggestions } from "../hooks/useClients";
import { getTodayDateString } from "../utils/dateUtils";
import type { CreateTripRequest } from "../types";

export default function QuickAddTrip() {
  const [step, setStep] = useState<
    "collapsed" | "client" | "details" | "success"
  >("collapsed");
  const [formData, setFormData] = useState<CreateTripRequest>({
    client_name: "",
    trip_date: getTodayDateString(),
    miles: 0,
    notes: "",
  });

  const clientInputRef = useRef<HTMLInputElement>(null);
  const milesInputRef = useRef<HTMLInputElement>(null);

  const createTripMutation = useCreateTrip();
  const { data: clientSuggestions } = useClientSuggestions(
    formData.client_name,
  );

  const handleClientSubmit = (clientName: string) => {
    setFormData({ ...formData, client_name: clientName });
    setStep("details");
    setTimeout(() => milesInputRef.current?.focus(), 100);
  };

  const handleSubmit = () => {
    if (formData.miles > 0) {
      createTripMutation.mutate(formData, {
        onSuccess: () => {
          setStep("success");
          setTimeout(() => {
            setStep("collapsed");
            setFormData({
              client_name: "",
              trip_date: getTodayDateString(),
              miles: 0,
              notes: "",
            });
          }, 2000);
        },
      });
    }
  };

  if (step === "collapsed") {
    return (
      <div className="bg-gradient-to-r from-ctp-blue/10 to-ctp-sapphire/10 rounded-xl p-4 border border-ctp-blue/20">
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

  if (step === "success") {
    return (
      <div className="bg-gradient-to-r from-ctp-green/10 to-ctp-teal/10 rounded-xl p-6 border border-ctp-green/20 text-center">
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

  return (
    <div className="bg-ctp-surface0 rounded-xl p-6 border border-ctp-surface1 space-y-4">
      {/* Progress indicator */}
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

      {step === "client" && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="client-name-input"
              className="block text-sm font-medium text-ctp-text mb-2"
            >
              Who did you visit?
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ctp-subtext1" />
              <input
                id="client-name-input"
                ref={clientInputRef}
                type="text"
                value={formData.client_name}
                onChange={(e) =>
                  setFormData({ ...formData, client_name: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && formData.client_name.trim()) {
                    handleClientSubmit(formData.client_name);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent"
                placeholder="Start typing client name..."
                maxLength={30}
              />
            </div>

            {/* Client suggestions */}
            {clientSuggestions?.clients &&
              clientSuggestions.clients.length > 0 &&
              formData.client_name.length > 0 && (
                <div className="mt-2 space-y-1">
                  {clientSuggestions.clients.slice(0, 3).map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSubmit(client.name)}
                      className="w-full text-left px-3 py-2 hover:bg-ctp-surface1 text-ctp-text rounded-lg text-sm"
                    >
                      {client.name}
                    </button>
                  ))}
                </div>
              )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep("collapsed")}
              className="flex-1 py-2 px-4 text-ctp-subtext1 hover:text-ctp-text"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                formData.client_name.trim() &&
                handleClientSubmit(formData.client_name)
              }
              disabled={!formData.client_name.trim()}
              className="flex-1 bg-ctp-blue hover:bg-ctp-blue/90 disabled:bg-ctp-blue/30 text-white py-2 px-4 rounded-lg font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="space-y-4">
          <div className="bg-ctp-base rounded-lg p-3 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-ctp-blue" />
            <span className="text-ctp-text font-medium">
              {formData.client_name}
            </span>
            <button
              onClick={() => setStep("client")}
              className="ml-auto text-xs text-ctp-subtext1 hover:text-ctp-text"
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
              className="w-full px-3 py-2 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent resize-none"
              placeholder="Trip purpose, meeting notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep("client")}
              className="flex-1 py-3 px-4 text-ctp-subtext1 hover:text-ctp-text font-medium"
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
              className="flex-1 bg-ctp-blue hover:bg-ctp-blue/90 disabled:bg-ctp-blue/30 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              {createTripMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
