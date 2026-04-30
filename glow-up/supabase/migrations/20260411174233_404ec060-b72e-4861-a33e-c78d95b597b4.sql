ALTER TABLE public.manual_reminder_config
ADD COLUMN IF NOT EXISTS wa_templates jsonb DEFAULT '{}'::jsonb;