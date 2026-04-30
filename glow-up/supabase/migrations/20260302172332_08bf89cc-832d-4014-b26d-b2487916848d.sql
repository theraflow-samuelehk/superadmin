
-- Add reward_service_id column to treatment_cards
ALTER TABLE public.treatment_cards
  ADD COLUMN reward_service_id uuid REFERENCES public.services(id);

-- Add DELETE policy for treatment_cards
CREATE POLICY "Users can delete own treatment_cards"
  ON public.treatment_cards FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));
