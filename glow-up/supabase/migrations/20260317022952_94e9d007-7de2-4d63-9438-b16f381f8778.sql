
-- Allow owners to update their own reminder flows
CREATE POLICY "Users can update own reminder_flows"
ON public.reminder_flows
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow owners to update nodes of their own flows
CREATE POLICY "Users can update own flow nodes"
ON public.reminder_flow_nodes
FOR UPDATE
TO authenticated
USING (flow_id IN (SELECT id FROM reminder_flows WHERE user_id = auth.uid()))
WITH CHECK (flow_id IN (SELECT id FROM reminder_flows WHERE user_id = auth.uid()));
