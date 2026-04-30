
-- Shop settings per salon (theme, colors, texts)
CREATE TABLE public.shop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hero_title text DEFAULT 'Il nostro Shop',
  hero_subtitle text DEFAULT 'Scopri i nostri prodotti',
  hero_image_url text,
  primary_color text DEFAULT '#8B5CF6',
  accent_color text DEFAULT '#F59E0B',
  logo_url text,
  footer_text text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shop_settings" ON public.shop_settings FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own shop_settings" ON public.shop_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shop_settings" ON public.shop_settings FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Public can view published shops" ON public.shop_settings FOR SELECT USING (is_published = true);

-- Shop orders
CREATE TABLE public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_number text NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  payment_method text DEFAULT 'in_store',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shop_orders" ON public.shop_orders FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can update own shop_orders" ON public.shop_orders FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Anyone can insert shop_orders" ON public.shop_orders FOR INSERT WITH CHECK (true);

-- Generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.shop_orders
  WHERE user_id = p_user_id;
  RETURN 'ORD-' || lpad(v_count::text, 5, '0');
END;
$$;
