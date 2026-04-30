-- Allow operators to insert appointments for their salon
CREATE POLICY "Operators can insert salon appointments"
ON public.appointments
FOR INSERT
WITH CHECK (user_id = get_operator_salon_user_id(auth.uid()));

-- Allow operators to update appointments for their salon
CREATE POLICY "Operators can update salon appointments"
ON public.appointments
FOR UPDATE
USING (user_id = get_operator_salon_user_id(auth.uid()));