
CREATE TABLE public.treatment_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id),
  threshold integer NOT NULL DEFAULT 10,
  reward_type text NOT NULL DEFAULT 'discount',
  stamps_count integer NOT NULL DEFAULT 0,
  completed_cycles integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own treatment_cards"
  ON public.treatment_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own treatment_cards"
  ON public.treatment_cards FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can update own treatment_cards"
  ON public.treatment_cards FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_treatment_cards_updated_at
  BEFORE UPDATE ON public.treatment_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
