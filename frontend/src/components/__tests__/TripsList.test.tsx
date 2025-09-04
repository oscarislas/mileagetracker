import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Trip } from "../../types";
import TripsList from "../TripsList";
import { renderWithProviders } from "../../test/utils/testUtils";
import { mockTripsResponse } from "../../test/utils/mockData";

// Create mock functions that can be controlled in tests
const mockUseTrips = vi.fn();
const mockUseConnectionStatus = vi.fn();

// Mock TripItem component
vi.mock("../TripItem", () => ({
  default: ({ trip }: { trip: Trip }) => (
    <div data-testid={`trip-${trip.id}`} className="trip-item">
      <span>{trip.client_name}</span>
      <span>{trip.miles} miles</span>
      <button data-testid={`edit-${trip.id}`}>View Details</button>
    </div>
  ),
}));

// Mock LoadingSkeletons components - import the actual components by name
vi.mock("../LoadingSkeletons", () => ({
  TripListSkeleton: () => (
    <div data-testid="trip-list-skeleton">Loading trips...</div>
  ),
  TripsEmptyState: () => (
    <div data-testid="trips-empty-state">
      <div>No trips recorded yet</div>
      <div>Start tracking your business mileage</div>
      <div>Enter your client name</div>
    </div>
  ),
  ConnectionErrorState: ({ onRetry }: { onRetry?: () => void }) => (
    <div data-testid="connection-error-state">
      <div>Failed to Load Trips</div>
      <div>Cannot connect to the server</div>
      <div>
        Make sure the backend server is running on http://localhost:8080
      </div>
      {onRetry && <button onClick={onRetry}>Try Again</button>}
    </div>
  ),
}));

// Mock hooks with centralized mock functions
vi.mock("../../hooks/useTrips", () => ({
  useTrips: (page: number, limit: number, filters?: Record<string, unknown>) =>
    mockUseTrips(page, limit, filters),
}));

vi.mock("../../hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => mockUseConnectionStatus(),
}));

describe("TripsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default values
    mockUseTrips.mockReturnValue({
      data: mockTripsResponse,
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseConnectionStatus.mockReturnValue({
      data: { connected: true },
      isLoading: false,
    });
  });

  it("renders trip items when data is available", () => {
    renderWithProviders(<TripsList />);

    expect(screen.getByTestId("trips-list")).toBeInTheDocument();
    expect(screen.getByText("Recent Trips")).toBeInTheDocument();
    expect(screen.getByTestId("trip-1")).toBeInTheDocument();
    expect(screen.getByTestId("trip-2")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
    expect(screen.getByText("125.5 miles")).toBeInTheDocument();
    expect(screen.getByText("75 miles")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    mockUseTrips.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    renderWithProviders(<TripsList />);

    expect(screen.getByText("Recent Trips")).toBeInTheDocument();
    expect(screen.getByTestId("trip-list-skeleton")).toBeInTheDocument();
    expect(screen.getByText("Loading trips...")).toBeInTheDocument();
  });

  it("displays error state with connection status", () => {
    const mockError = new Error("Cannot connect to server");
    mockUseTrips.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
    });
    mockUseConnectionStatus.mockReturnValue({
      data: { connected: false },
      isLoading: false,
    });

    renderWithProviders(<TripsList />);

    expect(screen.getByText("Recent Trips")).toBeInTheDocument();
    expect(screen.getByText("Disconnected")).toBeInTheDocument();
    expect(screen.getByTestId("connection-error-state")).toBeInTheDocument();
    expect(screen.getByText("Failed to Load Trips")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Make sure the backend server is running on http://localhost:8080",
      ),
    ).toBeInTheDocument();
  });

  it("displays empty state when no trips exist", () => {
    mockUseTrips.mockReturnValue({
      data: { trips: [], total: 0, page: 1, limit: 10, total_pages: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<TripsList />);

    expect(screen.getByTestId("trips-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No trips recorded yet")).toBeInTheDocument();
    expect(
      screen.getByText("Start tracking your business mileage"),
    ).toBeInTheDocument();
    expect(screen.getByText("Enter your client name")).toBeInTheDocument();
  });

  it("shows pagination when multiple pages exist", () => {
    mockUseTrips.mockReturnValue({
      data: { ...mockTripsResponse, total: 25, total_pages: 3 },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<TripsList />);

    expect(
      screen.getByRole("button", { name: /previous/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();

    // Check for page numbers
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
  });

  it("handles pagination navigation", async () => {
    const user = userEvent.setup();

    // Start on page 1 with multiple pages
    mockUseTrips.mockReturnValue({
      data: { ...mockTripsResponse, total: 25, total_pages: 3, page: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<TripsList />);

    const nextButton = screen.getByRole("button", { name: /next/i });
    const prevButton = screen.getByRole("button", { name: /previous/i });

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    await user.click(nextButton);
    // The component will re-render with new data, triggering useTrips with page 2
  });

  it("disables pagination buttons at boundaries", () => {
    // Test first page - previous button should be disabled
    mockUseTrips.mockReturnValue({
      data: { ...mockTripsResponse, total: 25, total_pages: 3, page: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<TripsList />);

    const prevButton = screen.getByRole("button", { name: /previous/i });
    expect(prevButton).toBeDisabled();

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeEnabled();
  });

  it("displays total count information", () => {
    renderWithProviders(<TripsList />);

    expect(screen.getByText("2 total")).toBeInTheDocument();
  });

  it("shows enhanced trip items", () => {
    renderWithProviders(<TripsList enhanced={true} />);

    // TripItem should be rendered for each trip
    expect(screen.getByTestId("trip-1")).toBeInTheDocument();
    expect(screen.getByTestId("trip-2")).toBeInTheDocument();

    // Should have "View Details" buttons instead of edit/delete
    expect(screen.getAllByText("View Details")).toHaveLength(2);
  });

  it("handles filters correctly", () => {
    const filters = {
      searchQuery: "test",
      clientFilter: "Acme Corp",
      dateRange: "month" as const,
      milesRange: "100+" as const,
    };

    renderWithProviders(<TripsList filters={filters} />);

    // Verify that useTrips is called with filters
    expect(mockUseTrips).toHaveBeenCalledWith(1, 10, filters);
  });

  it("displays no results when filters return empty", () => {
    const filters = {
      searchQuery: "nonexistent",
      dateRange: "" as const,
      clientFilter: "",
      milesRange: "" as const,
    };

    mockUseTrips.mockReturnValue({
      data: { trips: [], total: 0, page: 1, limit: 10, total_pages: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<TripsList filters={filters} />);

    expect(screen.getByText("No trips match your filters")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Try adjusting your search criteria or clear filters to see all trips",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Search: "nonexistent"')).toBeInTheDocument();
  });

  it("can be configured with custom limit", () => {
    renderWithProviders(<TripsList limit={5} />);

    expect(mockUseTrips).toHaveBeenCalledWith(1, 5, undefined);
  });

  it("can disable pagination", () => {
    mockUseTrips.mockReturnValue({
      data: { ...mockTripsResponse, total: 25, total_pages: 3 },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<TripsList showPagination={false} />);

    expect(
      screen.queryByRole("button", { name: /previous/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /next/i }),
    ).not.toBeInTheDocument();
  });

  it("shows connection status in error state", () => {
    mockUseTrips.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
    });

    mockUseConnectionStatus.mockReturnValue({
      data: { connected: true },
      isLoading: false,
    });

    renderWithProviders(<TripsList />);

    expect(screen.getByText("Connected")).toBeInTheDocument();

    // Test disconnected state
    mockUseConnectionStatus.mockReturnValue({
      data: { connected: false },
      isLoading: false,
    });

    const { rerender } = renderWithProviders(<TripsList />);
    rerender(<TripsList />);

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  it("handles loading trips with no data gracefully", () => {
    mockUseTrips.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<TripsList />);

    expect(screen.getByText("Recent Trips")).toBeInTheDocument();
    expect(screen.getByText("Loading trips...")).toBeInTheDocument();
  });
});
