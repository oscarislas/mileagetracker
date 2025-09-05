// API Types
export interface Trip {
  id: number;
  client_id?: number;
  client_name: string;
  trip_date: string; // YYYY-MM-DD
  miles: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTripRequest extends Record<string, unknown> {
  client_name: string;
  trip_date: string; // YYYY-MM-DD
  miles: number;
  notes: string;
}

export interface UpdateTripRequest extends Record<string, unknown> {
  client_name: string;
  trip_date: string; // YYYY-MM-DD
  miles: number;
  notes: string;
}

export interface TripsResponse {
  trips: Trip[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface MonthlySummary {
  month: string; // "January 2025"
  year: number;
  month_num: number; // 1-12
  total_miles: number;
  amount: number;
}

export interface SummaryResponse {
  months: MonthlySummary[];
}

export interface Client {
  id: number;
  name: string;
  created_at: string;
}

export interface ClientSuggestionsResponse {
  clients: Client[];
}

export interface SettingsResponse {
  mileage_rate: number;
}

export interface UpdateSettingsRequest {
  mileage_rate: number;
}

export interface ErrorResponse {
  error: string;
}

export interface MessageResponse {
  message: string;
}

// Filter Types
export type DateRangeFilter = "today" | "week" | "month" | "quarter" | "";
export type MilesRangeFilter = "0-10" | "10-50" | "50-100" | "100+" | "";

export interface TripFilters {
  dateRange: DateRangeFilter;
  clientFilter: string;
  milesRange: MilesRangeFilter;
  searchQuery: string;
}

export interface TripsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  client?: string;
  date_from?: string;
  date_to?: string;
  min_miles?: number;
  max_miles?: number;
}

// UI Types
export interface FormErrors {
  [key: string]: string;
}

// Enhanced Form Types
export interface TripFormData extends Record<string, unknown> {
  client_name: string;
  trip_date: string;
  miles: number;
  notes: string;
}

export interface TripFormErrors {
  client_name?: string;
  trip_date?: string;
  miles?: string;
  notes?: string;
}

// Form field configurations
export interface FormFieldConfig {
  label: string;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  type?: "text" | "number" | "date" | "textarea";
  step?: string;
  min?: string;
  inputMode?: string;
}

export interface TripFormFieldConfigs {
  client_name: FormFieldConfig;
  trip_date: FormFieldConfig;
  miles: FormFieldConfig;
  notes: FormFieldConfig;
}
