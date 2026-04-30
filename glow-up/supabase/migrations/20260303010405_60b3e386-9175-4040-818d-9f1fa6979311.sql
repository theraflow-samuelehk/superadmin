-- Make client_id nullable on appointments table
ALTER TABLE public.appointments ALTER COLUMN client_id DROP NOT NULL;