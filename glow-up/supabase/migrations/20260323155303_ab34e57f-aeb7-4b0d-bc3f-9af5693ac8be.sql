
-- Add max_appointments column to plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_appointments integer DEFAULT NULL;

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_percent integer NOT NULL,
  duration_months integer DEFAULT NULL,
  max_uses integer DEFAULT NULL,
  used_count integer DEFAULT 0,
  target_user_id uuid DEFAULT NULL,
  is_active boolean DEFAULT true,
  expires_at timestamptz DEFAULT NULL,
  created_by uuid DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access" ON discount_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Update get_public_plans to include max_appointments
CREATE OR REPLACE FUNCTION public.get_public_plans()
 RETURNS SETOF jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'slug', slug,
    'description', description,
    'price_monthly', price_monthly,
    'price_yearly', price_yearly,
    'max_operators', max_operators,
    'max_clients', max_clients,
    'max_appointments', max_appointments,
    'features', features,
    'sort_order', sort_order
  )
  FROM public.plans
  WHERE is_active = true AND deleted_at IS NULL
  ORDER BY sort_order
$$;
