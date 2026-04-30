CREATE OR REPLACE FUNCTION public.get_integration_secrets(p_integration_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only super_admin can read actual secret values
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RETURN '{}'::jsonb;
  END IF;

  RETURN COALESCE(
    (SELECT jsonb_build_object(
      'twilio_auth_token', COALESCE(twilio_auth_token, ''),
      'whatsapp_token', COALESCE(whatsapp_token, '')
    )
    FROM public.salon_integrations
    WHERE user_id = p_integration_user_id
    LIMIT 1),
    '{"twilio_auth_token": "", "whatsapp_token": ""}'::jsonb
  );
END;
$$;