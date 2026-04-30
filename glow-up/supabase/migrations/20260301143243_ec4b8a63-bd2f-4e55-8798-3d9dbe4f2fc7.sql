
-- Function to get operator_id from auth_user_id
CREATE OR REPLACE FUNCTION public.get_operator_id_for_auth_user(_auth_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.operators
  WHERE auth_user_id = _auth_user_id
  LIMIT 1
$$;

-- RLS: Operators can SELECT their own shifts
CREATE POLICY "Operators can view own shifts"
ON public.operator_shifts
FOR SELECT
TO authenticated
USING (operator_id = get_operator_id_for_auth_user(auth.uid()));

-- RLS: Operators can INSERT their own shifts
CREATE POLICY "Operators can insert own shifts"
ON public.operator_shifts
FOR INSERT
TO authenticated
WITH CHECK (operator_id = get_operator_id_for_auth_user(auth.uid()));

-- RLS: Operators can UPDATE their own shifts
CREATE POLICY "Operators can update own shifts"
ON public.operator_shifts
FOR UPDATE
TO authenticated
USING (operator_id = get_operator_id_for_auth_user(auth.uid()));

-- RLS: Operators can DELETE their own shifts
CREATE POLICY "Operators can delete own shifts"
ON public.operator_shifts
FOR DELETE
TO authenticated
USING (operator_id = get_operator_id_for_auth_user(auth.uid()));
