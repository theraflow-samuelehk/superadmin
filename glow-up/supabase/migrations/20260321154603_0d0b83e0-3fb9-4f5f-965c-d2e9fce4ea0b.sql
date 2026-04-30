
-- Add package columns to services
ALTER TABLE services ADD COLUMN is_package boolean NOT NULL DEFAULT false;
ALTER TABLE services ADD COLUMN package_sessions integer;
ALTER TABLE services ADD COLUMN package_price numeric;

-- Add package_id to appointments
ALTER TABLE appointments ADD COLUMN package_id uuid REFERENCES client_packages(id);

-- Add status to client_packages
ALTER TABLE client_packages ADD COLUMN status text NOT NULL DEFAULT 'active';
