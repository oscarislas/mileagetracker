import { Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import EnhancedTripsPage from './pages/EnhancedTripsPage'
import SummaryPage from './pages/SummaryPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-ctp-base">
      <Routes>
        <Route path="/" element={<EnhancedTripsPage />} />
        <Route path="/trips" element={<EnhancedTripsPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <Navigation />
    </div>
  )
}

export default App