-- FIX 1: Remove overly permissive anon SELECT on profiles
-- The public booking page already uses edge function, this policy just leaks data
DROP POLICY IF EXISTS "Anyone can view booking-enabled profiles" ON public.profiles;

-- Create a secure RPC for the rare case something needs public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile_for_booking(p_booking_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'salon_name', salon_name,
    'display_name', display_name,
    'avatar_url', avatar_url,
    'booking_slug', booking_slug,
    'opening_hours', opening_hours,
    'booking_enabled', booking_enabled
  )
  FROM public.profiles
  WHERE booking_slug = p_booking_slug
    AND booking_enabled = true
    AND deleted_at IS NULL
  LIMIT 1
$$;

-- FIX 2: Remove dangerous shop_orders INSERT policy (WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can insert shop_orders" ON public.shop_orders;

-- Add a proper policy: only service_role (edge functions) can insert
CREATE POLICY "Service role can insert shop_orders"
  ON public.shop_orders
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- Also allow authenticated salon owners to insert their own orders (for in-store)
CREATE POLICY "Authenticated users can insert own shop_orders"
  ON public.shop_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);