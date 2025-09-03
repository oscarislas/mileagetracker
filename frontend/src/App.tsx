import { Routes, Route } from 'react-router-dom'
import EnhancedNavigation from './components/EnhancedNavigation'
import EnhancedTripsPage from './pages/EnhancedTripsPage'
import TripsPage from './pages/TripsPage'
import SummaryPage from './pages/SummaryPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-ctp-base">
      <Routes>
        <Route path="/" element={<EnhancedTripsPage />} />
        <Route path="/trips" element={<EnhancedTripsPage />} />
        <Route path="/trips/simple" element={<TripsPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <EnhancedNavigation />
    </div>
  )
}

export default App