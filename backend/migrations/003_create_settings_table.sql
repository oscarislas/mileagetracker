-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE,
    value VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default mileage rate
INSERT INTO settings (key, value) 
VALUES ('mileage_rate', '0.67') 
ON CONFLICT (key) DO NOTHING;

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);