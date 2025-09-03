import AddTripForm from '../components/AddTripForm'
import TripsList from '../components/TripsList'

export default function TripsPage() {
  return (
    <div className="pb-20 px-4 pt-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ctp-text mb-2">Mileage Tracker</h1>
        <p className="text-ctp-subtext1">Track your business trips for tax deductions</p>
      </div>
      
      <AddTripForm />
      <TripsList />
    </div>
  )
}