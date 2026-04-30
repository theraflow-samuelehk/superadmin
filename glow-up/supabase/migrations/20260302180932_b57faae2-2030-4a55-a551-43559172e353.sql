
-- 1. Add affiliate and affiliate_manager to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'affiliate';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'affiliate_manager';

-- 2. Create affiliates table
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  commission_pct numeric NOT NULL DEFAULT 10,
  is_manager boolean NOT NULL DEFAULT false,
  manager_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  team_commission_pct numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT commission_pct_range CHECK (commission_pct >= 0 AND commission_pct <= 100),
  CONSTRAINT team_commission_pct_range CHECK (team_commission_pct IS NULL OR (team_commission_pct >= 0 AND team_commission_pct <= 100))
);

-- 3. Create affiliate_clients table (retailer_user_id = user_id del profilo/centro)
CREATE TABLE public.affiliate_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  retailer_user_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,
  UNIQUE (affiliate_id, retailer_user_id)
);

-- 4. Create affiliate_commissions table
CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  retailer_user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  payment_amount numeric NOT NULL DEFAULT 0,
  commission_pct numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  is_manager_share boolean NOT NULL DEFAULT false,
  parent_commission_id uuid REFERENCES public.affiliate_commissions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
);

-- 5. Create affiliate_invites table
CREATE TABLE public.affiliate_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Enable RLS on all tables
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_invites ENABLE ROW LEVEL SECURITY;

-- 7. Helper function: get affiliate_id for auth user
CREATE OR REPLACE FUNCTION public.get_affiliate_id_for_auth_user(_auth_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.affiliates
  WHERE auth_user_id = _auth_user_id AND deleted_at IS NULL
  LIMIT 1
$$;

-- 8. Helper function: get manager's affiliate_id for a team member
CREATE OR REPLACE FUNCTION public.get_affiliate_manager_id(_auth_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT manager_id FROM public.affiliates
  WHERE auth_user_id = _auth_user_id AND deleted_at IS NULL AND manager_id IS NOT NULL
  LIMIT 1
$$;

-- 9. Helper: check if user is an affiliate (any type)
CREATE OR REPLACE FUNCTION public.is_affiliate(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE auth_user_id = _user_id AND deleted_at IS NULL
  )
$$;

-- 10. Helper: check if user is an affiliate manager
CREATE OR REPLACE FUNCTION public.is_affiliate_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE auth_user_id = _user_id AND deleted_at IS NULL AND is_manager = true
  )
$$;

-- 11. Helper: get team member IDs for a manager
CREATE OR REPLACE FUNCTION public.get_team_member_ids(_manager_auth_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.affiliates
  WHERE manager_id = (
    SELECT id FROM public.affiliates WHERE auth_user_id = _manager_auth_user_id AND deleted_at IS NULL LIMIT 1
  ) AND deleted_at IS NULL
$$;

-- ===== RLS POLICIES: affiliates =====

-- Super admin full access
CREATE POLICY "Super admins can manage affiliates"
  ON public.affiliates FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Affiliate can view own record
CREATE POLICY "Affiliates can view own record"
  ON public.affiliates FOR SELECT
  USING (auth_user_id = auth.uid());

-- Manager can view team members
CREATE POLICY "Managers can view team members"
  ON public.affiliates FOR SELECT
  USING (
    manager_id IN (SELECT id FROM public.affiliates WHERE auth_user_id = auth.uid() AND deleted_at IS NULL)
  );

-- ===== RLS POLICIES: affiliate_clients =====

CREATE POLICY "Super admins can manage affiliate_clients"
  ON public.affiliate_clients FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Affiliates can view own clients"
  ON public.affiliate_clients FOR SELECT
  USING (
    affiliate_id = public.get_affiliate_id_for_auth_user(auth.uid())
  );

CREATE POLICY "Managers can view team clients"
  ON public.affiliate_clients FOR SELECT
  USING (
    affiliate_id IN (SELECT public.get_team_member_ids(auth.uid()))
  );

-- Managers can assign clients to team members
CREATE POLICY "Managers can insert team clients"
  ON public.affiliate_clients FOR INSERT
  WITH CHECK (
    public.is_affiliate_manager(auth.uid()) AND
    affiliate_id IN (SELECT public.get_team_member_ids(auth.uid()))
  );

-- ===== RLS POLICIES: affiliate_commissions =====

CREATE POLICY "Super admins can manage affiliate_commissions"
  ON public.affiliate_commissions FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Affiliates can view own commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (
    affiliate_id = public.get_affiliate_id_for_auth_user(auth.uid())
  );

CREATE POLICY "Managers can view team commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (
    affiliate_id IN (SELECT public.get_team_member_ids(auth.uid()))
  );

-- ===== RLS POLICIES: affiliate_invites =====

CREATE POLICY "Super admins can manage affiliate_invites"
  ON public.affiliate_invites FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Managers can manage own invites"
  ON public.affiliate_invites FOR ALL
  USING (created_by = auth.uid());

-- Anyone can read invites by token (for accepting)
CREATE POLICY "Anyone can read invites by token"
  ON public.affiliate_invites FOR SELECT
  USING (true);

-- 12. Accept affiliate invite function
CREATE OR REPLACE FUNCTION public.accept_affiliate_invite(p_token text, p_auth_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_affiliate record;
  v_role_name app_role;
BEGIN
  SELECT * INTO v_invite FROM public.affiliate_invites WHERE token = p_token;
  
  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('error', 'invite_not_found');
  END IF;

  SELECT * INTO v_affiliate FROM public.affiliates WHERE id = v_invite.affiliate_id;

  IF v_invite.accepted_at IS NOT NULL THEN
    IF v_affiliate.auth_user_id = p_auth_user_id THEN
      RETURN jsonb_build_object(
        'success', true,
        'affiliate_id', v_invite.affiliate_id,
        'already_accepted', true
      );
    ELSIF v_affiliate.auth_user_id IS NOT NULL THEN
      RETURN jsonb_build_object('error', 'affiliate_already_linked');
    END IF;
  END IF;

  IF v_affiliate.auth_user_id IS NOT NULL AND v_affiliate.auth_user_id != p_auth_user_id THEN
    RETURN jsonb_build_object('error', 'affiliate_already_linked');
  END IF;

  UPDATE public.affiliates SET auth_user_id = p_auth_user_id WHERE id = v_invite.affiliate_id;
  UPDATE public.affiliate_invites SET accepted_at = now() WHERE id = v_invite.id;

  -- Assign appropriate role
  IF v_affiliate.is_manager THEN
    v_role_name := 'affiliate_manager';
  ELSE
    v_role_name := 'affiliate';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_auth_user_id, v_role_name)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'affiliate_id', v_invite.affiliate_id,
    'is_manager', v_affiliate.is_manager
  );
END;
$$;

-- 13. Trigger for updated_at
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
