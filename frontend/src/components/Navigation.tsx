import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  CogIcon,
  ChartBarIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  CogIcon as CogIconSolid,
  ChartBarIcon as ChartBarIconSolid,
} from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import QuickAddTripForm from "./QuickAddTripForm";

export default function Navigation() {
  const location = useLocation();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showQuickAdd) {
        setShowQuickAdd(false);
      }
    };

    if (showQuickAdd) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [showQuickAdd]);

  const handleCloseModal = () => {
    setShowQuickAdd(false);
  };

  const handleTripSuccess = () => {
    setShowQuickAdd(false);
  };

  const isTrips = location.pathname === "/" || location.pathname === "/trips";
  const isSettings = location.pathname === "/settings";
  const isSummary = location.pathname === "/summary";

  const navItems = [
    {
      to: "/",
      label: "Trips",
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      isActive: isTrips,
      color: "ctp-blue",
    },
    {
      to: "/summary",
      label: "Summary",
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      isActive: isSummary,
      color: "ctp-green",
    },
    {
      to: "/settings",
      label: "Settings",
      icon: CogIcon,
      iconSolid: CogIconSolid,
      isActive: isSettings,
      color: "ctp-mauve",
    },
  ];

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-ctp-base/95 backdrop-blur-md border-t border-ctp-surface0 safe-area-pb z-40">
        <div className="flex items-center justify-around px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.isActive ? item.iconSolid : item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 ${
                  item.isActive
                    ? `text-${item.color} bg-${item.color}/10 shadow-sm`
                    : "text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface0"
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Quick Add FAB */}
          <button
            onClick={() => setShowQuickAdd(true)}
            className="bg-gradient-to-r from-ctp-blue to-ctp-sapphire text-white p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-ctp-blue focus:ring-offset-2 focus:outline-none"
            aria-label="Quick add trip"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Quick Add Modal Overlay */}
      {showQuickAdd && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
          onClick={(e) => {
            // Close modal when clicking the backdrop
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-ctp-base rounded-t-xl md:rounded-xl w-full max-w-md max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-ctp-text"
                >
                  Quick Add Trip
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface0 rounded-lg focus:ring-2 focus:ring-ctp-blue focus:outline-none"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <QuickAddTripForm
                mode="modal"
                showCollapseState={false}
                onSuccess={handleTripSuccess}
                onCancel={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Alternative floating action button for pages that need it
export function FloatingActionButton({
  onClick,
  icon: Icon = PlusIcon,
  label = "Add",
}: {
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 bg-gradient-to-r from-ctp-blue to-ctp-sapphire text-white p-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 active:scale-95 z-30 md:hidden"
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}
