
-- Create login_logs table
CREATE TABLE public.login_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Index for fast lookups by user_id
CREATE INDEX idx_login_logs_user_id ON public.login_logs (user_id);
CREATE INDEX idx_login_logs_created_at ON public.login_logs (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own logs
CREATE POLICY "Users can insert own login_logs"
  ON public.login_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Super admins can read all login logs
CREATE POLICY "Super admins can view all login_logs"
  ON public.login_logs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));
