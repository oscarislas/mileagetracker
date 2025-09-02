import { useState } from 'react'
import { apiClient } from './services/apiClient'
import './App.css'

interface DateResponse {
  date: string;
  formatted_date: string;
}

function App() {
  const [currentDate, setCurrentDate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const fetchCurrentDate = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get<DateResponse>('/api/v1/date')
      setCurrentDate(response.data.formatted_date)
    } catch (err) {
      setError('Failed to fetch current date from server')
      console.error('Error fetching date:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div>
        <h1>Mileage Tracker</h1>
        <div className="card">
          <h2>Test Backend Connection</h2>
          <button onClick={fetchCurrentDate} disabled={loading}>
            {loading ? 'Fetching...' : 'Get Current Date'}
          </button>
          
          {currentDate && (
            <p style={{ color: 'green', marginTop: '1rem' }}>
              Current date from server: <strong>{currentDate}</strong>
            </p>
          )}
          
          {error && (
            <p style={{ color: 'red', marginTop: '1rem' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  )
}

export default App
