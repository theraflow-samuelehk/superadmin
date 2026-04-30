CREATE OR REPLACE FUNCTION public.get_integration_secrets_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
      'has_twilio_token', (twilio_auth_token IS NOT NULL AND twilio_auth_token != ''),
      'has_whatsapp_token', (whatsapp_token IS NOT NULL AND whatsapp_token != '')
    )
    FROM public.salon_integrations
    WHERE user_id = p_user_id
    LIMIT 1),
    '{"has_twilio_token": false, "has_whatsapp_token": false}'::jsonb
  )
$$;