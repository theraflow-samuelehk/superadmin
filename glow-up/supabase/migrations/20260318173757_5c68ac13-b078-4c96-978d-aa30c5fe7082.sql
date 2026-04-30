
CREATE TABLE public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  step_index integer NOT NULL,
  step_name text NOT NULL,
  event_type text NOT NULL DEFAULT 'step_view',
  cta_action text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  user_agent text,
  screen_width integer,
  device_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_funnel_events_created ON public.funnel_events(created_at);
CREATE INDEX idx_funnel_events_session ON public.funnel_events(session_id);
CREATE INDEX idx_funnel_events_step ON public.funnel_events(step_index);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert funnel events"
  ON public.funnel_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can view funnel events"
  ON public.funnel_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
