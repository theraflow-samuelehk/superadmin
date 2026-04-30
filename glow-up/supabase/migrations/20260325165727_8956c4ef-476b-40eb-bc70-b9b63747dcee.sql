
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
  v_opening_hours jsonb;
  v_op_ids uuid[];
  v_svc_ids uuid[];
  v_op_id uuid;
  v_svc_id uuid;
  i int;
  d int;
BEGIN
  v_opening_hours := '{}'::jsonb;
  FOR d IN 0..6 LOOP
    v_opening_hours := v_opening_hours || jsonb_build_object(
      d::text,
      jsonb_build_object(
        'open', '08:00',
        'close', '21:00',
        'enabled', true,
        'dual_slot', false,
        'morning_open', '08:00',
        'morning_close', '13:00',
        'afternoon_open', '14:00',
        'afternoon_close', '21:00'
      )
    );
  END LOOP;

  INSERT INTO public.profiles (user_id, display_name, email, opening_hours, booking_enabled)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.email,
    v_opening_hours,
    true
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  v_op_ids := ARRAY[]::uuid[];
  FOR i IN 1..3 LOOP
    INSERT INTO public.operators (user_id, name, calendar_color, agenda_position)
    VALUES (NEW.id, v_names[i], v_colors[i], i)
    RETURNING id INTO v_op_id;
    v_op_ids := v_op_ids || v_op_id;
  END LOOP;

  v_svc_ids := ARRAY[]::uuid[];
  FOR i IN 1..6 LOOP
    INSERT INTO public.services (user_id, name, duration_minutes, price)
    VALUES (NEW.id, v_svc_names[i], v_svc_durations[i], v_svc_prices[i])
    RETURNING id INTO v_svc_id;
    v_svc_ids := v_svc_ids || v_svc_id;
  END LOOP;

  FOREACH v_op_id IN ARRAY v_op_ids LOOP
    UPDATE public.operators SET service_ids = v_svc_ids WHERE id = v_op_id;
  END LOOP;

  FOREACH v_op_id IN ARRAY v_op_ids LOOP
    FOR d IN 0..6 LOOP
      INSERT INTO public.operator_shifts (user_id, operator_id, day_of_week, start_time, end_time, is_active)
      VALUES (NEW.id, v_op_id, d, '08:00', '21:00', true);
    END LOOP;
  END LOOP;

  INSERT INTO public.salon_integrations (user_id, sms_enabled, whatsapp_enabled)
  VALUES (NEW.id, false, false);

  RETURN NEW;
END;
$function$;
