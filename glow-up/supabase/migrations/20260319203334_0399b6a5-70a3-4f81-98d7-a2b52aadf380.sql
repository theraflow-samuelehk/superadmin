
-- 1. Fix: get_operator_salon_user_id must check deleted_at IS NULL
CREATE OR REPLACE FUNCTION public.get_operator_salon_user_id(_auth_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT oi.user_id
  FROM public.operator_invites oi
  JOIN public.operators o ON o.id = oi.operator_id
  WHERE o.auth_user_id = _auth_user_id
    AND o.deleted_at IS NULL
    AND oi.accepted_at IS NOT NULL
  LIMIT 1
$function$;

-- 2. Fix: get_operator_id_for_auth_user must check deleted_at IS NULL
CREATE OR REPLACE FUNCTION public.get_operator_id_for_auth_user(_auth_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM public.operators
  WHERE auth_user_id = _auth_user_id
    AND deleted_at IS NULL
  LIMIT 1
$function$;

-- 3. Create RPC that returns only safe operator columns for clients
CREATE OR REPLACE FUNCTION public.get_public_operators_for_client(p_salon_user_id uuid)
 RETURNS SETOF jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'id', o.id,
    'name', o.name,
    'photo_url', o.photo_url,
    'specializations', o.specializations,
    'calendar_color', o.calendar_color,
    'service_ids', o.service_ids
  )
  FROM public.operators o
  WHERE o.user_id = p_salon_user_id
    AND o.deleted_at IS NULL
  ORDER BY o.agenda_position, o.name
$function$;

-- 4. Create RPC to check Stripe keys status (write-only pattern)
CREATE OR REPLACE FUNCTION public.get_stripe_platform_keys_status()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'has_secret_key', EXISTS (
      SELECT 1 FROM public.platform_settings
      WHERE key = 'stripe_secret_key' AND value IS NOT NULL AND value != ''
    ),
    'has_webhook_secret', EXISTS (
      SELECT 1 FROM public.platform_settings
      WHERE key = 'stripe_webhook_secret' AND value IS NOT NULL AND value != ''
    )
  )
$function$;
