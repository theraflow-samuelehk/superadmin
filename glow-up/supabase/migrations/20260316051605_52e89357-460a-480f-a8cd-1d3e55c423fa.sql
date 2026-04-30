CREATE POLICY "Authenticated users can update flow models"
ON public.reminder_flow_models
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);