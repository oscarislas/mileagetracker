import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuickAddTrip from "../QuickAddTrip";
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

describe("QuickAddTrip", () => {
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

  it("renders collapsed initially with expand button", () => {
    renderWithProviders(<QuickAddTrip />);

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
    renderWithProviders(<QuickAddTrip />);

    const expandButton = screen.getByRole("button", {
      name: /quick add trip/i,
    });
    await user.click(expandButton);

    expect(screen.getByLabelText(/who did you visit/i)).toBeInTheDocument();
  });

  it("shows next button enabled when client name is entered", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickAddTrip />);

    // Click to expand
    const expandButton = screen.getByRole("button", {
      name: /quick add trip/i,
    });
    await user.click(expandButton);

    const clientInput = screen.getByLabelText(/who did you visit/i);
    const nextButton = screen.getByRole("button", { name: /next/i });

    expect(nextButton).toBeDisabled();

    await user.type(clientInput, "Test Client");
    expect(nextButton).not.toBeDisabled();
  });

  it("proceeds to details step when next is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickAddTrip />);

    // Step 1: Expand
    const expandButton = screen.getByRole("button", {
      name: /quick add trip/i,
    });
    await user.click(expandButton);

    // Step 2: Enter client and click next
    const clientInput = screen.getByLabelText(/who did you visit/i);
    await user.type(clientInput, "Test Client");

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    // Step 3: Check details step is shown
    expect(screen.getByLabelText(/miles/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByText("Test Client")).toBeInTheDocument();
  });

  it("validates miles input", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickAddTrip />);

    // Navigate to details step
    await user.click(screen.getByRole("button", { name: /quick add trip/i }));
    await user.type(screen.getByLabelText(/who did you visit/i), "Test Client");
    await user.click(screen.getByRole("button", { name: /next/i }));

    const addTripButton = screen.getByRole("button", { name: /add trip/i });
    expect(addTripButton).toBeDisabled();

    const milesInput = screen.getByLabelText(/miles/i);
    await user.type(milesInput, "10");

    expect(addTripButton).not.toBeDisabled();
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
    renderWithProviders(<QuickAddTrip />);

    // Navigate through the flow
    await user.click(screen.getByRole("button", { name: /quick add trip/i }));
    await user.type(screen.getByLabelText(/who did you visit/i), "Test Client");
    await user.click(screen.getByRole("button", { name: /next/i }));

    const milesInput = screen.getByLabelText(/miles/i);
    await user.type(milesInput, "100");

    const addTripButton = screen.getByRole("button", { name: /add trip/i });
    await user.click(addTripButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          client_name: "Test Client",
          miles: 100,
          trip_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
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

    renderWithProviders(<QuickAddTrip />);

    // Navigate to details step
    await user.click(screen.getByRole("button", { name: /quick add trip/i }));
    await user.type(screen.getByLabelText(/who did you visit/i), "Test Client");
    await user.click(screen.getByRole("button", { name: /next/i }));

    const addTripButton = screen.getByRole("button", { name: /add trip/i });
    expect(addTripButton).toBeDisabled();
    expect(addTripButton.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("resets form after successful submission", async () => {
    let onSuccessCallback: (() => void) | undefined;

    mockUseCreateTrip.mockReturnValue({
      mutate: vi.fn((_data, { onSuccess }) => {
        onSuccessCallback = onSuccess;
      }),
      isPending: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithProviders(<QuickAddTrip />);

    // Navigate through the flow
    await user.click(screen.getByRole("button", { name: /quick add trip/i }));
    await user.type(screen.getByLabelText(/who did you visit/i), "Test Client");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.type(screen.getByLabelText(/miles/i), "100");
    await user.click(screen.getByRole("button", { name: /add trip/i }));

    // Simulate successful submission
    if (onSuccessCallback) {
      onSuccessCallback();
    }

    await waitFor(() => {
      expect(screen.getByText(/trip added!/i)).toBeInTheDocument();
      expect(screen.getByText(/100 miles to test client/i)).toBeInTheDocument();
    });

    // Should reset to collapsed after timeout
    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /quick add trip/i }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("provides client suggestions when typing", async () => {
    mockUseClientSuggestions.mockReturnValue({
      data: {
        clients: [
          { id: 1, name: "Acme Corp", created_at: "2024-01-01T00:00:00Z" },
          { id: 2, name: "Beta Inc", created_at: "2024-01-01T00:00:00Z" },
          { id: 3, name: "Test Client", created_at: "2024-01-01T00:00:00Z" },
        ],
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    renderWithProviders(<QuickAddTrip />);

    await user.click(screen.getByRole("button", { name: /quick add trip/i }));
    const clientInput = screen.getByLabelText(/who did you visit/i);
    await user.type(clientInput, "Test");

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.getByText("Beta Inc")).toBeInTheDocument();
      expect(screen.getByText("Test Client")).toBeInTheDocument();
    });
  });

  it("handles decimal miles input correctly", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickAddTrip />);

    // Navigate to details step
    await user.click(screen.getByRole("button", { name: /quick add trip/i }));
    await user.type(screen.getByLabelText(/who did you visit/i), "Test Client");
    await user.click(screen.getByRole("button", { name: /next/i }));

    const milesInput = screen.getByLabelText(/miles/i);
    await user.type(milesInput, "125.5");

    expect(milesInput).toHaveValue(125.5);
  });

  it("allows navigation back to client step", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickAddTrip />);

    // Navigate to details step
    await user.click(screen.getByRole("button", { name: /quick add trip/i }));
    await user.type(screen.getByLabelText(/who did you visit/i), "Test Client");
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Click back
    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    // Should be back on client step
    expect(screen.getByLabelText(/who did you visit/i)).toBeInTheDocument();
  });

  it("has accessible labels and form structure", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickAddTrip />);

    // Navigate to details step to see all form elements
    await user.click(screen.getByRole("button", { name: /quick add trip/i }));
    await user.type(screen.getByLabelText(/who did you visit/i), "Test Client");
    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByLabelText(/miles/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add trip/i }),
    ).toBeInTheDocument();

    // Check that form elements have proper types
    const milesInput = screen.getByLabelText(/miles/i);
    const dateInput = screen.getByLabelText(/date/i);

    expect(milesInput).toHaveAttribute("type", "number");
    expect(dateInput).toHaveAttribute("type", "date");
  });

  it("defaults to today's local date, not UTC date", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickAddTrip />);

    // Navigate to details step to see the date input
    await user.click(screen.getByRole("button", { name: /quick add trip/i }));
    await user.type(screen.getByLabelText(/who did you visit/i), "Test Client");
    await user.click(screen.getByRole("button", { name: /next/i }));

    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;

    // Calculate expected local date
    const today = new Date();
    const expectedLocalDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // The date input should have today's local date as its value
    expect(dateInput.value).toBe(expectedLocalDate);

    // Verify it's not using UTC date (which could be different near timezone boundaries)
    const utcDate = today.toISOString().split("T")[0];
    if (utcDate !== expectedLocalDate) {
      expect(dateInput.value).not.toBe(utcDate);
    }
  });
});
