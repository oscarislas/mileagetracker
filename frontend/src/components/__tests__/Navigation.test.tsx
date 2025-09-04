import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Navigation from "../Navigation";
import { renderWithProviders } from "../../test/utils/testUtils";

// Mock the QuickAddTripForm component
vi.mock("../QuickAddTripForm", () => ({
  default: ({
    mode,
    onSuccess,
    onCancel,
    showCollapseState,
  }: {
    mode?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    showCollapseState?: boolean;
  }) => (
    <div
      data-testid="quick-add-trip-form"
      data-mode={mode}
      data-show-collapse-state={showCollapseState}
    >
      <button onClick={onSuccess} data-testid="mock-success">
        Mock Success
      </button>
      <button onClick={onCancel} data-testid="mock-cancel">
        Mock Cancel
      </button>
    </div>
  ),
}));

// Mock the trip creation hooks
const mockCreateTripMutate = vi.fn();
vi.mock("../../hooks/useTrips", () => ({
  useCreateTrip: () => ({
    mutate: mockCreateTripMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useClients", () => ({
  useClientSuggestions: () => ({
    data: { clients: [] },
    isLoading: false,
  }),
}));

const NavigationWrapper = ({ initialPath = "/" }: { initialPath?: string }) => (
  <MemoryRouter initialEntries={[initialPath]}>
    <Navigation />
  </MemoryRouter>
);

describe("Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body styles
    document.body.style.overflow = "";
  });

  describe("Bottom navigation", () => {
    it("renders all navigation items", () => {
      renderWithProviders(<NavigationWrapper />);

      expect(screen.getByText("Trips")).toBeInTheDocument();
      expect(screen.getByText("Summary")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("shows active state for current route", () => {
      renderWithProviders(<NavigationWrapper initialPath="/summary" />);

      const summaryLink = screen.getByRole("link", { name: /summary/i });
      expect(summaryLink).toHaveClass("text-ctp-green");
    });

    it("renders quick add FAB with proper accessibility", () => {
      renderWithProviders(<NavigationWrapper />);

      const fabButton = screen.getByRole("button", { name: /quick add trip/i });
      expect(fabButton).toBeInTheDocument();
      expect(fabButton).toHaveClass(
        "bg-gradient-to-r",
        "from-ctp-blue",
        "to-ctp-sapphire",
      );
    });
  });

  describe("Quick Add Modal", () => {
    it("opens modal when FAB is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      const fabButton = screen.getByRole("button", { name: /quick add trip/i });
      await user.click(fabButton);

      // Check modal is open
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Quick Add Trip")).toBeInTheDocument();
      expect(screen.getByTestId("quick-add-trip-form")).toBeInTheDocument();
    });

    it("passes correct props to QuickAddTripForm in modal", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      await user.click(screen.getByRole("button", { name: /quick add trip/i }));

      const form = screen.getByTestId("quick-add-trip-form");
      expect(form).toHaveAttribute("data-mode", "modal");
      expect(form).toHaveAttribute("data-show-collapse-state", "false");
    });

    it("closes modal when close button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      // Open modal
      await user.click(screen.getByRole("button", { name: /quick add trip/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByRole("button", { name: /close modal/i });
      await user.click(closeButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes modal when backdrop is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      // Open modal
      await user.click(screen.getByRole("button", { name: /quick add trip/i }));
      const modal = screen.getByRole("dialog");

      // Click on backdrop (the modal overlay div)
      await user.click(modal);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("does not close modal when clicking inside modal content", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      // Open modal
      await user.click(screen.getByRole("button", { name: /quick add trip/i }));

      // Click inside modal content (not the backdrop)
      const modalContent = screen.getByText("Quick Add Trip");
      await user.click(modalContent);

      // Modal should still be open
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes modal when form triggers onSuccess", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      // Open modal
      await user.click(screen.getByRole("button", { name: /quick add trip/i }));

      // Trigger success from the form
      const successButton = screen.getByTestId("mock-success");
      await user.click(successButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes modal when form triggers onCancel", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      // Open modal
      await user.click(screen.getByRole("button", { name: /quick add trip/i }));

      // Trigger cancel from the form
      const cancelButton = screen.getByTestId("mock-cancel");
      await user.click(cancelButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Keyboard accessibility", () => {
    it("closes modal when Escape key is pressed", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      // Open modal
      await user.click(screen.getByRole("button", { name: /quick add trip/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Press Escape
      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("does not close modal with Escape when modal is not open", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      // Press Escape without modal open - should not cause any errors
      await user.keyboard("{Escape}");

      // No modal should be present
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("manages focus properly with modal", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      const fabButton = screen.getByRole("button", { name: /quick add trip/i });

      // FAB should be focusable
      await user.tab();
      // Navigate to FAB (may need multiple tabs depending on DOM order)
      while (document.activeElement !== fabButton && document.activeElement) {
        await user.tab();
        // Prevent infinite loop
        if (document.activeElement === document.body) break;
      }

      await user.keyboard("{Enter}");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Body scroll management", () => {
    it("prevents body scroll when modal is open", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      // Initially, body should have normal overflow
      expect(document.body.style.overflow).toBe("");

      // Open modal
      await user.click(screen.getByRole("button", { name: /quick add trip/i }));

      // Body scroll should be prevented
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("restores body scroll when modal is closed", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      // Open modal
      await user.click(screen.getByRole("button", { name: /quick add trip/i }));
      expect(document.body.style.overflow).toBe("hidden");

      // Close modal
      await user.click(screen.getByRole("button", { name: /close modal/i }));

      await waitFor(() => {
        expect(document.body.style.overflow).toBe("");
      });
    });

    it("restores body scroll when component is unmounted", async () => {
      const user = userEvent.setup();
      const { unmount } = renderWithProviders(<NavigationWrapper />);

      // Open modal
      await user.click(screen.getByRole("button", { name: /quick add trip/i }));
      expect(document.body.style.overflow).toBe("hidden");

      // Unmount component
      unmount();

      // Body scroll should be restored
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("Modal accessibility", () => {
    it("has proper ARIA attributes", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      await user.click(screen.getByRole("button", { name: /quick add trip/i }));

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");

      const title = screen.getByText("Quick Add Trip");
      expect(title).toHaveAttribute("id", "modal-title");
    });

    it("has accessible close button", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      await user.click(screen.getByRole("button", { name: /quick add trip/i }));

      const closeButton = screen.getByRole("button", { name: /close modal/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute("aria-label", "Close modal");
    });
  });

  describe("Responsive behavior", () => {
    it("positions modal correctly for mobile and desktop", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      await user.click(screen.getByRole("button", { name: /quick add trip/i }));

      const modal = screen.getByRole("dialog");
      expect(modal).toHaveClass("items-end", "md:items-center");

      const modalContent = modal.querySelector(".bg-ctp-base");
      expect(modalContent).toHaveClass("rounded-t-xl", "md:rounded-xl");
    });

    it("limits modal size appropriately", async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavigationWrapper />);

      await user.click(screen.getByRole("button", { name: /quick add trip/i }));

      const modalContent = screen
        .getByRole("dialog")
        .querySelector(".bg-ctp-base");
      expect(modalContent).toHaveClass("max-w-md", "max-h-[85vh]");
    });
  });

  describe("Route-based active states", () => {
    const routes = [
      { path: "/", expectedActive: "Trips" },
      { path: "/trips", expectedActive: "Trips" },
      { path: "/summary", expectedActive: "Summary" },
      { path: "/settings", expectedActive: "Settings" },
    ];

    routes.forEach(({ path, expectedActive }) => {
      it(`shows ${expectedActive} as active for route ${path}`, () => {
        renderWithProviders(<NavigationWrapper initialPath={path} />);

        const activeLink = screen.getByRole("link", {
          name: new RegExp(expectedActive, "i"),
        });
        // Check for active styling classes
        expect(activeLink).toHaveClass(/text-ctp-/);
      });
    });
  });

  describe("FloatingActionButton export", () => {
    it("exports FloatingActionButton component", async () => {
      // This test ensures the export is available
      const NavigationModule = await import("../Navigation");
      expect(NavigationModule.FloatingActionButton).toBeDefined();
    });
  });
});
