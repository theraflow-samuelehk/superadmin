INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('google_maps_account_email', 'samuelehk@gmail.com', 'Account Google Cloud associato a Google Maps API'),
  ('google_maps_api_key', 'AIzaSyB0VF0SfubcGYLB1ucpTNADIQnSaK4lIlQ', 'Google Maps API Key per Places Autocomplete')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();