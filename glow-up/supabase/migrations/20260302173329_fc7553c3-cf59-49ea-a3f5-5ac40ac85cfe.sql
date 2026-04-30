-- Allow users to delete their own loyalty_points
CREATE POLICY "Users can delete own loyalty_points"
  ON public.loyalty_points FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));
