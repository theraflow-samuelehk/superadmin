
-- Facebook Pages configuration (each salon can connect multiple FB pages)
CREATE TABLE public.facebook_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  page_access_token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Facebook Leads received via webhook
CREATE TABLE public.facebook_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  facebook_page_id UUID REFERENCES public.facebook_pages(id) ON DELETE SET NULL,
  fb_lead_id TEXT NOT NULL,
  fb_form_id TEXT,
  fb_page_id TEXT,
  lead_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facebook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_leads ENABLE ROW LEVEL SECURITY;

-- RLS policies for facebook_pages
CREATE POLICY "Users can manage own facebook_pages"
  ON public.facebook_pages FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policies for facebook_leads
CREATE POLICY "Users can manage own facebook_leads"
  ON public.facebook_leads FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Super admin can see all
CREATE POLICY "Super admin can manage all facebook_pages"
  ON public.facebook_pages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can manage all facebook_leads"
  ON public.facebook_leads FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Unique constraint: no duplicate fb_lead_id per user
CREATE UNIQUE INDEX idx_facebook_leads_fb_lead_id ON public.facebook_leads (user_id, fb_lead_id);

-- Updated_at triggers
CREATE TRIGGER update_facebook_pages_updated_at
  BEFORE UPDATE ON public.facebook_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facebook_leads_updated_at
  BEFORE UPDATE ON public.facebook_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions for authenticated role (needed for upsert)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facebook_pages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facebook_leads TO authenticated;

-- Revoke page_access_token from direct API access (write-only from frontend)
-- Token will only be readable via edge function with service role
