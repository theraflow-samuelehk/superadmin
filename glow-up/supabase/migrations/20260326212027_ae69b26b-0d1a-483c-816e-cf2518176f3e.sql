ALTER TABLE public.facebook_leads
  ADD COLUMN callback_date timestamptz,
  ADD COLUMN callback_agent_id uuid REFERENCES public.call_center_agents(id);