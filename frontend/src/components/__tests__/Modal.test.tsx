import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Modal from "../Modal";
import { useModal } from "../../hooks/useModal";

// Mock createPortal for testing
vi.mock("react-dom", () => ({
  ...vi.importActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

// Test component that uses the Modal
function TestModalComponent({
  isOpen = false,
  onClose = vi.fn(),
  ...modalProps
}: {
  isOpen?: boolean;
  onClose?: () => void;
  [key: string]: unknown;
}) {
  return (
    <div>
      <button data-testid="trigger">Open Modal</button>
      <Modal isOpen={isOpen} onClose={onClose} {...modalProps}>
        <div data-testid="modal-content">
          <p>Modal content here</p>
          <button data-testid="focus-button">Focusable Button</button>
          <input data-testid="focus-input" placeholder="Focusable Input" />
        </div>
      </Modal>
    </div>
  );
}

// Test component for useModal hook
function TestModalHook() {
  const { isOpen, openModal, closeModal, toggleModal } = useModal();

  return (
    <div>
      <button data-testid="open-button" onClick={openModal}>
        Open
      </button>
      <button data-testid="close-button" onClick={closeModal}>
        Close
      </button>
      <button data-testid="toggle-button" onClick={toggleModal}>
        Toggle
      </button>
      <Modal isOpen={isOpen} onClose={closeModal}>
        <div data-testid="hook-content">Hook modal content</div>
      </Modal>
    </div>
  );
}

describe("Modal Component", () => {
  beforeEach(() => {
    // Reset body styles
    document.body.style.overflow = "";
    // Clear any existing modals
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = "";
  });

  describe("Basic Rendering", () => {
    it("renders nothing when closed", () => {
      render(<TestModalComponent isOpen={false} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("modal-content")).not.toBeInTheDocument();
    });

    it("renders modal content when open", () => {
      render(<TestModalComponent isOpen={true} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByTestId("modal-content")).toBeInTheDocument();
      expect(screen.getByText("Modal content here")).toBeInTheDocument();
    });

    it("renders modal with title when provided", () => {
      render(<TestModalComponent isOpen={true} title="Test Modal" />);

      expect(screen.getByText("Test Modal")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "aria-labelledby",
        "modal-title",
      );
    });

    it("renders close button by default", () => {
      render(<TestModalComponent isOpen={true} />);

      expect(screen.getByLabelText("Close modal")).toBeInTheDocument();
    });

    it("hides close button when showCloseButton is false", () => {
      render(<TestModalComponent isOpen={true} showCloseButton={false} />);

      expect(screen.queryByLabelText("Close modal")).not.toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("applies default medium size classes", () => {
      render(<TestModalComponent isOpen={true} />);

      const modal = screen.getByRole("dialog").querySelector('[tabindex="-1"]');
      expect(modal).toHaveClass("max-w-md");
    });

    it("applies small size classes", () => {
      render(<TestModalComponent isOpen={true} size="sm" />);

      const modal = screen.getByRole("dialog").querySelector('[tabindex="-1"]');
      expect(modal).toHaveClass("max-w-sm");
    });

    it("applies large size classes", () => {
      render(<TestModalComponent isOpen={true} size="lg" />);

      const modal = screen.getByRole("dialog").querySelector('[tabindex="-1"]');
      expect(modal).toHaveClass("max-w-lg");
    });

    it("applies full size classes", () => {
      render(<TestModalComponent isOpen={true} size="full" />);

      const modal = screen.getByRole("dialog").querySelector('[tabindex="-1"]');
      expect(modal).toHaveClass(
        "max-w-none",
        "h-full",
        "w-full",
        "m-0",
        "rounded-none",
      );
    });
  });

  describe("Closing Behavior", () => {
    it("calls onClose when close button is clicked", async () => {
      const mockOnClose = vi.fn();
      const user = userEvent.setup();

      render(<TestModalComponent isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText("Close modal");
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when backdrop is clicked", async () => {
      const mockOnClose = vi.fn();
      const user = userEvent.setup();

      render(<TestModalComponent isOpen={true} onClose={mockOnClose} />);

      // Click on the backdrop (first child of dialog)
      const backdrop = screen.getByRole("dialog").firstChild;
      await user.click(backdrop as Element);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("does not close when backdrop is clicked and closeOnOutsideClick is false", async () => {
      const mockOnClose = vi.fn();
      const user = userEvent.setup();

      render(
        <TestModalComponent
          isOpen={true}
          onClose={mockOnClose}
          closeOnOutsideClick={false}
        />,
      );

      const backdrop = screen.getByRole("dialog").firstChild;
      await user.click(backdrop as Element);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("calls onClose when ESC key is pressed", async () => {
      const mockOnClose = vi.fn();
      const user = userEvent.setup();

      render(<TestModalComponent isOpen={true} onClose={mockOnClose} />);

      await user.keyboard("{Escape}");

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("does not close when ESC is pressed and closeOnEscape is false", async () => {
      const mockOnClose = vi.fn();
      const user = userEvent.setup();

      render(
        <TestModalComponent
          isOpen={true}
          onClose={mockOnClose}
          closeOnEscape={false}
        />,
      );

      await user.keyboard("{Escape}");

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("does not close when clicking inside modal content", async () => {
      const mockOnClose = vi.fn();
      const user = userEvent.setup();

      render(<TestModalComponent isOpen={true} onClose={mockOnClose} />);

      const modalContent = screen.getByTestId("modal-content");
      await user.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<TestModalComponent isOpen={true} title="Test Modal" />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
    });

    it("focuses first focusable element when opened", async () => {
      render(<TestModalComponent isOpen={true} />);

      await waitFor(
        () => {
          // The close button is the first focusable element in our modal
          const closeButton = screen.getByLabelText("Close modal");
          expect(closeButton).toHaveFocus();
        },
        { timeout: 200 },
      );
    });

    it("traps focus within modal", async () => {
      const user = userEvent.setup();
      render(<TestModalComponent isOpen={true} />);

      const focusButton = screen.getByTestId("focus-button");
      const focusInput = screen.getByTestId("focus-input");
      const closeButton = screen.getByLabelText("Close modal");

      await waitFor(() => expect(closeButton).toHaveFocus());

      // Tab forward
      await user.tab();
      expect(focusButton).toHaveFocus();

      await user.tab();
      expect(focusInput).toHaveFocus();

      // Tab should wrap back to first element (close button)
      await user.tab();
      expect(closeButton).toHaveFocus();

      // Shift+Tab should go to last element
      await user.tab({ shift: true });
      expect(focusInput).toHaveFocus();
    });

    it("disables body scroll when disableBodyScroll is true", () => {
      render(<TestModalComponent isOpen={true} disableBodyScroll={true} />);

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("does not disable body scroll when disableBodyScroll is false", () => {
      render(<TestModalComponent isOpen={true} disableBodyScroll={false} />);

      expect(document.body.style.overflow).toBe("");
    });

    it("restores body scroll when modal is closed", () => {
      const { rerender } = render(<TestModalComponent isOpen={true} />);
      expect(document.body.style.overflow).toBe("hidden");

      rerender(<TestModalComponent isOpen={false} />);
      expect(document.body.style.overflow).toBe("");
    });

    it("restores focus to previously focused element when closed", async () => {
      const { rerender } = render(<TestModalComponent isOpen={false} />);

      const triggerButton = screen.getByTestId("trigger");
      triggerButton.focus();
      expect(triggerButton).toHaveFocus();

      // Open modal
      rerender(<TestModalComponent isOpen={true} />);

      await waitFor(() => {
        expect(screen.getByLabelText("Close modal")).toHaveFocus();
      });

      // Close modal
      rerender(<TestModalComponent isOpen={false} />);

      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      });
    });
  });

  describe("Styling and Theming", () => {
    it("applies custom className", () => {
      render(<TestModalComponent isOpen={true} className="custom-modal" />);

      const modal = screen.getByRole("dialog").querySelector('[tabindex="-1"]');
      expect(modal).toHaveClass("custom-modal");
    });

    it("applies Catppuccin theme classes", () => {
      render(<TestModalComponent isOpen={true} />);

      const dialog = screen.getByRole("dialog");
      const backdrop = dialog.querySelector('[aria-hidden="true"]');
      const modal = dialog.querySelector('[tabindex="-1"]');

      // Check backdrop classes
      expect(backdrop).toHaveClass("bg-ctp-crust/80", "backdrop-blur-sm");

      // Check modal classes
      expect(modal).toHaveClass("bg-ctp-surface0", "border-ctp-surface1");
    });

    it("has proper transition classes", () => {
      render(<TestModalComponent isOpen={true} />);

      const dialog = screen.getByRole("dialog");
      const backdrop = dialog.querySelector('[aria-hidden="true"]');
      const modal = dialog.querySelector('[tabindex="-1"]');

      expect(dialog).toHaveClass("transition-all", "duration-300");
      expect(backdrop).toHaveClass("transition-opacity", "duration-300");
      expect(modal).toHaveClass("transition-all", "duration-300");
    });
  });

  describe("Edge Cases", () => {
    it("handles modal without focusable elements", async () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <div>No focusable elements</div>
        </Modal>,
      );

      // Should not throw error
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("handles rapid open/close cycles", () => {
      const { rerender } = render(<TestModalComponent isOpen={false} />);

      // Rapidly toggle
      rerender(<TestModalComponent isOpen={true} />);
      rerender(<TestModalComponent isOpen={false} />);
      rerender(<TestModalComponent isOpen={true} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("cleans up event listeners when unmounted", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      const { unmount } = render(<TestModalComponent isOpen={true} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
    });
  });

  describe("useModal Hook", () => {
    it("provides correct initial state", () => {
      render(<TestModalHook />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens modal when openModal is called", async () => {
      const user = userEvent.setup();
      render(<TestModalHook />);

      const openButton = screen.getByTestId("open-button");
      await user.click(openButton);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByTestId("hook-content")).toBeInTheDocument();
    });

    it("closes modal when closeModal is called", async () => {
      const user = userEvent.setup();
      render(<TestModalHook />);

      const openButton = screen.getByTestId("open-button");
      const closeButton = screen.getByTestId("close-button");

      await user.click(openButton);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await user.click(closeButton);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("toggles modal when toggleModal is called", async () => {
      const user = userEvent.setup();
      render(<TestModalHook />);

      const toggleButton = screen.getByTestId("toggle-button");

      // First toggle - should open
      await user.click(toggleButton);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Second toggle - should close
      await user.click(toggleButton);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("accepts initial open state", () => {
      function TestInitialOpen() {
        const { isOpen, closeModal } = useModal(true);

        return (
          <Modal isOpen={isOpen} onClose={closeModal}>
            <div>Initially open</div>
          </Modal>
        );
      }

      render(<TestInitialOpen />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
