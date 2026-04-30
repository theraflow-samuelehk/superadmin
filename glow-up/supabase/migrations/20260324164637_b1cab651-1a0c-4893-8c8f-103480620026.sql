
CREATE OR REPLACE FUNCTION public.validate_messaging_channel()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.channel NOT IN ('sms', 'whatsapp') THEN
    RAISE EXCEPTION 'channel must be sms or whatsapp';
  END IF;
  RETURN NEW;
END;
$$;
