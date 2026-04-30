
-- =====================================================
-- SECURITY FIX 1: reminder_flow_models
-- Remove overly permissive UPDATE policy (USING true)
-- Super admin ALL policy already covers legitimate updates
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can update flow models" ON public.reminder_flow_models;

-- =====================================================
-- SECURITY FIX 2: shop_settings
-- Remove anon SELECT policies that expose stripe_secret_key
-- and paypal_client_id. Replace with secure RPC.
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view published shop settings" ON public.shop_settings;
DROP POLICY IF EXISTS "Public can view published shops" ON public.shop_settings;

-- Secure RPC: returns only public-safe columns
CREATE OR REPLACE FUNCTION public.get_public_shop_settings()
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'hero_title', hero_title,
    'hero_subtitle', hero_subtitle,
    'hero_image_url', hero_image_url,
    'primary_color', primary_color,
    'accent_color', accent_color,
    'logo_url', logo_url,
    'footer_text', footer_text,
    'is_published', is_published,
    'shop_name', shop_name,
    'banner_sections', banner_sections,
    'navigation_menu', navigation_menu,
    'shipping_info', shipping_info,
    'footer_links', footer_links,
    'footer_about', footer_about,
    'social_links', social_links,
    'created_at', created_at,
    'updated_at', updated_at
  )
  FROM public.shop_settings
  WHERE is_published = true
$$;

-- =====================================================
-- SECURITY FIX 3: products
-- Remove anon SELECT that exposes cost_price, supplier, notes
-- Replace with secure RPC for public shop products
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view products of published shops" ON public.products;

-- Also fix the authenticated version that leaks cost_price
DROP POLICY IF EXISTS "Authenticated can view published shop products" ON public.products;

-- Secure RPC: returns only public-safe product columns
CREATE OR REPLACE FUNCTION public.get_public_shop_products(p_user_id uuid)
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'user_id', p.user_id,
    'name', p.name,
    'description', p.description,
    'sale_price', p.sale_price,
    'image_url', p.image_url,
    'category', p.category,
    'brand', p.brand,
    'tags', p.tags,
    'quantity', LEAST(p.quantity, 1),
    'product_type', p.product_type
  )
  FROM public.products p
  WHERE p.user_id = p_user_id
    AND p.product_type = 'retail'
    AND p.deleted_at IS NULL
    AND p.quantity > 0
  ORDER BY p.name
$$;
