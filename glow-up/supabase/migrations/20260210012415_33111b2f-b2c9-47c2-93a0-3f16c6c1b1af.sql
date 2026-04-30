
-- Table linking services to products they consume
CREATE TABLE public.service_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_used NUMERIC NOT NULL DEFAULT 1,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, product_id, user_id)
);

ALTER TABLE public.service_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service_products"
  ON public.service_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own service_products"
  ON public.service_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service_products"
  ON public.service_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service_products"
  ON public.service_products FOR DELETE
  USING (auth.uid() = user_id);
