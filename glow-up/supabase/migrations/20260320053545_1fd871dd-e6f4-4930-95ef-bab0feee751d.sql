
-- Fix permissive RLS: restrict inserts to service role context (edge functions)
DROP POLICY "Service role inserts usage logs" ON public.ai_usage_logs;

CREATE POLICY "Insert usage logs own user"
  ON public.ai_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
