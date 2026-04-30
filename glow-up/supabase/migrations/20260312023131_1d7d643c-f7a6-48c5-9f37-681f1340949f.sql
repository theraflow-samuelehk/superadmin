
-- Add new columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add new columns to shop_settings
ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS shop_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS banner_sections jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS navigation_menu jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS shipping_info jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS footer_links jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS footer_about text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';

-- Add shipping fields to shop_orders
ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'in_store',
  ADD COLUMN IF NOT EXISTS shipping_address jsonb DEFAULT NULL;

-- Create public storage bucket for shop images
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-images', 'shop-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for shop-images bucket: anyone can read (public), authenticated users can upload their own
CREATE POLICY "Anyone can view shop images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-images');

CREATE POLICY "Authenticated users can upload shop images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-images');

CREATE POLICY "Users can update own shop images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own shop images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anonymous read of shop_settings for public storefront
CREATE POLICY "Anyone can view published shop settings"
ON public.shop_settings FOR SELECT
TO anon
USING (is_published = true);

-- Allow anonymous read of products for public storefront  
CREATE POLICY "Anyone can view products of published shops"
ON public.products FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.shop_settings ss 
    WHERE ss.user_id = products.user_id 
    AND ss.is_published = true
  )
);
