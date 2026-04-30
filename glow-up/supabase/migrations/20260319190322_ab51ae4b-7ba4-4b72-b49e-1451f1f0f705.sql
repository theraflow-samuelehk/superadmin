
-- Secure RPC: returns only whether payment keys are configured (boolean)
-- Never exposes the actual key values to the client
CREATE OR REPLACE FUNCTION public.get_payment_keys_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
      'has_stripe', (stripe_secret_key IS NOT NULL AND stripe_secret_key != ''),
      'has_paypal', (paypal_client_id IS NOT NULL AND paypal_client_id != '')
    )
    FROM public.shop_settings
    WHERE user_id = p_user_id
    LIMIT 1),
    '{"has_stripe": false, "has_paypal": false}'::jsonb
  )
$$;
