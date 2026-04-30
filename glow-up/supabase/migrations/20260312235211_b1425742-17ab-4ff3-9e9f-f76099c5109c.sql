
-- =============================================
-- REMINDER FLOWS: tracks overall flow per appointment
-- =============================================
CREATE TABLE public.reminder_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  flow_case text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  client_action text,
  client_action_at timestamptz,
  action_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(appointment_id)
);

CREATE INDEX idx_reminder_flows_status ON public.reminder_flows(status);
CREATE INDEX idx_reminder_flows_token ON public.reminder_flows(action_token);

ALTER TABLE public.reminder_flows ENABLE ROW LEVEL SECURITY;

-- Only service_role (edge functions) manages flows
CREATE POLICY "Service role can manage reminder_flows"
  ON public.reminder_flows FOR ALL
  USING (auth.role() = 'service_role');

-- Salon owners can view their flows
CREATE POLICY "Users can view own reminder_flows"
  ON public.reminder_flows FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

-- =============================================
-- REMINDER FLOW NODES: individual scheduled notifications
-- =============================================
CREATE TABLE public.reminder_flow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES public.reminder_flows(id) ON DELETE CASCADE,
  node_type text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  push_sent_at timestamptz,
  whatsapp_sent_at timestamptz,
  sms_sent_at timestamptz,
  client_acted boolean NOT NULL DEFAULT false,
  admin_notified_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  message_variant text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminder_flow_nodes_pending ON public.reminder_flow_nodes(status, scheduled_at) WHERE status = 'pending';

ALTER TABLE public.reminder_flow_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage reminder_flow_nodes"
  ON public.reminder_flow_nodes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own flow nodes"
  ON public.reminder_flow_nodes FOR SELECT
  USING (
    flow_id IN (SELECT id FROM public.reminder_flows WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  );

-- =============================================
-- SALON INTEGRATIONS: per-salon Twilio/WhatsApp credentials
-- =============================================
CREATE TABLE public.salon_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_phone_number text,
  twilio_sender_id text DEFAULT 'GlowUp',
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  whatsapp_token text,
  whatsapp_phone_id text,
  whatsapp_phone_number text,
  sms_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.salon_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own salon_integrations"
  ON public.salon_integrations FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own salon_integrations"
  ON public.salon_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salon_integrations"
  ON public.salon_integrations FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

-- Service role needs access for edge functions
CREATE POLICY "Service role can manage salon_integrations"
  ON public.salon_integrations FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- UNCONFIRMED APPOINTMENTS: admin escalation list
-- =============================================
CREATE TABLE public.unconfirmed_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  escalated_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolution text,
  UNIQUE(appointment_id)
);

ALTER TABLE public.unconfirmed_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own unconfirmed_appointments"
  ON public.unconfirmed_appointments FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update own unconfirmed_appointments"
  ON public.unconfirmed_appointments FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role can manage unconfirmed_appointments"
  ON public.unconfirmed_appointments FOR ALL
  USING (auth.role() = 'service_role');
