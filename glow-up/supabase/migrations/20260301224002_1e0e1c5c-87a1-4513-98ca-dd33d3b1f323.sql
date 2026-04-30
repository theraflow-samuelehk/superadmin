
-- balance_entries: voci manuali del bilancio
CREATE TABLE public.balance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('income', 'expense')),
  category text NOT NULL,
  amount numeric NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  source text NOT NULL DEFAULT 'manual',
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.balance_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own balance_entries" ON public.balance_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance_entries" ON public.balance_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own balance_entries" ON public.balance_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own balance_entries" ON public.balance_entries
  FOR DELETE USING (auth.uid() = user_id);

-- balance_categories: categorie personalizzabili
CREATE TABLE public.balance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('income', 'expense')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.balance_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own balance_categories" ON public.balance_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance_categories" ON public.balance_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own balance_categories" ON public.balance_categories
  FOR DELETE USING (auth.uid() = user_id);
