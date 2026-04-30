
-- Create treatment_photos table for Before/After
CREATE TABLE public.treatment_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id),
  appointment_id uuid REFERENCES public.appointments(id),
  photo_url text NOT NULL,
  photo_type text NOT NULL DEFAULT 'before', -- before, after, progress
  notes text,
  taken_at timestamptz NOT NULL DEFAULT now(),
  gdpr_consent boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own treatment_photos" ON public.treatment_photos
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can insert own treatment_photos" ON public.treatment_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treatment_photos" ON public.treatment_photos
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_treatment_photos_client ON public.treatment_photos(client_id);

-- Create locations table for Multi-sede
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  is_primary boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own locations" ON public.locations
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can insert own locations" ON public.locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations" ON public.locations
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create AI suggestions log table
CREATE TABLE public.ai_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  suggestion_type text NOT NULL, -- inactive_clients, no_show_risk, agenda_optimization, trend_analysis
  title text NOT NULL,
  description text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_suggestions" ON public.ai_suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_suggestions" ON public.ai_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_suggestions" ON public.ai_suggestions
  FOR UPDATE USING (auth.uid() = user_id);

-- Storage bucket for treatment photos
INSERT INTO storage.buckets (id, name, public) VALUES ('treatment-photos', 'treatment-photos', false);

CREATE POLICY "Users can upload treatment photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'treatment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own treatment photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'treatment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own treatment photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'treatment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Audit triggers
CREATE TRIGGER audit_treatment_photos AFTER INSERT OR UPDATE ON public.treatment_photos FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_locations AFTER INSERT OR UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
