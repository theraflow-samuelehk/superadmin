-- Allow operators to insert loyalty points for their salon
CREATE POLICY "Operators can insert salon loyalty_points"
ON public.loyalty_points
FOR INSERT
WITH CHECK (user_id = get_operator_salon_user_id(auth.uid()));

-- Allow operators to view salon loyalty points (needed for total calculation)
CREATE POLICY "Operators can view salon loyalty_points"
ON public.loyalty_points
FOR SELECT
USING (user_id = get_operator_salon_user_id(auth.uid()));

-- Allow operators to update salon clients (needed for loyalty level updates)
CREATE POLICY "Operators can update salon clients"
ON public.clients
FOR UPDATE
USING (user_id = get_operator_salon_user_id(auth.uid()));