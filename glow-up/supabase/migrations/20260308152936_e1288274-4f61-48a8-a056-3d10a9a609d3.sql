
-- Allow operators to insert transactions for their salon
CREATE POLICY "Operators can insert salon transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (user_id = get_operator_salon_user_id(auth.uid()));

-- Allow operators to insert inventory movements for their salon
CREATE POLICY "Operators can insert salon inventory movements"
ON public.inventory_movements FOR INSERT TO authenticated
WITH CHECK (user_id = get_operator_salon_user_id(auth.uid()));

-- Allow operators to update salon products (for quantity changes)
CREATE POLICY "Operators can update salon products"
ON public.products FOR UPDATE TO authenticated
USING (user_id = get_operator_salon_user_id(auth.uid()));
