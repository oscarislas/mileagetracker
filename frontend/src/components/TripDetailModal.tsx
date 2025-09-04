import { useState, useRef, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  TruckIcon,
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Modal from "./Modal";
import { useUpdateTrip, useDeleteTrip } from "../hooks/useTrips";
import { useClientSuggestions } from "../hooks/useClients";
import { formatTripDateRelative, extractDateString } from "../utils/dateUtils";
import { getApiErrorMessage } from "../utils/errorUtils";
import type { Trip, UpdateTripRequest, FormErrors } from "../types";

interface TripDetailModalProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "view" | "edit";
}

export default function TripDetailModal({
  trip,
  isOpen,
  onClose,
  initialMode = "view",
}: TripDetailModalProps) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<UpdateTripRequest>({
    client_name: "",
    trip_date: "",
    miles: 0,
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const clientInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const updateTripMutation = useUpdateTrip();
  const deleteTripMutation = useDeleteTrip();
  const { data: clientSuggestions } = useClientSuggestions(
    formData.client_name,
  );

  // Initialize form data when trip changes or modal opens
  useEffect(() => {
    if (trip && isOpen) {
      setFormData({
        client_name: trip.client_name,
        trip_date: extractDateString(trip.trip_date),
        miles: trip.miles,
        notes: trip.notes || "",
      });
      setMode(initialMode);
      setShowDeleteConfirm(false);
      setErrors({});
      setShowSuggestions(false);
    }
  }, [trip, isOpen, initialMode]);

  // Handle click outside for suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !clientInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.client_name.trim()) {
      newErrors.client_name = "Client name is required";
    } else if (formData.client_name.length > 30) {
      newErrors.client_name = "Client name must be 30 characters or less";
    }

    if (!formData.trip_date) {
      newErrors.trip_date = "Trip date is required";
    }

    if (formData.miles <= 0) {
      newErrors.miles = "Miles must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!trip || !validateForm()) return;

    updateTripMutation.mutate(
      { id: trip.id, data: formData },
      {
        onSuccess: () => {
          setMode("view");
          setErrors({});
        },
      },
    );
  };

  const handleDelete = () => {
    if (!trip) return;

    deleteTripMutation.mutate(trip.id, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleClientSelect = (clientName: string) => {
    setFormData({ ...formData, client_name: clientName });
    setShowSuggestions(false);
  };

  const handleCancel = () => {
    if (trip) {
      setFormData({
        client_name: trip.client_name,
        trip_date: extractDateString(trip.trip_date),
        miles: trip.miles,
        notes: trip.notes || "",
      });
    }
    setErrors({});
    setMode("view");
  };

  const handleClose = () => {
    setMode("view");
    setShowDeleteConfirm(false);
    setErrors({});
    setShowSuggestions(false);
    onClose();
  };

  if (!trip) return null;

  const estimatedDeduction =
    (mode === "edit" ? formData.miles : trip.miles) * 0.67;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      className="max-h-[90vh] overflow-hidden"
    >
      {showDeleteConfirm ? (
        // Delete Confirmation View
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="bg-ctp-red/10 p-3 rounded-full">
              <TrashIcon className="h-6 w-6 text-ctp-red" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-ctp-text mb-2">
                Delete Trip?
              </h3>
              <p className="text-ctp-subtext1 mb-4">
                This will permanently remove the trip to{" "}
                <strong className="text-ctp-text">{trip.client_name}</strong> on{" "}
                <strong className="text-ctp-text">
                  {formatTripDateRelative(trip.trip_date)}
                </strong>
                . This action cannot be undone.
              </p>

              {deleteTripMutation.isError && (
                <div className="mb-4 p-3 bg-ctp-red/10 border border-ctp-red rounded-lg">
                  <p className="text-ctp-red text-sm">
                    {getApiErrorMessage(deleteTripMutation.error)}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteTripMutation.isPending}
                  className="bg-ctp-red hover:bg-ctp-red/90 disabled:bg-ctp-red/50 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 touch-manipulation"
                >
                  {deleteTripMutation.isPending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  Delete Trip
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteTripMutation.isPending}
                  className="bg-ctp-surface1 hover:bg-ctp-surface2 disabled:bg-ctp-surface1/50 text-ctp-text px-4 py-2 rounded-lg font-medium touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : mode === "view" ? (
        // View Mode
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-ctp-blue/10 p-3 rounded-lg">
                <UserIcon className="h-6 w-6 text-ctp-blue" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ctp-text">
                  {trip.client_name}
                </h2>
                <p className="text-sm text-ctp-subtext1">Trip Details</p>
              </div>
            </div>

            <div className="bg-ctp-green/10 px-3 py-2 rounded-lg flex items-center gap-2">
              <CurrencyDollarIcon className="h-4 w-4 text-ctp-green" />
              <span className="text-lg font-semibold text-ctp-green">
                ${estimatedDeduction.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Trip Details */}
          <div className="space-y-4">
            <div className="bg-ctp-base rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-ctp-subtext1" />
                  <span className="font-medium text-ctp-text">Trip Date</span>
                </div>
                <span className="text-ctp-text">
                  {formatTripDateRelative(trip.trip_date)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TruckIcon className="h-5 w-5 text-ctp-subtext1" />
                  <span className="font-medium text-ctp-text">
                    Miles Driven
                  </span>
                </div>
                <span className="text-ctp-text font-semibold">
                  {trip.miles} miles
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CurrencyDollarIcon className="h-5 w-5 text-ctp-subtext1" />
                  <span className="font-medium text-ctp-text">
                    Estimated Deduction
                  </span>
                </div>
                <span className="text-ctp-text font-semibold">
                  ${estimatedDeduction.toFixed(2)} ($0.67/mile)
                </span>
              </div>
            </div>

            {trip.notes && (
              <div className="bg-ctp-base rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <DocumentTextIcon className="h-5 w-5 text-ctp-subtext1 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-ctp-text mb-2">Notes</h4>
                    <p className="text-ctp-subtext1 whitespace-pre-wrap">
                      {trip.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-ctp-surface1">
            <button
              onClick={() => setMode("edit")}
              className="flex-1 bg-ctp-blue hover:bg-ctp-blue/90 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Trip
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-ctp-red hover:bg-ctp-red/90 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      ) : (
        // Edit Mode
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-ctp-surface1">
            <div className="bg-ctp-blue/10 p-3 rounded-lg">
              <PencilIcon className="h-6 w-6 text-ctp-blue" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ctp-text">Edit Trip</h2>
              <p className="text-sm text-ctp-subtext1">
                Update trip information
              </p>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Client Name */}
            <div className="relative">
              <label
                htmlFor="edit_client_name"
                className="block text-sm font-medium text-ctp-text mb-2"
              >
                Client Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ctp-subtext1" />
                <input
                  ref={clientInputRef}
                  type="text"
                  id="edit_client_name"
                  maxLength={30}
                  value={formData.client_name}
                  onChange={(e) => {
                    setFormData({ ...formData, client_name: e.target.value });
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() =>
                    setShowSuggestions(formData.client_name.length > 0)
                  }
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent ${
                    errors.client_name
                      ? "border-ctp-red"
                      : "border-ctp-surface1"
                  }`}
                  placeholder="Enter client name"
                />
              </div>

              {/* Client Suggestions */}
              {showSuggestions &&
                clientSuggestions?.clients &&
                clientSuggestions.clients.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-ctp-surface0 border border-ctp-surface1 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {clientSuggestions.clients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleClientSelect(client.name)}
                        className="w-full text-left px-3 py-2 hover:bg-ctp-surface1 text-ctp-text first:rounded-t-lg last:rounded-b-lg"
                      >
                        {client.name}
                      </button>
                    ))}
                  </div>
                )}

              {errors.client_name && (
                <p className="text-ctp-red text-sm mt-1">
                  {errors.client_name}
                </p>
              )}
            </div>

            {/* Trip Date */}
            <div>
              <label
                htmlFor="edit_trip_date"
                className="block text-sm font-medium text-ctp-text mb-2"
              >
                Trip Date <span className="text-ctp-red">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ctp-subtext1" />
                <input
                  type="date"
                  id="edit_trip_date"
                  value={formData.trip_date}
                  onChange={(e) =>
                    setFormData({ ...formData, trip_date: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-ctp-base text-ctp-text focus:ring-2 focus:ring-ctp-blue focus:border-transparent ${
                    errors.trip_date ? "border-ctp-red" : "border-ctp-surface1"
                  }`}
                />
              </div>
              {errors.trip_date && (
                <p className="text-ctp-red text-sm mt-1">{errors.trip_date}</p>
              )}
            </div>

            {/* Miles */}
            <div>
              <label
                htmlFor="edit_miles"
                className="block text-sm font-medium text-ctp-text mb-2"
              >
                Miles Driven
              </label>
              <div className="relative">
                <TruckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ctp-subtext1" />
                <input
                  type="number"
                  id="edit_miles"
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent ${
                    errors.miles ? "border-ctp-red" : "border-ctp-surface1"
                  }`}
                  placeholder="0.0"
                />
              </div>
              {errors.miles && (
                <p className="text-ctp-red text-sm mt-1">{errors.miles}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="edit_notes"
                className="block text-sm font-medium text-ctp-text mb-2"
              >
                Notes (Optional)
              </label>
              <div className="relative">
                <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5 text-ctp-subtext1" />
                <textarea
                  id="edit_notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent resize-none"
                  placeholder="Trip details, purpose, etc."
                />
              </div>
            </div>

            {/* Estimated Deduction Preview */}
            <div className="bg-ctp-base rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ctp-text">
                  Estimated Deduction:
                </span>
                <span className="text-lg font-semibold text-ctp-green">
                  ${estimatedDeduction.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {updateTripMutation.isError && (
            <div className="p-3 bg-ctp-red/10 border border-ctp-red rounded-lg">
              <p className="text-ctp-red text-sm">
                {getApiErrorMessage(updateTripMutation.error)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-ctp-surface1">
            <button
              onClick={handleSave}
              disabled={updateTripMutation.isPending}
              className="flex-1 bg-ctp-green hover:bg-ctp-green/90 disabled:bg-ctp-green/50 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
              {updateTripMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={updateTripMutation.isPending}
              className="bg-ctp-surface1 hover:bg-ctp-surface2 disabled:bg-ctp-surface1/50 text-ctp-text font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
