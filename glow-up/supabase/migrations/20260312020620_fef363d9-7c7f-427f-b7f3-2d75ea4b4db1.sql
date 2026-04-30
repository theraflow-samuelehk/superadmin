
ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS stripe_secret_key text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS paypal_client_id text DEFAULT NULL;
