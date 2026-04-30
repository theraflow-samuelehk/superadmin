-- Fix infinite recursion in affiliates RLS policies
-- Drop the problematic policy
DROP POLICY IF EXISTS "Managers can view team members" ON public.affiliates;

-- Recreate using security definer function to avoid recursion
CREATE POLICY "Managers can view team members"
ON public.affiliates
FOR SELECT
USING (
  manager_id = get_affiliate_id_for_auth_user(auth.uid())
);