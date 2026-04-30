DROP POLICY "Users can insert own salon_integrations" ON public.salon_integrations;
CREATE POLICY "Users can insert own salon_integrations"
  ON public.salon_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));