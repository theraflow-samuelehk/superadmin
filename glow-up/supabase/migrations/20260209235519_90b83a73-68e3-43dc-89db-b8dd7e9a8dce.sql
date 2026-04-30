
-- =============================================
-- FASE 6: Fidelizzazione Clienti
-- =============================================

-- 6.1 Loyalty Points
CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id),
  transaction_id uuid REFERENCES public.transactions(id),
  points integer NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT 'purchase',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loyalty_points" ON public.loyalty_points FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can insert own loyalty_points" ON public.loyalty_points FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_loyalty_points_client ON public.loyalty_points(client_id);
CREATE INDEX idx_loyalty_points_user ON public.loyalty_points(user_id);

-- Audit trigger
CREATE TRIGGER audit_loyalty_points AFTER INSERT OR UPDATE OR DELETE ON public.loyalty_points FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- 6.2 Client Packages
CREATE TABLE public.client_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id),
  name text NOT NULL,
  service_id uuid REFERENCES public.services(id),
  total_sessions integer NOT NULL DEFAULT 1,
  used_sessions integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  expires_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own client_packages" ON public.client_packages FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can insert own client_packages" ON public.client_packages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own client_packages" ON public.client_packages FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_client_packages_client ON public.client_packages(client_id);

CREATE TRIGGER update_client_packages_updated_at BEFORE UPDATE ON public.client_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_client_packages AFTER INSERT OR UPDATE OR DELETE ON public.client_packages FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- 6.3 Gift Cards
CREATE TABLE public.gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  initial_value numeric NOT NULL DEFAULT 0,
  remaining_value numeric NOT NULL DEFAULT 0,
  buyer_name text,
  recipient_name text,
  expires_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gift_cards" ON public.gift_cards FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can insert own gift_cards" ON public.gift_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gift_cards" ON public.gift_cards FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_gift_cards_code ON public.gift_cards(code);

CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON public.gift_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_gift_cards AFTER INSERT OR UPDATE OR DELETE ON public.gift_cards FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Add loyalty_level to clients table
ALTER TABLE public.clients ADD COLUMN loyalty_level text NOT NULL DEFAULT 'bronze';
ALTER TABLE public.clients ADD COLUMN total_points integer NOT NULL DEFAULT 0;
