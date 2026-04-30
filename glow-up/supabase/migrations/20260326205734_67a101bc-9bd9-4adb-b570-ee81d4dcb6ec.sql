ALTER TABLE public.call_center_agent_availability
  ADD COLUMN dual_slot boolean NOT NULL DEFAULT false,
  ADD COLUMN start_time_2 time DEFAULT '14:00',
  ADD COLUMN end_time_2 time DEFAULT '18:00';