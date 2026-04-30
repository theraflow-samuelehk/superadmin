
-- Add auth_user_id and portal_permissions columns to operators
ALTER TABLE public.operators ADD COLUMN auth_user_id uuid;
ALTER TABLE public.operators ADD COLUMN portal_permissions jsonb NOT NULL DEFAULT '{}';

-- Create operator_invites table
CREATE TABLE public.operator_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operator_id uuid NOT NULL REFERENCES public.operators(id),
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own operator invites"
  ON public.operator_invites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own operator invites"
  ON public.operator_invites FOR SELECT
  USING (auth.uid() = user_id);

-- RPC to accept operator invite
CREATE OR REPLACE FUNCTION public.accept_operator_invite(p_token text, p_auth_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invite record;
  v_operator record;
BEGIN
  SELECT * INTO v_invite FROM public.operator_invites WHERE token = p_token;
  
  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('error', 'invite_not_found');
  END IF;

  SELECT * INTO v_operator FROM public.operators WHERE id = v_invite.operator_id;

  IF v_invite.accepted_at IS NOT NULL THEN
    IF v_operator.auth_user_id = p_auth_user_id THEN
      RETURN jsonb_build_object(
        'success', true,
        'operator_id', v_invite.operator_id,
        'salon_user_id', v_invite.user_id,
        'already_accepted', true
      );
    ELSIF v_operator.auth_user_id IS NOT NULL THEN
      RETURN jsonb_build_object('error', 'operator_already_linked');
    END IF;
  END IF;

  IF v_operator.auth_user_id IS NOT NULL AND v_operator.auth_user_id != p_auth_user_id THEN
    RETURN jsonb_build_object('error', 'operator_already_linked');
  END IF;

  UPDATE public.operators SET auth_user_id = p_auth_user_id WHERE id = v_invite.operator_id;
  UPDATE public.operator_invites SET accepted_at = now() WHERE id = v_invite.id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_auth_user_id, 'operator')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'operator_id', v_invite.operator_id,
    'salon_user_id', v_invite.user_id
  );
END;
$$;

-- Helper function to get salon user_id for an operator
CREATE OR REPLACE FUNCTION public.get_operator_salon_user_id(_auth_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT oi.user_id
  FROM public.operator_invites oi
  JOIN public.operators o ON o.id = oi.operator_id
  WHERE o.auth_user_id = _auth_user_id
    AND oi.accepted_at IS NOT NULL
  LIMIT 1
$$;

-- RLS policies for operators to access salon data via operator_invites

-- Products: operators can view salon products
CREATE POLICY "Operators can view salon products"
  ON public.products FOR SELECT
  USING (user_id = public.get_operator_salon_user_id(auth.uid()));

-- Clients: operators can view salon clients
CREATE POLICY "Operators can view salon clients"
  ON public.clients FOR SELECT
  USING (user_id = public.get_operator_salon_user_id(auth.uid()));

-- Services: operators can view salon services
CREATE POLICY "Operators can view salon services"
  ON public.services FOR SELECT
  USING (user_id = public.get_operator_salon_user_id(auth.uid()));

-- Appointments: operators can view salon appointments
CREATE POLICY "Operators can view salon appointments"
  ON public.appointments FOR SELECT
  USING (user_id = public.get_operator_salon_user_id(auth.uid()));

-- Operators: operators can view salon operators
CREATE POLICY "Operators can view salon operators"
  ON public.operators FOR SELECT
  USING (user_id = public.get_operator_salon_user_id(auth.uid()));

-- Transactions: operators can view salon transactions
CREATE POLICY "Operators can view salon transactions"
  ON public.transactions FOR SELECT
  USING (user_id = public.get_operator_salon_user_id(auth.uid()));

-- Inventory movements: operators can view salon inventory
CREATE POLICY "Operators can view salon inventory"
  ON public.inventory_movements FOR SELECT
  USING (user_id = public.get_operator_salon_user_id(auth.uid()));

-- Profiles: operators can view salon profile
CREATE POLICY "Operators can view salon profile"
  ON public.profiles FOR SELECT
  USING (user_id = public.get_operator_salon_user_id(auth.uid()));

-- Service categories: operators can view
CREATE POLICY "Operators can view salon service categories"
  ON public.service_categories FOR SELECT
  USING (user_id = public.get_operator_salon_user_id(auth.uid()));

-- Product categories: operators can view
CREATE POLICY "Operators can view salon product categories"
  ON public.product_categories FOR SELECT
  USING (user_id = public.get_operator_salon_user_id(auth.uid()));
