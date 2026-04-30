ALTER TABLE public.manual_reminder_config
ADD COLUMN IF NOT EXISTS sms_templates jsonb DEFAULT NULL;