ALTER TABLE public.reminder_flow_nodes
  ADD COLUMN IF NOT EXISTS sms_delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS whatsapp_delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS sms_message_sid TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_message_sid TEXT;