import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  CogIcon,
  ChartBarIcon,
  PlusIcon 
} from '@heroicons/react/24/outline'
import { 
  HomeIcon as HomeIconSolid, 
  CogIcon as CogIconSolid,
  ChartBarIcon as ChartBarIconSolid 
} from '@heroicons/react/24/solid'
import { useState } from 'react'

export default function EnhancedNavigation() {
  const location = useLocation()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  
  const isTrips = location.pathname === '/' || location.pathname === '/trips'
  const isSettings = location.pathname === '/settings'
  const isSummary = location.pathname === '/summary'

  const navItems = [
    {
      to: '/',
      label: 'Trips',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      isActive: isTrips,
      color: 'ctp-blue'
    },
    {
      to: '/summary',
      label: 'Summary',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      isActive: isSummary,
      color: 'ctp-green'
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: CogIcon,
      iconSolid: CogIconSolid,
      isActive: isSettings,
      color: 'ctp-mauve'
    }
  ]

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-ctp-base/95 backdrop-blur-md border-t border-ctp-surface0 safe-area-pb z-40">
        <div className="flex items-center justify-around px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.isActive ? item.iconSolid : item.icon
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 ${
                  item.isActive
                    ? `text-${item.color} bg-${item.color}/10 shadow-sm`
                    : 'text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface0'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
          
          {/* Quick Add FAB */}
          <button
            onClick={() => setShowQuickAdd(true)}
            className="bg-gradient-to-r from-ctp-blue to-ctp-sapphire text-white p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Quick Add Modal Overlay */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-ctp-base rounded-t-xl md:rounded-xl w-full max-w-md max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-ctp-text">Quick Add Trip</h2>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="p-2 text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface0 rounded-lg"
                >
                  ×
                </button>
              </div>
              
              {/* Quick Add Form would go here */}
              <div className="space-y-4">
                <p className="text-ctp-subtext1 text-sm">
                  Quick add functionality would be implemented here
                </p>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="w-full bg-ctp-blue text-white py-3 rounded-lg font-medium"
                >
                  Close for now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Alternative floating action button for pages that need it
export function FloatingActionButton({ onClick, icon: Icon = PlusIcon, label = "Add" }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 bg-gradient-to-r from-ctp-blue to-ctp-sapphire text-white p-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 active:scale-95 z-30 md:hidden"
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
    </button>
  )
}