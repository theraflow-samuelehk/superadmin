
-- Lead WhatsApp Templates
CREATE TABLE public.lead_wa_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_wa_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage lead_wa_templates"
  ON public.lead_wa_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Lead WhatsApp Automations
CREATE TABLE public.lead_wa_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.lead_wa_templates(id) ON DELETE SET NULL,
  condition_type TEXT NOT NULL,
  delay_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT false,
  max_sends_per_lead INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_wa_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage lead_wa_automations"
  ON public.lead_wa_automations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Lead WhatsApp Send Log
CREATE TABLE public.lead_wa_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.facebook_leads(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.lead_wa_templates(id) ON DELETE SET NULL,
  automation_id UUID REFERENCES public.lead_wa_automations(id) ON DELETE SET NULL,
  sent_body TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  via TEXT NOT NULL DEFAULT 'baileys',
  message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_wa_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage lead_wa_send_log"
  ON public.lead_wa_send_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
