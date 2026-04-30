
-- =============================================
-- FEATURE FLAGS TABLE
-- =============================================
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read feature flags
CREATE POLICY "Authenticated users can read feature flags"
ON public.feature_flags
FOR SELECT
TO authenticated
USING (true);

-- Only super admins can manage feature flags
CREATE POLICY "Super admins can manage feature flags"
ON public.feature_flags
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trigger
CREATE TRIGGER audit_feature_flags
AFTER INSERT OR UPDATE OR DELETE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Add deleted_at for soft delete
ALTER TABLE public.feature_flags ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Seed default feature flags
INSERT INTO public.feature_flags (key, name, description, is_enabled) VALUES
  ('online_booking', 'Prenotazione Online', 'Abilita la prenotazione online per i clienti', true),
  ('sms_reminders', 'Promemoria SMS', 'Invia promemoria SMS ai clienti', true),
  ('email_reminders', 'Promemoria Email', 'Invia promemoria email ai clienti', true),
  ('inventory_alerts', 'Alert Magazzino', 'Notifiche automatiche scorte basse', true),
  ('digital_consent', 'Consensi Digitali', 'Firma digitale per consensi informati', false),
  ('multi_location', 'Multi-Sede', 'Gestione di più sedi', false),
  ('api_access', 'Accesso API', 'API REST per integrazioni esterne', false),
  ('advanced_reports', 'Report Avanzati', 'Analytics e report avanzati', false);

-- =============================================
-- Add status column to profiles for enable/disable
-- =============================================
ALTER TABLE public.profiles ADD COLUMN status text NOT NULL DEFAULT 'active';
