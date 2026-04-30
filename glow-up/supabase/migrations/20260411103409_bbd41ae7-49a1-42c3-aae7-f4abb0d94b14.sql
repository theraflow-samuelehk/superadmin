
-- Add is_new_contact column to messaging_usage_log
ALTER TABLE public.messaging_usage_log 
ADD COLUMN IF NOT EXISTS is_new_contact boolean DEFAULT false;

-- Create index for efficient lookups of unique contacts per salon
CREATE INDEX IF NOT EXISTS idx_messaging_usage_log_salon_phone 
ON public.messaging_usage_log (salon_user_id, recipient_phone);

-- Create index for daily point calculation
CREATE INDEX IF NOT EXISTS idx_messaging_usage_log_salon_date 
ON public.messaging_usage_log (salon_user_id, created_at);

-- Create wa_message_queue table for queued messages
CREATE TABLE public.wa_message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_user_id uuid NOT NULL,
  recipient_phone text NOT NULL,
  body text NOT NULL,
  flow_node_id uuid NULL,
  status text NOT NULL DEFAULT 'queued',
  scheduled_for timestamp with time zone NOT NULL DEFAULT now(),
  error_message text NULL,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone NULL
);

-- Enable RLS
ALTER TABLE public.wa_message_queue ENABLE ROW LEVEL SECURITY;

-- Only service_role can access the queue
CREATE POLICY "Service role manages wa_message_queue"
ON public.wa_message_queue
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Index for processing queued messages
CREATE INDEX idx_wa_message_queue_status_scheduled 
ON public.wa_message_queue (status, scheduled_for) 
WHERE status = 'queued';

CREATE INDEX idx_wa_message_queue_salon 
ON public.wa_message_queue (salon_user_id);
