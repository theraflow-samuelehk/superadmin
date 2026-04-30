
CREATE TABLE public.reminder_flow_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT false,
  flow_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reminder_flow_models ENABLE ROW LEVEL SECURITY;

-- Super admins full access
CREATE POLICY "Super admins can manage flow models"
  ON public.reminder_flow_models FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- All authenticated users can view active models
CREATE POLICY "Users can view active flow models"
  ON public.reminder_flow_models FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default model
INSERT INTO public.reminder_flow_models (name, description, is_active, flow_config)
VALUES (
  'Modello Standard v1',
  'Flusso progressivo Push → WhatsApp → SMS con escalation admin. Casi A-E basati sul tempo mancante all''appuntamento.',
  true,
  '{
    "cases": {
      "A": {"label": ">24h", "steps": ["day_before", "hours_before", "admin_escalation"]},
      "B": {"label": "12-24h", "steps": ["hours_before"]},
      "C": {"label": "4-12h", "steps": ["sms_2h"]},
      "D": {"label": "2-4h", "steps": ["sms_1h"]},
      "E": {"label": "<2h", "steps": []}
    },
    "channels": ["push", "whatsapp", "sms"],
    "escalation_delays": {"whatsapp_after_push_min": 10, "sms_after_whatsapp_min": 20}
  }'::jsonb
);
