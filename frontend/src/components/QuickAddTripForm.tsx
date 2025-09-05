import { useState, useRef, useEffect } from "react";
import { PlusIcon, UserIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useCreateTrip } from "../hooks/useTrips";
import { useForm } from "../hooks/useForm";
import {
  createTripFormValidator,
  getInitialTripFormData,
} from "../utils/formUtils";
import { getTodayDateString } from "../utils/dateUtils";
import { getApiErrorMessage } from "../utils/errorUtils";
import { ClientNameField, DateField, MilesField, NotesField } from "./form";
import { Button } from "./ui";
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

  const clientInputRef = useRef<HTMLInputElement>(null);
  const milesInputRef = useRef<HTMLInputElement>(null);

  const createTripMutation = useCreateTrip();

  // Initialize form with default data including today's date
  const form = useForm<CreateTripRequest>({
    initialData: {
      ...getInitialTripFormData(),
      trip_date: getTodayDateString(), // QuickAdd defaults to today
    },
    validate: createTripFormValidator<CreateTripRequest>(),
    onSubmit: async (data) => {
      return new Promise((resolve, reject) => {
        createTripMutation.mutate(data, {
          onSuccess: () => {
            setStep("success");
            // Handle success flow based on mode
            setTimeout(() => {
              if (mode === "modal") {
                onSuccess?.();
              } else {
                setStep(showCollapseState ? "collapsed" : "client");
                form.reset();
              }
            }, 2000);
            resolve();
          },
          onError: (error) => {
            reject(error);
          },
        });
      });
    },
    resetOnSuccess: false, // We handle reset manually for the step flow
  });

  // Focus management for modal mode
  useEffect(() => {
    if (mode === "modal" && step === "client") {
      setTimeout(() => clientInputRef.current?.focus(), 100);
    }
  }, [mode, step]);

  const handleClientSubmit = (clientName: string) => {
    form.setField("client_name", clientName);
    setStep("details");
    setTimeout(() => milesInputRef.current?.focus(), 100);
  };

  const handleSubmit = async () => {
    if (form.data.miles > 0) {
      await form.handleSubmit();
    }
  };

  const handleCancel = () => {
    if (mode === "modal") {
      onCancel?.();
    } else {
      setStep("collapsed");
      form.reset();
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
          {form.data.miles} miles to {form.data.client_name}
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
          <div
            onKeyDown={(e) => {
              if (e.key === "Enter" && form.data.client_name.trim()) {
                handleClientSubmit(form.data.client_name);
              }
              if (e.key === "Escape" && mode === "modal") {
                handleCancel();
              }
            }}
          >
            <ClientNameField
              form={form}
              fieldName="client_name"
              label="Who did you visit?"
              placeholder="Start typing client name..."
              ref={clientInputRef}
              id="client-name-input"
              positionUp={mode === "modal"}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="ghost" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() =>
                form.data.client_name.trim() &&
                handleClientSubmit(form.data.client_name)
              }
              disabled={!form.data.client_name.trim()}
              className="flex-1"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Details step */}
      {step === "details" && (
        <div className="space-y-4">
          <div className="bg-ctp-base rounded-lg p-3 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-ctp-blue" />
            <span className="text-ctp-text font-medium">
              {form.data.client_name}
            </span>
            <button
              onClick={handleBack}
              className="ml-auto text-xs text-ctp-subtext1 hover:text-ctp-text focus:ring-2 focus:ring-ctp-blue focus:outline-none rounded px-1"
            >
              Change
            </button>
          </div>

          <div
            className="grid grid-cols-2 gap-4"
            onKeyDown={(e) => {
              if (e.key === "Enter" && form.data.miles > 0) {
                handleSubmit();
              }
              if (e.key === "Escape" && mode === "modal") {
                handleCancel();
              }
            }}
          >
            <MilesField
              form={form}
              fieldName="miles"
              label="Miles"
              ref={milesInputRef}
              id="miles-input"
            />

            <DateField
              form={form}
              fieldName="trip_date"
              label="Date"
              id="date-input"
            />
          </div>

          <div
            onKeyDown={(e) => {
              if (e.key === "Escape" && mode === "modal") {
                handleCancel();
              }
            }}
          >
            <NotesField
              form={form}
              fieldName="notes"
              placeholder="Trip purpose, meeting notes..."
              rows={2}
              id="notes-input"
            />
          </div>

          {/* Error Display */}
          {createTripMutation.isError && (
            <div className="p-3 bg-ctp-red/10 border border-ctp-red rounded-lg">
              <p className="text-ctp-red text-sm">
                {getApiErrorMessage(createTripMutation.error)}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleBack} variant="ghost" className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.data.miles ||
                form.data.miles <= 0 ||
                form.isSubmitting ||
                createTripMutation.isPending
              }
              loading={form.isSubmitting || createTripMutation.isPending}
              icon={
                !(form.isSubmitting || createTripMutation.isPending)
                  ? PlusIcon
                  : undefined
              }
              className="flex-1"
            >
              {form.isSubmitting || createTripMutation.isPending
                ? "Adding Trip..."
                : "Add Trip"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
