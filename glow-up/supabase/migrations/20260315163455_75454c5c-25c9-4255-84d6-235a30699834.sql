
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view active flow models" ON public.reminder_flow_models;

-- Allow all authenticated users to view ALL flow models (not just active)
CREATE POLICY "Authenticated users can view all flow models"
ON public.reminder_flow_models
FOR SELECT
TO authenticated
USING (true);
