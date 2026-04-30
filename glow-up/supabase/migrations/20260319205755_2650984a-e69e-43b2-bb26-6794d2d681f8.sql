-- Fix: funnel_events INSERT policy - add basic validation instead of WITH CHECK (true)
-- funnel_events is used by anonymous landing page visitors for analytics,
-- so we keep anon access but add field validation to prevent abuse
DROP POLICY IF EXISTS "Anyone can insert funnel events" ON public.funnel_events;

CREATE POLICY "Anyone can insert funnel events"
  ON public.funnel_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Require mandatory fields to have non-empty values
    session_id IS NOT NULL AND session_id != ''
    AND step_name IS NOT NULL AND step_name != ''
    -- Prevent excessively long values (anti-abuse)
    AND length(session_id) <= 128
    AND length(step_name) <= 128
    AND (referrer IS NULL OR length(referrer) <= 2048)
    AND (user_agent IS NULL OR length(user_agent) <= 1024)
    AND (utm_source IS NULL OR length(utm_source) <= 256)
    AND (utm_medium IS NULL OR length(utm_medium) <= 256)
    AND (utm_campaign IS NULL OR length(utm_campaign) <= 256)
    AND (utm_content IS NULL OR length(utm_content) <= 256)
    AND (cta_action IS NULL OR length(cta_action) <= 256)
  );