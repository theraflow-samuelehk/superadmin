
-- =====================================================
-- SECURITY FIX: affiliate_invites
-- Remove "Anyone can read invites by token" (qual: true)
-- which exposes ALL tokens to anonymous users.
-- Invite validation is handled by edge function with
-- service_role, so no public SELECT is needed.
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read invites by token" ON public.affiliate_invites;

-- =====================================================
-- SECURITY FIX: plans table
-- Remove public SELECT that exposes stripe_price_id_monthly,
-- stripe_price_id_yearly, and internal features JSON.
-- Replace with secure RPC that returns only marketing fields.
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;

-- Authenticated users need to see plans for the pricing page
CREATE POLICY "Authenticated users can view active plans"
ON public.plans
FOR SELECT
TO authenticated
USING (is_active = true AND deleted_at IS NULL);

-- Secure RPC for the landing page (unauthenticated)
CREATE OR REPLACE FUNCTION public.get_public_plans()
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'slug', slug,
    'description', description,
    'price_monthly', price_monthly,
    'price_yearly', price_yearly,
    'max_operators', max_operators,
    'max_clients', max_clients,
    'features', features,
    'sort_order', sort_order
  )
  FROM public.plans
  WHERE is_active = true AND deleted_at IS NULL
  ORDER BY sort_order
$$;
