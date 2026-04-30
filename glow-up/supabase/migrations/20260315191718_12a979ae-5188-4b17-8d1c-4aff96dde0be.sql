
-- Tutorial categories table
CREATE TABLE public.tutorial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tutorial videos table
CREATE TABLE public.tutorial_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.tutorial_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  vimeo_embed_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutorial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_videos ENABLE ROW LEVEL SECURITY;

-- Super admin full access on categories
CREATE POLICY "Super admins can manage tutorial categories"
  ON public.tutorial_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Authenticated users can view published categories
CREATE POLICY "Authenticated can view published categories"
  ON public.tutorial_categories FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Super admin full access on videos
CREATE POLICY "Super admins can manage tutorial videos"
  ON public.tutorial_videos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Authenticated users can view published videos (only if category is also published)
CREATE POLICY "Authenticated can view published videos"
  ON public.tutorial_videos FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    AND category_id IN (
      SELECT id FROM public.tutorial_categories WHERE status = 'published'
    )
  );

-- Updated_at triggers
CREATE TRIGGER update_tutorial_categories_updated_at
  BEFORE UPDATE ON public.tutorial_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tutorial_videos_updated_at
  BEFORE UPDATE ON public.tutorial_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
