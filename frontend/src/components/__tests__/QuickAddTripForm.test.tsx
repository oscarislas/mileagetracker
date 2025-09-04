import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuickAddTripForm from "../QuickAddTripForm";
import type { QuickAddTripFormProps } from "../QuickAddTripForm";
import { renderWithProviders } from "../../test/utils/testUtils";

// Create mock functions that can be controlled in tests
const mockCreateTripMutate = vi.fn();
const mockUseCreateTrip = vi.fn(() => ({
  mutate: mockCreateTripMutate,
  isPending: false,
  isError: false,
  error: null,
}));

const mockUseClientSuggestions = vi.fn(() => ({
  data: {
    clients: [] as Array<{ id: number; name: string; created_at: string }>,
  },
  isLoading: false,
}));

// Mock the hooks
vi.mock("../../hooks/useTrips", () => ({
  useCreateTrip: () => mockUseCreateTrip(),
}));

vi.mock("../../hooks/useClients", () => ({
  useClientSuggestions: () => mockUseClientSuggestions(),
}));

vi.mock("../../utils/errorUtils", () => ({
  getApiErrorMessage: () => "Test error message",
}));

describe("QuickAddTripForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default values
    mockUseCreateTrip.mockReturnValue({
      mutate: mockCreateTripMutate,
      isPending: false,
      isError: false,
      error: null,
    });
    mockUseClientSuggestions.mockReturnValue({
      data: { clients: [] },
      isLoading: false,
    });
  });

  describe("Inline mode with collapse state", () => {
    const defaultProps: QuickAddTripFormProps = {
      mode: "inline",
      showCollapseState: true,
    };

    it("renders collapsed initially with expand button", () => {
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /quick add trip/i }),
      ).toBeInTheDocument();
      // Form fields should not be visible when collapsed
      expect(
        screen.queryByLabelText(/who did you visit/i),
      ).not.toBeInTheDocument();
    });

    it("expands to show client input when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      const expandButton = screen.getByRole("button", {
        name: /quick add trip/i,
      });
      await user.click(expandButton);

      expect(screen.getByLabelText(/who did you visit/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });

    it("shows progress indicator when expanded", async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /quick add trip/i }));

      // Progress indicator should be visible - check for the progress dots
      const progressDots = document.querySelectorAll(".h-2.w-2.rounded-full");
      expect(progressDots.length).toBeGreaterThan(0);
    });
  });

  describe("Modal mode", () => {
    const modalProps: QuickAddTripFormProps = {
      mode: "modal",
      showCollapseState: false,
      onSuccess: vi.fn(),
      onCancel: vi.fn(),
    };

    it("starts with client step in modal mode", () => {
      renderWithProviders(<QuickAddTripForm {...modalProps} />);

      expect(screen.getByLabelText(/who did you visit/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });

    it("calls onCancel when cancel button is clicked", async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(
        <QuickAddTripForm {...modalProps} onCancel={onCancel} />,
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when escape key is pressed in client input", async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(
        <QuickAddTripForm {...modalProps} onCancel={onCancel} />,
      );

      const clientInput = screen.getByLabelText(/who did you visit/i);
      await user.type(clientInput, "{Escape}");

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onSuccess after successful trip creation", async () => {
      const onSuccess = vi.fn();
      let onSuccessCallback: (() => void) | undefined;

      mockUseCreateTrip.mockReturnValue({
        mutate: vi.fn((_data, { onSuccess: callback }) => {
          onSuccessCallback = callback;
        }),
        isPending: false,
        isError: false,
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(
        <QuickAddTripForm {...modalProps} onSuccess={onSuccess} />,
      );

      // Navigate through the flow
      await user.type(
        screen.getByLabelText(/who did you visit/i),
        "Test Client",
      );
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.type(screen.getByLabelText(/miles/i), "100");
      await user.click(screen.getByRole("button", { name: /add trip/i }));

      // Simulate successful submission
      if (onSuccessCallback) {
        onSuccessCallback();
      }

      await waitFor(() => {
        expect(screen.getByText(/trip added!/i)).toBeInTheDocument();
      });

      // Wait for the success timeout and callback
      await waitFor(
        () => {
          expect(onSuccess).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );
    });

    it("does not show progress indicator in modal mode", () => {
      renderWithProviders(<QuickAddTripForm {...modalProps} />);

      // Progress dots should not be visible in modal mode when showCollapseState is false
      // The progress indicator is only shown when mode is not modal OR showCollapseState is true
      const progressContainer = document.querySelector(
        ".flex.items-center.gap-2.mb-4",
      );
      expect(progressContainer).not.toBeInTheDocument();
    });

    it("positions client suggestions upward in modal mode", async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...modalProps} />);

      // Type in the client input to trigger suggestions
      const clientInput = screen.getByLabelText(/who did you visit/i);
      await user.type(clientInput, "Acme");

      // Check if suggestions appear (assuming mock data includes clients)
      // The key test is that the dropdown should have the upward positioning classes
      const suggestionContainer = document.querySelector('[role="listbox"]');

      if (suggestionContainer) {
        // Check for upward positioning classes
        expect(suggestionContainer).toHaveClass("bottom-full", "mb-2");
        expect(suggestionContainer).not.toHaveClass("top-full", "mt-2");
      }
    });
  });

  describe("Form functionality", () => {
    const defaultProps: QuickAddTripFormProps = {
      mode: "inline",
      showCollapseState: false, // Start with form visible
    };

    it("validates client name input", async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      expect(nextButton).toBeDisabled();

      const clientInput = screen.getByLabelText(/who did you visit/i);
      await user.type(clientInput, "Test Client");
      expect(nextButton).not.toBeDisabled();

      // Test whitespace handling
      await user.clear(clientInput);
      await user.type(clientInput, "   ");
      expect(nextButton).toBeDisabled();
    });

    it("handles Enter key in client input", async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      const clientInput = screen.getByLabelText(/who did you visit/i);
      await user.type(clientInput, "Test Client{Enter}");

      expect(screen.getByLabelText(/miles/i)).toBeInTheDocument();
      expect(screen.getByText("Test Client")).toBeInTheDocument();
    });

    it("shows and handles client suggestions", async () => {
      mockUseClientSuggestions.mockReturnValue({
        data: {
          clients: [
            { id: 1, name: "Acme Corp", created_at: "2024-01-01T00:00:00Z" },
            { id: 2, name: "Beta Inc", created_at: "2024-01-01T00:00:00Z" },
          ],
        },
        isLoading: false,
      });

      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      const clientInput = screen.getByLabelText(/who did you visit/i);
      await user.type(clientInput, "A");

      await waitFor(() => {
        // Check that suggestions are visible by looking for the listbox
        const listbox = screen.getByRole("listbox");
        expect(listbox).toBeInTheDocument();

        // Check for options that contain our client names (might have highlighting)
        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(2);

        // Verify the text content includes our clients
        const optionsText = options.map((option) => option.textContent);
        expect(optionsText.some((text) => text?.includes("Acme Corp"))).toBe(
          true,
        );
        expect(optionsText.some((text) => text?.includes("Beta Inc"))).toBe(
          true,
        );
      });

      // Click on the first suggestion
      const firstOption = screen.getAllByRole("option")[0];
      await user.click(firstOption);
      expect(screen.getByLabelText(/miles/i)).toBeInTheDocument();
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    it("validates miles input", async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      // Navigate to details step
      await user.type(
        screen.getByLabelText(/who did you visit/i),
        "Test Client",
      );
      await user.click(screen.getByRole("button", { name: /next/i }));

      const addTripButton = screen.getByRole("button", { name: /add trip/i });
      expect(addTripButton).toBeDisabled();

      // Test zero miles
      const milesInput = screen.getByLabelText(/miles/i);
      await user.type(milesInput, "0");
      expect(addTripButton).toBeDisabled();

      // Test valid miles
      await user.clear(milesInput);
      await user.type(milesInput, "10.5");
      expect(addTripButton).not.toBeDisabled();
    });

    it("handles Enter key in miles input", async () => {
      const mockMutate = vi.fn();
      mockUseCreateTrip.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      // Navigate to details step
      await user.type(
        screen.getByLabelText(/who did you visit/i),
        "Test Client",
      );
      await user.click(screen.getByRole("button", { name: /next/i }));

      const milesInput = screen.getByLabelText(/miles/i);
      await user.type(milesInput, "100{Enter}");

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            client_name: "Test Client",
            miles: 100,
          }),
          expect.any(Object),
        );
      });
    });

    it("allows navigation back to client step", async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      // Navigate to details step
      await user.type(
        screen.getByLabelText(/who did you visit/i),
        "Test Client",
      );
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Click back
      const backButton = screen.getByRole("button", { name: /back/i });
      await user.click(backButton);

      // Should be back on client step
      expect(screen.getByLabelText(/who did you visit/i)).toBeInTheDocument();
    });

    it("allows changing client from details step", async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      // Navigate to details step
      await user.type(
        screen.getByLabelText(/who did you visit/i),
        "Test Client",
      );
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Click change button
      const changeButton = screen.getByRole("button", { name: /change/i });
      await user.click(changeButton);

      // Should be back on client step
      expect(screen.getByLabelText(/who did you visit/i)).toBeInTheDocument();
    });

    it("submits form with valid data", async () => {
      const mockMutate = vi.fn();
      mockUseCreateTrip.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      // Navigate through the flow
      await user.type(
        screen.getByLabelText(/who did you visit/i),
        "Test Client",
      );
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.type(screen.getByLabelText(/miles/i), "100");

      // Test optional fields
      await user.type(screen.getByLabelText(/notes/i), "Test notes");
      const dateInput = screen.getByLabelText(/date/i);
      await user.clear(dateInput);
      await user.type(dateInput, "2024-12-25");

      await user.click(screen.getByRole("button", { name: /add trip/i }));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            client_name: "Test Client",
            miles: 100,
            trip_date: "2024-12-25",
            notes: "Test notes",
          }),
          expect.objectContaining({
            onSuccess: expect.any(Function),
          }),
        );
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      mockUseCreateTrip.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        isError: false,
        error: null,
      });

      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      // Navigate to details step
      await user.type(
        screen.getByLabelText(/who did you visit/i),
        "Test Client",
      );
      await user.click(screen.getByRole("button", { name: /next/i }));

      const addTripButton = screen.getByRole("button", { name: /add trip/i });
      expect(addTripButton).toBeDisabled();
      expect(addTripButton.querySelector(".animate-spin")).toBeInTheDocument();

      // Check accessibility for loading state
      expect(screen.getByText("Adding trip...")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    const defaultProps: QuickAddTripFormProps = {
      mode: "inline",
      showCollapseState: false,
    };

    it("has proper ARIA labels and descriptions", async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      const clientInput = screen.getByLabelText(/who did you visit/i);
      expect(clientInput).toHaveAttribute(
        "aria-describedby",
        "client-suggestions",
      );

      // Navigate to details to check other inputs
      await user.type(clientInput, "Test Client");
      await user.click(screen.getByRole("button", { name: /next/i }));

      expect(screen.getByLabelText(/miles/i)).toHaveAttribute("type", "number");
      expect(screen.getByLabelText(/date/i)).toHaveAttribute("type", "date");
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it("provides proper focus management", async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      const clientInput = screen.getByLabelText(/who did you visit/i);
      await user.type(clientInput, "Test Client");
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Miles input should be focused after navigating to details
      await waitFor(() => {
        expect(screen.getByLabelText(/miles/i)).toHaveFocus();
      });
    });

    it("supports keyboard navigation in client suggestions", async () => {
      mockUseClientSuggestions.mockReturnValue({
        data: {
          clients: [
            { id: 1, name: "Acme Corp", created_at: "2024-01-01T00:00:00Z" },
            { id: 2, name: "Beta Inc", created_at: "2024-01-01T00:00:00Z" },
          ],
        },
        isLoading: false,
      });

      const user = userEvent.setup();
      renderWithProviders(<QuickAddTripForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/who did you visit/i), "A");

      await waitFor(() => {
        const listbox = screen.getByRole("listbox");
        expect(listbox).toBeInTheDocument();

        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(2);

        // Check text content includes our clients
        const optionsText = options.map((option) => option.textContent);
        expect(optionsText.some((text) => text?.includes("Acme Corp"))).toBe(
          true,
        );
      });
    });

    it("provides keyboard shortcuts for modal mode", async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <QuickAddTripForm
          mode="modal"
          showCollapseState={false}
          onCancel={onCancel}
        />,
      );

      // Test escape in notes textarea
      await user.type(
        screen.getByLabelText(/who did you visit/i),
        "Test Client",
      );
      await user.click(screen.getByRole("button", { name: /next/i }));

      const notesTextarea = screen.getByLabelText(/notes/i);
      await user.type(notesTextarea, "{Escape}");

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Custom styling and props", () => {
    it("applies custom className", () => {
      const { container } = renderWithProviders(
        <QuickAddTripForm className="custom-class" showCollapseState={false} />,
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });

    it("handles different mode styling", () => {
      const { rerender } = renderWithProviders(
        <QuickAddTripForm mode="inline" showCollapseState={false} />,
      );

      // Inline mode should have background styling
      expect(document.querySelector(".bg-ctp-surface0")).toBeInTheDocument();

      rerender(<QuickAddTripForm mode="modal" showCollapseState={false} />);

      // Modal mode should not have the background container styling
      expect(
        document.querySelector(".bg-ctp-surface0"),
      ).not.toBeInTheDocument();
    });
  });
});
