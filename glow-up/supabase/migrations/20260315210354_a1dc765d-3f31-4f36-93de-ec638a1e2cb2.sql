ALTER TABLE public.appointments 
ADD COLUMN client_confirmed_at timestamptz,
ADD COLUMN client_rescheduled_at timestamptz;