
-- Table: manual_reminder_logs
CREATE TABLE public.manual_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  salon_user_id UUID NOT NULL,
  channel TEXT NOT NULL,
  slot_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(appointment_id, channel)
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_manual_reminder_channel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.channel NOT IN ('whatsapp', 'sms') THEN
    RAISE EXCEPTION 'channel must be whatsapp or sms';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_manual_reminder_channel
  BEFORE INSERT OR UPDATE ON public.manual_reminder_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_manual_reminder_channel();

CREATE INDEX idx_manual_reminder_logs_appointment ON public.manual_reminder_logs(appointment_id);
CREATE INDEX idx_manual_reminder_logs_salon ON public.manual_reminder_logs(salon_user_id);

ALTER TABLE public.manual_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminder logs"
  ON public.manual_reminder_logs FOR SELECT
  USING (auth.uid() = salon_user_id);

CREATE POLICY "Users can insert own reminder logs"
  ON public.manual_reminder_logs FOR INSERT
  WITH CHECK (auth.uid() = salon_user_id);

CREATE POLICY "Users can delete own reminder logs"
  ON public.manual_reminder_logs FOR DELETE
  USING (auth.uid() = salon_user_id);

-- Table: manual_reminder_config
CREATE TABLE public.manual_reminder_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  slots JSONB NOT NULL DEFAULT '[
    {"key":"morning","label":"Mattina","hour":8,"enabled":true,"isNextDay":false},
    {"key":"midday","label":"Mezzogiorno","hour":12,"enabled":true,"isNextDay":false},
    {"key":"afternoon","label":"Pomeriggio","hour":16,"enabled":true,"isNextDay":false},
    {"key":"evening","label":"Sera","hour":19,"enabled":true,"isNextDay":true}
  ]'::jsonb,
  wa_template TEXT NOT NULL DEFAULT 'Ciao {{client_name}}! 👋

*{{salon_name}}* ti ricorda il tuo appuntamento:

📅 *{{day_label}}*, {{date}}
⏰ *Ore {{time}}*
💇 {{service_name}}

Conferma o annulla qui:
{{link}}

Ti aspettiamo! ✨',
  sms_template TEXT NOT NULL DEFAULT '{{salon_name}}: promemoria appuntamento {{day_label}} {{date}} ore {{time}} - {{service_name}}. Conferma: {{link}}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_reminder_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own config"
  ON public.manual_reminder_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own config"
  ON public.manual_reminder_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own config"
  ON public.manual_reminder_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_manual_reminder_config_updated_at
  BEFORE UPDATE ON public.manual_reminder_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
