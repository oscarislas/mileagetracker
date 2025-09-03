-- Add performance optimization indexes
-- These indexes are designed to optimize the most common query patterns

-- Composite index for trips pagination with ordering
-- Optimizes: ORDER BY trip_date DESC, created_at DESC queries
CREATE INDEX IF NOT EXISTS idx_trips_date_created_desc ON trips(trip_date DESC, created_at DESC);

-- Composite index for monthly summary aggregations
-- Optimizes: GROUP BY DATE_TRUNC('month', trip_date) queries with date range filtering
CREATE INDEX IF NOT EXISTS idx_trips_date_month_aggregation ON trips(trip_date, miles) WHERE trip_date IS NOT NULL;

-- Partial index for client suggestions (non-empty names only)
-- Optimizes: ILIKE '%query%' queries on client names
CREATE INDEX IF NOT EXISTS idx_clients_name_lower_partial ON clients(LOWER(name)) WHERE LENGTH(name) > 0;

-- Index for foreign key relationship optimization
CREATE INDEX IF NOT EXISTS idx_trips_client_id_date ON trips(client_id, trip_date) WHERE client_id IS NOT NULL;

-- Covering index for trip pagination (includes frequently selected columns)
-- This allows index-only scans for common pagination queries
CREATE INDEX IF NOT EXISTS idx_trips_pagination_covering ON trips(trip_date DESC, created_at DESC) 
  INCLUDE (id, client_name, miles, notes);

-- Partial index for recent trips (last 2 years)
-- Optimizes queries for recent data which are most common
CREATE INDEX IF NOT EXISTS idx_trips_recent ON trips(trip_date DESC, created_at DESC) 
  WHERE trip_date >= (CURRENT_DATE - INTERVAL '2 years');

-- Statistics update for better query planning
-- This ensures PostgreSQL has up-to-date statistics for optimization
ANALYZE trips;
ANALYZE clients;
ANALYZE settings;