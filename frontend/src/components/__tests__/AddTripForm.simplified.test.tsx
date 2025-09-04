import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AddTripForm from "../AddTripForm";

// Simple mocks for the essential functionality
vi.mock("../../hooks/useTrips", () => ({
  useCreateTrip: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useClients", () => ({
  useClientSuggestions: () => ({
    data: { clients: [] },
  }),
}));

vi.mock("../../hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => ({
    data: { connected: true },
  }),
}));

vi.mock("../../utils/errorUtils", () => ({
  getApiErrorMessage: () => "Test error message",
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
};

describe("AddTripForm - Core Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all required form fields", () => {
    renderWithQueryClient(<AddTripForm />);

    expect(
      screen.getByRole("textbox", { name: /client name/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/trip date/i)).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: /miles driven/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /notes/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add trip/i }),
    ).toBeInTheDocument();
  });

  it("starts with empty date to encourage user selection", () => {
    renderWithQueryClient(<AddTripForm />);

    const dateInput = screen.getByLabelText(/trip date/i) as HTMLInputElement;
    expect(dateInput.value).toBe("");

    // Should show helpful hint text
    expect(
      screen.getByText(/select the date when your trip occurred/i),
    ).toBeInTheDocument();
  });

  it("validates required client name", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddTripForm />);

    const submitButton = screen.getByRole("button", { name: /add trip/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Client name is required")).toBeInTheDocument();
    });
  });

  it("enforces client name max length in HTML", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddTripForm />);

    const clientNameInput = screen.getByRole("textbox", {
      name: /client name/i,
    }) as HTMLInputElement;

    // Try to type 31 characters, but maxlength should limit to 30
    await user.type(clientNameInput, "A".repeat(31));

    expect(clientNameInput.value).toHaveLength(30);
    expect(clientNameInput.maxLength).toBe(30);
  });

  it("validates miles must be greater than zero", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddTripForm />);

    const clientNameInput = screen.getByRole("textbox", {
      name: /client name/i,
    });
    const milesInput = screen.getByRole("spinbutton", {
      name: /miles driven/i,
    });

    await user.type(clientNameInput, "Test Client");
    await user.clear(milesInput);
    await user.type(milesInput, "0");

    const submitButton = screen.getByRole("button", { name: /add trip/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Miles must be greater than 0"),
      ).toBeInTheDocument();
    });
  });

  it("accepts valid form input", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddTripForm />);

    const clientNameInput = screen.getByRole("textbox", {
      name: /client name/i,
    });
    const milesInput = screen.getByRole("spinbutton", {
      name: /miles driven/i,
    });
    const notesInput = screen.getByRole("textbox", { name: /notes/i });

    await user.type(clientNameInput, "Acme Corp");
    await user.clear(milesInput);
    await user.type(milesInput, "125.5");
    await user.type(notesInput, "Client meeting");

    expect(clientNameInput).toHaveValue("Acme Corp");
    expect(milesInput).toHaveValue(125.5);
    expect(notesInput).toHaveValue("Client meeting");
  });

  it("can be collapsed and expanded", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddTripForm />);

    // Should be expanded by default
    expect(
      screen.getByRole("textbox", { name: /client name/i }),
    ).toBeInTheDocument();

    // Click collapse button
    const collapseButton = screen.getByRole("button", {
      name: /collapse form/i,
    });
    await user.click(collapseButton);

    // Should show collapsed state
    expect(
      screen.getByRole("button", { name: /add new trip/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /client name/i }),
    ).not.toBeInTheDocument();

    // Click to expand
    const expandButton = screen.getByRole("button", { name: /add new trip/i });
    await user.click(expandButton);

    // Should be expanded again
    expect(
      screen.getByRole("textbox", { name: /client name/i }),
    ).toBeInTheDocument();
  });

  it("displays connection status", () => {
    renderWithQueryClient(<AddTripForm />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("handles decimal miles input correctly", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddTripForm />);

    const milesInput = screen.getByRole("spinbutton", {
      name: /miles driven/i,
    });

    await user.clear(milesInput);
    await user.type(milesInput, "123.45");

    expect(milesInput).toHaveValue(123.45);
  });
});
