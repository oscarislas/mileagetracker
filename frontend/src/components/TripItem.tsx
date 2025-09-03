import { useState } from 'react'
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { useUpdateTrip, useDeleteTrip } from '../hooks/useTrips'
import { getApiErrorMessage } from '../utils/errorUtils'
import { formatTripDate, extractDateString } from '../utils/dateUtils'
import type { Trip, UpdateTripRequest, FormErrors } from '../types'

interface TripItemProps {
  trip: Trip
}

export default function TripItem({ trip }: TripItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<UpdateTripRequest>({
    client_name: trip.client_name,
    trip_date: extractDateString(trip.trip_date),
    miles: trip.miles,
    notes: trip.notes
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const updateTripMutation = useUpdateTrip()
  const deleteTripMutation = useDeleteTrip()

  // Calculate estimated deduction (using a reasonable default rate)
  const estimatedDeduction = trip.miles * 0.67

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Client name is required'
    } else if (formData.client_name.length > 30) {
      newErrors.client_name = 'Client name must be 30 characters or less'
    }

    if (!formData.trip_date) {
      newErrors.trip_date = 'Trip date is required'
    }

    if (formData.miles <= 0) {
      newErrors.miles = 'Miles must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEdit = () => {
    setIsEditing(true)
    setFormData({
      client_name: trip.client_name,
      trip_date: extractDateString(trip.trip_date),
      miles: trip.miles,
      notes: trip.notes
    })
    setErrors({})
  }

  const handleSave = () => {
    if (!validateForm()) return

    updateTripMutation.mutate(
      { id: trip.id, data: formData },
      {
        onSuccess: () => {
          setIsEditing(false)
          setErrors({})
        }
      }
    )
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      client_name: trip.client_name,
      trip_date: extractDateString(trip.trip_date),
      miles: trip.miles,
      notes: trip.notes
    })
    setErrors({})
  }

  const handleDelete = () => {
    deleteTripMutation.mutate(trip.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false)
      }
    })
  }

  // Removed formatDate function - using utility instead

  if (showDeleteConfirm) {
    return (
      <div className="bg-ctp-base border border-ctp-red/30 rounded-lg p-4">
        <div className="text-center">
          <p className="text-ctp-text font-medium mb-2">Delete this trip?</p>
          <p className="text-ctp-subtext1 text-sm mb-4">
            {trip.client_name} • {formatTripDate(trip.trip_date)} • {trip.miles} miles
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleDelete}
              disabled={deleteTripMutation.isPending}
              className="bg-ctp-red hover:bg-ctp-red/90 disabled:bg-ctp-red/50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {deleteTripMutation.isPending ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="bg-ctp-surface1 hover:bg-ctp-surface2 text-ctp-text px-4 py-2 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="bg-ctp-base border border-ctp-blue/30 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="text"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-ctp-surface1 rounded bg-ctp-surface0 text-ctp-text placeholder-ctp-subtext0 focus:ring-1 focus:ring-ctp-blue focus:border-transparent"
              placeholder="Client name"
              maxLength={30}
            />
            {errors.client_name && (
              <p className="text-ctp-red text-xs mt-1">{errors.client_name}</p>
            )}
          </div>
          <div>
            <input
              type="date"
              value={formData.trip_date}
              onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-ctp-surface1 rounded bg-ctp-surface0 text-ctp-text focus:ring-1 focus:ring-ctp-blue focus:border-transparent"
            />
            {errors.trip_date && (
              <p className="text-ctp-red text-xs mt-1">{errors.trip_date}</p>
            )}
          </div>
        </div>

        <div>
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.miles || ''}
            onChange={(e) => setFormData({ ...formData, miles: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 text-sm border border-ctp-surface1 rounded bg-ctp-surface0 text-ctp-text placeholder-ctp-subtext0 focus:ring-1 focus:ring-ctp-blue focus:border-transparent"
            placeholder="Miles"
          />
          {errors.miles && (
            <p className="text-ctp-red text-xs mt-1">{errors.miles}</p>
          )}
        </div>

        <div>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-ctp-surface1 rounded bg-ctp-surface0 text-ctp-text placeholder-ctp-subtext0 focus:ring-1 focus:ring-ctp-blue focus:border-transparent resize-none"
            placeholder="Notes (optional)"
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="p-2 text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface1 rounded-lg"
            title="Cancel"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={updateTripMutation.isPending}
            className="p-2 text-ctp-blue hover:bg-ctp-blue/10 rounded-lg disabled:opacity-50"
            title="Save changes"
          >
            {updateTripMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-ctp-blue border-t-transparent"></div>
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {updateTripMutation.isError && (
          <div className="text-ctp-red text-xs">
            {getApiErrorMessage(updateTripMutation.error)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div data-testid="trip-item" className="bg-ctp-base rounded-lg p-4 border border-ctp-surface1 hover:border-ctp-surface2 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-ctp-text truncate">{trip.client_name}</h3>
            <span className="text-ctp-green text-sm font-medium flex items-center gap-1 ml-2">
              <CurrencyDollarIcon className="h-3 w-3" />
              {estimatedDeduction.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-ctp-subtext1 mb-1">
            <span>{formatTripDate(trip.trip_date)}</span>
            <span className="font-medium">{trip.miles} miles</span>
          </div>
          
          {trip.notes && (
            <p className="text-sm text-ctp-subtext1 truncate">{trip.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={handleEdit}
            className="p-2 text-ctp-subtext1 hover:text-ctp-blue hover:bg-ctp-blue/10 rounded-lg transition-colors"
            title="Edit trip"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-ctp-subtext1 hover:text-ctp-red hover:bg-ctp-red/10 rounded-lg transition-colors"
            title="Delete trip"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}