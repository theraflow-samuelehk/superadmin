
-- Revoke direct SELECT on sensitive columns from authenticated and anon roles
-- by revoking table-level SELECT and re-granting only safe columns.

-- === shop_settings ===
REVOKE SELECT ON public.shop_settings FROM authenticated, anon;

GRANT SELECT (
  id, user_id, hero_title, hero_subtitle, hero_image_url,
  primary_color, accent_color, logo_url, footer_text, is_published,
  shop_name, banner_sections, navigation_menu, shipping_info,
  footer_links, footer_about, social_links, created_at, updated_at
) ON public.shop_settings TO authenticated, anon;

-- Keep INSERT/UPDATE/DELETE for authenticated (RLS still applies)
GRANT INSERT, UPDATE, DELETE ON public.shop_settings TO authenticated;

-- === salon_integrations ===
REVOKE SELECT ON public.salon_integrations FROM authenticated, anon;

GRANT SELECT (
  id, user_id, created_at, updated_at,
  sms_enabled, whatsapp_enabled, test_mode, fast_flow_mode,
  sender_id_enabled, twilio_account_sid, twilio_phone_number,
  twilio_sender_id, twilio_messaging_service_sid,
  whatsapp_phone_id, whatsapp_phone_number
) ON public.salon_integrations TO authenticated, anon;

GRANT INSERT, UPDATE, DELETE ON public.salon_integrations TO authenticated;
