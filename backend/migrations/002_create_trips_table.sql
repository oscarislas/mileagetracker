-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(30) NOT NULL,
    trip_date DATE NOT NULL,
    miles DECIMAL(8,2) NOT NULL CHECK (miles >= 0),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_trip_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_client_name ON trips(client_name);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);