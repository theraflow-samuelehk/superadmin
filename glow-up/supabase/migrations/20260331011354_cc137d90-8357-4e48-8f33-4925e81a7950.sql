
ALTER TABLE public.salon_integrations 
  ADD COLUMN IF NOT EXISTS baileys_service_url text,
  ADD COLUMN IF NOT EXISTS baileys_api_key text;
