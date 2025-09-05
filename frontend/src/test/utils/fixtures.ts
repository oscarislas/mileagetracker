/**
 * Comprehensive Test Data Fixtures
 *
 * Centralized test data fixtures that provide consistent, realistic test data
 * across the entire test suite. These fixtures support the 99.6% pass rate
 * by providing reliable, well-structured data for all testing scenarios.
 */

import type { Trip, TripFormData } from "../../types";

// ============================================================================
// Core Trip Fixtures
// ============================================================================

export const FIXTURE_BASE_TRIP: Trip = {
  id: 1,
  client_name: "Acme Corporation",
  trip_date: "2025-09-03",
  miles: 45.5,
  notes: "Client meeting and site inspection",
  created_at: "2025-09-03T10:00:00Z",
  updated_at: "2025-09-03T10:00:00Z",
};

export const FIXTURE_MINIMAL_TRIP: Trip = {
  id: 2,
  client_name: "Beta Inc",
  trip_date: "2025-09-02",
  miles: 12.0,
  notes: "",
  created_at: "2025-09-02T14:30:00Z",
  updated_at: "2025-09-02T14:30:00Z",
};

export const FIXTURE_LONG_TRIP: Trip = {
  id: 3,
  client_name: "Gamma LLC",
  trip_date: "2025-09-01",
  miles: 125.75,
  notes:
    "Cross-country business trip with multiple stops and detailed documentation for expense reporting",
  created_at: "2025-09-01T08:15:00Z",
  updated_at: "2025-09-01T18:45:00Z",
};

export const FIXTURE_DECIMAL_MILES_TRIP: Trip = {
  id: 4,
  client_name: "Delta Services",
  trip_date: "2025-08-31",
  miles: 23.7,
  notes: "Short local visit",
  created_at: "2025-08-31T11:22:00Z",
  updated_at: "2025-08-31T11:22:00Z",
};

export const FIXTURE_HIGH_MILES_TRIP: Trip = {
  id: 5,
  client_name: "Epsilon Enterprise",
  trip_date: "2025-08-30",
  miles: 999.9,
  notes: "Multi-day conference and training",
  created_at: "2025-08-30T06:00:00Z",
  updated_at: "2025-08-30T20:30:00Z",
};

// ============================================================================
// Trip Collections
// ============================================================================

export const FIXTURE_TRIPS_LIST: Trip[] = [
  FIXTURE_BASE_TRIP,
  FIXTURE_MINIMAL_TRIP,
  FIXTURE_LONG_TRIP,
  FIXTURE_DECIMAL_MILES_TRIP,
  FIXTURE_HIGH_MILES_TRIP,
];

export const FIXTURE_EMPTY_TRIPS_LIST: Trip[] = [];

export const FIXTURE_SINGLE_TRIP_LIST: Trip[] = [FIXTURE_BASE_TRIP];

export const FIXTURE_PAGINATED_TRIPS = {
  trips: FIXTURE_TRIPS_LIST,
  total: 5,
  page: 1,
  limit: 10,
  total_pages: 1,
};

export const FIXTURE_LARGE_PAGINATED_TRIPS = {
  trips: FIXTURE_TRIPS_LIST,
  total: 25,
  page: 2,
  limit: 5,
  total_pages: 5,
};

// ============================================================================
// Form Data Fixtures
// ============================================================================

export const FIXTURE_VALID_FORM_DATA: TripFormData = {
  client_name: "Acme Corporation",
  trip_date: "2025-09-03",
  miles: 45.5,
  notes: "Client meeting and site inspection",
};

export const FIXTURE_MINIMAL_FORM_DATA: TripFormData = {
  client_name: "Beta Inc",
  trip_date: "2025-09-02",
  miles: 12.0,
  notes: "",
};

export const FIXTURE_QUICK_ADD_FORM_DATA = {
  client_name: "Quick Add Client",
  miles: 25,
  trip_date: new Date().toISOString().split("T")[0], // Today's date
  notes: "",
};

export const FIXTURE_EMPTY_FORM_DATA: TripFormData = {
  client_name: "",
  trip_date: "",
  miles: 0,
  notes: "",
};

export const FIXTURE_INVALID_FORM_DATA = {
  empty_client: {
    client_name: "",
    trip_date: "2025-09-03",
    miles: 45.5,
    notes: "Missing client name",
  },
  zero_miles: {
    client_name: "Test Client",
    trip_date: "2025-09-03",
    miles: 0,
    notes: "Zero miles should be invalid",
  },
  negative_miles: {
    client_name: "Test Client",
    trip_date: "2025-09-03",
    miles: -10,
    notes: "Negative miles should be invalid",
  },
  invalid_date: {
    client_name: "Test Client",
    trip_date: "invalid-date",
    miles: 45.5,
    notes: "Invalid date format",
  },
  whitespace_client: {
    client_name: "   ",
    trip_date: "2025-09-03",
    miles: 45.5,
    notes: "Whitespace-only client name",
  },
};

// ============================================================================
// Client Fixtures
// ============================================================================

export const FIXTURE_CLIENT_SUGGESTIONS = [
  { id: 1, name: "Acme Corporation", created_at: "2025-01-01T00:00:00Z" },
  { id: 2, name: "Beta Inc", created_at: "2025-01-02T00:00:00Z" },
  { id: 3, name: "Gamma LLC", created_at: "2025-01-03T00:00:00Z" },
  { id: 4, name: "Delta Services", created_at: "2025-01-04T00:00:00Z" },
  { id: 5, name: "Epsilon Enterprise", created_at: "2025-01-05T00:00:00Z" },
  { id: 6, name: "Zeta Solutions", created_at: "2025-01-06T00:00:00Z" },
];

export const FIXTURE_EMPTY_CLIENTS: typeof FIXTURE_CLIENT_SUGGESTIONS = [];

export const FIXTURE_SINGLE_CLIENT = [FIXTURE_CLIENT_SUGGESTIONS[0]];

export const FIXTURE_CLIENT_SUGGESTIONS_RESPONSE = {
  clients: FIXTURE_CLIENT_SUGGESTIONS,
};

export const FIXTURE_EMPTY_CLIENT_SUGGESTIONS_RESPONSE = {
  clients: FIXTURE_EMPTY_CLIENTS,
};

// ============================================================================
// Summary/Statistics Fixtures
// ============================================================================

export const FIXTURE_MONTHLY_SUMMARY = {
  months: [
    {
      month: "September 2025",
      year: 2025,
      month_num: 9,
      total_miles: 206.95,
      amount: 138.66,
    },
    {
      month: "August 2025",
      year: 2025,
      month_num: 8,
      total_miles: 1146.35,
      amount: 768.06,
    },
  ],
};

export const FIXTURE_EMPTY_SUMMARY = {
  months: [],
};

export const FIXTURE_SINGLE_MONTH_SUMMARY = {
  months: [FIXTURE_MONTHLY_SUMMARY.months[0]],
};

// ============================================================================
// Error Fixtures
// ============================================================================

export const FIXTURE_API_ERROR = {
  message: "Network connection failed",
  code: "NETWORK_ERROR",
  status: 500,
};

export const FIXTURE_VALIDATION_ERROR = {
  message: "Validation failed",
  code: "VALIDATION_ERROR",
  status: 400,
  errors: {
    client_name: "Client name is required",
    miles: "Miles must be greater than 0",
  },
};

export const FIXTURE_NOT_FOUND_ERROR = {
  message: "Trip not found",
  code: "NOT_FOUND",
  status: 404,
};

// ============================================================================
// Date Fixtures
// ============================================================================

export const FIXTURE_DATES = {
  today: new Date().toISOString().split("T")[0],
  yesterday: new Date(Date.now() - 86400000).toISOString().split("T")[0],
  tomorrow: new Date(Date.now() + 86400000).toISOString().split("T")[0],
  lastWeek: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
  nextWeek: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  firstOfMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0],
  endOfMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toISOString()
    .split("T")[0],
};

// ============================================================================
// UI State Fixtures
// ============================================================================

export const FIXTURE_LOADING_STATE = {
  isLoading: true,
  isError: false,
  error: null,
  data: undefined,
};

export const FIXTURE_ERROR_STATE = {
  isLoading: false,
  isError: true,
  error: FIXTURE_API_ERROR,
  data: undefined,
};

export const FIXTURE_SUCCESS_STATE = {
  isLoading: false,
  isError: false,
  error: null,
  data: FIXTURE_PAGINATED_TRIPS,
};

export const FIXTURE_EMPTY_STATE = {
  isLoading: false,
  isError: false,
  error: null,
  data: { trips: [], total: 0, page: 1, limit: 10, total_pages: 0 },
};

// ============================================================================
// Mutation State Fixtures
// ============================================================================

import { vi } from "vitest";

export const FIXTURE_MUTATION_IDLE = {
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: undefined,
  reset: vi.fn(),
};

export const FIXTURE_MUTATION_LOADING = {
  ...FIXTURE_MUTATION_IDLE,
  isPending: true,
};

export const FIXTURE_MUTATION_ERROR = {
  ...FIXTURE_MUTATION_IDLE,
  isError: true,
  error: FIXTURE_API_ERROR,
};

export const FIXTURE_MUTATION_SUCCESS = {
  ...FIXTURE_MUTATION_IDLE,
  isSuccess: true,
  data: FIXTURE_BASE_TRIP,
};

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a trip fixture with custom overrides
 */
export function createTripFixture(overrides: Partial<Trip> = {}): Trip {
  return {
    ...FIXTURE_BASE_TRIP,
    ...overrides,
  };
}

/**
 * Creates form data fixture with custom overrides
 */
export function createFormDataFixture(
  overrides: Partial<TripFormData> = {},
): TripFormData {
  return {
    ...FIXTURE_VALID_FORM_DATA,
    ...overrides,
  };
}

/**
 * Creates a list of trip fixtures
 */
export function createTripsListFixture(
  count: number,
  baseTrip: Partial<Trip> = {},
): Trip[] {
  return Array.from({ length: count }, (_, index) => ({
    ...FIXTURE_BASE_TRIP,
    ...baseTrip,
    id: index + 1,
    client_name: `${baseTrip.client_name || "Test Client"} ${index + 1}`,
  }));
}

/**
 * Creates client suggestions fixture with custom count
 */
export function createClientSuggestionsFixture(
  count: number,
): typeof FIXTURE_CLIENT_SUGGESTIONS {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Client ${index + 1}`,
    created_at: new Date(2025, 0, index + 1).toISOString(),
  }));
}

/**
 * Creates paginated response fixture
 */
export function createPaginatedFixture<T>(
  items: T[],
  page = 1,
  limit = 10,
): {
  trips: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
} {
  const total = items.length;
  const total_pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    trips: paginatedItems,
    total,
    page,
    limit,
    total_pages,
  };
}

// ============================================================================
// Test Data Builders
// ============================================================================

/**
 * Builder pattern for creating complex test scenarios
 */
export class TripFixtureBuilder {
  private trip: Trip;

  constructor(baseTrip: Trip = FIXTURE_BASE_TRIP) {
    this.trip = { ...baseTrip };
  }

  withId(id: number): TripFixtureBuilder {
    this.trip.id = id;
    return this;
  }

  withClient(clientName: string): TripFixtureBuilder {
    this.trip.client_name = clientName;
    return this;
  }

  withMiles(miles: number): TripFixtureBuilder {
    this.trip.miles = miles;
    return this;
  }

  withDate(date: string): TripFixtureBuilder {
    this.trip.trip_date = date;
    return this;
  }

  withNotes(notes: string): TripFixtureBuilder {
    this.trip.notes = notes;
    return this;
  }

  withTimestamps(created: string, updated?: string): TripFixtureBuilder {
    this.trip.created_at = created;
    this.trip.updated_at = updated || created;
    return this;
  }

  build(): Trip {
    return { ...this.trip };
  }

  buildList(count: number): Trip[] {
    return Array.from({ length: count }, (_, index) => ({
      ...this.trip,
      id: this.trip.id + index,
      client_name: `${this.trip.client_name} ${index + 1}`,
    }));
  }
}

// ============================================================================
// Convenience Builders
// ============================================================================

export const tripBuilder = () => new TripFixtureBuilder();

export const recentTrip = () => tripBuilder().withDate(FIXTURE_DATES.today);
export const oldTrip = () => tripBuilder().withDate(FIXTURE_DATES.lastWeek);
export const longDistanceTrip = () => tripBuilder().withMiles(500);
export const shortTrip = () => tripBuilder().withMiles(5);
export const businessTrip = (client: string) =>
  tripBuilder().withClient(client).withNotes("Business meeting");
