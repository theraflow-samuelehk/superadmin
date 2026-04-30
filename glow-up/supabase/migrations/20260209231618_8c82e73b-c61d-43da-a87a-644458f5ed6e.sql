
-- =============================================
-- SOFT DELETE: Add deleted_at to main tables
-- =============================================
ALTER TABLE public.profiles ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.plans ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.subscriptions ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Create indexes for soft delete filtering
CREATE INDEX idx_profiles_deleted_at ON public.profiles (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_plans_deleted_at ON public.plans (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscriptions_deleted_at ON public.subscriptions (deleted_at) WHERE deleted_at IS NULL;

-- Helper function for soft delete
CREATE OR REPLACE FUNCTION public.soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.deleted_at = now();
  RETURN NEW;
END;
$$;

-- Helper function for restore
CREATE OR REPLACE FUNCTION public.restore_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.deleted_at = NULL;
  RETURN NEW;
END;
$$;

-- =============================================
-- AUDIT LOG TABLE
-- =============================================
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast querying
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs (table_name);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Super admins can view all audit logs
CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Only system (service_role) can insert audit logs
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can insert their own audit logs
CREATE POLICY "Users can insert own audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Audit log trigger function
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if this is a soft delete
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
      VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), 'SOFT_DELETE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    -- Check if this is a restore
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
      VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), 'RESTORE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSE
      INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
      VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach audit triggers to tables
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_plans AFTER INSERT OR UPDATE OR DELETE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_subscriptions AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.log_audit();
