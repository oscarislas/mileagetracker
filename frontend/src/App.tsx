import { Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import TripsPage from './pages/TripsPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-ctp-base">
      <Routes>
        <Route path="/" element={<TripsPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <Navigation />
    </div>
  )
}

export default App