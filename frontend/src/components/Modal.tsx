import { useEffect, useRef, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should be closed */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Optional title for the modal */
  title?: string;
  /** Whether to show the close button in header */
  showCloseButton?: boolean;
  /** Custom CSS classes for the modal content */
  className?: string;
  /** Whether clicking outside closes the modal */
  closeOnOutsideClick?: boolean;
  /** Whether pressing ESC closes the modal */
  closeOnEscape?: boolean;
  /** Size variant for the modal */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Disable scroll on body when modal is open */
  disableBodyScroll?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  className = "",
  closeOnOutsideClick = true,
  closeOnEscape = true,
  size = "md",
  disableBodyScroll = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Get size classes
  const getSizeClasses = (size: ModalProps["size"]): string => {
    switch (size) {
      case "sm":
        return "max-w-sm";
      case "md":
        return "max-w-md";
      case "lg":
        return "max-w-lg";
      case "xl":
        return "max-w-xl";
      case "full":
        return "max-w-none h-full w-full m-0 rounded-none";
      default:
        return "max-w-md";
    }
  };

  // Focus trap implementation
  const trapFocus = (e: KeyboardEvent) => {
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    firstFocusableRef.current = firstElement;
    lastFocusableRef.current = lastElement;

    if (e.key === "Tab") {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }
  };

  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        e.preventDefault();
        onClose();
      }
      trapFocus(e);
    },
    [closeOnEscape, onClose],
  );

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOutsideClick) {
      onClose();
    }
  };

  // Setup effects when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement;

      // Add event listeners
      document.addEventListener("keydown", handleKeyDown);

      // Disable body scroll if requested
      if (disableBodyScroll) {
        document.body.style.overflow = "hidden";
      }

      // Focus the modal after a brief delay to ensure it's rendered
      const focusTimeout = setTimeout(() => {
        if (modalRef.current) {
          // Try to focus the first focusable element, or the modal itself
          const firstFocusable = modalRef.current.querySelector(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) as HTMLElement;

          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 100);

      return () => {
        clearTimeout(focusTimeout);
        document.removeEventListener("keydown", handleKeyDown);

        // Restore body scroll
        if (disableBodyScroll) {
          document.body.style.overflow = "";
        }

        // Restore focus to previously focused element
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen, closeOnEscape, disableBodyScroll, handleKeyDown]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-ctp-crust/80 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div
          ref={modalRef}
          className={`
            relative transform overflow-hidden rounded-lg bg-ctp-surface0 border border-ctp-surface1 
            text-left shadow-xl transition-all duration-300 w-full
            ${getSizeClasses(size)}
            ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}
            ${size === "full" ? "h-full" : ""}
            ${className}
          `}
          tabIndex={-1}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-ctp-surface1">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-ctp-text"
                >
                  {title}
                </h2>
              )}

              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface1 transition-colors touch-manipulation"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={`${title || showCloseButton ? "p-4" : "p-6"}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // Render portal to body
  const portalRoot = document.getElementById("modal-root") || document.body;
  return createPortal(modalContent, portalRoot);
}
