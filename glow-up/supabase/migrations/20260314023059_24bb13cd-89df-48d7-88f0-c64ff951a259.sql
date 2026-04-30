
CREATE TABLE public.reminder_flow_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  model_id uuid REFERENCES public.reminder_flow_models(id) ON DELETE CASCADE,
  layout_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  anchor_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, model_id)
);

ALTER TABLE public.reminder_flow_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own layouts" ON public.reminder_flow_layouts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own layouts" ON public.reminder_flow_layouts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own layouts" ON public.reminder_flow_layouts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage layouts" ON public.reminder_flow_layouts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
