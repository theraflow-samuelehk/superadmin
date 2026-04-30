
-- 1. Add auth_user_id to clients
ALTER TABLE public.clients 
ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_clients_auth_user ON public.clients(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- 2. Add 'client' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- 3. Create client_invites table
CREATE TABLE public.client_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;

-- Centro can create/view own invites
CREATE POLICY "Users can insert own invites"
ON public.client_invites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own invites"
ON public.client_invites FOR SELECT
USING (auth.uid() = user_id);

-- 4. RLS: clients can view their own record via auth_user_id
CREATE POLICY "Clients can view own record via auth"
ON public.clients FOR SELECT
USING (auth_user_id = auth.uid());

-- 5. RLS: clients can view their own appointments
CREATE POLICY "Clients can view own appointments"
ON public.appointments FOR SELECT
USING (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

-- 6. RLS: clients can view their own loyalty points
CREATE POLICY "Clients can view own loyalty_points"
ON public.loyalty_points FOR SELECT
USING (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

-- 7. RLS: clients can view their own packages
CREATE POLICY "Clients can view own packages"
ON public.client_packages FOR SELECT
USING (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

-- 8. RLS: clients can view their own treatment photos
CREATE POLICY "Clients can view own photos"
ON public.treatment_photos FOR SELECT
USING (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

-- 9. Function to accept invite (security definer)
CREATE OR REPLACE FUNCTION public.accept_client_invite(p_token text, p_auth_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_client record;
BEGIN
  -- Find valid invite
  SELECT * INTO v_invite FROM public.client_invites
  WHERE token = p_token AND accepted_at IS NULL AND expires_at > now();
  
  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_or_expired_invite');
  END IF;

  -- Check if client already linked
  SELECT * INTO v_client FROM public.clients WHERE id = v_invite.client_id;
  IF v_client.auth_user_id IS NOT NULL AND v_client.auth_user_id != p_auth_user_id THEN
    RETURN jsonb_build_object('error', 'client_already_linked');
  END IF;

  -- Link auth user to client
  UPDATE public.clients SET auth_user_id = p_auth_user_id WHERE id = v_invite.client_id;

  -- Mark invite as accepted
  UPDATE public.client_invites SET accepted_at = now() WHERE id = v_invite.id;

  -- Add client role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_auth_user_id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'client_id', v_invite.client_id,
    'salon_user_id', v_invite.user_id
  );
END;
$$;

-- 10. RLS: clients can view services of their salon
CREATE POLICY "Clients can view salon services"
ON public.services FOR SELECT
USING (
  user_id IN (
    SELECT ci.user_id FROM public.client_invites ci
    JOIN public.clients c ON c.id = ci.client_id
    WHERE c.auth_user_id = auth.uid() AND ci.accepted_at IS NOT NULL
  )
);

-- 11. RLS: clients can view operators of their salon
CREATE POLICY "Clients can view salon operators"
ON public.operators FOR SELECT
USING (
  user_id IN (
    SELECT ci.user_id FROM public.client_invites ci
    JOIN public.clients c ON c.id = ci.client_id
    WHERE c.auth_user_id = auth.uid() AND ci.accepted_at IS NOT NULL
  )
);

-- 12. RLS: clients can view service categories of their salon
CREATE POLICY "Clients can view salon categories"
ON public.service_categories FOR SELECT
USING (
  user_id IN (
    SELECT ci.user_id FROM public.client_invites ci
    JOIN public.clients c ON c.id = ci.client_id
    WHERE c.auth_user_id = auth.uid() AND ci.accepted_at IS NOT NULL
  )
);

-- 13. RLS: clients can view operator shifts of their salon
CREATE POLICY "Clients can view salon shifts"
ON public.operator_shifts FOR SELECT
USING (
  user_id IN (
    SELECT ci.user_id FROM public.client_invites ci
    JOIN public.clients c ON c.id = ci.client_id
    WHERE c.auth_user_id = auth.uid() AND ci.accepted_at IS NOT NULL
  )
);

-- 14. RLS: clients can insert appointments for their salon
CREATE POLICY "Clients can insert own appointments"
ON public.appointments FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT ci.user_id FROM public.client_invites ci
    JOIN public.clients c ON c.id = ci.client_id
    WHERE c.auth_user_id = auth.uid() AND ci.accepted_at IS NOT NULL
  )
  AND client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

-- 15. RLS: clients can view profiles (salon info) for booking
CREATE POLICY "Clients can view salon profile"
ON public.profiles FOR SELECT
USING (
  user_id IN (
    SELECT ci.user_id FROM public.client_invites ci
    JOIN public.clients c ON c.id = ci.client_id
    WHERE c.auth_user_id = auth.uid() AND ci.accepted_at IS NOT NULL
  )
);
