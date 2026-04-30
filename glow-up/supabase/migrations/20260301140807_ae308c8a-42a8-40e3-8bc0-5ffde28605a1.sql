
CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own product categories"
ON public.product_categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own product categories"
ON public.product_categories FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view own product categories"
ON public.product_categories FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));
