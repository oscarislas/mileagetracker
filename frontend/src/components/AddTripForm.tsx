import { useState, useRef, useEffect } from 'react'
import { PlusIcon, UserIcon, CalendarIcon, TruckIcon, DocumentTextIcon, WifiIcon } from '@heroicons/react/24/outline'
import { useCreateTrip } from '../hooks/useTrips'
import { useClientSuggestions } from '../hooks/useClients'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import { getApiErrorMessage } from '../utils/errorUtils'
import { getTodayDateString } from '../utils/dateUtils'
import type { CreateTripRequest, FormErrors } from '../types'

export default function AddTripForm() {
  const [formData, setFormData] = useState<CreateTripRequest>({
    client_name: '',
    trip_date: getTodayDateString(), // Today's date
    miles: 0,
    notes: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const clientInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const createTripMutation = useCreateTrip()
  const { data: clientSuggestions } = useClientSuggestions(formData.client_name)
  const { data: connectionStatus } = useConnectionStatus()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !clientInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    createTripMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({
          client_name: '',
          trip_date: getTodayDateString(),
          miles: 0,
          notes: ''
        })
        setErrors({})
        setIsCollapsed(true)
        // Auto-expand after successful submission for better UX
        setTimeout(() => setIsCollapsed(false), 2000)
      }
    })
  }

  const handleClientSelect = (clientName: string) => {
    setFormData({ ...formData, client_name: clientName })
    setShowSuggestions(false)
  }

  if (isCollapsed) {
    return (
      <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center justify-center gap-2 py-3 text-ctp-blue font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Add New Trip
        </button>
      </div>
    )
  }

  return (
    <div className="bg-ctp-surface0 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-ctp-text">Add New Trip</h2>
          {connectionStatus && (
            <div className="flex items-center gap-1 text-xs">
              <WifiIcon className={`h-3 w-3 ${connectionStatus.connected ? 'text-ctp-green' : 'text-ctp-red'}`} />
              <span className={connectionStatus.connected ? 'text-ctp-green' : 'text-ctp-red'}>
                {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          )}
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
        <div className="relative">
          <label htmlFor="client_name" className="block text-sm font-medium text-ctp-text mb-2">
            Client Name
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ctp-subtext1" />
            <input
              ref={clientInputRef}
              type="text"
              id="client_name"
              maxLength={30}
              value={formData.client_name}
              onChange={(e) => {
                setFormData({ ...formData, client_name: e.target.value })
                setShowSuggestions(e.target.value.length > 0)
              }}
              onFocus={() => setShowSuggestions(formData.client_name.length > 0)}
              className="w-full pl-10 pr-4 py-3 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent"
              placeholder="Enter client name"
            />
          </div>
          
          {/* Client Suggestions */}
          {showSuggestions && clientSuggestions?.clients && clientSuggestions.clients.length > 0 && (
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
            <p className="text-ctp-red text-sm mt-1">{errors.client_name}</p>
          )}
        </div>

        {/* Trip Date */}
        <div>
          <label htmlFor="trip_date" className="block text-sm font-medium text-ctp-text mb-2">
            Trip Date
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ctp-subtext1" />
            <input
              type="date"
              id="trip_date"
              value={formData.trip_date}
              onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text focus:ring-2 focus:ring-ctp-blue focus:border-transparent"
            />
          </div>
          {errors.trip_date && (
            <p className="text-ctp-red text-sm mt-1">{errors.trip_date}</p>
          )}
        </div>

        {/* Miles */}
        <div>
          <label htmlFor="miles" className="block text-sm font-medium text-ctp-text mb-2">
            Miles Driven
          </label>
          <div className="relative">
            <TruckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ctp-subtext1" />
            <input
              type="number"
              id="miles"
              step="0.1"
              min="0"
              inputMode="decimal"
              value={formData.miles || ''}
              onChange={(e) => setFormData({ ...formData, miles: parseFloat(e.target.value) || 0 })}
              className="w-full pl-10 pr-4 py-3 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent"
              placeholder="0.0"
            />
          </div>
          {errors.miles && (
            <p className="text-ctp-red text-sm mt-1">{errors.miles}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-ctp-text mb-2">
            Notes (Optional)
          </label>
          <div className="relative">
            <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5 text-ctp-subtext1" />
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent resize-none"
              placeholder="Trip details, purpose, etc."
            />
          </div>
        </div>

        {/* Error Display */}
        {createTripMutation.isError && (
          <div className="p-3 bg-ctp-red/10 border border-ctp-red rounded-lg">
            <p className="text-ctp-red text-sm">
              {getApiErrorMessage(createTripMutation.error)}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={createTripMutation.isPending}
          className="w-full bg-ctp-blue hover:bg-ctp-blue/90 disabled:bg-ctp-blue/50 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {createTripMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Adding Trip...
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              Add Trip
            </>
          )}
        </button>
      </form>
    </div>
  )
}