
-- 1. Add short_code column
ALTER TABLE public.appointments
ADD COLUMN short_code TEXT;

-- 2. Function to generate random alphanumeric codes (base62, 10 chars)
CREATE OR REPLACE FUNCTION public.generate_short_code(len INTEGER DEFAULT 10)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..len LOOP
    result := result || substr(chars, floor(random() * 62 + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- 3. Trigger function: auto-generate short_code on INSERT, retry on collision
CREATE OR REPLACE FUNCTION public.set_appointment_short_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  max_attempts INTEGER := 5;
  attempt INTEGER := 0;
  new_code TEXT;
BEGIN
  IF NEW.short_code IS NULL OR NEW.short_code = '' THEN
    LOOP
      attempt := attempt + 1;
      new_code := generate_short_code(10);
      -- Check uniqueness
      IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE short_code = new_code) THEN
        NEW.short_code := new_code;
        EXIT;
      END IF;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Could not generate unique short_code after % attempts', max_attempts;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Attach trigger
CREATE TRIGGER trg_set_appointment_short_code
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.set_appointment_short_code();

-- 5. Backfill existing appointments with short codes
DO $$
DECLARE
  rec RECORD;
  new_code TEXT;
  attempts INTEGER;
BEGIN
  FOR rec IN SELECT id FROM public.appointments WHERE short_code IS NULL LOOP
    attempts := 0;
    LOOP
      attempts := attempts + 1;
      new_code := public.generate_short_code(10);
      IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE short_code = new_code) THEN
        UPDATE public.appointments SET short_code = new_code WHERE id = rec.id;
        EXIT;
      END IF;
      IF attempts >= 10 THEN
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 6. Add unique constraint and index after backfill
ALTER TABLE public.appointments
ALTER COLUMN short_code SET NOT NULL;

CREATE UNIQUE INDEX idx_appointments_short_code ON public.appointments (short_code);
