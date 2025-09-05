import { useState, useEffect, useCallback } from "react";
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
import { useForm } from "../hooks/useForm";
import { formatTripDateRelative, extractDateString } from "../utils/dateUtils";
import { getApiErrorMessage } from "../utils/errorUtils";
import { createTripFormValidator } from "../utils/formUtils";
import { ClientNameField, DateField, MilesField, NotesField } from "./form";
import { Button, LoadingSpinner } from "./ui";
import type { Trip, UpdateTripRequest } from "../types";

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

  const updateTripMutation = useUpdateTrip();
  const deleteTripMutation = useDeleteTrip();

  // Initialize form with trip data when available
  const getInitialFormData = useCallback((): UpdateTripRequest => {
    if (!trip) {
      return {
        client_name: "",
        trip_date: "",
        miles: 0,
        notes: "",
      };
    }
    return {
      client_name: trip.client_name,
      trip_date: extractDateString(trip.trip_date),
      miles: trip.miles,
      notes: trip.notes || "",
    };
  }, [trip]);

  const form = useForm<UpdateTripRequest>({
    initialData: getInitialFormData(),
    validate: createTripFormValidator<UpdateTripRequest>(),
    onSubmit: async (data) => {
      if (!trip) return;
      return new Promise((resolve, reject) => {
        updateTripMutation.mutate(
          { id: trip.id, data },
          {
            onSuccess: () => {
              setMode("view");
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
          },
        );
      });
    },
    resetOnSuccess: false, // Don't reset as we want to keep updated values
  });

  // Reset form and modal state when trip changes or modal opens
  useEffect(() => {
    if (trip && isOpen) {
      const initialFormData = getInitialFormData();
      form.setData(initialFormData);
      form.clearErrors();
      setMode(initialMode);
      setShowDeleteConfirm(false);
    }
  }, [trip, isOpen, initialMode, getInitialFormData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    form.handleSubmit();
  };

  const handleDelete = () => {
    if (!trip) return;

    deleteTripMutation.mutate(trip.id, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleCancel = () => {
    if (trip) {
      const initialFormData = getInitialFormData();
      form.setData(initialFormData);
    }
    form.clearErrors();
    setMode("view");
  };

  const handleClose = () => {
    setMode("view");
    setShowDeleteConfirm(false);
    form.clearErrors();
    onClose();
  };

  if (!trip) return null;

  const estimatedDeduction =
    (mode === "edit" ? form.data.miles : trip.miles) * 0.67;

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
                    <LoadingSpinner size="sm" color="white" />
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

          <form
            onSubmit={form.handleSubmit}
            className="space-y-4 max-h-96 overflow-y-auto"
          >
            <ClientNameField
              form={form}
              fieldName="client_name"
              id="edit_client_name"
              required
            />

            <DateField
              form={form}
              fieldName="trip_date"
              label="Trip Date"
              id="edit_trip_date"
              required
            />

            <MilesField
              form={form}
              fieldName="miles"
              id="edit_miles"
              required
            />

            <NotesField form={form} fieldName="notes" id="edit_notes" />
          </form>

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
            <Button
              onClick={handleSave}
              loading={form.isSubmitting || updateTripMutation.isPending}
              disabled={form.isSubmitting || updateTripMutation.isPending}
              icon={
                !(form.isSubmitting || updateTripMutation.isPending)
                  ? CheckIcon
                  : undefined
              }
              className="flex-1 bg-ctp-green hover:bg-ctp-green/90 disabled:bg-ctp-green/50"
              fullWidth
            >
              {form.isSubmitting || updateTripMutation.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={form.isSubmitting || updateTripMutation.isPending}
              variant="secondary"
              icon={XMarkIcon}
              className="bg-ctp-surface1 hover:bg-ctp-surface2 disabled:bg-ctp-surface1/50"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
