
-- Fiscal receipts table for Italian corrispettivi elettronici
CREATE TABLE public.fiscal_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id),
  receipt_number TEXT NOT NULL,
  receipt_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC NOT NULL DEFAULT 22,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'draft',
  rt_serial_number TEXT,
  rt_closure_number INTEGER,
  rt_document_number INTEGER,
  xml_content TEXT,
  sent_to_ade BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  ade_response TEXT,
  salon_name TEXT,
  salon_vat_number TEXT,
  salon_address TEXT,
  client_name TEXT,
  client_vat_number TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fiscal_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own receipts"
  ON public.fiscal_receipts FOR SELECT
  USING (auth.uid() = user_id OR public.has_super_admin_role(auth.uid()));

CREATE POLICY "Users can create their own receipts"
  ON public.fiscal_receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
  ON public.fiscal_receipts FOR UPDATE
  USING (auth.uid() = user_id);

-- Receipt number sequence per user
CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.fiscal_receipts
  WHERE user_id = p_user_id
    AND to_char(receipt_date, 'YYYY') = v_year;
  RETURN v_year || '-' || lpad(v_count::text, 6, '0');
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_fiscal_receipts_updated_at
  BEFORE UPDATE ON public.fiscal_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add google_calendar_event_id to appointments for sync
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
