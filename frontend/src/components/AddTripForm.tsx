import { useState } from "react";
import {
  PlusIcon,
  UserIcon,
  CalendarIcon,
  TruckIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useCreateTrip } from "../hooks/useTrips";
import { useClientSuggestions as useClientSuggestionsHook } from "../hooks/useClientSuggestions";
import { getApiErrorMessage } from "../utils/errorUtils";
import { validateTripForm } from "../utils/formUtils";
import {
  Button,
  Input,
  FormField,
  ClientSuggestions,
  Textarea,
  ConnectionStatus,
} from "./ui";
import type { CreateTripRequest, FormErrors } from "../types";

export default function AddTripForm() {
  const [formData, setFormData] = useState<CreateTripRequest>({
    client_name: "",
    trip_date: "", // Empty by default to encourage user selection
    miles: 0,
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  const createTripMutation = useCreateTrip();
  const clientSuggestions = useClientSuggestionsHook(formData.client_name);

  const validateForm = (): boolean => {
    const { isValid, errors: validationErrors } = validateTripForm(formData);
    setErrors(validationErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    createTripMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({
          client_name: "",
          trip_date: "", // Empty to encourage date selection for next trip
          miles: 0,
          notes: "",
        });
        setErrors({});
        setIsCollapsed(true);
        // Auto-expand after successful submission for better UX
        setTimeout(() => setIsCollapsed(false), 2000);
      },
    });
  };

  const handleClientSelect = (clientName: string) => {
    setFormData({ ...formData, client_name: clientName });
    clientSuggestions.handleClientSelect(clientName);
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, client_name: value });
    if (value.length > 0) {
      clientSuggestions.showSuggestionsDropdown();
    } else {
      clientSuggestions.hideSuggestionsDropdown();
    }
    // Clear error when user starts typing
    if (errors.client_name) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.client_name;
        return newErrors;
      });
    }
  };

  const handleClientNameFocus = () => {
    if (formData.client_name.length > 0) {
      clientSuggestions.showSuggestionsDropdown();
    }
  };

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Name */}
        <FormField
          label="Client Name"
          error={errors.client_name}
          icon={UserIcon}
          id="client_name"
        >
          <div className="relative">
            <Input
              ref={clientSuggestions.inputRef}
              id="client_name"
              maxLength={30}
              value={formData.client_name}
              onChange={handleClientNameChange}
              onFocus={handleClientNameFocus}
              hasIcon
              error={!!errors.client_name}
              placeholder="Enter client name"
            />

            {/* Client Suggestions */}
            <ClientSuggestions
              ref={clientSuggestions.suggestionsRef}
              clients={clientSuggestions.suggestions?.data?.clients || []}
              show={clientSuggestions.showSuggestions}
              onSelect={handleClientSelect}
              isLoading={clientSuggestions.suggestions?.isLoading}
              query={formData.client_name}
              noResultsMessage="No matching clients found"
            />
          </div>
        </FormField>

        {/* Trip Date */}
        <FormField
          label="Trip Date"
          required
          error={errors.trip_date}
          helperText={
            !formData.trip_date && !errors.trip_date
              ? "💡 Select the date when your trip occurred"
              : undefined
          }
          icon={CalendarIcon}
          id="trip_date"
        >
          <Input
            type="date"
            id="trip_date"
            value={formData.trip_date}
            onChange={(e) => {
              setFormData({ ...formData, trip_date: e.target.value });
              if (errors.trip_date) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.trip_date;
                  return newErrors;
                });
              }
            }}
            hasIcon
            error={!!errors.trip_date}
            placeholder="Select trip date"
          />
        </FormField>

        {/* Miles */}
        <FormField
          label="Miles Driven"
          error={errors.miles}
          icon={TruckIcon}
          id="miles"
        >
          <Input
            type="number"
            id="miles"
            step="0.1"
            min="0"
            inputMode="decimal"
            value={formData.miles || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                miles: parseFloat(e.target.value) || 0,
              });
              if (errors.miles) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.miles;
                  return newErrors;
                });
              }
            }}
            hasIcon
            error={!!errors.miles}
            placeholder="0.0"
          />
        </FormField>

        {/* Notes */}
        <FormField label="Notes (Optional)" icon={DocumentTextIcon} id="notes">
          <Textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            hasIcon
            noResize
            placeholder="Trip details, purpose, etc."
          />
        </FormField>

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
          loading={createTripMutation.isPending}
          icon={!createTripMutation.isPending ? PlusIcon : undefined}
          fullWidth
        >
          {createTripMutation.isPending ? "Adding Trip..." : "Add Trip"}
        </Button>
      </form>
    </div>
  );
}
