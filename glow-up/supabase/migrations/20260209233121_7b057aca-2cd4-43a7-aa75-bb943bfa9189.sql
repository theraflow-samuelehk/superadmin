
-- =============================================
-- FASE 1: Tabelle Clienti, Categorie Servizi, Servizi, Operatori
-- =============================================

-- 1. CLIENTS
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  birth_date date,
  notes text,
  allergies text,
  privacy_consent boolean NOT NULL DEFAULT false,
  source text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_deleted_at ON public.clients(deleted_at);

-- 2. SERVICE_CATEGORIES
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON public.service_categories
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own categories" ON public.service_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.service_categories
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER audit_service_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE INDEX idx_service_categories_user_id ON public.service_categories(user_id);

-- 3. SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid REFERENCES public.service_categories(id),
  name text NOT NULL,
  duration_minutes integer NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  description text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own services" ON public.services
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own services" ON public.services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services" ON public.services
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_services
  AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE INDEX idx_services_user_id ON public.services(user_id);
CREATE INDEX idx_services_category_id ON public.services(category_id);

-- 4. OPERATORS
CREATE TABLE public.operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  role text,
  specializations text[],
  calendar_color text NOT NULL DEFAULT '#8B5CF6',
  working_hours jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own operators" ON public.operators
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert own operators" ON public.operators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own operators" ON public.operators
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON public.operators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_operators
  AFTER INSERT OR UPDATE OR DELETE ON public.operators
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE INDEX idx_operators_user_id ON public.operators(user_id);
