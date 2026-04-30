INSERT INTO public.platform_settings (key, value, description)
VALUES 
  ('google_maps_api_key', 'AIzaSyDD_LTGHXzE-QkEeBDgxxHOJf88ODJpkSk', 'Google Maps API Key - Account: samuelehk@gmail.com - Places API + Maps JavaScript API abilitati')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = now();