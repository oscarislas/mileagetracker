import { useState, useEffect } from 'react'
import { 
  FunnelIcon, 
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import QuickAddTrip from '../components/QuickAddTrip'
import SummaryCard from '../components/SummaryCard'
import TripsList from '../components/TripsList'
import { StatsOverviewSkeleton } from '../components/LoadingSkeletons'
import { useTrips } from '../hooks/useTrips'
import { useSummary } from '../hooks/useSummary'
import { useAllClients } from '../hooks/useClients'
import type { TripFilters, DateRangeFilter, MilesRangeFilter } from '../types'

export default function EnhancedTripsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState<TripFilters>({
    dateRange: '',
    clientFilter: '',
    milesRange: '',
    searchQuery: ''
  })
  
  // Applied filters (only updated when Apply button is clicked)
  const [appliedFilters, setAppliedFilters] = useState<TripFilters>({
    dateRange: '',
    clientFilter: '',
    milesRange: '',
    searchQuery: ''
  })
  
  // Update applied filters when search query changes (for immediate search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAppliedFilters(prev => ({ ...prev, searchQuery }))
    }, 300) // Debounce search
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery])
  
  const { data: tripsData } = useTrips(1, 10, appliedFilters)
  const { data: summaryData, isLoading: isSummaryLoading } = useSummary()
  const { data: clientsData } = useAllClients()
  
  // Calculate totals from summary data
  const totalMiles = summaryData?.months?.reduce((sum, month) => sum + month.total_miles, 0) || 0
  const estimatedDeduction = summaryData?.months?.reduce((sum, month) => sum + month.amount, 0) || 0
  
  return (
    <div className="min-h-screen pb-20 px-4 pt-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-ctp-text mb-2">
            Mileage Tracker
          </h1>
          <p className="text-ctp-subtext1 max-w-md mx-auto">
            Track your business trips and maximize your tax deductions
          </p>
        </div>

        {/* Quick stats overview */}
        {isSummaryLoading ? (
          <StatsOverviewSkeleton />
        ) : (
          <div className="bg-gradient-to-r from-ctp-blue/5 to-ctp-sapphire/5 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-ctp-blue">
                  {tripsData?.total || 0}
                </p>
                <p className="text-xs text-ctp-subtext1">Total Trips</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ctp-green">
                  ${(estimatedDeduction || ((tripsData?.trips?.reduce((sum, trip) => sum + trip.miles, 0) || 0) * 0.67)).toFixed(0)}
                </p>
                <p className="text-xs text-ctp-subtext1">Deductions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ctp-yellow">
                  {(totalMiles || tripsData?.trips?.reduce((sum, trip) => sum + trip.miles, 0) || 0).toFixed(0)}
                </p>
                <p className="text-xs text-ctp-subtext1">Miles</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick add form */}
      <QuickAddTrip />

      {/* Controls bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ctp-subtext1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-ctp-surface1 rounded-lg bg-ctp-surface0 text-ctp-text placeholder-ctp-subtext0 focus:ring-2 focus:ring-ctp-blue focus:border-transparent"
              placeholder="Search trips, clients..."
            />
          </div>
        </div>

        {/* Filters */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-ctp-surface1 rounded-lg bg-ctp-surface0 text-ctp-text hover:bg-ctp-surface1"
        >
          <FunnelIcon className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-ctp-surface0 rounded-lg p-4 border border-ctp-surface1 space-y-4">
          <h3 className="font-medium text-ctp-text mb-3">Filter Trips</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date-range-select" className="block text-sm font-medium text-ctp-text mb-1">
                Date Range
              </label>
              <select 
                id="date-range-select"
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as DateRangeFilter }))}
                className="w-full px-3 py-2 text-sm border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text focus:ring-2 focus:ring-ctp-blue focus:border-transparent"
              >
                <option value="">All dates</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="quarter">This quarter</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="client-select" className="block text-sm font-medium text-ctp-text mb-1">
                Client
              </label>
              <select 
                id="client-select"
                value={filters.clientFilter}
                onChange={(e) => setFilters(prev => ({ ...prev, clientFilter: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text focus:ring-2 focus:ring-ctp-blue focus:border-transparent"
              >
                <option value="">All clients</option>
                {clientsData?.clients.map(client => (
                  <option key={client.id} value={client.name}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="miles-range-select" className="block text-sm font-medium text-ctp-text mb-1">
                Miles Range
              </label>
              <select 
                id="miles-range-select"
                value={filters.milesRange}
                onChange={(e) => setFilters(prev => ({ ...prev, milesRange: e.target.value as MilesRangeFilter }))}
                className="w-full px-3 py-2 text-sm border border-ctp-surface1 rounded-lg bg-ctp-base text-ctp-text focus:ring-2 focus:ring-ctp-blue focus:border-transparent"
              >
                <option value="">Any distance</option>
                <option value="0-10">0-10 miles</option>
                <option value="10-50">10-50 miles</option>
                <option value="50-100">50-100 miles</option>
                <option value="100+">100+ miles</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setAppliedFilters({ ...filters, searchQuery: appliedFilters.searchQuery })
              }}
              className="px-4 py-2 text-sm bg-ctp-blue text-white rounded-lg hover:bg-ctp-blue/90 transition-colors"
            >
              Apply Filters
            </button>
            <button 
              onClick={() => {
                const clearedFilters: TripFilters = {
                  dateRange: '',
                  clientFilter: '',
                  milesRange: '',
                  searchQuery: ''
                }
                setFilters(clearedFilters)
                setAppliedFilters(clearedFilters)
                setSearchQuery('')
              }}
              className="px-4 py-2 text-sm text-ctp-subtext1 hover:text-ctp-text transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Main content area with responsive layout */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6">
        
        {/* Main content - trips list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-ctp-text flex items-center gap-2">
              {appliedFilters.searchQuery || appliedFilters.dateRange || appliedFilters.clientFilter || appliedFilters.milesRange ? 'Filtered Trips' : 'Recent Trips'}
              {(appliedFilters.searchQuery || appliedFilters.dateRange || appliedFilters.clientFilter || appliedFilters.milesRange) && (
                <span className="text-xs bg-ctp-blue/20 text-ctp-blue px-2 py-1 rounded-full">
                  {tripsData?.total || 0} results
                </span>
              )}
            </h2>
            
            <TripsList 
              enhanced={true} 
              showPagination={false} 
              limit={5}
              filters={appliedFilters}
            />
          </div>
        </div>

        {/* Sidebar - summary on desktop, below content on mobile */}
        <div className="lg:col-span-4 space-y-4 mt-6 lg:mt-0">
          <SummaryCard />
        </div>
      </div>
    </div>
  )
}