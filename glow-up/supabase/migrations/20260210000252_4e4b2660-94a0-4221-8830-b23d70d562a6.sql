
-- =============================================
-- FASE 8: Gestione Avanzata Staff
-- =============================================

-- 8.1 Turni operatori
CREATE TABLE public.operator_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operator_id uuid NOT NULL REFERENCES public.operators(id),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own shifts" ON public.operator_shifts FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can insert own shifts" ON public.operator_shifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shifts" ON public.operator_shifts FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can delete own shifts" ON public.operator_shifts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_operator_shifts_operator ON public.operator_shifts(operator_id);
CREATE TRIGGER update_operator_shifts_updated_at BEFORE UPDATE ON public.operator_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8.1 Presenze (clock in/out)
CREATE TABLE public.operator_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operator_id uuid NOT NULL REFERENCES public.operators(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  clock_in timestamptz,
  clock_out timestamptz,
  break_minutes integer NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'present',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own attendance" ON public.operator_attendance FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can insert own attendance" ON public.operator_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.operator_attendance FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_operator_attendance_operator ON public.operator_attendance(operator_id);
CREATE INDEX idx_operator_attendance_date ON public.operator_attendance(date);
CREATE TRIGGER update_operator_attendance_updated_at BEFORE UPDATE ON public.operator_attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8.2 Commissioni operatori
ALTER TABLE public.operators ADD COLUMN commission_service_pct numeric NOT NULL DEFAULT 0;
ALTER TABLE public.operators ADD COLUMN commission_product_pct numeric NOT NULL DEFAULT 0;
ALTER TABLE public.operators ADD COLUMN monthly_target numeric NOT NULL DEFAULT 0;

-- 8.2 Tabella obiettivi mensili
CREATE TABLE public.operator_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operator_id uuid NOT NULL REFERENCES public.operators(id),
  month integer NOT NULL,
  year integer NOT NULL,
  target_revenue numeric NOT NULL DEFAULT 0,
  actual_revenue numeric NOT NULL DEFAULT 0,
  target_appointments integer NOT NULL DEFAULT 0,
  actual_appointments integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(operator_id, month, year)
);

ALTER TABLE public.operator_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON public.operator_goals FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can insert own goals" ON public.operator_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.operator_goals FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_operator_goals_operator ON public.operator_goals(operator_id);
CREATE TRIGGER update_operator_goals_updated_at BEFORE UPDATE ON public.operator_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
