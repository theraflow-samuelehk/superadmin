-- Add unique constraint on platform_settings.key for upsert support
ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_key_unique UNIQUE (key);

-- Restrict SELECT on platform_settings to only super_admin (not all authenticated)
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.platform_settings;

CREATE POLICY "Super admins can read settings"
ON public.platform_settings
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow service_role to read (for edge functions)
CREATE POLICY "Service role can read settings"
ON public.platform_settings
FOR SELECT
USING (auth.role() = 'service_role'::text);