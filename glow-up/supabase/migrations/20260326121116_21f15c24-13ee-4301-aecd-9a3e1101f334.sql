
-- Add is_trial flag to subscriptions table to track trial usage
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_trial boolean NOT NULL DEFAULT false;

-- Create messaging_subscriptions table for separate SMS/WA billing
CREATE TABLE public.messaging_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messaging_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own messaging subscriptions"
  ON public.messaging_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all messaging subscriptions"
  ON public.messaging_subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
