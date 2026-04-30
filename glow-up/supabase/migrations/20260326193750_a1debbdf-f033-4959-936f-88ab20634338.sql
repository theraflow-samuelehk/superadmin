
-- 1. Call center agents table
CREATE TABLE public.call_center_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.call_center_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on call_center_agents"
  ON public.call_center_agents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 2. Agent availability table
CREATE TABLE public.call_center_agent_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.call_center_agents(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (agent_id, day_of_week)
);

ALTER TABLE public.call_center_agent_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on agent_availability"
  ON public.call_center_agent_availability FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 3. Lead call logs table
CREATE TABLE public.lead_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.facebook_leads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.call_center_agents(id) ON DELETE CASCADE,
  outcome text NOT NULL,
  notes text,
  called_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on lead_call_logs"
  ON public.lead_call_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 4. Add new columns to facebook_leads
ALTER TABLE public.facebook_leads
  ADD COLUMN assigned_agent_id uuid REFERENCES public.call_center_agents(id) ON DELETE SET NULL,
  ADD COLUMN appointment_date timestamptz,
  ADD COLUMN call_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN last_called_at timestamptz,
  ADD COLUMN next_reminder_at timestamptz,
  ADD COLUMN priority text NOT NULL DEFAULT 'normal';
