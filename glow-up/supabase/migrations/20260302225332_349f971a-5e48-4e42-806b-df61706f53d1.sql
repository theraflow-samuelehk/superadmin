-- Make last_name optional for walk-in clients
ALTER TABLE public.clients ALTER COLUMN last_name DROP NOT NULL;
ALTER TABLE public.clients ALTER COLUMN last_name SET DEFAULT '';