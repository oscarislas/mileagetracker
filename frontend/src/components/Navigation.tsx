import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, CogIcon } from '@heroicons/react/24/outline'
import { HomeIcon as HomeIconSolid, CogIcon as CogIconSolid } from '@heroicons/react/24/solid'

export default function Navigation() {
  const location = useLocation()
  const isTrips = location.pathname === '/' || location.pathname === '/trips'
  const isSettings = location.pathname === '/settings'

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ctp-base border-t border-ctp-surface0 safe-area-pb">
      <div className="flex justify-around items-center py-2">
        <Link
          to="/"
          className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
            isTrips
              ? 'text-ctp-blue bg-ctp-surface0'
              : 'text-ctp-subtext1 hover:text-ctp-text'
          }`}
        >
          {isTrips ? (
            <HomeIconSolid className="h-6 w-6" />
          ) : (
            <HomeIcon className="h-6 w-6" />
          )}
          <span className="text-xs mt-1 font-medium">Trips</span>
        </Link>
        
        <Link
          to="/settings"
          className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
            isSettings
              ? 'text-ctp-blue bg-ctp-surface0'
              : 'text-ctp-subtext1 hover:text-ctp-text'
          }`}
        >
          {isSettings ? (
            <CogIconSolid className="h-6 w-6" />
          ) : (
            <CogIcon className="h-6 w-6" />
          )}
          <span className="text-xs mt-1 font-medium">Settings</span>
        </Link>
      </div>
    </nav>
  )
}