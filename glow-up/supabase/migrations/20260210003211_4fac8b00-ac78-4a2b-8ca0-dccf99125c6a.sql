
-- Add missing columns to profiles for salon settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS vat_number text,
ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{"0":{"open":"09:00","close":"19:00","enabled":true},"1":{"open":"09:00","close":"19:00","enabled":true},"2":{"open":"09:00","close":"19:00","enabled":true},"3":{"open":"09:00","close":"19:00","enabled":true},"4":{"open":"09:00","close":"19:00","enabled":true},"5":{"open":"09:00","close":"14:00","enabled":true},"6":{"open":"09:00","close":"19:00","enabled":false}}'::jsonb,
ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{"sms_reminder":true,"email_reminder":true,"booking_confirmation":true,"inventory_alert":true,"weekly_report":false}'::jsonb;
