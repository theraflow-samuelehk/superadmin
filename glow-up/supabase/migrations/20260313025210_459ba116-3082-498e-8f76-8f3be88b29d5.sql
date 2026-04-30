
-- Add conditional execution columns and message_key to reminder_flow_nodes
ALTER TABLE public.reminder_flow_nodes 
  ADD COLUMN IF NOT EXISTS only_if_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS only_if_no_response boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_key text;
