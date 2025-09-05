import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useCreateTrip } from "../hooks/useTrips";
import { useForm } from "../hooks/useForm";
import { getApiErrorMessage } from "../utils/errorUtils";
import {
  createTripFormValidator,
  getInitialTripFormData,
} from "../utils/formUtils";
import { Button, ConnectionStatus } from "./ui";
import { ClientNameField, DateField, MilesField, NotesField } from "./form";
import type { CreateTripRequest } from "../types";

export default function AddTripForm() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const createTripMutation = useCreateTrip();

  const form = useForm<CreateTripRequest>({
    initialData: getInitialTripFormData(),
    validate: createTripFormValidator<CreateTripRequest>(),
    onSubmit: async (data) => {
      return new Promise((resolve, reject) => {
        createTripMutation.mutate(data, {
          onSuccess: () => {
            setIsCollapsed(true);
            // Auto-expand after successful submission for better UX
            setTimeout(() => setIsCollapsed(false), 2000);
            resolve();
          },
          onError: (error) => {
            reject(error);
          },
        });
      });
    },
    resetOnSuccess: true,
  });

  if (isCollapsed) {
    return (
      <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
        <Button
          onClick={() => setIsCollapsed(false)}
          variant="ghost"
          icon={PlusIcon}
          fullWidth
          className="text-ctp-blue font-medium py-3"
        >
          Add New Trip
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-ctp-text">Add New Trip</h2>
          <ConnectionStatus />
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-ctp-subtext1 hover:text-ctp-text p-1"
          aria-label="Collapse form"
        >
          ×
        </button>
      </div>

      <form onSubmit={form.handleSubmit} className="space-y-4">
        <ClientNameField form={form} fieldName="client_name" required />

        <DateField
          form={form}
          fieldName="trip_date"
          label="Trip Date"
          required
          helperText={
            !form.data.trip_date && !form.getFieldError("trip_date")
              ? "💡 Select the date when your trip occurred"
              : undefined
          }
        />

        <MilesField form={form} fieldName="miles" />

        <NotesField form={form} fieldName="notes" />

        {/* Error Display */}
        {createTripMutation.isError && (
          <div className="p-3 bg-ctp-red/10 border border-ctp-red rounded-lg">
            <p className="text-ctp-red text-sm">
              {getApiErrorMessage(createTripMutation.error)}
            </p>
          </div>
        )}

        <Button
          type="submit"
          loading={form.isSubmitting || createTripMutation.isPending}
          icon={
            !(form.isSubmitting || createTripMutation.isPending)
              ? PlusIcon
              : undefined
          }
          fullWidth
        >
          {form.isSubmitting || createTripMutation.isPending
            ? "Adding Trip..."
            : "Add Trip"}
        </Button>
      </form>
    </div>
  );
}
