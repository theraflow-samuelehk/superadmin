CREATE POLICY "Authenticated can view published shop products"
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shop_settings ss
    WHERE ss.user_id = products.user_id
      AND ss.is_published = true
  )
  AND product_type = 'retail'
  AND deleted_at IS NULL
  AND quantity > 0
);