
-- Add missing onboarding columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS team_size text,
  ADD COLUMN IF NOT EXISTS service_locations text[],
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS current_software text,
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS referral_other_text text,
  ADD COLUMN IF NOT EXISTS other_category_text text;

-- Update handle_new_user to also create default operators and services
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_colors text[] := ARRAY['#E91E63', '#9C27B0', '#FF9800'];
  v_names text[] := ARRAY['Claudia', 'Sofia', 'Aurora'];
  v_svc_names text[] := ARRAY['Manicure', 'Pedicure', 'Ceretta Gambe', 'Pulizia Viso', 'Massaggio Rilassante', 'Trattamento Corpo'];
  v_svc_durations int[] := ARRAY[30, 30, 60, 60, 90, 90];
  v_svc_prices numeric[] := ARRAY[25, 30, 35, 50, 65, 70];
  i int;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));

  -- Default role: user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Create 3 default operators
  FOR i IN 1..3 LOOP
    INSERT INTO public.operators (user_id, name, calendar_color, agenda_position)
    VALUES (NEW.id, v_names[i], v_colors[i], i);
  END LOOP;

  -- Create 6 default services
  FOR i IN 1..6 LOOP
    INSERT INTO public.services (user_id, name, duration_minutes, price)
    VALUES (NEW.id, v_svc_names[i], v_svc_durations[i], v_svc_prices[i]);
  END LOOP;

  RETURN NEW;
END;
$function$;
