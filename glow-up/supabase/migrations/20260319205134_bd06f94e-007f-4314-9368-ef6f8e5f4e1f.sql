-- Drop the overly broad client SELECT policy on operators table
-- Clients get operator data via the client-portal edge function (service role)
-- which already selects only safe columns (name, photo_url, specializations, calendar_color, service_ids)
DROP POLICY IF EXISTS "Clients can view salon operators" ON public.operators;