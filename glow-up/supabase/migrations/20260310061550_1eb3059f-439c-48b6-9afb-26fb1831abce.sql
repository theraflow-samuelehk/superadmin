UPDATE public.appointments
SET final_price = s.price
FROM public.services s
WHERE appointments.service_id = s.id
  AND appointments.final_price IS NULL;