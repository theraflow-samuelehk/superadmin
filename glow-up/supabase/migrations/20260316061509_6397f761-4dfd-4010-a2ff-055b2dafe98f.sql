
CREATE TABLE public.sms_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_user_id UUID NOT NULL,
  order_id UUID REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  message_sid TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can view their delivery logs"
  ON public.sms_delivery_log FOR SELECT TO authenticated
  USING (salon_user_id = auth.uid());
