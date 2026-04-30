ALTER TABLE public.operators ADD COLUMN agenda_position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.operators ADD COLUMN calendar_visible BOOLEAN NOT NULL DEFAULT true;