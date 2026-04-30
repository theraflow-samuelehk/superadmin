
-- Messaging usage log table
CREATE TABLE public.messaging_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_user_id UUID NOT NULL,
  channel TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  flow_node_id UUID,
  message_sid TEXT,
  unit_price NUMERIC(6,4) NOT NULL DEFAULT 0,
  reported_to_stripe BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_messaging_channel()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.channel NOT IN ('sms', 'whatsapp') THEN
    RAISE EXCEPTION 'channel must be sms or whatsapp';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_messaging_channel
  BEFORE INSERT OR UPDATE ON public.messaging_usage_log
  FOR EACH ROW EXECUTE FUNCTION public.validate_messaging_channel();

-- RLS
ALTER TABLE public.messaging_usage_log ENABLE ROW LEVEL SECURITY;

-- Salon owner can read their own usage
CREATE POLICY "Salon owner reads own usage"
  ON public.messaging_usage_log
  FOR SELECT
  TO authenticated
  USING (salon_user_id = auth.uid());

-- Super admin can read all
CREATE POLICY "Super admin reads all usage"
  ON public.messaging_usage_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Index for billing queries
CREATE INDEX idx_messaging_usage_salon_date ON public.messaging_usage_log (salon_user_id, created_at);
CREATE INDEX idx_messaging_usage_unreported ON public.messaging_usage_log (reported_to_stripe) WHERE reported_to_stripe = FALSE;
