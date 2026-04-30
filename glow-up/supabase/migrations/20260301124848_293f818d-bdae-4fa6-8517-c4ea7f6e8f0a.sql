
-- First drop NOT NULL, then update
ALTER TABLE public.client_invites ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE public.client_invites ALTER COLUMN expires_at SET DEFAULT NULL;

-- Now set all existing to NULL
UPDATE public.client_invites SET expires_at = NULL;

-- Update accept_client_invite function
CREATE OR REPLACE FUNCTION public.accept_client_invite(p_token text, p_auth_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invite record;
  v_client record;
BEGIN
  SELECT * INTO v_invite FROM public.client_invites WHERE token = p_token;
  
  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('error', 'invite_not_found');
  END IF;

  SELECT * INTO v_client FROM public.clients WHERE id = v_invite.client_id;

  IF v_invite.accepted_at IS NOT NULL THEN
    IF v_client.auth_user_id = p_auth_user_id THEN
      RETURN jsonb_build_object(
        'success', true,
        'client_id', v_invite.client_id,
        'salon_user_id', v_invite.user_id,
        'already_accepted', true
      );
    ELSIF v_client.auth_user_id IS NOT NULL THEN
      RETURN jsonb_build_object('error', 'client_already_linked');
    END IF;
  END IF;

  IF v_client.auth_user_id IS NOT NULL AND v_client.auth_user_id != p_auth_user_id THEN
    RETURN jsonb_build_object('error', 'client_already_linked');
  END IF;

  UPDATE public.clients SET auth_user_id = p_auth_user_id WHERE id = v_invite.client_id;
  UPDATE public.client_invites SET accepted_at = now() WHERE id = v_invite.id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_auth_user_id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'client_id', v_invite.client_id,
    'salon_user_id', v_invite.user_id
  );
END;
$function$;
