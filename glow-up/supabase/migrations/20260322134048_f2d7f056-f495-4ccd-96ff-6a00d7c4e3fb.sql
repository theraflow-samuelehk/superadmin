
-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill existing emails from auth.users
UPDATE public.profiles p SET email = u.email
FROM auth.users u WHERE p.user_id = u.id AND p.email IS NULL;

-- Update handle_new_user to save email
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
  -- Create profile with email
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email), NEW.email);

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
